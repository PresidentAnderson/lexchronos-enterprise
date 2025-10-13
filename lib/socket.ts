import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const initializeSocket = (token: string) => {
  if (!socket) {
    socket = io(process.env.NODE_ENV === 'production' 
      ? 'wss://your-domain.com' 
      : 'http://localhost:3000', {
      auth: {
        token
      },
      transports: ['websocket'],
      upgrade: true
    });

    socket.on('connect', () => {
      console.log('Connected to Socket.io server');
    });

    socket.on('disconnect', (reason) => {
      console.log('Disconnected from Socket.io server:', reason);
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });
  }

  return socket;
};

export const getSocket = (): Socket | null => {
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

// Socket event types
export interface CaseUpdate {
  caseId: string;
  field: string;
  update: any;
  activity: Activity;
}

export interface Activity {
  id: string;
  type: string;
  userId: string;
  userName: string;
  caseId?: string;
  timestamp: string;
  [key: string]: any;
}

export interface ChatMessage {
  id: string;
  chatId: string;
  userId: string;
  userData: UserData;
  message: string;
  type: 'text' | 'image' | 'file' | 'system';
  timestamp: string;
}

export interface UserData {
  id: string;
  name: string;
  role: 'lawyer' | 'client' | 'admin';
  email: string;
}

export interface DocumentState {
  content: string;
  users: Array<{
    socketId: string;
    userData: UserData;
    cursor: any;
  }>;
  cursors: Array<[string, any]>;
}

export interface NotificationData {
  id: string;
  type: string;
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  timestamp: string;
  read?: boolean;
  readAt?: string;
  caseId?: string;
  dueDate?: string;
}

export interface TimelineEvent {
  id: string;
  title: string;
  description?: string;
  date: string;
  type: 'court_hearing' | 'deadline' | 'meeting' | 'filing' | 'other';
  userId: string;
  userName: string;
  timestamp: string;
}

export interface SearchSuggestion {
  query: string;
  suggestions: string[];
  timestamp: string;
}

export interface PresenceData {
  userId: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  activity?: string;
}