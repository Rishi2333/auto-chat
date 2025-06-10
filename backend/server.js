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
const io = new Server(server, { cors: { origin: "http://localhost:3000" } });

const getSuggestionsFromDB = async (category, type, count = 3) => {
    try {
        let query = { type, category: category.toLowerCase() };
        let suggestions = await Suggestion.aggregate([{ $match: query }, { $sample: { size: count } }]);
        if (type === 'reply' && suggestions.length < count && category.toLowerCase() !== 'general') {
            const neededMore = count - suggestions.length;
            query.category = 'general';
            const generalSuggestions = await Suggestion.aggregate([{ $match: query }, { $sample: { size: neededMore } }]);
            const currentTexts = suggestions.map(s => s.text);
            generalSuggestions.forEach(gs => { if (!currentTexts.includes(gs.text)) suggestions.push(gs); });
        }
        return suggestions.slice(0, count).map(s => s.text);
    } catch (error) {
        console.error("[BE] Error fetching suggestions:", error);
        return [];
    }
};

io.on('connection', (socket) => {
    console.log(`[BE] User Connected: ${socket.id}`);

    socket.on('join-room', async ({ roomId, userId }) => {
        try {
            if (!userId) return;
            socket.join(roomId);
            socket.roomId = roomId;
            socket.userId = userId;

            let room = await Room.findById(roomId);
            if (!room) {
                // Naya room, participant ka permanent ID save karo
                room = await Room.create({ _id: roomId, participants: [userId], users: [socket.id] });
                socket.emit('waiting_for_player');
            } else {
                const isParticipant = room.participants.includes(userId);
                if (isParticipant) {
                    if (!room.users.includes(socket.id)) room.users.push(socket.id);
                } else {
                    if (room.participants.length >= 2) {
                        socket.emit('room_is_private');
                        socket.leave(roomId);
                        return;
                    }
                    // Naye participant ka permanent ID save karo
                    room.participants.push(userId);
                    room.users.push(socket.id);
                }
                await room.save();
            }

            const chatHistory = await Message.find({ roomId }).sort('timestamp').limit(50);
            socket.emit('chat_history', chatHistory);

            if (room.users.length === 2) {
                if (room.category) {
                    const type = room.activeUser ? 'reply' : 'question';
                    const suggestions = await getSuggestionsFromDB(room.category, type, 3);
                    io.to(roomId).emit('update_suggestions', { suggestions, activeUserId: room.activeUser, category: room.category });
                }
                io.to(roomId).emit('game_ready');
            } else if (room.users.length === 1 && room.participants.length === 2) {
                socket.emit('waiting_for_player');
            }
        } catch (error) {
            console.error("[BE] Error in join-room:", error);
            socket.emit('server_error');
        }
    });

    socket.on('select_category', async ({ roomId, category }) => {
        try {
            const room = await Room.findByIdAndUpdate(roomId, { category: category.toLowerCase(), activeUser: null }, { new: true });
            if (room && room.users.length === 2) {
                const starters = await getSuggestionsFromDB(category.toLowerCase(), 'question', 3);
                io.to(roomId).emit('update_suggestions', { suggestions: starters, activeUserId: null, category: room.category });
            }
        } catch (error) {
            console.error("[BE] Error in select_category:", error);
        }
    });

    socket.on('send_message', async ({ roomId, message }) => {
        try {
            let room = await Room.findById(roomId);
            if (!room || !socket.userId) return;
            const canTakeAction = room.activeUser === null || room.activeUser === socket.id;
            if (!canTakeAction) return;

            // Message bhejne wale ka permanent userId save karo
            await Message.create({ roomId, senderId: socket.userId, text: message });
            io.to(roomId).emit('new_message', { user: socket.id, text: message });

            const nextActiveUser = room.users.find(id => id !== socket.id);
            room.activeUser = nextActiveUser;
            await room.save();
            
            if (nextActiveUser) {
                const replies = await getSuggestionsFromDB(room.category, 'reply', 3);
                io.to(roomId).emit('update_suggestions', { suggestions: replies, activeUserId: room.activeUser, category: room.category });
            }
        } catch (error) {
            console.error("[BE] Error in send_message:", error);
        }
    });

    socket.on('request_new_suggestions', async ({ roomId }) => {
        try {
            const room = await Room.findById(roomId);
            if (!room || !room.category) return;
            const canShuffle = room.activeUser === null || socket.id === room.activeUser;
            if (canShuffle) {
                const type = room.activeUser === null ? 'question' : 'reply';
                const newSuggestions = await getSuggestionsFromDB(room.category, type, 3);
                io.to(roomId).emit('update_suggestions', { suggestions: newSuggestions, activeUserId: room.activeUser, category: room.category });
            }
        } catch (error) {
            console.error("[BE] Error in request_new_suggestions:", error);
        }
    });

    socket.on('disconnect', async () => {
        try {
            const { roomId } = socket;
            if (roomId) {
                const room = await Room.findByIdAndUpdate(roomId, { $pull: { users: socket.id } }, { new: true });
                if (room && room.users.length === 1) {
                    io.to(room.users[0]).emit('opponent_left');
                }
            }
        } catch (error) {
            console.error("Error on disconnect:", error);
        }
    });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`✅ Backend (Before Names) - IS RUNNING ON PORT ${PORT}`));
