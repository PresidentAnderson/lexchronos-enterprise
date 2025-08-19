import { useState, useEffect, useCallback, useRef } from 'react';
import { useSocket } from './useSocket';
import { DocumentState, UserData } from '@/lib/socket';

interface CursorPosition {
  line: number;
  column: number;
}

export const useDocumentCollaboration = (documentId: string) => {
  const socket = useSocket();
  const [content, setContent] = useState('');
  const [collaborators, setCollaborators] = useState<UserData[]>([]);
  const [cursors, setCursors] = useState<Map<string, CursorPosition>>(new Map());
  const [isConnected, setIsConnected] = useState(false);
  const contentRef = useRef(content);
  
  // Keep ref in sync with state for latest content in callbacks
  useEffect(() => {
    contentRef.current = content;
  }, [content]);

  useEffect(() => {
    if (!socket || !documentId) return;

    // Join document room
    socket.emit('document:join', documentId);
    setIsConnected(true);

    // Listen for document state
    socket.on('document:state', (state: DocumentState) => {
      setContent(state.content);
      setCollaborators(state.users.map(u => u.userData));
      setCursors(new Map(state.cursors));
    });

    // Listen for document changes
    socket.on('document:changed', (data: {
      userId: string;
      operation: any;
      content: string;
      cursor?: CursorPosition;
    }) => {
      setContent(data.content);
      if (data.cursor) {
        setCursors(prev => new Map(prev.set(data.userId, data.cursor)));
      }
    });

    // Listen for cursor movements
    socket.on('document:cursor_moved', (data: {
      userId: string;
      cursor: CursorPosition;
    }) => {
      setCursors(prev => new Map(prev.set(data.userId, data.cursor)));
    });

    // Listen for user joins/leaves
    socket.on('document:user_joined', (data: { userId: string; userData: UserData }) => {
      setCollaborators(prev => [...prev.filter(u => u.id !== data.userId), data.userData]);
    });

    socket.on('document:user_left', (data: { userId: string }) => {
      setCollaborators(prev => prev.filter(u => u.id !== data.userId));
      setCursors(prev => {
        const newCursors = new Map(prev);
        newCursors.delete(data.userId);
        return newCursors;
      });
    });

    return () => {
      socket.emit('document:leave', documentId);
      socket.off('document:state');
      socket.off('document:changed');
      socket.off('document:cursor_moved');
      socket.off('document:user_joined');
      socket.off('document:user_left');
      setIsConnected(false);
    };
  }, [socket, documentId]);

  const updateContent = useCallback((newContent: string, operation?: any) => {
    if (socket && documentId) {
      setContent(newContent);
      socket.emit('document:edit', {
        documentId,
        content: newContent,
        operation
      });
    }
  }, [socket, documentId]);

  const updateCursor = useCallback((cursor: CursorPosition) => {
    if (socket && documentId) {
      socket.emit('document:cursor', {
        documentId,
        cursor
      });
    }
  }, [socket, documentId]);

  return {
    content,
    collaborators,
    cursors,
    updateContent,
    updateCursor,
    isConnected
  };
};