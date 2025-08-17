import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, 
  X, 
  CheckCircle, 
  AlertCircle, 
  AlertTriangle, 
  Info, 
  Zap,
  Bot,
  Code,
  Settings,
  User,
  CreditCard,
  Shield,
  Globe,
  Clock,
  Archive
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

export enum NotificationType {
  SUCCESS = 'success',
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info',
  AI_UPDATE = 'ai_update',
  CODE_EXECUTION = 'code_execution',
  SYSTEM = 'system',
  BILLING = 'billing',
  SECURITY = 'security',
  FEATURE = 'feature'
}

export enum NotificationPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

export interface Notification {
  id: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  persistent?: boolean;
  actionLabel?: string;
  actionUrl?: string;
  onAction?: () => void;
  autoHide?: boolean;
  hideDelay?: number;
  metadata?: Record<string, any>;
}

interface NotificationState {
  notifications: Notification[];
  isOpen: boolean;
}

type NotificationAction =
  | { type: 'ADD_NOTIFICATION'; payload: Notification }
  | { type: 'REMOVE_NOTIFICATION'; payload: string }
  | { type: 'MARK_READ'; payload: string }
  | { type: 'MARK_ALL_READ' }
  | { type: 'CLEAR_ALL' }
  | { type: 'TOGGLE_CENTER' }
  | { type: 'SET_OPEN'; payload: boolean };

const initialState: NotificationState = {
  notifications: [],
  isOpen: false
};

function notificationReducer(state: NotificationState, action: NotificationAction): NotificationState {
  switch (action.type) {
    case 'ADD_NOTIFICATION':
      return {
        ...state,
        notifications: [action.payload, ...state.notifications.slice(0, 49)] // Keep max 50
      };
    case 'REMOVE_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.filter(n => n.id !== action.payload)
      };
    case 'MARK_READ':
      return {
        ...state,
        notifications: state.notifications.map(n =>
          n.id === action.payload ? { ...n, read: true } : n
        )
      };
    case 'MARK_ALL_READ':
      return {
        ...state,
        notifications: state.notifications.map(n => ({ ...n, read: true }))
      };
    case 'CLEAR_ALL':
      return {
        ...state,
        notifications: []
      };
    case 'TOGGLE_CENTER':
      return {
        ...state,
        isOpen: !state.isOpen
      };
    case 'SET_OPEN':
      return {
        ...state,
        isOpen: action.payload
      };
    default:
      return state;
  }
}

interface NotificationContextType {
  state: NotificationState;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => string;
  removeNotification: (id: string) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  toggleCenter: () => void;
  setOpen: (open: boolean) => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

// Notification Provider
export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(notificationReducer, initialState);

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const id = Math.random().toString(36).substring(2, 15);
    const newNotification: Notification = {
      ...notification,
      id,
      timestamp: Date.now(),
      read: false,
      autoHide: notification.autoHide ?? true,
      hideDelay: notification.hideDelay ?? 5000
    };

    dispatch({ type: 'ADD_NOTIFICATION', payload: newNotification });

    // Auto-remove notification if autoHide is enabled
    if (newNotification.autoHide && !newNotification.persistent) {
      setTimeout(() => {
        dispatch({ type: 'REMOVE_NOTIFICATION', payload: id });
      }, newNotification.hideDelay);
    }

    return id;
  }, []);

  const removeNotification = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_NOTIFICATION', payload: id });
  }, []);

  const markAsRead = useCallback((id: string) => {
    dispatch({ type: 'MARK_READ', payload: id });
  }, []);

  const markAllAsRead = useCallback(() => {
    dispatch({ type: 'MARK_ALL_READ' });
  }, []);

  const clearAll = useCallback(() => {
    dispatch({ type: 'CLEAR_ALL' });
  }, []);

  const toggleCenter = useCallback(() => {
    dispatch({ type: 'TOGGLE_CENTER' });
  }, []);

  const setOpen = useCallback((open: boolean) => {
    dispatch({ type: 'SET_OPEN', payload: open });
  }, []);

  const value = {
    state,
    addNotification,
    removeNotification,
    markAsRead,
    markAllAsRead,
    clearAll,
    toggleCenter,
    setOpen
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <NotificationCenter />
      <NotificationToasts />
    </NotificationContext.Provider>
  );
};

