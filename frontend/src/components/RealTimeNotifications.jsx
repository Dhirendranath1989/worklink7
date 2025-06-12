import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-hot-toast';

const RealTimeNotifications = () => {
  const { realTimeNotifications } = useSelector((state) => state.notifications);

  useEffect(() => {
    // Get the latest notification (first in array since we unshift new ones)
    if (realTimeNotifications.length > 0) {
      const latestNotification = realTimeNotifications[0];
      
      // Only show toast for new notifications (check if it's really new)
      // We'll use a simple approach: show toast for the most recent notification
      // when the array length changes
      const notificationMessage = getNotificationMessage(latestNotification);
      
      if (notificationMessage) {
        toast(notificationMessage, {
          icon: getNotificationIcon(latestNotification.type),
          duration: 5000,
          style: {
            background: '#1f2937',
            color: '#f3f4f6',
            border: '1px solid #374151',
          },
        });
      }
    }
  }, [realTimeNotifications.length]); // Only trigger when new notifications are added

  const getNotificationMessage = (notification) => {
    switch (notification.type) {

      case 'job_request':
        return `Job request: ${notification.title}`;
      case 'review':
        return `New review: ${notification.title}`;
      case 'payment':
        return `Payment update: ${notification.title}`;
      default:
        return notification.title || 'New notification';
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'job_request':
        return '💼';

      case 'review':
        return '⭐';
      case 'payment':
        return '💰';
      default:
        return '🔔';
    }
  };

  // This component doesn't render anything visible
  return null;
};

export default RealTimeNotifications;