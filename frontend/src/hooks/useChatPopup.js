import { useDispatch } from 'react-redux';
import { setCurrentConversation } from '../features/chat/chatSlice';

// Custom hook to handle chat popup functionality
export const useChatPopup = () => {
  const dispatch = useDispatch();

  const openChatPopup = (conversation = null, scrollToUnread = false) => {
    if (conversation) {
      dispatch(setCurrentConversation(conversation));
    }
    // Dispatch a custom event to open the chat popup
    window.dispatchEvent(new CustomEvent('openChatPopup', { detail: { conversation, scrollToUnread } }));
  };

  const openChatList = () => {
    // Open chat popup without selecting a specific conversation
    window.dispatchEvent(new CustomEvent('openChatPopup', { detail: { conversation: null } }));
  };

  const openChatGeneral = () => {
    // Open chat popup without selecting a specific conversation (alias for openChatList)
    window.dispatchEvent(new CustomEvent('openChatPopup', { detail: { conversation: null } }));
  };

  return {
    openChatPopup,
    openChatList,
    openChatGeneral
  };
};

export default useChatPopup;