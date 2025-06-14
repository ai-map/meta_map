import React, { useEffect } from "react";
import "./ToastNotification.css";

export interface ToastProps {
  message: string;
  type?: "success" | "error" | "info" | "warning";
  duration?: number; // 自动关闭时间，毫秒，0表示不自动关闭
  onClose?: () => void;
}

interface ToastNotificationProps {
  toasts: ToastProps[];
  onRemoveToast: (index: number) => void;
}

export const ToastNotification: React.FC<ToastNotificationProps> = ({
  toasts,
  onRemoveToast,
}) => {
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    
    toasts.forEach((toast, index) => {
      if (toast.duration && toast.duration > 0) {
        const timer = setTimeout(() => {
          onRemoveToast(index);
          toast.onClose?.();
        }, toast.duration);
        
        timers.push(timer);
      }
    });

    // 清理函数
    return () => {
      timers.forEach(timer => clearTimeout(timer));
    };
  }, [toasts, onRemoveToast]);

  return (
    <div className="toast-container">
      {toasts.map((toast, index) => (
        <div
          key={index}
          className={`toast toast-${toast.type || "info"}`}
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
