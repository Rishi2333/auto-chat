import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import connectDB from './db.js';
import Room from './models/Room.js';
import Message from './models/Message.js';
import Suggestion from './models/Suggestion.js';

connectDB();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' ? 'your_production_frontend_url' : "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const getSuggestionsFromDB = async (category, type, count = 3) => {
  try {
    let query = { type };
    if (category && category !== 'general') { // Agar specific category hai
        query.category = category;
    } else if (type === 'question') { // Starters ke liye general category
        query.category = 'general';
    }
    // Agar replies hain aur specific category mein nahi mil rahe, toh general se bhi lo
    // This part is complex with aggregation. Let's simplify for now.
    // Fetch specific category first, then general if needed.

    let suggestions = await Suggestion.aggregate([
      { $match: query },
      { $sample: { size: count } },
    ]);

    // Agar specific category mein kum suggestions mile, aur woh replies hain, toh general se baaki ke lo
    if (type === 'reply' && suggestions.length < count && category !== 'general') {
      const neededMore = count - suggestions.length;
      const generalReplies = await Suggestion.aggregate([
        { $match: { category: 'general', type: 'reply' } },
        { $sample: { size: neededMore } },
      ]);
      // Make sure not to add duplicates if any were fetched
      const currentTexts = suggestions.map(s => s.text);
      generalReplies.forEach(gr => {
        if (!currentTexts.includes(gr.text)) {
            suggestions.push(gr);
        }
      });
    }
     // Ensure we only return 'count' number of suggestions
    return suggestions.slice(0, count).map(s => s.text);
  } catch (error) {
    console.error("Error fetching suggestions:", error);
    return []; // Return empty array on error
  }
};

io.on('connection', (socket) => {
  console.log(`User Connected: ${socket.id}`);

  socket.on('join-room', async (roomId) => {
    try {
      socket.join(roomId);
      socket.roomId = roomId;

      let room = await Room.findById(roomId);
      if (!room) {
        room = await Room.create({ _id: roomId, users: [socket.id] });
      } else {
        if (!room.users.includes(socket.id) && room.users.length < 2) {
          room.users.push(socket.id);
        } else if (room.users.includes(socket.id)) {
          // User is already in the room, perhaps reconnected
        } else {
          socket.emit('room_full'); // Room pehle se full hai
          socket.leave(roomId);
          return;
        }
        await room.save();
      }
      
      const chatHistory = await Message.find({ roomId }).sort('timestamp').limit(50); // Limit history
      socket.emit('chat_history', chatHistory);

      if (room.users.length === 2) {
        io.to(roomId).emit('game_ready'); // Dono users ready hain, category select kar sakte hain
      } else {
        socket.emit('waiting_for_player');
      }
    } catch (error) {
      console.error("Error in join-room:", error);
      socket.emit('server_error', 'Could not join room.');
    }
  });

  socket.on('category-select', async ({ roomId, category }) => {
    try {
      const room = await Room.findByIdAndUpdate(roomId, { category: category.toLowerCase(), activeUser: null }, { new: true });
      if (room && room.users.length === 2) {
        const starters = await getSuggestionsFromDB(category.toLowerCase(), 'question', 3);
        io.to(roomId).emit('update_suggestions', {
          suggestions: starters,
          activeUserId: null, // Koi bhi shuru kar sakta hai
        });
      }
    } catch (error) {
      console.error("Error in category-select:", error);
    }
  });

  socket.on('send_message', async ({ roomId, message }) => {
    try {
      let room = await Room.findById(roomId);
      if (!room) return;
      
      // Pehla message ya active user ka message
      const canSendMessage = room.activeUser === null || room.activeUser === socket.id;
      if (!canSendMessage) return;

      await Message.create({ roomId, senderId: socket.id, text: message });
      io.to(roomId).emit('new_message', { user: socket.id, text: message });

      const nextActiveUser = room.users.find(id => id !== socket.id);
      if (!nextActiveUser) { // Ho sakta hai doosra user disconnect ho gaya ho
          room.activeUser = null; // Ya kisi ek ko active rakhein
      } else {
          room.activeUser = nextActiveUser;
      }
      await room.save();
      
      if (nextActiveUser) { // Agar doosra user hai toh hi suggestions bhejein
        const replies = await getSuggestionsFromDB(room.category, 'reply', 3);
        io.to(roomId).emit('update_suggestions', { // Dono ko update bhejo
          suggestions: replies,
          activeUserId: room.activeUser,
        });
      } else { // Agar doosra user nahi, toh current user ke suggestions blank kardo
         io.to(socket.id).emit('update_suggestions', {
             suggestions: [],
             activeUserId: null
         })
      }
    } catch (error) {
      console.error("Error in send_message:", error);
    }
  });

  socket.on('request_new_suggestions', async ({ roomId }) => {
    try {
        const room = await Room.findById(roomId);
        if (!room || !room.category) return;
        
        const canShuffle = room.activeUser === null || socket.id === room.activeUser;
        if(canShuffle){
            const type = room.activeUser === null ? 'question' : 'reply';
            const newSuggestions = await getSuggestionsFromDB(room.category, type, 3);
            io.to(roomId).emit('update_suggestions', { // Dono ko update bhejo
                suggestions: newSuggestions,
                activeUserId: room.activeUser, // Active user wahi rahega
            });
        }
    } catch (error) {
        console.error("Error in request_new_suggestions:", error);
    }
  });

  socket.on('disconnect', async () => {
    try {
        console.log(`User Disconnected: ${socket.id}`);
        const roomId = socket.roomId; // Humne join ke waqt set kiya tha
        if (roomId) {
            let room = await Room.findById(roomId);
            if (room) {
                room.users = room.users.filter(id => id !== socket.id);
                if (room.users.length < 2) { // Agar ek user bacha ya koi nahi
                    room.activeUser = null; // Koi active nahi
                    if (room.users.length === 1) {
                        io.to(room.users[0]).emit('opponent_left');
                        io.to(room.users[0]).emit('update_suggestions', {suggestions: [], activeUserId: null});
                    }
                }
                if (room.users.length === 0) {
                    await Room.findByIdAndDelete(roomId);
                    await Message.deleteMany({ roomId }); // Optional: clean messages
                    console.log(`Cleaned up empty room ${roomId}`);
                } else {
                    await room.save();
                }
            }
        }
    } catch (error) {
        console.error("Error on disconnect:", error);
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`✅ MongoDB-powered Auto-Chat BACKEND IS RUNNING ON PORT ${PORT}`));
