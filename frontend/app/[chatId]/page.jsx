"use client";
import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation'; // useRouter import kiya
import io from 'socket.io-client';
import styles from './chat.module.css';
import ChatWindow from '../components/ChatWindow';
import SuggestionsPanel from '../components/SuggestionsPanel';
import CategorySelector from '../components/CategorySelector';
import StatusScreen from '../components/StatusScreen';

let socket;

export default function ChatRoom() {
  const params = useParams();
  const router = useRouter(); // router instance
  const roomId = params.chatId;

  const [appStatus, setAppStatus] = useState('connecting');
  const [myId, setMyId] = useState('');
  const [messages, setMessages] = useState([]);
  const [categorySelected, setCategorySelected] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [activeUserId, setActiveUserId] = useState(null);
  const [customInput, setCustomInput] = useState("");


  const initializeSocket = useCallback(() => {
    const socket_url = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';
    socket = io(socket_url);
    
    socket.on('connect', () => {
      setMyId(socket.id);
      socket.emit('join-room', roomId);
    });

    socket.on('room_full', () => {
        setAppStatus('room_full');
    });
    socket.on('waiting_for_player', () => setAppStatus('waiting'));
    socket.on('game_ready', () => setAppStatus('active')); // Category selection screen
    socket.on('opponent_left', () => setAppStatus('opponent_left'));
    socket.on('server_error', (message) => {
        console.error("Server error:", message);
        setAppStatus('error'); // Naya status error ke liye
    });

    socket.on('chat_history', (history) => {
      const formattedHistory = history.map(msg => ({
        text: msg.text,
        type: msg.senderId === socket.id ? 'sent' : 'received' // socket.id connect par set hota hai
      }));
      setMessages(formattedHistory);
    });

    socket.on('update_suggestions', ({ suggestions: newSuggestions, activeUserId: newActiveUserId }) => {
      setSuggestions(newSuggestions || []);
      setActiveUserId(newActiveUserId);
      if (newSuggestions && newSuggestions.length > 0) { // Suggestions aane par category selected maan lo
          setCategorySelected(true);
      }
    });

    socket.on('new_message', ({ user, text }) => {
      setMessages((prevMessages) => [...prevMessages, { text, type: user === socket.id ? 'sent' : 'received' }]);
    });

    return () => {
        if (socket) socket.disconnect();
    }
  }, [roomId]); // roomId par dependency

  useEffect(() => {
    return initializeSocket();
  }, [initializeSocket]);


  const handleCategorySelect = (category) => socket.emit('category-select', { roomId, category });
  
  const handleSendMessage = (message) => {
    const trimmedMessage = message.trim();
    if(trimmedMessage && socket) socket.emit('send_message', { roomId, message: trimmedMessage });
  }
  
  const handleShuffle = () => {
    if(socket) socket.emit('request_new_suggestions', { roomId });
  }
  
  const handleCustomInputChange = (e) => setCustomInput(e.target.value);

  const handleCustomMessageSend = () => {
    if (customInput.trim() !== '') {
        handleSendMessage(customInput);
        setCustomInput("");
    }
  }
  
  const canTakeAction = (activeUserId === null && categorySelected && appStatus === 'active') || (myId === activeUserId && appStatus === 'active');

  const renderContent = () => {
    switch (appStatus) {
      case 'waiting':
        return <StatusScreen title="Waiting for a Friend" message={`Share this page's link to invite someone. Room ID: ${roomId}`} />;
      case 'opponent_left':
        return <StatusScreen title="Your Friend Has Left" message="The chat session has ended." showHomeButton={true} />;
      case 'room_full':
        return <StatusScreen title="Room is Full" message="This chat room already has two participants." showHomeButton={true} />;
      case 'error':
        return <StatusScreen title="Connection Error" message="Could not connect to the chat. Please try again." showHomeButton={true} />;
      case 'active':
        return (
          <div className={styles.mainContainer}>
            <div className={styles.chatSection}>
              <ChatWindow messages={messages} />
              <div className={styles.chatInputWrapper}>
                <input
                  type="text"
                  value={customInput}
                  onChange={handleCustomInputChange}
                  placeholder={canTakeAction ? "Type your own message..." : "Waiting for friend's turn..."}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && canTakeAction) {
                      handleCustomMessageSend();
                    }
                  }}
                  disabled={!canTakeAction}
                  className={styles.chatInput}
                />
              </div>
            </div>
            <div className={styles.suggestionsSection}>
              {!categorySelected ? (
                <CategorySelector onSelectCategory={handleCategorySelect} />
              ) : (
                <SuggestionsPanel
                  suggestions={suggestions}
                  onSelect={handleSendMessage}
                  onShuffle={handleShuffle}
                  canTakeAction={canTakeAction}
                />
              )}
            </div>
          </div>
        );
      default: // 'connecting'
        return <StatusScreen title="Connecting to Auto-Chat..." message="Please wait while we set things up." />;
    }
  };

  return (
    <main className={styles.pageContainer}>
      {renderContent()}
    </main>
  );
}
