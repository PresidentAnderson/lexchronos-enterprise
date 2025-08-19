import { useEffect, useRef } from 'react';
import { getSocket, initializeSocket, disconnectSocket } from '@/lib/socket';
import { useAuth } from '@/hooks/useAuth'; // Assuming you have an auth hook

export const useSocket = () => {
  const { token } = useAuth(); // Get JWT token from your auth system
  const socketRef = useRef(getSocket());

  useEffect(() => {
    if (token && !socketRef.current) {
      socketRef.current = initializeSocket(token);
    }

    return () => {
      if (!token) {
        disconnectSocket();
        socketRef.current = null;
      }
    };
  }, [token]);

  return socketRef.current;
};