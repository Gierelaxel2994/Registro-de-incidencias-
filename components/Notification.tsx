import React, { useEffect } from 'react';
import { CheckCircleIcon, XCircleIcon, XMarkIcon } from './icons';

interface NotificationProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}

const Notification: React.FC<NotificationProps> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const isSuccess = type === 'success';

  return (
    <div
      role="alert"
      className="fixed bottom-5 right-5 z-50 animate-fade-in-up"
    >
      <div className="max-w-sm bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 flex items-start gap-4 border border-gray-200 dark:border-gray-700">
        <div className="flex-shrink-0">
            {isSuccess ? (
                <CheckCircleIcon className="h-6 w-6 text-green-500" />
            ) : (
                <XCircleIcon className="h-6 w-6 text-red-500" />
            )}
        </div>
        <div className="flex-1">
            <p className="text-sm font-medium text-gray-900 dark:text-white">
                {isSuccess ? 'Éxito' : 'Error'}
            </p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {message}
            </p>
        </div>
        <div className="flex-shrink-0">
            <button
                onClick={onClose}
                aria-label="Cerrar notificación"
                className="p-1 rounded-full text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-primary"
            >
                <XMarkIcon className="h-5 w-5" />
            </button>
        </div>
      </div>
      <style>{`
        @keyframes fade-in-up {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        .animate-fade-in-up {
            animation: fade-in-up 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default Notification;
