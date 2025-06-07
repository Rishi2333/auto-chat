Auto-Chat: A Guided Conversation Application
Welcome to Auto-Chat! This is a real-time, full-stack chat application designed to make conversations flow naturally and never hit a dead end. It acts as a "Conversation Co-pilot" by providing users with category-specific, contextual suggestions to keep the chat engaging and fun.

The core idea is to provide a shared, transparent experience where both users can see the suggested replies, but only the user whose turn it is can interact with them.


(Note: Aapko is link ki jagah apne app ka screenshot lekar use upload karke uska link yahan daalna chahiye)

✨ Features
Real-Time Chat: Instant messaging built with Socket.IO.

Guided Conversations: Contextual suggestions (questions and replies) are provided to users to keep the conversation going.

Categorized Topics: Users can select a topic (like Romantic, Food, Singing, etc.) to get relevant conversation starters.

Transparent Suggestion Panel: Both users can see the suggestions offered to the active user, creating a collaborative and fun experience.

User-Controlled Flow: Users can start the conversation, shuffle suggestions if they don't like them, or type their own custom messages.

Persistent Chat History: Conversations are stored in a MongoDB database.

Robust Backend: Handles user connections, disconnections, and room management gracefully.

🛠️ Tech Stack
Frontend: Next.js (React Framework)

Backend: Node.js, Express

Database: MongoDB (with Mongoose)

Real-Time Communication: Web Sockets (Socket.IO)

🚀 Getting Started
Is project ko apne local machine par set up karne ke liye yeh steps follow karein.

Prerequisites
Node.js: v18.x ya usse naya version install hona chahiye.

npm: Node.js ke saath install ho jaata hai.

Git: Code ko clone karne ke liye.

MongoDB Atlas Account: Aapko ek free MongoDB Atlas account aur uski connection string ki zaroorat hogi.

Installation & Setup
1. Clone the Repository

git clone https://github.com/your-username/auto-chat.git
cd auto-chat

(Note: your-username ki jagah apna GitHub username daalein)

2. Backend Setup

# Backend folder mein jaayein
cd backend

# Saare zaroori packages install karein
npm install

# .env file banayein
# backend folder ke andar .env naam ki ek nayi file banayein
# aur neeche diya gaya content usmein daalein

backend/.env file ka content:

# Apni MongoDB Atlas ki connection string yahan paste karein
# <password> aur <database-name> ko zaroor update karein
MONGO_URI=mongodb+srv://your_username:<password>@your_cluster_url/<database-name>?retryWrites=true&w=majority

# Backend server ka port
PORT=3001

3. Frontend Setup

# Main project folder se frontend folder mein jaayein
cd ../frontend

# Saare zaroori packages install karein
npm install

# .env.local file banayein
# frontend folder ke andar .env.local naam ki ek nayi file banayein
# aur neeche diya gaya content usmein daalein

frontend/.env.local file ka content:

# Aapke local backend server ka URL
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001

4. Database ko Seed Karein (Initial Data Daalne ke Liye)

Yeh step database mein initial conversation starters aur replies daal dega. Yeh sirf ek baar karna hai.

# Backend folder ke terminal mein yeh command chalayein
cd ../backend
npm run seed

Aapko "✅ Categorized Suggestions seeded successfully!" jaisa message dikhega.

5. Application ko Run Karein

Aapko do alag-alag terminals ki zaroorat hogi.

Terminal 1: Backend Server Start Karein

cd backend
npm run dev

Server http://localhost:3001 par chalne lagega.

Terminal 2: Frontend Server Start Karein

cd frontend
npm run dev

Aapka application browser mein http://localhost:3000 par khul jayega.

Ab aap app ko test kar sakte hain! Homepage se ek naya chat room banayein, link copy karein, aur use ek naye incognito window mein khol kar test karein.

🤝 How to Contribute
Contributions are welcome! Agar aap is project ko behtar banana chahte hain, toh please ek pull request banayein ya ek issue create karein.

Is repository ko Fork karein.

Apna naya feature branch banayein (git checkout -b feature/AmazingFeature).

Apne changes ko Commit karein (git commit -m 'Add some AmazingFeature').

Branch ko Push karein (git push origin feature/AmazingFeature).

Ek Pull Request kholo.
