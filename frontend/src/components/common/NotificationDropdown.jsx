import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Menu, Transition } from '@headlessui/react';
import {
  BellIcon,
  CheckIcon,
  XMarkIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import {
  fetchNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from '../../features/notifications/notificationsSlice';
import { formatDistanceToNow } from 'date-fns';



const NotificationDropdown = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, unreadCount, isLoading } = useSelector((state) => state.notifications);

  const dispatch = useDispatch();


  useEffect(() => {
    if (isOpen && notifications.length === 0) {
      dispatch(fetchNotifications());
    }
  }, [isOpen, notifications.length, dispatch]);

  const handleMarkAsRead = (notificationId) => {
    dispatch(markAsRead(notificationId));
  };

  const handleMarkAllAsRead = () => {
    dispatch(markAllAsRead());
  };

  const handleDelete = (notificationId) => {
    dispatch(deleteNotification(notificationId));
  };

  const handleNotificationClick = async (notification) => {
    // Mark notification as read
    if (!notification.read) {
      dispatch(markAsRead(notification._id));
    }

    // Message notifications are no longer supported
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'job_request':
        return '💼';

      case 'review':
        return '⭐';
      case 'payment':
        return '💰';
      case 'system':
        return '🔔';
      default:
        return '📢';
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'job_request':
        return 'bg-blue-100 text-blue-800';

      case 'review':
        return 'bg-yellow-100 text-yellow-800';
      case 'payment':
        return 'bg-purple-100 text-purple-800';
      case 'system':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Menu as="div" className="relative">
      {({ open }) => {
        if (open !== isOpen) {
          setIsOpen(open);
        }
        return (
          <>
            <Menu.Button as="div">
              {children}
            </Menu.Button>
            <Transition
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 dark:ring-gray-600 focus:outline-none max-h-96 overflow-hidden border dark:border-gray-700">
                {/* Header */}
                <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Notifications</h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllAsRead}
                      className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                {/* Notifications List */}
                <div className="max-h-64 overflow-y-auto">
                  {isLoading ? (
                    <div className="px-4 py-8 text-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 mx-auto"></div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Loading notifications...</p>
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center">
                      <BellIcon className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-500 dark:text-gray-400">No notifications yet</p>
                    </div>
                  ) : (
                    notifications.slice(0, 10).map((notification) => (
                      <Menu.Item key={notification._id}>
                        {({ active }) => (
                          <div
                            className={`px-4 py-3 border-b border-gray-50 dark:border-gray-700 last:border-b-0 cursor-pointer ${
                              active ? 'bg-gray-50 dark:bg-gray-700' : ''
                            } ${!notification.read ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                            onClick={() => handleNotificationClick(notification)}
                          >
                            <div className="flex items-start space-x-3">
                              {/* Icon */}
                              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                                getNotificationColor(notification.type)
                              }`}>
                                {getNotificationIcon(notification.type)}
                              </div>

                              {/* Content */}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                  {notification.title}
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
                                  {notification.message}
                                </p>
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                  {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                </p>
                              </div>

                              {/* Actions */}
                              <div className="flex-shrink-0 flex items-center space-x-1">
                                {!notification.read && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleMarkAsRead(notification._id);
                                    }}
                                    className="p-1 text-gray-400 dark:text-gray-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                                    title="Mark as read"
                                  >
                                    <EyeIcon className="h-4 w-4" />
                                  </button>
                                )}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete(notification._id);
                                  }}
                                  className="p-1 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                                  title="Delete"
                                >
                                  <XMarkIcon className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </Menu.Item>
                    ))
                  )}
                </div>

                {/* Footer */}
                {notifications.length > 0 && (
                  <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-700">
                    <button className="w-full text-center text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium">
                      View all notifications
                    </button>
                  </div>
                )}
              </Menu.Items>
            </Transition>
          </>
        );
      }}
    </Menu>
  );
};

export default NotificationDropdown;