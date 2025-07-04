"use client";
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { v4 as uuidV4 } from 'uuid';
import io from 'socket.io-client';
import styles from './chat.module.css';
import ChatWindow from '../components/ChatWindow';
import SuggestionsPanel from '../components/SuggestionsPanel';
import CategorySelector from '../components/CategorySelector';
import StatusScreen from '../components/StatusScreen';
import Header from '../components/Header';

let socket;

const getUserId = () => {
  if (typeof window !== 'undefined') {
    let userId = localStorage.getItem('autoChatUserId');
    if (!userId) {
      userId = uuidV4();
      localStorage.setItem('autoChatUserId', userId);
    }
    return userId;
  }
  return null;
};

export default function ChatRoom() {
  const params = useParams();
  const roomId = params.chatId;

  const [appStatus, setAppStatus] = useState('connecting');
  const [myId, setMyId] = useState('');
  const [myUserId, setMyUserId] = useState('');
  const [messages, setMessages] = useState([]);
  const [categorySelected, setCategorySelected] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [activeUserId, setActiveUserId] = useState(null);
  const [currentCategory, setCurrentCategory] = useState('');
  const [customInput, setCustomInput] = useState("");

  useEffect(() => {
    const userId = getUserId();
    if (userId) setMyUserId(userId);

    const socket_url = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';
    socket = io(socket_url);

    const handleConnect = () => {
      setMyId(socket.id);
      socket.emit('join-room', { roomId, userId });
    };

    const handleWaiting = () => setAppStatus('waiting');
    const handleGameReady = () => setAppStatus('active');
    const handleRoomFull = () => setAppStatus('room_is_private');
    const handleOpponentLeft = () => {
      setAppStatus('opponent_left');
      setCategorySelected(false);
      setSuggestions([]);
      setActiveUserId(null);
    };
    const handleServerError = () => setAppStatus('error');

    const handleChatHistory = (history) => {
      const formattedHistory = history.map(msg => ({
        text: msg.text,
        type: msg.senderId === userId ? 'sent' : 'received'
      }));
      setMessages(formattedHistory);
    };

    const handleUpdateSuggestions = ({ suggestions, activeUserId, category }) => {
      setSuggestions(suggestions || []);
      setActiveUserId(activeUserId);
      if (category) setCurrentCategory(category);
      if (category) setCategorySelected(true);
    };

    const handleNewMessage = ({ user, text }) => {
      setMessages((prev) => [...prev, { text, type: user === socket.id ? 'sent' : 'received' }]);
    };
    
    socket.on('connect', handleConnect);
    socket.on('waiting_for_player', handleWaiting);
    socket.on('game_ready', handleGameReady);
    socket.on('room_is_private', handleRoomFull);
    socket.on('opponent_left', handleOpponentLeft);
    socket.on('server_error', handleServerError);
    socket.on('chat_history', handleChatHistory);
    socket.on('update_suggestions', handleUpdateSuggestions);
    socket.on('new_message', handleNewMessage);

    return () => {
      if (socket) {
        socket.off('connect', handleConnect);
        socket.off('waiting_for_player', handleWaiting);
        socket.off('game_ready', handleGameReady);
        socket.off('room_is_private', handleRoomFull);
        socket.off('opponent_left', handleOpponentLeft);
        socket.off('server_error', handleServerError);
        socket.off('chat_history', handleChatHistory);
        socket.off('update_suggestions', handleUpdateSuggestions);
        socket.off('new_message', handleNewMessage);
        socket.disconnect();
      }
    };
  }, [roomId]);

  const handleCategorySelect = (category) => {
    if (socket) socket.emit('select_category', { roomId, category });
  };

  const handleChangeCategory = () => {
    setCategorySelected(false);
    setSuggestions([]);
    setActiveUserId(null);
    setCurrentCategory('');
  };
  
  const handleSendSuggestedMessage = (suggestion) => {
      if (suggestion.trim() && (isMyTurn || canIStart)) {
          socket.emit('send_suggested_message', {
              roomId,
              message: suggestion,
          });
      }
  };

  const handleSendCustomMessage = () => {
      if (customInput.trim()) {
          socket.emit('send_custom_message', {
              roomId,
              message: customInput.trim(),
          });
          setCustomInput("");
      }
  };

  const handleShuffle = () => {
      // **BADLAV YAHAN HAI:** Ab hum purane suggestions bhi bhej rahe hain
      if (socket) {
          socket.emit('request_new_suggestions', {
              roomId,
              // Backend ko batayein ki in suggestions ko dobara na bheje
              previousSuggestions: suggestions 
          });
      }
  };

  const isMyTurn = myId === activeUserId;
  const isFriendsTurn = activeUserId !== null && myId !== activeUserId;
  const canIStart = activeUserId === null && categorySelected && appStatus === 'active';
  const canSelectSuggestion = isMyTurn || canIStart;

  const renderContent = () => {
    switch (appStatus) {
      case 'waiting':
        return <StatusScreen title="Waiting for a Friend" message={`Share this page's link to invite someone. Room ID: ${roomId}`} />;
      case 'opponent_left':
        return <StatusScreen title="Your Friend Has Left" message="The chat session has ended." showHomeButton={true} />;
      case 'room_is_private':
        return <StatusScreen title="Chat is Private" message="This chat room is locked for the original two participants." showHomeButton={true} />;
      case 'error':
        return <StatusScreen title="Connection Error" message="Could not connect to the chat. Please try again." showHomeButton={true} />;
      case 'active':
        return (
          <div className={styles.mainContainer}>
            {!categorySelected ? (
              <CategorySelector onSelectCategory={handleCategorySelect} />
            ) : (
              <>
                <Header category={currentCategory} onChangeCategory={handleChangeCategory} />
                
                <div className={styles.chatSection}>
                  <ChatWindow messages={messages} />
                </div>
                
                <div className={styles.inputArea}>
                  <SuggestionsPanel
                    suggestions={suggestions}
                    onSelect={handleSendSuggestedMessage}
                    onShuffle={handleShuffle}
                    isMyTurn={canSelectSuggestion}
                    isFriendsTurn={isFriendsTurn}
                  />
                  
                  <div className={styles.chatInputWrapper}>
                    <input
                      type="text"
                      value={customInput}
                      onChange={(e) => setCustomInput(e.target.value)}
                      placeholder="Type a message..."
                      onKeyPress={(e) => { if (e.key === 'Enter') { handleSendCustomMessage(); } }}
                      disabled={false}
                      className={styles.chatInput}
                    />
                    <button onClick={handleSendCustomMessage} disabled={customInput.trim() === ''} className={styles.sendButton}>
                       <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        );
      default:
        return <StatusScreen title="Connecting to Auto-Chat..." message="Please wait..." />;
    }
  };

  return (
    <main className={styles.pageContainer}>
      {renderContent()}
    </main>
  );
}