// Notification Icon Component
const getNotificationIcon = (type: NotificationType) => {
  switch (type) {
    case NotificationType.SUCCESS:
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    case NotificationType.ERROR:
      return <AlertCircle className="w-5 h-5 text-red-500" />;
    case NotificationType.WARNING:
      return <AlertTriangle className="w-5 h-5 text-orange-500" />;
    case NotificationType.AI_UPDATE:
      return <Bot className="w-5 h-5 text-primary" />;
    case NotificationType.CODE_EXECUTION:
      return <Code className="w-5 h-5 text-green-500" />;
    case NotificationType.SYSTEM:
      return <Settings className="w-5 h-5 text-blue-500" />;
    case NotificationType.BILLING:
      return <CreditCard className="w-5 h-5 text-blue-500" />;
    case NotificationType.SECURITY:
      return <Shield className="w-5 h-5 text-red-500" />;
    case NotificationType.FEATURE:
      return <Zap className="w-5 h-5 text-yellow-500" />;
    default:
      return <Info className="w-5 h-5 text-blue-500" />;
  }
};

// Notification Bell Button
export const NotificationBell: React.FC<{ className?: string }> = ({ className }) => {
  const { state, toggleCenter } = useNotifications();
  const unreadCount = state.notifications.filter(n => !n.read).length;
  const hasUrgent = state.notifications.some(n => !n.read && n.priority === NotificationPriority.URGENT);

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleCenter}
      className={cn('relative glass-hover', hasUrgent && 'animate-pulse', className)}
    >
      <Bell className="w-5 h-5" />
      {unreadCount > 0 && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className={cn(
            'absolute -top-1 -right-1 min-w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white',
            hasUrgent ? 'bg-red-500 animate-pulse' : 'bg-primary'
          )}
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </motion.div>
      )}
    </Button>
  );
};

// Notification Center (Dropdown)
const NotificationCenter: React.FC = () => {
  const { state, markAsRead, markAllAsRead, clearAll, setOpen, removeNotification } = useNotifications();
  const { notifications, isOpen } = state;

  const unreadNotifications = notifications.filter(n => !n.read);
  const readNotifications = notifications.filter(n => n.read);

  const formatTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: -10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -10 }}
      className="fixed top-16 right-4 z-50 w-96 max-h-[80vh] glass-elevated rounded-xl border border-white/20 shadow-2xl"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <h3 className="font-semibold text-lg">Notifications</h3>
        <div className="flex items-center gap-2">
          {unreadNotifications.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="text-xs"
            >
              Mark all read
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAll}
            className="text-xs text-muted-foreground"
          >
            Clear all
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setOpen(false)}
            className="w-6 h-6"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Notifications List */}
      <ScrollArea className="max-h-96">
        <div className="p-2">
          {notifications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Bell className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No notifications yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Unread notifications */}
              {unreadNotifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onRead={markAsRead}
                  onRemove={removeNotification}
                  formatTime={formatTime}
                />
              ))}

              {/* Separator */}
              {unreadNotifications.length > 0 && readNotifications.length > 0 && (
                <div className="flex items-center gap-2 py-2">
                  <div className="flex-1 h-px bg-white/10" />
                  <span className="text-xs text-muted-foreground">Earlier</span>
                  <div className="flex-1 h-px bg-white/10" />
                </div>
              )}

              {/* Read notifications (collapsed) */}
              {readNotifications.slice(0, 10).map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onRead={markAsRead}
                  onRemove={removeNotification}
                  formatTime={formatTime}
                />
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </motion.div>
  );
};

