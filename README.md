Auto-Chat: AI-Powered Conversational Assistant
Auto-Chat is a real-time, AI-driven web chat application designed to help users have more engaging and progressive conversations. Its primary goal is to eliminate "conversation block"—the awkward moment when you don't know what to say next—by leveraging Google's Gemini AI to generate smart, context-aware reply suggestions. This dynamic approach ensures that every interaction is unique and tailored to the flow of the chat.

This project is particularly helpful for individuals looking to improve their communication skills, brainstorm creative ideas with a partner, or simply enjoy a fun and non-repetitive chat experience that feels more natural and human-like.

✨ Key Features
Real-time Chat: Utilizes WebSockets via Socket.IO to provide instant messaging between two users for a seamless, interactive experience.

AI-Powered Suggestions: Instead of static, pre-written responses, the application uses Google's Gemini AI to generate three new, relevant, and progressive reply suggestions after each message, making every conversation unique.

Category-Based Topics: Users can select a conversation category (e.g., "Romantic", "Gardening") at the start. This helps focus the dialogue and allows the AI to provide more accurate and topic-relevant suggestions.

Flexible Turn System:

Suggested Replies: These operate on a structured turn-based system, which is ideal for game-like interactions or focused brainstorming.

Custom Messages: Users are not restricted by turns and can send a custom message at any time. Sending a custom message automatically passes the suggestion turn to the other user, ensuring the conversation keeps flowing smoothly.

Persistent User ID: Leverages localStorage to save a unique, randomly generated user ID on the client's browser. This allows users to easily rejoin rooms they have participated in before, without losing their identity within that room.

Context-Aware AI: The AI doesn't just look at the last message; it considers the last 10 messages of the chat history. This provides deeper context, leading to more coherent, less robotic suggestions that truly understand the conversation's direction.

🛠️ Technology Stack
Frontend:

Framework: Next.js - Chosen for its powerful features like Server-Side Rendering (SSR) and a great developer experience.

Language: JavaScript

Real-time Communication: Socket.IO Client - Provides a robust and reliable WebSocket connection with the backend.

Backend:

Framework: Express.js - A minimal and flexible Node.js framework that is perfect for building the API and WebSocket server.

Language: Node.js

Database: MongoDB with Mongoose - A NoSQL database that offers flexibility for storing chat messages and room data. Mongoose provides elegant object modeling.

Real-time Communication: Socket.IO - Manages the persistent, bidirectional communication between clients and the server.

AI: Google Generative AI (Gemini) - The core of the smart suggestion feature, providing state-of-the-art language understanding and generation.

🚀 Getting Started
Follow the instructions below to set up and run the project on your local machine for development and testing purposes.

Prerequisites
Node.js: v18 or newer is recommended. You can download it from nodejs.org.

MongoDB Atlas Account: A free MongoDB Atlas cluster is required for the database. You can create one at mongodb.com/atlas.

Google AI API Key: Get your free Gemini API key from Google AI Studio.

Installation & Setup
Clone the Repository:

git clone https://github.com/your-username/auto-chat.git
cd auto-chat

Backend Setup:
Navigate to the backend directory and install the necessary npm packages.

cd backend
npm install

Next, create a .env file in the /backend folder. This file will store your secret keys. Do not commit this file to Git.

MONGO_URI=YOUR_MONGODB_CONNECTION_STRING
NODE_ENV=development
PORT=3001
GEMINI_API_KEY=YOUR_GEMINI_API_KEY

Start the backend server. It will watch for file changes and restart automatically.

npm run dev

Your backend server should now be running on http://localhost:3001.

Frontend Setup:
Open a new terminal and navigate to the frontend folder.

cd frontend
npm install

Next, create a .env.local file inside the frontend folder to tell the app where the backend is running.

NEXT_PUBLIC_SOCKET_URL=http://localhost:3001

Start the frontend development server:

npm run dev

Open http://localhost:3000 in your browser to use the application.

🔑 Environment Variables
These environment variables are crucial for the application to function correctly.

Backend (/backend/.env)
Variable

Description

Example

MONGO_URI

Your connection string for the MongoDB Atlas cluster.

mongodb+srv://user:pass@cluster.mongodb.net/

GEMINI_API_KEY

Your Google AI (Gemini) API key.

AIzaSy...

Frontend (/frontend/.env.local)
Variable

Description

Example

NEXT_PUBLIC_SOCKET_URL

The URL of your running backend server.

http://localhost:3001

🤝 How to Contribute
Contributions make the open-source community an amazing place to learn, inspire, and create. Any contributions you make are greatly appreciated.

Fork the Project.

Create your Feature Branch (git checkout -b feature/AmazingFeature).

Commit your Changes (git commit -m 'Add some AmazingFeature').

Push to the Branch (git push origin feature/AmazingFeature).

Open a Pull Request.

Please make sure to discuss the changes you wish to make via an issue before making a pull request.

📄 License
This project is distributed under the MIT License. See the LICENSE file for more information.

Ek Pull Request kholo.
