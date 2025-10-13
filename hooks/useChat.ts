import { useState, useEffect, useCallback, useRef } from 'react';
import { useSocket } from './useSocket';
import { ChatMessage, UserData } from '@/lib/socket';

export const useChat = (chatId: string) => {
  const socket = useSocket();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [typingUsers, setTypingUsers] = useState<UserData[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!socket || !chatId) return;

    // Join chat room
    socket.emit('chat:join', chatId);
    setIsConnected(true);

    // Listen for new messages
    socket.on('chat:new_message', (message: ChatMessage) => {
      setMessages(prev => [...prev, message]);
    });

    // Listen for typing indicators
    socket.on('chat:user_typing', (data: {
      userId: string;
      userData: UserData;
      isTyping: boolean;
    }) => {
      setTypingUsers(prev => {
        if (data.isTyping) {
          return [...prev.filter(u => u.id !== data.userId), data.userData];
        } else {
          return prev.filter(u => u.id !== data.userId);
        }
      });

      // Auto-remove typing indicator after 3 seconds
      if (data.isTyping) {
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        typingTimeoutRef.current = setTimeout(() => {
          setTypingUsers(prev => prev.filter(u => u.id !== data.userId));
        }, 3000);
      }
    });

    return () => {
      socket.off('chat:new_message');
      socket.off('chat:user_typing');
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      setIsConnected(false);
    };
  }, [socket, chatId]);

  const sendMessage = useCallback((message: string, type: 'text' | 'image' | 'file' = 'text') => {
    if (socket && chatId && message.trim()) {
      socket.emit('chat:message', {
        chatId,
        message: message.trim(),
        type
      });
    }
  }, [socket, chatId]);

  const setTyping = useCallback((isTyping: boolean) => {
    if (socket && chatId) {
      socket.emit('chat:typing', {
        chatId,
        isTyping
      });
    }
  }, [socket, chatId]);

  return {
    messages,
    typingUsers,
    sendMessage,
    setTyping,
    isConnected
  };
};