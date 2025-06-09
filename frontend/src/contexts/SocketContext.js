import React, { createContext, useContext, useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import io from 'socket.io-client';
import { addMessage, setOnlineUsers, addOnlineUser, removeOnlineUser, setTypingUser } from '../features/chat/chatSlice';
import { addRealTimeNotification } from '../features/notifications/notificationsSlice';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { currentConversation } = useSelector((state) => state.chat);

  useEffect(() => {
    if (user) {
      // Initialize socket connection
      const newSocket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000', {
        withCredentials: true,
        transports: ['websocket', 'polling']
      });

      newSocket.on('connect', () => {
        console.log('Connected to server');
        setIsConnected(true);
        
        // Join with user ID
        newSocket.emit('join', user.id);
      });

      newSocket.on('disconnect', () => {
        console.log('Disconnected from server');
        setIsConnected(false);
      });

      // Listen for new messages
      newSocket.on('new_message', (message) => {
        console.log('SocketContext: Received new message:', message);
        console.log('SocketContext: Current conversation ID:', currentConversation?._id);
        console.log('SocketContext: Message conversation ID:', message.conversationId);
        
        // Only add message if it's not from the current user (to prevent duplication)
        const messageSenderId = message.sender?._id || message.sender?.id;
        const currentUserId = user?.id || user?._id;
        
        if (messageSenderId !== currentUserId) {
          console.log('SocketContext: Adding message from other user:', message);
          dispatch(addMessage(message));
        } else {
          console.log('SocketContext: Skipping own message to prevent duplication:', message._id);
        }
      });

      // Listen for conversation updates
      newSocket.on('conversation_updated', (data) => {
        console.log('Conversation updated:', data);
        // You can dispatch an action to update the conversation list
      });

      // Listen for user online/offline status
      newSocket.on('user_online', (userId) => {
        dispatch(addOnlineUser(userId));
      });

      newSocket.on('user_offline', (userId) => {
        dispatch(removeOnlineUser(userId));
      });

      // Listen for typing indicators
      newSocket.on('user_typing', ({ userId, conversationId, isTyping }) => {
        if (currentConversation && conversationId === currentConversation._id) {
          dispatch(setTypingUser({ userId, isTyping }));
        }
      });

      // Listen for notifications
      newSocket.on('new_notification', (notification) => {
        console.log('New notification:', notification);
        // Dispatch action to add real-time notification
        dispatch(addRealTimeNotification(notification));
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    }
  }, [user, dispatch]);

  // Join conversation room when current conversation changes
  useEffect(() => {
    if (socket && currentConversation) {
      console.log('Joining conversation room:', currentConversation._id);
      socket.emit('join_conversation', currentConversation._id);
      
      return () => {
        console.log('Leaving conversation room:', currentConversation._id);
        socket.emit('leave_conversation', currentConversation._id);
      };
    }
  }, [socket, currentConversation]);

  const emitTyping = (conversationId, isTyping) => {
    if (socket && conversationId) {
      socket.emit('typing', { conversationId, isTyping });
    }
  };

  const value = {
    socket,
    isConnected,
    emitTyping
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};