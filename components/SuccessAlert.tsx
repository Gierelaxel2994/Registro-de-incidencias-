import React, { useEffect } from 'react';

interface SuccessAlertProps {
  message: string;
  onClose: () => void;
}

const SuccessAlert: React.FC<SuccessAlertProps> = ({ message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 2000); // The alert will be visible for 2 seconds

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <>
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 transition-opacity animate-fade-in"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="success-alert-title"
      >
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 flex flex-col items-center gap-4 w-64 transform animate-scale-in">
          <svg className="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
            <circle className="checkmark__circle" cx="26" cy="26" r="25" fill="none" />
            <path className="checkmark__check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
          </svg>
          <h2 id="success-alert-title" className="text-xl font-bold text-gray-800 dark:text-white text-center">
            {message}
          </h2>
        </div>
      </div>
      <style>{`
        .checkmark {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          display: block;
          stroke-width: 4;
          stroke: #4CAF50;
          stroke-miterlimit: 10;
          margin: 0 auto;
          box-shadow: inset 0px 0px 0px #4CAF50;
          animation: fill .4s ease-in-out .4s forwards, scale .3s ease-in-out .9s both;
        }
        .checkmark__circle {
          stroke-dasharray: 166;
          stroke-dashoffset: 166;
          stroke-width: 3;
          stroke-miterlimit: 10;
          stroke: #4CAF50;
          fill: #fff;
          animation: stroke 0.6s cubic-bezier(0.65, 0, 0.45, 1) forwards;
        }
        html.dark .checkmark__circle {
          fill: #1f2937; /* bg-gray-800 */
        }
        .checkmark__check {
          transform-origin: 50% 50%;
          stroke-dasharray: 48;
          stroke-dashoffset: 48;
          animation: stroke 0.3s cubic-bezier(0.65, 0, 0.45, 1) 0.8s forwards;
        }
        @keyframes stroke {
          100% {
            stroke-dashoffset: 0;
          }
        }
        @keyframes scale {
          0%, 100% {
            transform: none;
          }
          50% {
            transform: scale3d(1.1, 1.1, 1);
          }
        }
        @keyframes fill {
          100% {
            box-shadow: inset 0px 0px 0px 40px #4CAF50;
          }
        }
        @keyframes fade-in {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        .animate-fade-in {
            animation: fade-in 0.2s ease-out forwards;
        }
        @keyframes scale-in {
            from {
                opacity: 0;
                transform: scale(0.9);
            }
            to {
                opacity: 1;
                transform: scale(1);
            }
        }
        .animate-scale-in {
            animation: scale-in 0.3s ease-out forwards;
        }
      `}</style>
    </>
  );
};

export default SuccessAlert;
