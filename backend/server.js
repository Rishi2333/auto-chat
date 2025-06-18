import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import 'dotenv/config';
import connectDB from './db.js';
import Room from './models/Room.js';
import Message from './models/Message.js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// **BADLAV YAHAN HAI:** Function ab `previousSuggestions` ka parameter lega
const getAiGeneratedSuggestions = async (category, type, chatHistory = [], previousSuggestions = []) => {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const latestMessageText = chatHistory.length > 0 ? chatHistory[0].text : '';
        const chronologicalHistory = [...chatHistory].reverse();
        const historyText = chronologicalHistory.map(m => `User: ${m.text}`).join('\n');
        
        // **BADLAV YAHAN HAI:** AI ko batayenge ki purane suggestions ko avoid kare
        const avoidText = previousSuggestions.length > 0
            ? `\n**Crucial Instruction:** DO NOT generate any replies that are similar to these, as the user has already seen them generate something diffrent from this but should be on the "${category}" : ${JSON.stringify(previousSuggestions)}.`
            : '';

        const promptAction = type === 'question'
            ? `In just Hinglish, generate 3 unique, interesting, and progressive conversation starter questions for the category "${category}". The questions should help the conversation move forward naturally.`
            : `You are a sophisticated chat helper. A user has sent a message. Your task is to generate 3 interesting replies for the OTHER user to choose from.

            **Core Objective:** Make the conversation more engaging, natural, and progressive.

            **Rules for Generating Replies:**
            1.  **Language:** Generate all replies in just Hinglish (a mix of Hindi and English means hindi words are written in english).
            2.  **Context is Key:** Base the replies on the latest message and the overall conversation history. Avoid repeating suggestions that are too similar to past messages.
            3.  **Stay On Topic:** Replies must be clearly related to the main category: "${category}".
            4.  **Handle Off-Topic Messages:** If the latest message seems off-topic, one reply can acknowledge it, but you must gently and creatively guide the conversation back to the category: "${category}".
            5.  **Be Progressive & Natural:** Replies must help the conversation move forward. Avoid repetitive cross-questioning. The goal is a smooth flow, not an interrogation. Don't force a topic change if the current one is flowing well.
            6.  **Maintain Diversity & Tone:**
                * Ensure all three suggestions are distinct from each other.
                * Make the replies engaging and encouraging to elicit a response.
                * Generally, keep the tone supportive. However, to make the conversation more "spicy" and interesting, one of the three replies can occasionally be slightly challenging, playful, or offer a contrary viewpoint, but only if the situation allows.
            7.  **Be Short and Concise:** Each reply must be a single, clear sentence or question. Avoid long paragraphs.
            8.  **Focus:** Do not try to cover too many topics in one reply. Focus on one aspect of the conversation at a time.

            **Conversation Category:** "${category}"
            **Conversation History (oldest to newest):**
            ${historyText || '(No history yet, start the conversation!)'}

            **Latest Message to Reply To:** "${latestMessageText}"
            `;

        const prompt = `${promptAction} ${avoidText}
        
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

connectDB();

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "http://localhost:3000" } });

async function handlePostMessageActions(roomId, currentSocketId) {
    const room = await Room.findById(roomId);
    if (!room) return;

    const nextActiveUser = room.users.find(id => id !== currentSocketId);
    room.activeUser = nextActiveUser;
    await room.save();
    
    if (nextActiveUser) {
        const chatHistory = await Message.find({ roomId }).sort({ createdAt: -1 }).limit(10);
        const replies = await getAiGeneratedSuggestions(room.category, 'reply', chatHistory);
        io.to(roomId).emit('update_suggestions', { suggestions: replies, activeUserId: room.activeUser, category: room.category });
    }
}

io.on('connection', (socket) => {
    console.log(`[BE] User Connected: ${socket.id}`);

    socket.on('join-room', async ({ roomId, userId }) => {
        // (Ismein koi badlav nahi hai)
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
        // (Ismein koi badlav nahi hai)
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
        // (Ismein koi badlav nahi hai)
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
        // (Ismein koi badlav nahi hai)
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

    // **BADLAV YAHAN HAI:** `previousSuggestions` ko handle kar rahe hain
    socket.on('request_new_suggestions', async ({ roomId, previousSuggestions }) => {
        try {
            const room = await Room.findById(roomId);
            if (!room || !room.category) return;
            const canShuffle = room.activeUser === null || socket.id === room.activeUser;
            if (canShuffle) {
                const type = room.activeUser === null ? 'question' : 'reply';
                const chatHistory = await Message.find({ roomId }).sort({ createdAt: -1 }).limit(10);
                const newSuggestions = await getAiGeneratedSuggestions(room.category, type, chatHistory, previousSuggestions);
                io.to(roomId).emit('update_suggestions', { suggestions: newSuggestions, activeUserId: room.activeUser, category: room.category });
            }
        } catch (error) {
            console.error("[BE] Error in request_new_suggestions:", error);
        }
    });

    socket.on('disconnect', async () => {
        // (Ismein koi badlav nahi hai)
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