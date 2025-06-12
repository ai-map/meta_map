import React, { useState, useEffect } from 'react';
import './ToastNotification.css';

export interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  duration?: number; // 自动关闭时间，毫秒，0表示不自动关闭
  onClose?: () => void;
}

interface ToastNotificationProps {
  toasts: ToastProps[];
  onRemoveToast: (index: number) => void;
}

const ToastNotification: React.FC<ToastNotificationProps> = ({
  toasts,
  onRemoveToast,
}) => {
  useEffect(() => {
    toasts.forEach((toast, index) => {
      if (toast.duration && toast.duration > 0) {
        const timer = setTimeout(() => {
          onRemoveToast(index);
          toast.onClose?.();
        }, toast.duration);

        return () => clearTimeout(timer);
      }
    });
  }, [toasts, onRemoveToast]);

  return (
    <div className="toast-container">
      {toasts.map((toast, index) => (
        <div
          key={index}
          className={`toast toast-${toast.type || 'info'}`}
          onClick={() => {
            onRemoveToast(index);
            toast.onClose?.();
          }}
        >
          <div className="toast-content">
            <span className="toast-message">{toast.message}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ToastNotification; 