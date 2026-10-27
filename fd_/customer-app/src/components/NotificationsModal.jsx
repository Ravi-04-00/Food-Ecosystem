import React from 'react';
import { SmartNotificationCenter } from './SmartNotificationCenter.jsx';

export const NotificationsModal = ({ isOpen, onClose, onNavigateResource }) => {
  return (
    <SmartNotificationCenter 
      isOpen={isOpen} 
      onClose={onClose} 
      onNavigateResource={onNavigateResource}
    />
  );
};
