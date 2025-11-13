import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import './styles.css';

export interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  duration?: number;
  onClose?: () => void;
}

export function Toast({ message, type = 'info', duration = 3000, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return createPortal(
    <div className={`mc-toast mc-toast--${type}`}>
      <span>{message}</span>
    </div>,
    document.body
  );
}
