const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 3000;

// Initialize Next.js app
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// In-memory stores for demo (replace with Redis/Database in production)
const onlineUsers = new Map(); // userId -> { socketId, userData }
const userSessions = new Map(); // socketId -> userId
const caseRooms = new Map(); // caseId -> Set of socketIds
const documentSessions = new Map(); // documentId -> { users: Map, content: string, cursors: Map }
const notifications = new Map(); // userId -> Array of notifications
const activities = new Map(); // caseId -> Array of activities
const searchSessions = new Map(); // socketId -> { query, suggestions }

// JWT Secret (use environment variable in production)
const JWT_SECRET = process.env.JWT_SECRET || 'lexchronos-secret-key';

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  const io = new Server(server, {
    cors: {
      origin: process.env.NODE_ENV === 'production' 
        ? ['https://your-domain.com'] 
        : ['http://localhost:3000'],
      methods: ['GET', 'POST']
    }
  });

  // Authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      return next(new Error('Authentication error'));
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      socket.userId = decoded.userId;
      socket.userRole = decoded.role || 'client';
      socket.userData = {
        id: decoded.userId,
        name: decoded.name || 'User',
        role: decoded.role || 'client',
        email: decoded.email
      };
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User ${socket.userId} connected with socket ${socket.id}`);
    
    // Store user session
    userSessions.set(socket.id, socket.userId);
    onlineUsers.set(socket.userId, {
      socketId: socket.id,
      userData: socket.userData,
      lastSeen: new Date()
    });

    // Broadcast user online status
    socket.broadcast.emit('user:online', {
      userId: socket.userId,
      userData: socket.userData
    });

    // ========== CASE UPDATES ==========
    socket.on('case:join', (caseId) => {
      socket.join(`case_${caseId}`);
      
      if (!caseRooms.has(caseId)) {
        caseRooms.set(caseId, new Set());
      }
      caseRooms.get(caseId).add(socket.id);
      
      // Send case activity history
      const caseActivities = activities.get(caseId) || [];
      socket.emit('case:activities', caseActivities);
      
      console.log(`User ${socket.userId} joined case ${caseId}`);
    });

    socket.on('case:leave', (caseId) => {
      socket.leave(`case_${caseId}`);
      if (caseRooms.has(caseId)) {
        caseRooms.get(caseId).delete(socket.id);
      }
    });

    socket.on('case:update', (data) => {
      const { caseId, update, field } = data;
      
      // Add activity
      const activity = {
        id: uuidv4(),
        type: 'case_update',
        userId: socket.userId,
        userName: socket.userData.name,
        caseId,
        field,
        update,
        timestamp: new Date().toISOString()
      };
      
      if (!activities.has(caseId)) {
        activities.set(caseId, []);
      }
      activities.get(caseId).push(activity);

      // Broadcast to case room
      io.to(`case_${caseId}`).emit('case:updated', {
        caseId,
        field,
        update,
        activity
      });
    });

    // ========== DOCUMENT COLLABORATION ==========
    socket.on('document:join', (documentId) => {
      socket.join(`doc_${documentId}`);
      
      if (!documentSessions.has(documentId)) {
        documentSessions.set(documentId, {
          users: new Map(),
          content: '',
          cursors: new Map(),
          lastModified: new Date()
        });
      }
      
      const session = documentSessions.get(documentId);
      session.users.set(socket.userId, {
        socketId: socket.id,
        userData: socket.userData,
        cursor: null
      });
      
      // Send current document state
      socket.emit('document:state', {
        content: session.content,
        users: Array.from(session.users.values()),
        cursors: Array.from(session.cursors.entries())
      });
      
      // Notify others
      socket.to(`doc_${documentId}`).emit('document:user_joined', {
        userId: socket.userId,
        userData: socket.userData
      });
    });

    socket.on('document:leave', (documentId) => {
      socket.leave(`doc_${documentId}`);
      
      if (documentSessions.has(documentId)) {
        const session = documentSessions.get(documentId);
        session.users.delete(socket.userId);
        session.cursors.delete(socket.userId);
        
        socket.to(`doc_${documentId}`).emit('document:user_left', {
          userId: socket.userId
        });
      }
    });

    socket.on('document:edit', (data) => {
      const { documentId, operation, content, cursor } = data;
      
      if (documentSessions.has(documentId)) {
        const session = documentSessions.get(documentId);
        session.content = content;
        session.lastModified = new Date();
        
        if (cursor) {
          session.cursors.set(socket.userId, cursor);
        }
        
        // Broadcast to others in document
        socket.to(`doc_${documentId}`).emit('document:changed', {
          userId: socket.userId,
          operation,
          content,
          cursor
        });
      }
    });

    socket.on('document:cursor', (data) => {
      const { documentId, cursor } = data;
      
      if (documentSessions.has(documentId)) {
        const session = documentSessions.get(documentId);
        session.cursors.set(socket.userId, cursor);
        
        socket.to(`doc_${documentId}`).emit('document:cursor_moved', {
          userId: socket.userId,
          cursor
        });
      }
    });

    // ========== NOTIFICATIONS ==========
    socket.on('notification:mark_read', (notificationId) => {
      const userNotifications = notifications.get(socket.userId) || [];
      const notification = userNotifications.find(n => n.id === notificationId);
      if (notification) {
        notification.read = true;
        notification.readAt = new Date().toISOString();
      }
    });

    // ========== CHAT SYSTEM ==========
    socket.on('chat:join', (chatId) => {
      socket.join(`chat_${chatId}`);
      console.log(`User ${socket.userId} joined chat ${chatId}`);
    });

    socket.on('chat:message', (data) => {
      const { chatId, message, type = 'text' } = data;
      
      const chatMessage = {
        id: uuidv4(),
        chatId,
        userId: socket.userId,
        userData: socket.userData,
        message,
        type,
        timestamp: new Date().toISOString()
      };
      
      // Broadcast to chat room
      io.to(`chat_${chatId}`).emit('chat:new_message', chatMessage);
    });

    socket.on('chat:typing', (data) => {
      const { chatId, isTyping } = data;
      
      socket.to(`chat_${chatId}`).emit('chat:user_typing', {
        userId: socket.userId,
        userData: socket.userData,
        isTyping
      });
    });

    // ========== TIMELINE UPDATES ==========
    socket.on('timeline:join', (caseId) => {
      socket.join(`timeline_${caseId}`);
    });

    socket.on('timeline:add_event', (data) => {
      const { caseId, event } = data;
      
      const timelineEvent = {
        id: uuidv4(),
        ...event,
        userId: socket.userId,
        userName: socket.userData.name,
        timestamp: new Date().toISOString()
      };
      
      // Broadcast to timeline room
      io.to(`timeline_${caseId}`).emit('timeline:event_added', timelineEvent);
      
      // Add to case activities
      const activity = {
        id: uuidv4(),
        type: 'timeline_event',
        userId: socket.userId,
        userName: socket.userData.name,
        caseId,
        event: timelineEvent,
        timestamp: new Date().toISOString()
      };
      
      if (!activities.has(caseId)) {
        activities.set(caseId, []);
      }
      activities.get(caseId).push(activity);
    });

    // ========== SEARCH SUGGESTIONS ==========
    socket.on('search:query', (data) => {
      const { query, type = 'general' } = data;
      
      searchSessions.set(socket.id, { query, type });
      
      // Simulate search suggestions (replace with real search logic)
      const suggestions = generateSearchSuggestions(query, type);
      
      socket.emit('search:suggestions', {
        query,
        suggestions,
        timestamp: new Date().toISOString()
      });
    });

    // ========== PRESENCE INDICATORS ==========
    socket.on('presence:update', (data) => {
      const { status, activity } = data;
      
      if (onlineUsers.has(socket.userId)) {
        const userInfo = onlineUsers.get(socket.userId);
        userInfo.status = status;
        userInfo.activity = activity;
        userInfo.lastSeen = new Date();
        
        // Broadcast presence update
        socket.broadcast.emit('presence:user_updated', {
          userId: socket.userId,
          status,
          activity
        });
      }
    });

    // ========== DEADLINE NOTIFICATIONS ==========
    // Check for upcoming deadlines periodically
    const checkDeadlines = () => {
      // This would typically query your database
      // For now, simulate deadline notifications
      const mockDeadline = {
        id: uuidv4(),
        type: 'deadline_reminder',
        title: 'Court Hearing Tomorrow',
        message: 'You have a court hearing scheduled for tomorrow at 10:00 AM',
        priority: 'high',
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        caseId: 'case_123'
      };
      
      // Send to specific user
      if (Math.random() > 0.95) { // 5% chance for demo
        socket.emit('notification:deadline', mockDeadline);
      }
    };
    
    const deadlineInterval = setInterval(checkDeadlines, 30000); // Check every 30 seconds

    // ========== DISCONNECT HANDLING ==========
    socket.on('disconnect', () => {
      console.log(`User ${socket.userId} disconnected`);
      
      clearInterval(deadlineInterval);
      
      // Clean up user sessions
      userSessions.delete(socket.id);
      onlineUsers.delete(socket.userId);
      
      // Clean up case rooms
      caseRooms.forEach((sockets, caseId) => {
        sockets.delete(socket.id);
      });
      
      // Clean up document sessions
      documentSessions.forEach((session, docId) => {
        session.users.delete(socket.userId);
        session.cursors.delete(socket.userId);
        socket.to(`doc_${docId}`).emit('document:user_left', {
          userId: socket.userId
        });
      });
      
      // Clean up search sessions
      searchSessions.delete(socket.id);
      
      // Broadcast user offline status
      socket.broadcast.emit('user:offline', {
        userId: socket.userId
      });
    });
  });

  // Helper function to generate search suggestions
  function generateSearchSuggestions(query, type) {
    const suggestions = [];
    
    if (type === 'cases') {
      suggestions.push(
        `Case: ${query}`,
        `Client: ${query}`,
        `Case Number: ${query}`,
        `Status: ${query}`
      );
    } else if (type === 'documents') {
      suggestions.push(
        `Document: ${query}`,
        `Contract: ${query}`,
        `Brief: ${query}`,
        `Evidence: ${query}`
      );
    } else {
      suggestions.push(
        `Search all: ${query}`,
        `Recent: ${query}`,
        `People: ${query}`,
        `Files: ${query}`
      );
    }
    
    return suggestions.filter(s => s.toLowerCase().includes(query.toLowerCase()));
  }

  // Periodic cleanup
  setInterval(() => {
    // Clean up inactive sessions
    const now = new Date();
    onlineUsers.forEach((userInfo, userId) => {
      const timeSinceLastSeen = now - new Date(userInfo.lastSeen);
      if (timeSinceLastSeen > 5 * 60 * 1000) { // 5 minutes
        onlineUsers.delete(userId);
        io.emit('user:offline', { userId });
      }
    });
  }, 60000); // Every minute

  server.listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://${hostname}:${port}`);
    console.log('> Socket.io server running with real-time features:');
    console.log('  - Real-time case updates');
    console.log('  - Live document collaboration');
    console.log('  - Instant notifications');
    console.log('  - Chat system');
    console.log('  - Timeline updates');
    console.log('  - Presence indicators');
    console.log('  - Search suggestions');
  });
});