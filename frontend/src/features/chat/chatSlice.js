import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';
import { fetchNotifications } from '../notifications/notificationsSlice';

// Async thunks
export const fetchConversations = createAsyncThunk(
  'chat/fetchConversations',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/chat/conversations');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data.message);
    }
  }
);

export const fetchMessages = createAsyncThunk(
  'chat/fetchMessages',
  async ({ conversationId, page = 1 }, { rejectWithValue }) => {
    try {
      const response = await api.get(`/chat/conversations/${conversationId}/messages?page=${page}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data.message);
    }
  }
);

export const sendMessage = createAsyncThunk(
  'chat/sendMessage',
  async ({ conversationId, message, type = 'text', attachments = [] }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/chat/conversations/${conversationId}/messages`, {
        message,
        type,
        attachments,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data.message);
    }
  }
);

export const createConversation = createAsyncThunk(
  'chat/createConversation',
  async ({ participantId, initialMessage }, { rejectWithValue }) => {
    try {
      const response = await api.post('/chat/conversations', {
        participantId,
        initialMessage,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data.message);
    }
  }
);

export const markMessagesAsRead = createAsyncThunk(
  'chat/markMessagesAsRead',
  async (conversationId, { rejectWithValue, dispatch }) => {
    try {
      await api.patch(`/chat/conversations/${conversationId}/read`);
      // Refresh notifications since backend marks related notifications as read
      dispatch(fetchNotifications());
      return conversationId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const uploadAttachment = createAsyncThunk(
  'chat/uploadAttachment',
  async (file, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await api.post('/chat/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data.message);
    }
  }
);

const initialState = {
  conversations: [],
  currentConversation: null,
  messages: [],
  isLoading: false,
  sendingMessage: false,
  uploadingFile: false,
  error: null,
  onlineUsers: [],
  typingUsers: {},
  unreadCount: 0,
  pagination: {
    page: 1,
    hasMore: true,
  },
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setCurrentConversation: (state, action) => {
      state.currentConversation = action.payload;
      state.messages = [];
      state.pagination = { page: 1, hasMore: true };
    },
    addMessage: (state, action) => {
      const message = action.payload;
      console.log('Adding message to Redux:', message);
      console.log('Current conversation:', state.currentConversation?._id);
      console.log('Message conversation:', message.conversationId);
      
      // Add message to current conversation if it matches
      if (state.currentConversation && message.conversationId === state.currentConversation._id) {
        // Check if message already exists to prevent duplication
        const existingMessage = state.messages.find(m => m._id === message._id);
        if (!existingMessage) {
          console.log('Adding message from socket to current conversation:', message);
          state.messages.push(message);
        } else {
          console.log('Message already exists, skipping:', message._id);
        }
      } else {
        console.log('Message not for current conversation:', {
          messageConversationId: message.conversationId,
          currentConversationId: state.currentConversation?._id
        });
      }
      
      // Update conversation's last message
      // Ensure conversations array exists
      if (!state.conversations) {
        state.conversations = [];
      }
      const conversation = state.conversations.find(c => c._id === message.conversationId);
      if (conversation) {
        conversation.lastMessage = {
          content: message.content,
          sender: message.sender,
          createdAt: message.createdAt
        };
        conversation.updatedAt = message.createdAt;
        
        // Increment unread count if this conversation is not currently active
        if (!state.currentConversation || state.currentConversation._id !== message.conversationId) {
          console.log('Incrementing unread count for conversation:', conversation._id);
          console.log('Previous unread count:', conversation.unreadCount);
          conversation.unreadCount = (conversation.unreadCount || 0) + 1;
          console.log('New unread count:', conversation.unreadCount);
          // Update total unread count
          const previousTotal = state.unreadCount;
          state.unreadCount = state.conversations.reduce((total, conv) => total + (conv.unreadCount || 0), 0);
          console.log('Total unread count changed from', previousTotal, 'to', state.unreadCount);
        } else {
          console.log('Message is for current conversation, not incrementing unread count');
        }
        
        // Move conversation to top
        state.conversations = [
          conversation,
          ...state.conversations.filter(c => c._id !== message.conversationId)
        ];
      } else {
        console.log('Conversation not found for message:', message.conversationId);
      }
    },
    updateMessageStatus: (state, action) => {
      const { messageId, status } = action.payload;
      const message = state.messages.find(m => m._id === messageId);
      if (message) {
        message.status = status;
      }
    },
    setOnlineUsers: (state, action) => {
      state.onlineUsers = action.payload;
    },
    addOnlineUser: (state, action) => {
      if (!state.onlineUsers.includes(action.payload)) {
        state.onlineUsers.push(action.payload);
      }
    },
    removeOnlineUser: (state, action) => {
      state.onlineUsers = state.onlineUsers.filter(userId => userId !== action.payload);
    },
    setTypingUser: (state, action) => {
      const { conversationId, userId, isTyping } = action.payload;
      if (isTyping) {
        state.typingUsers[conversationId] = state.typingUsers[conversationId] || [];
        if (!state.typingUsers[conversationId].includes(userId)) {
          state.typingUsers[conversationId].push(userId);
        }
      } else {
        if (state.typingUsers[conversationId]) {
          state.typingUsers[conversationId] = state.typingUsers[conversationId].filter(
            id => id !== userId
          );
          if (state.typingUsers[conversationId].length === 0) {
            delete state.typingUsers[conversationId];
          }
        }
      }
    },
    clearError: (state) => {
      state.error = null;
    },
    updateUnreadCount: (state, action) => {
      state.unreadCount = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch conversations
      .addCase(fetchConversations.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchConversations.fulfilled, (state, action) => {
        state.isLoading = false;
        // Backend returns conversations array directly
        state.conversations = action.payload;
        console.log('Fetched conversations:', action.payload);
        // Calculate unread count from conversations
        const calculatedUnreadCount = action.payload.reduce((total, conv) => {
          console.log('Conversation', conv._id, 'unread count:', conv.unreadCount);
          return total + (conv.unreadCount || 0);
        }, 0);
        state.unreadCount = calculatedUnreadCount;
        console.log('Initial total unread count calculated:', calculatedUnreadCount);
      })
      .addCase(fetchConversations.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Fetch messages
      .addCase(fetchMessages.pending, (state) => {
        if (state.pagination.page === 1) {
          state.isLoading = true;
        }
        state.error = null;
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.isLoading = false;
        const { messages, hasMore } = action.payload;
        if (state.pagination.page === 1) {
          state.messages = messages;
        } else {
          state.messages = [...messages, ...state.messages];
        }
        state.pagination.hasMore = hasMore;
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Send message
      .addCase(sendMessage.pending, (state) => {
        state.sendingMessage = true;
        state.error = null;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.sendingMessage = false;
        // Add the sent message to the current conversation
        const newMessage = action.payload;
        if (newMessage) {
          state.messages.push(newMessage);
          
          // Update conversation's last message
          if (!state.conversations) {
            state.conversations = [];
          }
          const conversation = state.conversations.find(c => c._id === newMessage.conversationId);
          if (conversation) {
            conversation.lastMessage = {
              content: newMessage.content,
              sender: newMessage.sender,
              createdAt: newMessage.createdAt
            };
            conversation.updatedAt = newMessage.createdAt;
            // Move conversation to top
            state.conversations = [
              conversation,
              ...state.conversations.filter(c => c._id !== newMessage.conversationId)
            ];
          }
        }
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.sendingMessage = false;
        state.error = action.payload;
      })
      // Create conversation
      .addCase(createConversation.fulfilled, (state, action) => {
        // Ensure conversations array exists
        if (!state.conversations) {
          state.conversations = [];
        }
        state.conversations.unshift(action.payload);
        state.currentConversation = action.payload;
      })
      // Mark messages as read
      .addCase(markMessagesAsRead.fulfilled, (state, action) => {
        const { conversationId } = action.payload;
        console.log('Marking messages as read for conversation:', conversationId);
        
        // Update messages in current conversation
        if (state.currentConversation && state.currentConversation._id === conversationId) {
          state.messages.forEach(message => {
            if (!message.read) {
              message.read = true;
            }
          });
        }
        
        // Update conversation
        const conversation = state.conversations.find(c => c._id === conversationId);
        if (conversation) {
          console.log('Previous conversation unread count:', conversation.unreadCount);
          conversation.unreadCount = 0;
          console.log('Set conversation unread count to 0');
        } else {
          console.log('Conversation not found when marking as read:', conversationId);
        }
        
        // Recalculate total unread count
        const previousTotal = state.unreadCount;
        state.unreadCount = state.conversations.reduce((total, conv) => total + (conv.unreadCount || 0), 0);
        console.log('Total unread count after marking as read changed from', previousTotal, 'to', state.unreadCount);
      })
      // Upload attachment
      .addCase(uploadAttachment.pending, (state) => {
        state.uploadingFile = true;
      })
      .addCase(uploadAttachment.fulfilled, (state) => {
        state.uploadingFile = false;
      })
      .addCase(uploadAttachment.rejected, (state, action) => {
        state.uploadingFile = false;
        state.error = action.payload;
      });
  },
});

export const {
  setCurrentConversation,
  addMessage,
  updateMessageStatus,
  setOnlineUsers,
  addOnlineUser,
  removeOnlineUser,
  setTypingUser,
  clearError,
  updateUnreadCount,
} = chatSlice.actions;

export default chatSlice.reducer;