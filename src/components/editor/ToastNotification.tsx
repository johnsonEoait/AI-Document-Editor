import React from 'react';
import { ToastMessage } from './types/editor';

interface ToastNotificationProps {
  toast: ToastMessage | null;
}

export const ToastNotification: React.FC<ToastNotificationProps> = ({ toast }) => {
  if (!toast) return null;

  return (
    <div
      className={`fixed top-4 right-4 px-3 py-2 rounded-md shadow-lg z-[9999] ${
        toast.type === 'success' ? 'bg-black text-white' : 'bg-white text-black'
      } flex items-center space-x-2 transition-all duration-300 transform translate-y-0 opacity-100 text-sm border ${
        toast.type === 'success' ? 'border-gray-700' : 'border-gray-200'
      }`}
      style={{
        animation: 'slideIn 0.3s ease-out',
        boxShadow: '0 2px 4px -1px rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.06)'
      }}
    >
      {toast.type === 'success' ? (
        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      )}
      <span>{toast.message}</span>
    </div>
  );
}; 