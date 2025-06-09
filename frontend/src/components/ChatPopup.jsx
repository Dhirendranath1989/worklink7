import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { PaperAirplaneIcon, PaperClipIcon, FaceSmileIcon, XMarkIcon, MinusIcon, ChatBubbleLeftIcon } from '@heroicons/react/24/outline';
import { CheckIcon } from '@heroicons/react/20/solid';
import { fetchConversations, fetchMessages, sendMessage, markMessagesAsRead, setCurrentConversation } from '../features/chat/chatSlice';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';

const ChatPopup = () => {
  const dispatch = useDispatch();
  const { conversations, messages, onlineUsers, typingUsers, currentConversation } = useSelector((state) => state.chat);
  // Removed notifications selector as backend now handles notification updates automatically
  const { user } = useSelector((state) => state.auth);
  
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [showConversationList, setShowConversationList] = useState(true);
  const [scrollToMessageId, setScrollToMessageId] = useState(null);
  const messagesEndRef = useRef(null);
  const messageRefs = useRef({});
  const fileInputRef = useRef(null);

  // Listen for custom events to open chat popup
  useEffect(() => {
    const handleOpenChatPopup = (event) => {
      const { conversation, scrollToUnread } = event.detail;
      setIsOpen(true);
      setIsMinimized(false);
      
      if (conversation) {
        setSelectedConversation(conversation);
        setShowConversationList(false);
        dispatch(setCurrentConversation(conversation));
        
        // If scrollToUnread is true, we'll scroll to the first unread message
        if (scrollToUnread) {
          setScrollToMessageId('first-unread');
        }
      } else {
        setShowConversationList(true);
      }
    };

    window.addEventListener('openChatPopup', handleOpenChatPopup);
    return () => window.removeEventListener('openChatPopup', handleOpenChatPopup);
  }, [dispatch]);

  useEffect(() => {
    if (isOpen && !conversations.length) {
      dispatch(fetchConversations());
    }
  }, [dispatch, isOpen, conversations.length]);

  useEffect(() => {
    if (selectedConversation) {
      dispatch(setCurrentConversation(selectedConversation));
      dispatch(fetchMessages({ conversationId: selectedConversation._id, page: 1 }));
      // Mark messages as read after a short delay to allow user to see the conversation
      const timer = setTimeout(() => {
        dispatch(markMessagesAsRead(selectedConversation._id));
        // Backend now automatically marks related notifications as read
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [dispatch, selectedConversation]);

  useEffect(() => {
    if (scrollToMessageId === 'first-unread' && messages.length > 0) {
      // Add a small delay to ensure DOM is updated
      const timer = setTimeout(() => {
        scrollToFirstUnreadMessage();
        setScrollToMessageId(null);
      }, 100);
      return () => clearTimeout(timer);
    } else if (scrollToMessageId && messages.length > 0) {
      const timer = setTimeout(() => {
        scrollToMessage(scrollToMessageId);
        setScrollToMessageId(null);
      }, 100);
      return () => clearTimeout(timer);
    } else if (!scrollToMessageId && messages.length > 0) {
      scrollToBottom();
    }
  }, [messages, scrollToMessageId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToMessage = (messageId) => {
    const messageElement = messageRefs.current[messageId];
    if (messageElement) {
      messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Highlight the message briefly
      messageElement.style.backgroundColor = '#fef3c7';
      setTimeout(() => {
        messageElement.style.backgroundColor = '';
      }, 2000);
    }
  };

  const scrollToFirstUnreadMessage = () => {
    if (!selectedConversation || !messages.length) return;
    
    // Find the first unread message (messages that were created after the user last read)
    const unreadMessages = messages.filter(message => {
      const isFromOtherUser = message.sender._id !== user.id;
      const isUnread = !message.read;
      return isFromOtherUser && isUnread;
    });
    
    if (unreadMessages.length > 0) {
      const firstUnreadMessage = unreadMessages[0];
      scrollToMessage(firstUnreadMessage._id);
    } else {
      // If no unread messages found, scroll to the last message from other user
      const otherUserMessages = messages.filter(message => message.sender._id !== user.id);
      if (otherUserMessages.length > 0) {
        const lastOtherMessage = otherUserMessages[otherUserMessages.length - 1];
        scrollToMessage(lastOtherMessage._id);
      } else {
        scrollToBottom();
      }
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedConversation) {
      return;
    }

    try {
      await dispatch(sendMessage({
        conversationId: selectedConversation._id,
        message: messageText.trim(),
        type: 'text'
      })).unwrap();
      setMessageText('');
    } catch (error) {
      toast.error('Failed to send message');
    }
  };

  const getOtherParticipant = (conversation) => {
    if (!conversation) {
      return { name: 'Unknown User', _id: '', profilePicture: null };
    }
    
    if (conversation.otherParticipant) {
      return {
        name: conversation.otherParticipant.fullName || 'Unknown User',
        _id: conversation.otherParticipant._id || '',
        profilePicture: conversation.otherParticipant.profilePhoto || null
      };
    }
    
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

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !selectedConversation) return;
    toast.info('File upload feature coming soon!');
  };

  const handleBackToList = () => {
    setShowConversationList(true);
    setSelectedConversation(null);
    dispatch(setCurrentConversation(null));
  };

  if (!user) return null;

  return (
    <>
      {/* Chat Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-primary-600 hover:bg-primary-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 z-50 flex items-center justify-center"
        >
          <ChatBubbleLeftIcon className="w-6 h-6" />
        </button>
      )}

      {/* Chat Popup */}
      {isOpen && (
        <div className={`fixed bottom-6 right-6 w-96 bg-white dark:bg-gray-800 rounded-lg shadow-2xl border dark:border-gray-700 z-50 transition-all duration-300 ${
          isMinimized ? 'h-14' : 'h-96'
        }`}>
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-primary-600 text-white rounded-t-lg">
            <div className="flex items-center space-x-2">
              {selectedConversation && !showConversationList ? (
                <>
                  {getOtherParticipant(selectedConversation).profilePicture ? (
                    <img
                      className="w-8 h-8 rounded-full object-cover border-2 border-white"
                      src={getOtherParticipant(selectedConversation).profilePicture.startsWith('http') 
                        ? getOtherParticipant(selectedConversation).profilePicture 
                        : `http://localhost:5000${getOtherParticipant(selectedConversation).profilePicture}`}
                      alt={getOtherParticipant(selectedConversation).name}
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center border-2 border-white">
                      <span className="text-sm font-semibold">
                        {getOtherParticipant(selectedConversation).name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <h3 className="font-semibold">
                    {getOtherParticipant(selectedConversation).name}
                  </h3>
                </>
              ) : (
                <>
                  <ChatBubbleLeftIcon className="w-5 h-5" />
                  <h3 className="font-semibold">Chat</h3>
                </>
              )}
            </div>
            <div className="flex items-center space-x-1">
              {selectedConversation && !showConversationList && (
                <button
                  onClick={handleBackToList}
                  className="p-1 hover:bg-primary-700 rounded transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              )}
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1 hover:bg-primary-700 rounded transition-colors"
              >
                <MinusIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-primary-700 rounded transition-colors"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Content */}
          {!isMinimized && (
            <div className="flex flex-col h-80">
              {showConversationList ? (
                /* Conversations List */
                <div className="flex-1 overflow-y-auto">
                  {!conversations || conversations.length === 0 ? (
                    <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                      No conversations yet
                    </div>
                  ) : (
                    conversations.filter(conversation => conversation && conversation._id).map((conversation) => {
                      const otherParticipant = getOtherParticipant(conversation);
                      const isOnline = isUserOnline(otherParticipant._id);
                      
                      return (
                        <div
                          key={conversation._id}
                          onClick={() => {
                            setSelectedConversation(conversation);
                            setShowConversationList(false);
                            dispatch(setCurrentConversation(conversation));
                          }}
                          className="p-3 border-b border-gray-100 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
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
                                className="w-10 h-10 rounded-full object-cover ring-2 ring-gray-200 dark:ring-gray-600"
                              />
                              {isOnline && (
                                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
                              )}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                  {otherParticipant.name}
                                </h4>
                                {conversation.lastMessage && (
                                  <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                                    {format(new Date(conversation.lastMessage.createdAt), 'HH:mm')}
                                  </span>
                                )}
                              </div>
                              
                              <div className="flex items-center justify-between">
                                {conversation.lastMessage && (
                                  <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                                    {conversation.lastMessage.content}
                                  </p>
                                )}
                                
                                {conversation.unreadCount > 0 && (
                                  <span className="inline-flex items-center justify-center w-4 h-4 text-xs font-bold text-white bg-primary-500 rounded-full flex-shrink-0 ml-2">
                                    {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
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
              ) : (
                /* Chat Messages */
                <>
                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-gray-50 dark:bg-gray-900">
                    {messages.map((message, index) => {
                      const isOwn = message.sender._id === user.id;
                      const nextMessage = messages[index + 1];
                      const isLastInGroup = !nextMessage || nextMessage.sender._id !== message.sender._id;
                      
                      return (
                        <div
                          key={message._id}
                          ref={(el) => messageRefs.current[message._id] = el}
                          className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-1 transition-colors duration-500`}
                        >
                          <div className={`flex items-end space-x-1 max-w-xs ${isOwn ? 'flex-row-reverse space-x-reverse' : ''}`}>
                            {!isOwn && isLastInGroup && (
                              <img
                                src={message.sender.profilePhoto 
                                  ? (message.sender.profilePhoto.startsWith('http') 
                                    ? message.sender.profilePhoto 
                                    : `http://localhost:5000${message.sender.profilePhoto}`)
                                  : '/default-avatar.png'}
                                alt={message.sender.fullName}
                                className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                              />
                            )}
                            {!isOwn && !isLastInGroup && (
                              <div className="w-6 h-6 flex-shrink-0"></div>
                            )}
                            
                            <div className={`relative px-3 py-2 break-words text-sm ${
                              isOwn
                                ? 'bg-primary-600 dark:bg-primary-500 text-white rounded-t-xl rounded-bl-xl rounded-br-md'
                                : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm border dark:border-gray-600 rounded-t-xl rounded-br-xl rounded-bl-md'
                            }`}>
                              <p className="whitespace-pre-wrap break-words">{message.content}</p>
                              
                              <div className={`flex items-center justify-end space-x-1 mt-1 ${
                                isOwn ? 'text-primary-100' : 'text-gray-500 dark:text-gray-400'
                              }`}>
                                <span className="text-xs">
                                  {format(new Date(message.createdAt), 'HH:mm')}
                                </span>
                                {isOwn && (
                                  <div className="flex">
                                    <CheckIcon className="w-3 h-3" />
                                    <CheckIcon className="w-3 h-3 -ml-1" />
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  
                    {isUserTyping(selectedConversation?._id) && (
                      <div className="flex justify-start">
                        <div className="flex items-end space-x-1">
                          <img
                            src={getOtherParticipant(selectedConversation).profilePicture 
                              ? (getOtherParticipant(selectedConversation).profilePicture.startsWith('http') 
                                ? getOtherParticipant(selectedConversation).profilePicture 
                                : `http://localhost:5000${getOtherParticipant(selectedConversation).profilePicture}`)
                              : '/default-avatar.png'}
                            alt={getOtherParticipant(selectedConversation).name}
                            className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                          />
                          <div className="bg-white dark:bg-gray-700 rounded-t-xl rounded-br-xl rounded-bl-md px-3 py-2 shadow-sm border dark:border-gray-600">
                            <div className="flex space-x-1">
                              <div className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce"></div>
                              <div className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                              <div className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Message Input */}
                  <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                    <form onSubmit={handleSendMessage} className="flex items-end space-x-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <PaperClipIcon className="h-4 w-4" />
                      </button>
                      
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        className="hidden"
                        accept="image/*,application/pdf,.doc,.docx"
                      />
                      
                      <div className="flex-1 relative">
                        <div className="flex items-end bg-gray-50 dark:bg-gray-700 rounded-2xl border border-gray-200 dark:border-gray-600 focus-within:border-primary-500 focus-within:ring-1 focus-within:ring-primary-500">
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
                            className="flex-1 resize-none border-0 bg-transparent px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-0 max-h-20"
                            style={{
                              minHeight: '32px',
                              maxHeight: '80px'
                            }}
                          />
                          <button
                            type="button"
                            className="p-1.5 mr-1 text-gray-400 dark:text-gray-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-gray-600"
                          >
                            <FaceSmileIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      
                      <button
                        type="submit"
                        disabled={!messageText.trim()}
                        className="p-2 bg-primary-600 dark:bg-primary-500 text-white rounded-full hover:bg-primary-700 dark:hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100 shadow-lg"
                      >
                        <PaperAirplaneIcon className="h-4 w-4" />
                      </button>
                    </form>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default ChatPopup;