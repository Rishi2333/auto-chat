import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import 'dotenv/config';
import connectDB from './db.js';
import Room from './models/Room.js';
import Message from './models/Message.js';
import { GoogleGenerativeAI } from '@google/generative-ai';

// --- START: AI SETUP ---
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const getAiGeneratedSuggestions = async (category, type, chatHistory = []) => {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        // BUG FIX: Sabse naya message chatHistory[0] se milega kyunki hum descending order me sort kar rahe hain.
        const latestMessageText = chatHistory.length > 0 ? chatHistory[0].text : '';

        // PROMPT IMPROVEMENT: Chat history ko seedha (chronological) order me AI ko bhejte hain.
        const chronologicalHistory = [...chatHistory].reverse();
        const historyText = chronologicalHistory.map(m => `User: ${m.text}`).join('\n');
        
        const promptAction = type === 'question'
            ? `In hinglish language, generate 3 interesting and progressive conversation starter questions for the category "${category}". The questions should help the conversation move forward.`
            : `You are a chat helper. A user has sent a message. Your task is to generate 3 intresting replies for the OTHER user.

            **Rules for Replies:**
            1.  **Language:** Generate replies in Hinglish (a mix of Hindi and English).
            2.  **Context is Key:** Base the replies on the latest message and the overall conversation history.
            3.  **Stay On Topic:** Replies must be related to the category: "${category}".
            4.  **Handle Off-Topic Messages:** If the latest message seems off-topic, create a reply that acknowledges it but then gently guides the conversation back to the category "${category}".
            5.  **Be Progressive:** The replies must not be repetitive. They must help the conversation move forward in a natural and engaging way.
            6.  **Be Diverse:** Ensure the three suggestions are different from each other.
            7.  **Be Engaging:** The replies should be interesting and engaging, encouraging the other user to respond.
            8.  **Be Concise:** Each reply should be a single sentence or question, not a long paragraph.
        
            **Conversation Category:** "${category}"
            **Conversation History (oldest to newest):**
            ${historyText || '(No history yet, start the conversation!)'}

            **Latest Message to Reply To:** "${latestMessageText}"
            `;

        const prompt = `${promptAction}
        
        IMPORTANT: Your output MUST be a valid JavaScript array of 3 strings, like this: ["Pehla reply", "Dusra reply", "Teesra reply"]. Do not add any other text, formatting like markdown (e.g. \`\`\`json), or explanations.`;

        console.log(`[AI] Generating suggestions for category: ${category}, type: ${type}`);
        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text().trim();
        
        const jsonMatch = text.match(/\[.*\]/s);
        if (jsonMatch) {
            text = jsonMatch[0];
        } else {
            throw new Error("AI response did not contain a valid JSON array.");
        }

        const suggestions = JSON.parse(text);
        return Array.isArray(suggestions) ? suggestions.slice(0, 3) : [];

    } catch (error) {
        console.error("[BE] Error generating or parsing AI suggestions:", error);
        return type === 'question'
            ? ["What's your favorite movie in this genre?", "Any interesting facts to share?", "What's the best part about this topic?"]
            : ["Tell me more!", "That's interesting, why so?", "What happened after that?"];
    }
};
// --- END: AI SETUP ---

connectDB();

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "http://localhost:3000" } });

// Helper Function: Turn badalne aur naye suggestions laane ke liye
async function handlePostMessageActions(roomId, currentSocketId) {
    const room = await Room.findById(roomId);
    if (!room) return;

    // Turn switch karein
    const nextActiveUser = room.users.find(id => id !== currentSocketId);
    room.activeUser = nextActiveUser;
    await room.save();
    
    // Naye active user ke liye AI suggestions generate karein
    if (nextActiveUser) {
        // BUG FIX: Database se hamesha latest messages lein.
        const chatHistory = await Message.find({ roomId }).sort({ createdAt: -1 }).limit(10);
        const replies = await getAiGeneratedSuggestions(room.category, 'reply', chatHistory);
        io.to(roomId).emit('update_suggestions', { suggestions: replies, activeUserId: room.activeUser, category: room.category });
    }
}

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
                    const initialChatHistory = await Message.find({ roomId }).sort({ createdAt: -1 }).limit(10);
                    const suggestions = await getAiGeneratedSuggestions(room.category, type, initialChatHistory);
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
                const starters = await getAiGeneratedSuggestions(category.toLowerCase(), 'question');
                io.to(roomId).emit('update_suggestions', { suggestions: starters, activeUserId: null, category: room.category });
            }
        } catch (error) {
            console.error("[BE] Error in select_category:", error);
        }
    });

    socket.on('send_suggested_message', async ({ roomId, message }) => {
        try {
            const room = await Room.findById(roomId);
            if (!room || !socket.userId) return;
            
            const canTakeAction = room.activeUser === null || room.activeUser === socket.id;
            if (!canTakeAction) return;

            await Message.create({ roomId, senderId: socket.userId, text: message });
            io.to(roomId).emit('new_message', { user: socket.id, text: message });

            await handlePostMessageActions(roomId, socket.id);
        } catch (error) {
            console.error("[BE] Error in send_suggested_message:", error);
        }
    });

    socket.on('send_custom_message', async ({ roomId, message }) => {
        try {
            const room = await Room.findById(roomId);
            if (!room || !socket.userId) return;

            await Message.create({ roomId, senderId: socket.userId, text: message });
            io.to(roomId).emit('new_message', { user: socket.id, text: message });

            await handlePostMessageActions(roomId, socket.id);
        } catch (error) {
            console.error("[BE] Error in send_custom_message:", error);
        }
    });

    socket.on('request_new_suggestions', async ({ roomId }) => {
        try {
            const room = await Room.findById(roomId);
            if (!room || !room.category) return;
            const canShuffle = room.activeUser === null || socket.id === room.activeUser;
            if (canShuffle) {
                const type = room.activeUser === null ? 'question' : 'reply';
                const chatHistory = await Message.find({ roomId }).sort({ createdAt: -1 }).limit(10);
                const newSuggestions = await getAiGeneratedSuggestions(room.category, type, chatHistory);
                io.to(roomId).emit('update_suggestions', { suggestions: newSuggestions, activeUserId: room.activeUser, category: room.category });
            }
        } catch (error) {
            console.error("[BE] Error in request_new_suggestions:", error);
        }
    });

    socket.on('disconnect', async () => {
        try {
            console.log(`[BE] User Disconnected: ${socket.id}`);
            const { roomId } = socket;
            if (roomId) {
                const room = await Room.findByIdAndUpdate(roomId, { $pull: { users: socket.id } }, { new: true });
                if (room && room.users.length === 1 && room.participants.includes(socket.userId)) {
                    io.to(roomId).emit('opponent_left');
                }
            }
        } catch (error) {
            console.error("[BE] Error on disconnect:", error);
        }
    });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`✅ AI Backend - IS RUNNING ON PORT ${PORT}`));