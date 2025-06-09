import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import { PaperAirplaneIcon, PaperClipIcon, FaceSmileIcon, PhoneIcon, VideoCameraIcon, EllipsisVerticalIcon } from '@heroicons/react/24/outline';
import { CheckIcon } from '@heroicons/react/20/solid';
import { fetchConversations, fetchMessages, sendMessage, markMessagesAsRead, setCurrentConversation } from '../features/chat/chatSlice';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';

const Chat = () => {
  const dispatch = useDispatch();
  const { conversations, messages, onlineUsers, typingUsers, currentConversation } = useSelector((state) => state.chat);
  const { user } = useSelector((state) => state.auth);
  const [searchParams] = useSearchParams();
  const [messageText, setMessageText] = useState('');
  const [selectedConversation, setSelectedConversation] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    dispatch(fetchConversations());
  }, [dispatch]);

  // Auto-select conversation from Redux currentConversation or URL parameter
  useEffect(() => {
    // First priority: use currentConversation from Redux (set by createConversation action)
    if (currentConversation) {
      console.log('Chat - Using currentConversation from Redux:', currentConversation);
      setSelectedConversation(currentConversation);
      return;
    }
    
    // Second priority: try URL parameter for direct links
    const conversationId = searchParams.get('conversation');
    console.log('Chat - URL conversation parameter:', conversationId);
    console.log('Chat - Available conversations:', conversations);
    console.log('Chat - Conversations length:', conversations?.length);
    
    if (conversationId && conversations && conversations.length > 0) {
      const targetConversation = conversations.find(conv => conv._id === conversationId);
      console.log('Chat - Target conversation found:', targetConversation);
      
      if (targetConversation) {
        console.log('Chat - Setting selected conversation from URL:', targetConversation);
        setSelectedConversation(targetConversation);
        dispatch(setCurrentConversation(targetConversation));
      } else {
        console.log('Chat - No conversation found with ID:', conversationId);
        console.log('Chat - Available conversation IDs:', conversations.map(c => c._id));
      }
    } else if (!conversationId && !currentConversation) {
      // Clear selection if no conversation is specified
      setSelectedConversation(null);
      dispatch(setCurrentConversation(null));
    }
  }, [currentConversation, conversations, searchParams, dispatch]);

  useEffect(() => {
    if (selectedConversation) {
      // Set current conversation in Redux for SocketContext
      dispatch(setCurrentConversation(selectedConversation));
      dispatch(fetchMessages({ conversationId: selectedConversation._id, page: 1 }));
      // Mark messages as read after a short delay to allow user to see the conversation
      const timer = setTimeout(() => {
        dispatch(markMessagesAsRead(selectedConversation._id));
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [dispatch, selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedConversation) {
      console.log('Cannot send message:', { messageText: messageText.trim(), selectedConversation });
      return;
    }

    console.log('Sending message:', {
      conversationId: selectedConversation._id,
      message: messageText.trim(),
      type: 'text'
    });

    try {
      const result = await dispatch(sendMessage({
        conversationId: selectedConversation._id,
        message: messageText.trim(),
        type: 'text'
      })).unwrap();
      console.log('Message sent successfully:', result);
      setMessageText('');
    } catch (error) {
      console.error('Send message error:', error);
      toast.error('Failed to send message');
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !selectedConversation) return;

    // Handle file upload logic here
    toast.info('File upload feature coming soon!');
  };

  const getOtherParticipant = (conversation) => {
    if (!conversation) {
      return { name: 'Unknown User', _id: '', profilePicture: null };
    }
    
    // Handle backend response structure with otherParticipant
    if (conversation.otherParticipant) {
      return {
        name: conversation.otherParticipant.fullName || 'Unknown User',
        _id: conversation.otherParticipant._id || '',
        profilePicture: conversation.otherParticipant.profilePhoto || null
      };
    }
    
    // Fallback for participants array structure
    if (conversation.participants && Array.isArray(conversation.participants)) {
      const otherParticipant = conversation.participants.find(p => p._id !== user.id);
      if (otherParticipant) {
        return {
          name: otherParticipant.fullName || otherParticipant.name || 'Unknown User',
          _id: otherParticipant._id || '',
          profilePicture: otherParticipant.profilePhoto || otherParticipant.profilePicture || null
        };
      }
    }
    
    return { name: 'Unknown User', _id: '', profilePicture: null };
  };

  const isUserOnline = (userId) => {
    return onlineUsers && onlineUsers.includes(userId);
  };

  const isUserTyping = (conversationId) => {
    return typingUsers && typingUsers[conversationId] && typingUsers[conversationId].length > 0;
  };

  return (
    <div className="h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
      {/* Dark theme background pattern */}
      <div className="absolute inset-0 opacity-5 dark:opacity-10">
        <div className="h-full w-full" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '60px 60px'
        }}></div>
      </div>
      
      <div className="relative h-full flex">
        <div className="flex h-full w-full max-w-7xl mx-auto bg-white dark:bg-gray-800 shadow-2xl border dark:border-gray-700">
            {/* Conversations List */}
            <div className="w-1/3 border-r border-gray-200 dark:border-gray-700 flex flex-col bg-white dark:bg-gray-800">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Chats</h2>
              </div>
              
              <div className="flex-1 overflow-y-auto">
              {!conversations || conversations.length === 0 ? (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                  No conversations yet
                </div>
              ) : (
                conversations.filter(conversation => conversation && conversation._id).map((conversation) => {
                  const otherParticipant = getOtherParticipant(conversation);
                  const isOnline = isUserOnline(otherParticipant._id);
                  const isSelected = selectedConversation?._id === conversation._id;
                  
                  return (
                    <div
                      key={conversation._id}
                      onClick={() => {
                        setSelectedConversation(conversation);
                        dispatch(setCurrentConversation(conversation));
                      }}
                      className={`p-3 border-b border-gray-100 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                        isSelected ? 'bg-primary-50 dark:bg-primary-900/20 border-l-4 border-l-primary-500' : ''
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="relative flex-shrink-0">
                          <img
                            src={otherParticipant.profilePicture 
                              ? (otherParticipant.profilePicture.startsWith('http') 
                                ? otherParticipant.profilePicture 
                                : `http://localhost:5000${otherParticipant.profilePicture}`)
                              : '/default-avatar.png'}
                            alt={otherParticipant.name}
                            className="w-12 h-12 rounded-full object-cover ring-2 ring-gray-200 dark:ring-gray-600"
                          />
                          {isOnline && (
                            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                              {otherParticipant.name}
                            </h3>
                            {conversation.lastMessage && (
                              <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                                {format(new Date(conversation.lastMessage.createdAt), 'HH:mm')}
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center justify-between">
                            {conversation.lastMessage && (
                              <div className="flex items-center space-x-1 flex-1 min-w-0">
                                {conversation.lastMessage.sender === user.id && (
                                  <div className="flex-shrink-0">
                                    <CheckIcon className="w-4 h-4 text-primary-500" />
                                  </div>
                                )}
                                <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                                  {conversation.lastMessage.content}
                                </p>
                              </div>
                            )}
                            
                            {conversation.unreadCount > 0 && (
                              <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-primary-500 rounded-full flex-shrink-0 ml-2">
                                {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col">
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <img
                        src={getOtherParticipant(selectedConversation).profilePicture 
                          ? (getOtherParticipant(selectedConversation).profilePicture.startsWith('http') 
                            ? getOtherParticipant(selectedConversation).profilePicture 
                            : `http://localhost:5000${getOtherParticipant(selectedConversation).profilePicture}`)
                          : '/default-avatar.png'}
                        alt={getOtherParticipant(selectedConversation).name}
                        className="w-10 h-10 rounded-full object-cover ring-2 ring-gray-200 dark:ring-gray-600"
                      />
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {getOtherParticipant(selectedConversation).name}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {isUserOnline(getOtherParticipant(selectedConversation)._id) ? (
                            <span className="flex items-center">
                              <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                              Online
                            </span>
                          ) : (
                            'Last seen recently'
                          )}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button className="p-2 text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                        <PhoneIcon className="w-5 h-5" />
                      </button>
                      <button className="p-2 text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                        <VideoCameraIcon className="w-5 h-5" />
                      </button>
                      <button className="p-2 text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                        <EllipsisVerticalIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-gray-50 dark:bg-gray-900" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23000000' fill-opacity='0.02'%3E%3Cpath d='M50 50c0-5.5-4.5-10-10-10s-10 4.5-10 10 4.5 10 10 10 10-4.5 10-10zm20 0c0-5.5-4.5-10-10-10s-10 4.5-10 10 4.5 10 10 10 10-4.5 10-10z'/%3E%3C/g%3E%3C/svg%3E")`
                  }}>
                    {messages.map((message, index) => {
                      const isOwn = message.sender._id === user.id;
                      const nextMessage = messages[index + 1];
                      const isLastInGroup = !nextMessage || nextMessage.sender._id !== message.sender._id;
                      const prevMessage = messages[index - 1];
                      const isFirstInGroup = !prevMessage || prevMessage.sender._id !== message.sender._id;
                      
                      return (
                        <div
                          key={message._id}
                          className={`flex ${isOwn ? 'justify-end' : 'justify-start'} ${isFirstInGroup ? 'mt-4' : 'mt-1'}`}
                        >
                          <div className={`flex items-end space-x-2 max-w-sm lg:max-w-lg ${isOwn ? 'flex-row-reverse space-x-reverse' : ''}`}>
                            {/* Profile picture for received messages */}
                            {!isOwn && isLastInGroup && (
                              <img
                                src={message.sender.profilePhoto 
                                  ? (message.sender.profilePhoto.startsWith('http') 
                                    ? message.sender.profilePhoto 
                                    : `http://localhost:5000${message.sender.profilePhoto}`)
                                  : '/default-avatar.png'}
                                alt={message.sender.fullName}
                                className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                              />
                            )}
                            {!isOwn && !isLastInGroup && (
                              <div className="w-8 h-8 flex-shrink-0"></div>
                            )}
                            
                            {/* Profile picture for sent messages */}
                            {isOwn && isLastInGroup && (
                              <img
                                src={user?.profilePhoto 
                                  ? (user.profilePhoto.startsWith('http') 
                                    ? user.profilePhoto 
                                    : `http://localhost:5000${user.profilePhoto}`)
                                  : '/default-avatar.png'}
                                alt={user?.fullName || user?.name}
                                className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                              />
                            )}
                            {isOwn && !isLastInGroup && (
                              <div className="w-8 h-8 flex-shrink-0"></div>
                            )}
                            
                            <div className={`relative px-3 py-2 break-words ${
                              isOwn
                                ? `bg-primary-600 dark:bg-primary-500 text-white ${
                                    isLastInGroup ? 'rounded-t-2xl rounded-bl-2xl rounded-br-md' : 'rounded-t-2xl rounded-bl-2xl rounded-br-2xl'
                                  }`
                                : `bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm border dark:border-gray-600 ${
                                    isLastInGroup ? 'rounded-t-2xl rounded-br-2xl rounded-bl-md' : 'rounded-t-2xl rounded-br-2xl rounded-bl-2xl'
                                  }`
                            }`}>
                              {!isOwn && isFirstInGroup && (
                                <p className="text-xs font-semibold text-primary-600 dark:text-primary-400 mb-1">
                                  {message.sender.fullName}
                                </p>
                              )}
                              
                              <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                              
                              <div className={`flex items-center justify-end space-x-1 mt-1 ${
                                isOwn ? 'text-primary-100' : 'text-gray-500 dark:text-gray-400'
                              }`}>
                                <span className="text-xs">
                                  {format(new Date(message.createdAt), 'HH:mm')}
                                </span>
                                {isOwn && (
                                  <div className="flex">
                                    <CheckIcon className="w-4 h-4" />
                                    <CheckIcon className="w-4 h-4 -ml-1" />
                                  </div>
                                )}
                              </div>
                              
                              {/* Message tail */}
                              {isLastInGroup && (
                                <div className={`absolute bottom-0 ${
                                  isOwn 
                                    ? 'right-0 transform translate-x-1 translate-y-1'
                                    : 'left-0 transform -translate-x-1 translate-y-1'
                                }`}>
                                  <div className={`w-3 h-3 transform rotate-45 ${
                                    isOwn ? 'bg-primary-600 dark:bg-primary-500' : 'bg-white dark:bg-gray-700'
                                  }`}></div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  
                  {isUserTyping(selectedConversation._id) && (
                    <div className="flex justify-start mt-2">
                      <div className="flex items-end space-x-2">
                        <img
                          src={getOtherParticipant(selectedConversation).profilePicture 
                            ? (getOtherParticipant(selectedConversation).profilePicture.startsWith('http') 
                              ? getOtherParticipant(selectedConversation).profilePicture 
                              : `http://localhost:5000${getOtherParticipant(selectedConversation).profilePicture}`)
                            : '/default-avatar.png'}
                          alt={getOtherParticipant(selectedConversation).name}
                          className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                        />
                        <div className="bg-white dark:bg-gray-700 rounded-t-2xl rounded-br-2xl rounded-bl-md px-4 py-3 shadow-sm border dark:border-gray-600">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                  <form onSubmit={handleSendMessage} className="flex items-end space-x-3">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="p-2 text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <PaperClipIcon className="h-6 w-6" />
                    </button>
                    
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      className="hidden"
                      accept="image/*,application/pdf,.doc,.docx"
                    />
                    
                    <div className="flex-1 relative">
                      <div className="flex items-end bg-gray-50 dark:bg-gray-700 rounded-3xl border border-gray-200 dark:border-gray-600 focus-within:border-primary-500 focus-within:ring-1 focus-within:ring-primary-500">
                        <textarea
                          value={messageText}
                          onChange={(e) => setMessageText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleSendMessage(e);
                            }
                          }}
                          placeholder="Type a message..."
                          rows={1}
                          className="flex-1 resize-none border-0 bg-transparent px-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-0 max-h-32"
                          style={{
                            minHeight: '44px',
                            maxHeight: '128px'
                          }}
                        />
                        <button
                          type="button"
                          className="p-2 mr-2 text-gray-400 dark:text-gray-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-gray-600"
                        >
                          <FaceSmileIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                    
                    <button
                      type="submit"
                      disabled={!messageText.trim()}
                      className="p-3 bg-primary-600 dark:bg-primary-500 text-white rounded-full hover:bg-primary-700 dark:hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100 shadow-lg"
                    >
                      <PaperAirplaneIcon className="h-5 w-5" />
                    </button>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23000000' fill-opacity='0.02'%3E%3Cpath d='M50 50c0-5.5-4.5-10-10-10s-10 4.5-10 10 4.5 10 10 10 10-4.5 10-10zm20 0c0-5.5-4.5-10-10-10s-10 4.5-10 10 4.5 10 10 10 10-4.5 10-10z'/%3E%3C/g%3E%3C/svg%3E")`
              }}>
                <div className="text-center max-w-md mx-auto px-8">
                  <div className="w-32 h-32 mx-auto mb-8 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
                    <svg className="w-16 h-16 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                    WorkLink Chat
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                    Connect with workers and employers seamlessly. Select a conversation from the list to start messaging and collaborate on your projects.
                  </p>
                  <div className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
                    <p>• Send messages instantly</p>
                    <p>• Share files and documents</p>
                    <p>• Real-time notifications</p>
                  </div>
                </div>
              </div>
            )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;