import React, { useState } from 'react';
import { KeyIcon, ExclamationTriangleIcon } from './icons';

interface LoginModalProps {
    onLoginSuccess: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ onLoginSuccess }) => {
    const [username, setUsername] = useState('Axel.deleon');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const attemptLogin = (pass: string) => {
        if (isLoading) return; // Prevent multiple submissions

        setError(null);
        setIsLoading(true);

        setTimeout(() => {
            if (username === 'Axel.deleon' && pass === '321123') {
                onLoginSuccess();
            } else {
                setError('Credenciales incorrectas. Inténtelo de nuevo.');
                setIsLoading(false);
            }
        }, 500);
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newPassword = e.target.value;
        setPassword(newPassword);
        
        // Auto-submit when the correct length is reached
        if (newPassword.length === 6) {
            attemptLogin(newPassword);
        }
    };

    const handlePasswordSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        attemptLogin(password);
    };

    return (
        <div className="fixed inset-0 bg-gray-100 dark:bg-gray-900 flex items-center justify-center z-50 no-print" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl transform transition-all sm:my-8 sm:max-w-md sm:w-full p-6 m-4">
                <div className="flex items-start">
                    <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-brand-light dark:bg-gray-700 sm:mx-0 sm:h-10 sm:w-10">
                        <KeyIcon className="h-6 w-6 text-brand-primary dark:text-brand-light" />
                    </div>
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left flex-1">
                        <h3 className="text-xl leading-6 font-medium text-gray-900 dark:text-white" id="modal-title">
                            Iniciar Sesión
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Por favor, introduzca sus credenciales para acceder.</p>
                    </div>
                </div>

                <div className="mt-6 space-y-4">
                    <form onSubmit={handlePasswordSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Usuario</label>
                            <input
                                id="username"
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                                className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary sm:text-sm"
                                placeholder="Axel.deleon"
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Contraseña</label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={handlePasswordChange}
                                required
                                className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary sm:text-sm"
                                placeholder="••••••"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                maxLength={6}
                                autoFocus
                            />
                        </div>
                         <div className="mt-6 sm:mt-8">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-brand-primary text-base font-medium text-white hover:bg-brand-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? 'Ingresando...' : 'Ingresar'}
                            </button>
                        </div>
                    </form>
                </div>

                {error && (
                    <div className="mt-4 flex items-center gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded-md">
                        <ExclamationTriangleIcon className="h-5 w-5 flex-shrink-0" />
                        <span>{error}</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LoginModal;