// Individual Notification Item
const NotificationItem: React.FC<{
  notification: Notification;
  onRead: (id: string) => void;
  onRemove: (id: string) => void;
  formatTime: (timestamp: number) => string;
}> = ({ notification, onRead, onRemove, formatTime }) => {
  const handleClick = () => {
    if (!notification.read) {
      onRead(notification.id);
    }
    
    if (notification.onAction) {
      notification.onAction();
    } else if (notification.actionUrl) {
      window.open(notification.actionUrl, '_blank');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className={cn(
        'p-3 rounded-lg cursor-pointer transition-all group relative',
        notification.read ? 'glass opacity-60' : 'glass-elevated',
        notification.priority === NotificationPriority.URGENT && !notification.read && 'ring-2 ring-red-500/50'
      )}
      onClick={handleClick}
    >
      {/* Unread indicator */}
      {!notification.read && (
        <div className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full" />
      )}

      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="flex-shrink-0 mt-0.5">
          {getNotificationIcon(notification.type)}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h4 className={cn(
            'font-medium text-sm mb-1',
            notification.read ? 'text-muted-foreground' : 'text-foreground'
          )}>
            {notification.title}
          </h4>
          <p className={cn(
            'text-sm leading-relaxed',
            notification.read ? 'text-muted-foreground/70' : 'text-muted-foreground'
          )}>
            {notification.message}
          </p>
          
          {/* Footer */}
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-muted-foreground/60">
              {formatTime(notification.timestamp)}
            </span>
            {(notification.actionLabel || notification.priority === NotificationPriority.URGENT) && (
              <div className="flex items-center gap-2">
                {notification.priority === NotificationPriority.URGENT && (
                  <Badge variant="destructive" className="text-xs">
                    Urgent
                  </Badge>
                )}
                {notification.actionLabel && (
                  <Button variant="ghost" size="sm" className="text-xs h-6 px-2">
                    {notification.actionLabel}
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Remove button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(notification.id);
          }}
          className="w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <X className="w-3 h-3" />
        </Button>
      </div>
    </motion.div>
  );
};

// Toast Notifications (for immediate feedback)
const NotificationToasts: React.FC = () => {
  const { state } = useNotifications();
  
  // Only show non-persistent notifications as toasts
  const toastNotifications = state.notifications
    .filter(n => !n.persistent && !n.read)
    .slice(0, 3); // Max 3 toasts at once

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      <AnimatePresence>
        {toastNotifications.map((notification) => (
          <NotificationToast
            key={notification.id}
            notification={notification}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

// Individual Toast Notification
const NotificationToast: React.FC<{
  notification: Notification;
}> = ({ notification }) => {
  const { removeNotification, markAsRead } = useNotifications();

  React.useEffect(() => {
    if (notification.autoHide && !notification.persistent) {
      const timer = setTimeout(() => {
        removeNotification(notification.id);
      }, notification.hideDelay || 5000);
      return () => clearTimeout(timer);
    }
  }, [notification, removeNotification]);

  const handleAction = () => {
    markAsRead(notification.id);
    removeNotification(notification.id);
    
    if (notification.onAction) {
      notification.onAction();
    } else if (notification.actionUrl) {
      window.open(notification.actionUrl, '_blank');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 300, scale: 0.8 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 300, scale: 0.8 }}
      className="w-80 glass-elevated rounded-lg p-4 border border-white/20 shadow-lg"
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="flex-shrink-0">
          {getNotificationIcon(notification.type)}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm mb-1">
            {notification.title}
          </h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {notification.message}
          </p>
          
          {notification.actionLabel && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleAction}
              className="mt-2 h-7 px-3 text-xs"
            >
              {notification.actionLabel}
            </Button>
          )}
        </div>

        {/* Close button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => removeNotification(notification.id)}
          className="w-6 h-6 flex-shrink-0"
        >
          <X className="w-3 h-3" />
        </Button>
      </div>
    </motion.div>
  );
};

// Utility hooks for common notification types
export const useNotificationHelpers = () => {
  const { addNotification } = useNotifications();

  return {
    success: (title: string, message: string, options?: Partial<Notification>) =>
      addNotification({
        type: NotificationType.SUCCESS,
        priority: NotificationPriority.MEDIUM,
        title,
        message,
        ...options
      }),

    error: (title: string, message: string, options?: Partial<Notification>) =>
      addNotification({
        type: NotificationType.ERROR,
        priority: NotificationPriority.HIGH,
        title,
        message,
        persistent: true,
        autoHide: false,
        ...options
      }),

    warning: (title: string, message: string, options?: Partial<Notification>) =>
      addNotification({
        type: NotificationType.WARNING,
        priority: NotificationPriority.MEDIUM,
        title,
        message,
        ...options
      }),

    info: (title: string, message: string, options?: Partial<Notification>) =>
      addNotification({
        type: NotificationType.INFO,
        priority: NotificationPriority.LOW,
        title,
        message,
        ...options
      }),

    aiUpdate: (title: string, message: string, options?: Partial<Notification>) =>
      addNotification({
        type: NotificationType.AI_UPDATE,
        priority: NotificationPriority.MEDIUM,
        title,
        message,
        ...options
      }),

    codeExecution: (title: string, message: string, options?: Partial<Notification>) =>
      addNotification({
        type: NotificationType.CODE_EXECUTION,
        priority: NotificationPriority.MEDIUM,
        title,
        message,
        ...options
      })
  };
};

export default NotificationProvider;