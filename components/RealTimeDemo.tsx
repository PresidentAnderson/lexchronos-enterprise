'use client';

import { useEffect, useState } from 'react';
import { useCaseUpdates } from '@/hooks/useCaseUpdates';
import { useDocumentCollaboration } from '@/hooks/useDocumentCollaboration';
import { useNotifications } from '@/hooks/useNotifications';
import { useChat } from '@/hooks/useChat';
import { useTimeline } from '@/hooks/useTimeline';
import { usePresence } from '@/hooks/usePresence';
import { useSearch } from '@/hooks/useSearch';
import { useActivityFeed } from '@/hooks/useActivityFeed';
import { useAuth } from '@/hooks/useAuth';

export default function RealTimeDemo() {
  const { login, isAuthenticated, user } = useAuth();
  const [activeDemo, setActiveDemo] = useState('overview');

  // Initialize demo user if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      login('demo@lexchronos.com', 'demo123');
    }
  }, [isAuthenticated, login]);

  if (!isAuthenticated || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Connecting to LexChronos real-time system...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">LexChronos</h1>
              <span className="ml-2 px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                Real-Time Demo
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, {user.name}</span>
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Real-Time Legal Case Management System
          </h2>
          <p className="text-lg text-gray-600 mb-6">
            Experience all real-time features of LexChronos in action. Everything updates instantly across all connected users.
          </p>
          
          {/* Feature Navigation */}
          <div className="flex flex-wrap gap-2 mb-8">
            {[
              { id: 'overview', name: 'Overview', icon: '📊' },
              { id: 'case-updates', name: 'Case Updates', icon: '📋' },
              { id: 'document-collaboration', name: 'Live Documents', icon: '📄' },
              { id: 'notifications', name: 'Notifications', icon: '🔔' },
              { id: 'chat', name: 'Chat System', icon: '💬' },
              { id: 'timeline', name: 'Timeline', icon: '📅' },
              { id: 'presence', name: 'Presence', icon: '👥' },
              { id: 'search', name: 'Live Search', icon: '🔍' },
              { id: 'activity', name: 'Activity Feed', icon: '📈' }
            ].map(feature => (
              <button
                key={feature.id}
                onClick={() => setActiveDemo(feature.id)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeDemo === feature.id
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border'
                }`}
              >
                {feature.icon} {feature.name}
              </button>
            ))}
          </div>
        </div>

        {/* Demo Content */}
        <div className="bg-white rounded-lg shadow-sm border">
          {activeDemo === 'overview' && <OverviewDemo />}
          {activeDemo === 'case-updates' && <CaseUpdatesDemo />}
          {activeDemo === 'document-collaboration' && <DocumentCollaborationDemo />}
          {activeDemo === 'notifications' && <NotificationsDemo />}
          {activeDemo === 'chat' && <ChatDemo />}
          {activeDemo === 'timeline' && <TimelineDemo />}
          {activeDemo === 'presence' && <PresenceDemo />}
          {activeDemo === 'search' && <SearchDemo />}
          {activeDemo === 'activity' && <ActivityFeedDemo />}
        </div>
      </div>
    </div>
  );
}

function OverviewDemo() {
  return (
    <div className="p-8">
      <h3 className="text-2xl font-bold mb-6">Real-Time Features Overview</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          {
            title: 'Case Updates',
            description: 'Real-time synchronization of case information across all users',
            features: ['Live case editing', 'Instant updates', 'Change tracking', 'Multi-user sync'],
            icon: '📋',
            color: 'blue'
          },
          {
            title: 'Document Collaboration',
            description: 'Google Docs-style collaborative editing for legal documents',
            features: ['Live editing', 'Cursor tracking', 'User presence', 'Version control'],
            icon: '📄',
            color: 'green'
          },
          {
            title: 'Instant Notifications',
            description: 'Push notifications for deadlines and important updates',
            features: ['Deadline alerts', 'Browser notifications', 'Priority levels', 'Read tracking'],
            icon: '🔔',
            color: 'yellow'
          },
          {
            title: 'Chat System',
            description: 'Secure real-time communication between lawyers and clients',
            features: ['Instant messaging', 'Typing indicators', 'File sharing', 'Message history'],
            icon: '💬',
            color: 'purple'
          },
          {
            title: 'Timeline Updates',
            description: 'Real-time case timeline with automatic event tracking',
            features: ['Live events', 'Deadline tracking', 'Court dates', 'Milestone alerts'],
            icon: '📅',
            color: 'red'
          },
          {
            title: 'Presence Indicators',
            description: 'See who\'s online and what they\'re working on',
            features: ['Online status', 'Activity tracking', 'User locations', 'Availability'],
            icon: '👥',
            color: 'indigo'
          },
          {
            title: 'Live Search',
            description: 'Real-time search suggestions and results',
            features: ['Instant suggestions', 'Search history', 'Smart filters', 'Quick access'],
            icon: '🔍',
            color: 'gray'
          },
          {
            title: 'Activity Feed',
            description: 'Real-time feed of all case activities and changes',
            features: ['Live updates', 'Activity tracking', 'User actions', 'Change logs'],
            icon: '📈',
            color: 'pink'
          },
          {
            title: 'Push Notifications',
            description: 'Browser and system notifications for critical updates',
            features: ['Browser alerts', 'Sound notifications', 'Priority routing', 'Custom rules'],
            icon: '📱',
            color: 'teal'
          }
        ].map((feature, index) => (
          <div key={index} className="p-6 border rounded-lg hover:shadow-md transition-shadow">
            <div className={`w-12 h-12 rounded-lg bg-${feature.color}-100 flex items-center justify-center mb-4`}>
              <span className="text-2xl">{feature.icon}</span>
            </div>
            <h4 className="text-lg font-semibold mb-2">{feature.title}</h4>
            <p className="text-gray-600 mb-4">{feature.description}</p>
            <ul className="space-y-1">
              {feature.features.map((item, i) => (
                <li key={i} className="text-sm text-gray-500 flex items-center">
                  <span className="w-1 h-1 bg-gray-400 rounded-full mr-2"></span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      
      <div className="mt-8 p-6 bg-blue-50 rounded-lg">
        <h4 className="text-lg font-semibold mb-2">🚀 Try the Features</h4>
        <p className="text-gray-600 mb-4">
          Click on any feature tab above to see it in action. All features are fully functional and demonstrate 
          real-time capabilities using Socket.io WebSocket connections.
        </p>
        <div className="flex items-center text-sm text-gray-500">
          <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
          Connected and ready for real-time collaboration
        </div>
      </div>
    </div>
  );
}

function CaseUpdatesDemo() {
  const { activities, updateCase, isConnected } = useCaseUpdates('demo-case-123');
  const [caseData, setCaseData] = useState({
    title: 'Anderson vs. Tech Corp',
    status: 'Active',
    priority: 'High',
    description: 'Intellectual property dispute case'
  });

  const handleUpdate = (field: string, value: string) => {
    setCaseData(prev => ({ ...prev, [field]: value }));
    updateCase(field, value);
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold">Real-Time Case Updates</h3>
        <div className="flex items-center">
          <div className={`w-2 h-2 rounded-full mr-2 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="text-sm text-gray-600">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Case Editor */}
        <div>
          <h4 className="text-lg font-semibold mb-4">Edit Case (Updates in Real-Time)</h4>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Case Title</label>
              <input
                type="text"
                value={caseData.title}
                onChange={(e) => handleUpdate('title', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={caseData.status}
                onChange={(e) => handleUpdate('status', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="Active">Active</option>
                <option value="Pending">Pending</option>
                <option value="Closed">Closed</option>
                <option value="On Hold">On Hold</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select
                value={caseData.priority}
                onChange={(e) => handleUpdate('priority', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={caseData.description}
                onChange={(e) => handleUpdate('description', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Activity Feed */}
        <div>
          <h4 className="text-lg font-semibold mb-4">Live Activity Feed</h4>
          <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
            {activities.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No activities yet. Make some changes to see real-time updates!
              </p>
            ) : (
              <div className="space-y-3">
                {activities.map((activity, index) => (
                  <div key={activity.id || index} className="bg-white rounded-lg p-3 shadow-sm">
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm">👤</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          {activity.userName}
                        </p>
                        <p className="text-sm text-gray-600">
                          Updated <span className="font-medium">{activity.field}</span>
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(activity.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h5 className="font-semibold mb-2">💡 Try This</h5>
        <p className="text-sm text-gray-600">
          Make changes to any field above and watch them appear instantly in the activity feed. 
          In a real application, these updates would be visible to all connected users working on this case.
        </p>
      </div>
    </div>
  );
}

function DocumentCollaborationDemo() {
  const { content, collaborators, updateContent, isConnected } = useDocumentCollaboration('demo-doc-456');
  const [localContent, setLocalContent] = useState(content);

  useEffect(() => {
    setLocalContent(content);
  }, [content]);

  const handleContentChange = (newContent: string) => {
    setLocalContent(newContent);
    updateContent(newContent);
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold">Live Document Collaboration</h3>
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            {collaborators.map((user, index) => (
              <div
                key={user.id}
                className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center -ml-2 first:ml-0 border-2 border-white"
                title={user.name}
              >
                <span className="text-xs font-medium">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              </div>
            ))}
          </div>
          <div className="flex items-center">
            <div className={`w-2 h-2 rounded-full mr-2 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm text-gray-600">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <h4 className="text-lg font-semibold mb-2">Legal Document Editor</h4>
          <p className="text-sm text-gray-600 mb-4">
            Type in the editor below. Changes are synchronized in real-time with all connected users.
          </p>
          <textarea
            value={localContent}
            onChange={(e) => handleContentChange(e.target.value)}
            placeholder="Start typing your legal document here... Changes will be synchronized in real-time!"
            rows={15}
            className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-mono text-sm"
          />
        </div>

        {collaborators.length > 0 && (
          <div>
            <h4 className="text-lg font-semibold mb-2">Active Collaborators</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {collaborators.map(user => (
                <div key={user.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium">{user.name}</p>
                    <p className="text-xs text-gray-500">{user.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mt-8 p-4 bg-purple-50 rounded-lg">
        <h5 className="font-semibold mb-2">✨ Real-Time Features</h5>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
          <div>
            <h6 className="font-medium mb-1">Live Collaboration:</h6>
            <ul className="space-y-1">
              <li>• Character-by-character synchronization</li>
              <li>• Cursor position tracking</li>
              <li>• User presence indicators</li>
            </ul>
          </div>
          <div>
            <h6 className="font-medium mb-1">Smart Features:</h6>
            <ul className="space-y-1">
              <li>• Conflict resolution</li>
              <li>• Version history</li>
              <li>• Auto-save functionality</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function NotificationsDemo() {
  const { notifications, unreadCount, markAsRead, requestPermission } = useNotifications();

  const handleRequestPermission = async () => {
    const granted = await requestPermission();
    if (granted) {
      alert('Notifications enabled! You\'ll receive browser notifications for important updates.');
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold">Instant Notifications</h3>
        <div className="flex items-center space-x-4">
          <button
            onClick={handleRequestPermission}
            className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors text-sm"
          >
            Enable Browser Notifications
          </button>
          {unreadCount > 0 && (
            <div className="px-3 py-1 bg-red-500 text-white rounded-full text-sm">
              {unreadCount} unread
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <h4 className="text-lg font-semibold mb-4">Notification Center</h4>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🔔</div>
                <p className="text-gray-500 mb-4">No notifications yet</p>
                <p className="text-sm text-gray-400">
                  Notifications will appear here when deadlines approach or important updates occur.
                </p>
              </div>
            ) : (
              notifications.map(notification => (
                <div
                  key={notification.id}
                  className={`p-4 rounded-lg border ${
                    notification.read 
                      ? 'bg-gray-50 border-gray-200' 
                      : 'bg-white border-blue-200 shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-lg">
                          {notification.priority === 'urgent' ? '🚨' :
                           notification.priority === 'high' ? '⚠️' :
                           notification.priority === 'medium' ? '📋' : '💬'}
                        </span>
                        <h5 className="font-medium">{notification.title}</h5>
                        {!notification.read && (
                          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(notification.timestamp).toLocaleString()}
                      </p>
                    </div>
                    {!notification.read && (
                      <button
                        onClick={() => markAsRead(notification.id)}
                        className="text-xs text-blue-600 hover:text-blue-800 ml-4"
                      >
                        Mark as read
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div>
          <h4 className="text-lg font-semibold mb-4">Notification Types</h4>
          <div className="space-y-3">
            {[
              { icon: '⏰', name: 'Deadline Reminders', description: 'Court dates, filing deadlines' },
              { icon: '📋', name: 'Case Updates', description: 'Status changes, new filings' },
              { icon: '💬', name: 'Messages', description: 'Chat messages, comments' },
              { icon: '📄', name: 'Document Changes', description: 'Edits, new versions' },
              { icon: '💰', name: 'Billing Updates', description: 'Payments, invoices' },
              { icon: '⚖️', name: 'Court Notifications', description: 'Hearings, decisions' }
            ].map((type, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                <span className="text-xl">{type.icon}</span>
                <div>
                  <p className="font-medium text-sm">{type.name}</p>
                  <p className="text-xs text-gray-500">{type.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8 p-4 bg-yellow-50 rounded-lg">
        <h5 className="font-semibold mb-2">🔔 Notification Features</h5>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
          <div>
            <h6 className="font-medium mb-1">Smart Delivery:</h6>
            <ul className="space-y-1">
              <li>• Priority-based routing</li>
              <li>• Time-zone aware</li>
              <li>• Do not disturb modes</li>
            </ul>
          </div>
          <div>
            <h6 className="font-medium mb-1">Multiple Channels:</h6>
            <ul className="space-y-1">
              <li>• Browser notifications</li>
              <li>• Email alerts</li>
              <li>• Mobile push (future)</li>
            </ul>
          </div>
          <div>
            <h6 className="font-medium mb-1">Customization:</h6>
            <ul className="space-y-1">
              <li>• Custom notification rules</li>
              <li>• Frequency settings</li>
              <li>• Category preferences</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChatDemo() {
  const { messages, typingUsers, sendMessage, setTyping } = useChat('demo-chat-789');
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim()) {
      sendMessage(newMessage);
      setNewMessage('');
      setTyping(false);
      setIsTyping(false);
    }
  };

  const handleTyping = (value: string) => {
    setNewMessage(value);
    
    if (value && !isTyping) {
      setTyping(true);
      setIsTyping(true);
    } else if (!value && isTyping) {
      setTyping(false);
      setIsTyping(false);
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold">Real-Time Chat System</h3>
        <div className="text-sm text-gray-600">
          Secure lawyer-client communication
        </div>
      </div>

      <div className="max-w-4xl mx-auto">
        <div className="bg-white border rounded-lg overflow-hidden">
          {/* Chat Header */}
          <div className="px-6 py-4 border-b bg-gray-50">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold">Case Discussion: Anderson vs. Tech Corp</h4>
                <p className="text-sm text-gray-600">Participants: Lawyer, Client, Assistant</p>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Online</span>
              </div>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="h-96 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">💬</div>
                <p className="text-gray-500 mb-2">Start a conversation</p>
                <p className="text-sm text-gray-400">
                  Send a message to begin real-time communication
                </p>
              </div>
            ) : (
              messages.map(message => (
                <div key={message.id} className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-xs font-medium">
                      {message.userData.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-medium text-sm">{message.userData.name}</span>
                      <span className="text-xs text-gray-400">
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="bg-gray-100 rounded-lg px-3 py-2 max-w-md">
                      <p className="text-sm">{message.message}</p>
                    </div>
                  </div>
                </div>
              ))
            )}

            {/* Typing Indicators */}
            {typingUsers.length > 0 && (
              <div className="flex items-center space-x-2 text-sm text-gray-500 animate-pulse">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span>{typingUsers.map(user => user.name).join(', ')} typing...</span>
              </div>
            )}
          </div>

          {/* Chat Input */}
          <div className="px-4 py-3 border-t">
            <form onSubmit={handleSendMessage} className="flex space-x-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => handleTyping(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                type="submit"
                disabled={!newMessage.trim()}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Send
              </button>
            </form>
            <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
              <span>📎 Attach files</span>
              <span>🔒 End-to-end encrypted</span>
              <span>📱 Mobile notifications</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 p-4 bg-green-50 rounded-lg">
        <h5 className="font-semibold mb-2">💬 Chat Features</h5>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
          <div>
            <h6 className="font-medium mb-1">Real-Time:</h6>
            <ul className="space-y-1">
              <li>• Instant message delivery</li>
              <li>• Live typing indicators</li>
              <li>• Read receipts</li>
            </ul>
          </div>
          <div>
            <h6 className="font-medium mb-1">Security:</h6>
            <ul className="space-y-1">
              <li>• Attorney-client privilege</li>
              <li>• End-to-end encryption</li>
              <li>• Audit trails</li>
            </ul>
          </div>
          <div>
            <h6 className="font-medium mb-1">Features:</h6>
            <ul className="space-y-1">
              <li>• File attachments</li>
              <li>• Message search</li>
              <li>• Chat history export</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function TimelineDemo() {
  const { events, addEvent, getUpcomingEvents, getOverdueEvents } = useTimeline('demo-case-123');
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    date: '',
    type: 'other' as const
  });

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (newEvent.title && newEvent.date) {
      addEvent(newEvent);
      setNewEvent({ title: '', description: '', date: '', type: 'other' });
    }
  };

  const upcomingEvents = getUpcomingEvents();
  const overdueEvents = getOverdueEvents();

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold">Real-Time Case Timeline</h3>
        <div className="flex items-center space-x-4 text-sm">
          {upcomingEvents.length > 0 && (
            <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full">
              {upcomingEvents.length} upcoming
            </span>
          )}
          {overdueEvents.length > 0 && (
            <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full">
              {overdueEvents.length} overdue
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Add New Event */}
        <div>
          <h4 className="text-lg font-semibold mb-4">Add Timeline Event</h4>
          <form onSubmit={handleAddEvent} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Event Title</label>
              <input
                type="text"
                value={newEvent.title}
                onChange={(e) => setNewEvent(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., Court Hearing"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date & Time</label>
              <input
                type="datetime-local"
                value={newEvent.date}
                onChange={(e) => setNewEvent(prev => ({ ...prev, date: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Event Type</label>
              <select
                value={newEvent.type}
                onChange={(e) => setNewEvent(prev => ({ ...prev, type: e.target.value as any }))}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="court_hearing">Court Hearing</option>
                <option value="deadline">Deadline</option>
                <option value="meeting">Meeting</option>
                <option value="filing">Filing</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={newEvent.description}
                onChange={(e) => setNewEvent(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Additional details..."
                rows={3}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
            <button
              type="submit"
              disabled={!newEvent.title || !newEvent.date}
              className="w-full px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add Event
            </button>
          </form>
        </div>

        {/* Timeline */}
        <div className="lg:col-span-2">
          <h4 className="text-lg font-semibold mb-4">Case Timeline</h4>
          <div className="relative">
            {events.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📅</div>
                <p className="text-gray-500 mb-2">No timeline events yet</p>
                <p className="text-sm text-gray-400">
                  Add court dates, deadlines, and important milestones to track case progress
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {events.map((event, index) => {
                  const isUpcoming = new Date(event.date) > new Date();
                  const isOverdue = new Date(event.date) < new Date();
                  
                  return (
                    <div key={event.id} className="relative flex items-start space-x-4">
                      {/* Timeline line */}
                      {index < events.length - 1 && (
                        <div className="absolute left-4 top-10 w-0.5 h-16 bg-gray-300"></div>
                      )}
                      
                      {/* Event icon */}
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${
                        isOverdue ? 'bg-red-500' : 
                        isUpcoming ? 'bg-orange-500' : 
                        'bg-gray-500'
                      }`}>
                        <span className="text-xs">
                          {event.type === 'court_hearing' ? '⚖️' :
                           event.type === 'deadline' ? '⏰' :
                           event.type === 'meeting' ? '🤝' :
                           event.type === 'filing' ? '📄' : '📌'}
                        </span>
                      </div>
                      
                      {/* Event content */}
                      <div className="flex-1 bg-white border rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h5 className="font-medium">{event.title}</h5>
                            {event.description && (
                              <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                            )}
                            <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                              <span>📅 {new Date(event.date).toLocaleDateString()}</span>
                              <span>🕒 {new Date(event.date).toLocaleTimeString()}</span>
                              <span>👤 {event.userName}</span>
                            </div>
                          </div>
                          {isOverdue && (
                            <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">
                              Overdue
                            </span>
                          )}
                          {isUpcoming && (
                            <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded">
                              Upcoming
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-8 p-4 bg-orange-50 rounded-lg">
        <h5 className="font-semibold mb-2">📅 Timeline Features</h5>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
          <div>
            <h6 className="font-medium mb-1">Real-Time Updates:</h6>
            <ul className="space-y-1">
              <li>• Live event synchronization</li>
              <li>• Instant notifications</li>
              <li>• Multi-user collaboration</li>
            </ul>
          </div>
          <div>
            <h6 className="font-medium mb-1">Smart Tracking:</h6>
            <ul className="space-y-1">
              <li>• Deadline reminders</li>
              <li>• Overdue alerts</li>
              <li>• Calendar integration</li>
            </ul>
          </div>
          <div>
            <h6 className="font-medium mb-1">Event Types:</h6>
            <ul className="space-y-1">
              <li>• Court hearings</li>
              <li>• Filing deadlines</li>
              <li>• Client meetings</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function PresenceDemo() {
  const { onlineUsers, myStatus, updateStatus, getOnlineUserCount, isUserOnline } = usePresence();

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold">Real-Time Presence Indicators</h3>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-600">
            {getOnlineUserCount()} users online
          </div>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              myStatus === 'online' ? 'bg-green-500' :
              myStatus === 'busy' ? 'bg-red-500' :
              myStatus === 'away' ? 'bg-yellow-500' : 'bg-gray-500'
            }`}></div>
            <span className="text-sm capitalize">{myStatus}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Status Controls */}
        <div>
          <h4 className="text-lg font-semibold mb-4">Your Status</h4>
          <div className="space-y-3">
            {[
              { status: 'online' as const, label: 'Online', color: 'green', description: 'Available and active' },
              { status: 'busy' as const, label: 'Busy', color: 'red', description: 'Do not disturb' },
              { status: 'away' as const, label: 'Away', color: 'yellow', description: 'Temporarily unavailable' },
              { status: 'offline' as const, label: 'Offline', color: 'gray', description: 'Appear offline' }
            ].map(option => (
              <button
                key={option.status}
                onClick={() => updateStatus(option.status)}
                className={`w-full flex items-center space-x-3 p-3 rounded-lg border-2 transition-colors ${
                  myStatus === option.status
                    ? `border-${option.color}-500 bg-${option.color}-50`
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className={`w-4 h-4 rounded-full bg-${option.color}-500`}></div>
                <div className="text-left">
                  <p className="font-medium">{option.label}</p>
                  <p className="text-sm text-gray-600">{option.description}</p>
                </div>
                {myStatus === option.status && (
                  <div className="ml-auto text-green-500">✓</div>
                )}
              </button>
            ))}
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h5 className="font-semibold mb-2">🤖 Smart Presence</h5>
            <div className="text-sm text-gray-600 space-y-1">
              <p>• Automatically set to "Away" when window loses focus</p>
              <p>• Return to "Online" when window regains focus</p>
              <p>• Detect idle time and adjust status accordingly</p>
            </div>
          </div>
        </div>

        {/* Online Users */}
        <div>
          <h4 className="text-lg font-semibold mb-4">Team Presence</h4>
          <div className="space-y-3">
            {onlineUsers.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-2">👥</div>
                <p className="text-gray-500">No other users online</p>
                <p className="text-sm text-gray-400">
                  Other team members will appear here when they're online
                </p>
              </div>
            ) : (
              onlineUsers.map(user => (
                <div key={user.userId} className="flex items-center space-x-3 p-3 bg-white border rounded-lg">
                  <div className="relative">
                    <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                      <span className="font-medium text-sm">
                        {user.userData.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                      user.status === 'online' ? 'bg-green-500' :
                      user.status === 'busy' ? 'bg-red-500' :
                      user.status === 'away' ? 'bg-yellow-500' : 'bg-gray-500'
                    }`}></div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{user.userData.name}</span>
                      <span className="text-xs px-2 py-1 bg-gray-100 rounded">{user.userData.role}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <span className="capitalize">{user.status}</span>
                      {user.activity && (
                        <>
                          <span>•</span>
                          <span>{user.activity}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-gray-400">
                    {isUserOnline(user.userId) ? 'Online' : 'Offline'}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Presence Statistics */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h5 className="font-semibold mb-2">📊 Presence Stats</h5>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Total Online:</p>
                <p className="font-medium text-lg">{getOnlineUserCount()}</p>
              </div>
              <div>
                <p className="text-gray-600">Your Status:</p>
                <p className="font-medium text-lg capitalize">{myStatus}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 p-4 bg-indigo-50 rounded-lg">
        <h5 className="font-semibold mb-2">👥 Presence Features</h5>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
          <div>
            <h6 className="font-medium mb-1">Real-Time Status:</h6>
            <ul className="space-y-1">
              <li>• Live status updates</li>
              <li>• Activity indicators</li>
              <li>• Last seen timestamps</li>
            </ul>
          </div>
          <div>
            <h6 className="font-medium mb-1">Smart Detection:</h6>
            <ul className="space-y-1">
              <li>• Automatic away detection</li>
              <li>• Focus-based status</li>
              <li>• Idle time tracking</li>
            </ul>
          </div>
          <div>
            <h6 className="font-medium mb-1">Privacy Controls:</h6>
            <ul className="space-y-1">
              <li>• Invisible mode</li>
              <li>• Custom status messages</li>
              <li>• Activity preferences</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function SearchDemo() {
  const { suggestions, isSearching, recentSearches, debouncedSearch, clearRecentSearches } = useSearch();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<'general' | 'cases' | 'documents' | 'people'>('general');

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    debouncedSearch(value, searchType);
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold">Real-Time Search Suggestions</h3>
        <div className="text-sm text-gray-600">
          Powered by live search indexing
        </div>
      </div>

      <div className="max-w-4xl mx-auto">
        {/* Search Interface */}
        <div className="relative mb-8">
          <div className="flex space-x-4 mb-4">
            <div className="flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search cases, documents, people..."
                className="w-full px-4 py-3 pl-10 border rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 text-lg"
              />
              <div className="absolute left-3 top-3">
                <span className="text-gray-400">🔍</span>
              </div>
              {isSearching && (
                <div className="absolute right-3 top-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-500"></div>
                </div>
              )}
            </div>
            <select
              value={searchType}
              onChange={(e) => setSearchType(e.target.value as any)}
              className="px-4 py-3 border rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
            >
              <option value="general">All</option>
              <option value="cases">Cases</option>
              <option value="documents">Documents</option>
              <option value="people">People</option>
            </select>
          </div>

          {/* Search Suggestions */}
          {suggestions.length > 0 && (
            <div className="absolute z-10 w-full bg-white border rounded-lg shadow-lg mt-1">
              <div className="p-2">
                <div className="text-xs text-gray-500 mb-2">Suggestions</div>
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => setSearchQuery(suggestion)}
                    className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded text-sm flex items-center space-x-2"
                  >
                    <span>🔍</span>
                    <span>{suggestion}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Searches */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold">Recent Searches</h4>
              {recentSearches.length > 0 && (
                <button
                  onClick={clearRecentSearches}
                  className="text-sm text-red-600 hover:text-red-800"
                >
                  Clear all
                </button>
              )}
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              {recentSearches.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No recent searches</p>
              ) : (
                <div className="space-y-2">
                  {recentSearches.map((search, index) => (
                    <button
                      key={index}
                      onClick={() => setSearchQuery(search)}
                      className="w-full text-left p-2 hover:bg-white rounded flex items-center space-x-2 text-sm"
                    >
                      <span className="text-gray-400">🕒</span>
                      <span>{search}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Search Categories */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Search Categories</h4>
            <div className="space-y-3">
              {[
                { type: 'cases', icon: '📋', name: 'Cases', description: 'Search case files, statuses, clients' },
                { type: 'documents', icon: '📄', name: 'Documents', description: 'Find contracts, briefs, evidence' },
                { type: 'people', icon: '👥', name: 'People', description: 'Locate clients, lawyers, contacts' },
                { type: 'general', icon: '🔍', name: 'General', description: 'Search across all content' }
              ].map(category => (
                <button
                  key={category.type}
                  onClick={() => setSearchType(category.type as any)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    searchType === category.type
                      ? 'border-gray-500 bg-gray-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-xl">{category.icon}</span>
                    <div>
                      <p className="font-medium">{category.name}</p>
                      <p className="text-sm text-gray-600">{category.description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Sample Search Results */}
        <div className="mt-8">
          <h4 className="text-lg font-semibold mb-4">Sample Search Results</h4>
          <div className="bg-white border rounded-lg overflow-hidden">
            {[
              {
                type: 'case',
                title: 'Anderson vs. Tech Corp',
                description: 'Intellectual property dispute case involving patent infringement claims...',
                metadata: 'Case #2024-IP-001 • Active • High Priority'
              },
              {
                type: 'document',
                title: 'Patent Filing Application',
                description: 'Complete patent application documentation for software algorithm...',
                metadata: 'PDF • 42 pages • Modified 2 hours ago'
              },
              {
                type: 'person',
                title: 'John Anderson (Client)',
                description: 'CEO of Anderson Industries, primary plaintiff in IP case...',
                metadata: 'Client • Contact: john@anderson-industries.com'
              }
            ].map((result, index) => (
              <div key={index} className="p-4 border-b last:border-b-0 hover:bg-gray-50">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
                    <span className="text-sm">
                      {result.type === 'case' ? '📋' :
                       result.type === 'document' ? '📄' : '👤'}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h5 className="font-medium text-blue-600 hover:text-blue-800 cursor-pointer">
                      {result.title}
                    </h5>
                    <p className="text-sm text-gray-600 mt-1">{result.description}</p>
                    <p className="text-xs text-gray-400 mt-2">{result.metadata}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h5 className="font-semibold mb-2">🔍 Search Features</h5>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
          <div>
            <h6 className="font-medium mb-1">Real-Time:</h6>
            <ul className="space-y-1">
              <li>• Instant suggestions</li>
              <li>• Live result updates</li>
              <li>• Debounced queries</li>
            </ul>
          </div>
          <div>
            <h6 className="font-medium mb-1">Smart Search:</h6>
            <ul className="space-y-1">
              <li>• Fuzzy matching</li>
              <li>• Context-aware results</li>
              <li>• Relevance ranking</li>
            </ul>
          </div>
          <div>
            <h6 className="font-medium mb-1">User Experience:</h6>
            <ul className="space-y-1">
              <li>• Search history</li>
              <li>• Quick filters</li>
              <li>• Keyboard shortcuts</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function ActivityFeedDemo() {
  const { activities, isLoading, hasMore, unreadCount, loadMore, markAsRead, markAllAsRead } = useActivityFeed();

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold">Real-Time Activity Feed</h3>
        <div className="flex items-center space-x-4">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
            >
              Mark all read ({unreadCount})
            </button>
          )}
          <div className="text-sm text-gray-600">
            Live activity tracking
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto">
        <div className="bg-white border rounded-lg overflow-hidden">
          {activities.length === 0 && !isLoading ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📈</div>
              <p className="text-gray-500 mb-2">No recent activity</p>
              <p className="text-sm text-gray-400">
                Case activities and updates will appear here in real-time
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {activities.map(activity => (
                <div
                  key={activity.id}
                  className={`p-4 hover:bg-gray-50 ${!activity.read ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''}`}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white bg-${activity.color}-500`}>
                      <span>{activity.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm">
                            <span className="font-medium">{activity.userName}</span>
                            {' '}
                            <span className="text-gray-600">{activity.description}</span>
                          </p>
                          {activity.caseId && (
                            <p className="text-xs text-blue-600 mt-1">
                              Case: Anderson vs. Tech Corp
                            </p>
                          )}
                          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                            <span>{activity.timeAgo}</span>
                            <span>{new Date(activity.timestamp).toLocaleTimeString()}</span>
                            {activity.type && (
                              <span className="capitalize">{activity.type.replace('_', ' ')}</span>
                            )}
                          </div>
                        </div>
                        {!activity.read && (
                          <button
                            onClick={() => markAsRead(activity.id)}
                            className="text-xs text-blue-600 hover:text-blue-800 ml-4"
                          >
                            Mark read
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Load More */}
          {hasMore && (
            <div className="p-4 border-t">
              <button
                onClick={loadMore}
                disabled={isLoading}
                className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Loading...' : 'Load More Activities'}
              </button>
            </div>
          )}
        </div>

        {/* Activity Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          <div className="bg-white border rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">📊</span>
              <div>
                <p className="text-sm text-gray-600">Total Activities</p>
                <p className="text-lg font-semibold">{activities.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white border rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">🔔</span>
              <div>
                <p className="text-sm text-gray-600">Unread</p>
                <p className="text-lg font-semibold">{unreadCount}</p>
              </div>
            </div>
          </div>
          <div className="bg-white border rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">⚡</span>
              <div>
                <p className="text-sm text-gray-600">Real-Time</p>
                <p className="text-lg font-semibold">Live</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h5 className="font-semibold mb-2">📈 Activity Feed Features</h5>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
          <div>
            <h6 className="font-medium mb-1">Real-Time Updates:</h6>
            <ul className="space-y-1">
              <li>• Live activity streaming</li>
              <li>• Instant notifications</li>
              <li>• Auto-refresh content</li>
            </ul>
          </div>
          <div>
            <h6 className="font-medium mb-1">Activity Types:</h6>
            <ul className="space-y-1">
              <li>• Case updates</li>
              <li>• Document changes</li>
              <li>• User actions</li>
            </ul>
          </div>
          <div>
            <h6 className="font-medium mb-1">Smart Features:</h6>
            <ul className="space-y-1">
              <li>• Read/unread tracking</li>
              <li>• Infinite scroll</li>
              <li>• Activity filtering</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}