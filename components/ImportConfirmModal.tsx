import React, { useEffect } from 'react';
import { ExclamationTriangleIcon } from './icons';

interface ImportConfirmModalProps {
    onConfirm: () => void;
    onClose: () => void;
}

const ImportConfirmModal: React.FC<ImportConfirmModalProps> = ({ onConfirm, onClose }) => {

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [onClose]);
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 transition-opacity no-print" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl transform transition-all sm:my-8 sm:max-w-lg sm:w-full p-6 m-4" onClick={(e) => e.stopPropagation()}>
                <div className="sm:flex sm:items-start">
                    <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/50 sm:mx-0 sm:h-10 sm:w-10">
                        <ExclamationTriangleIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
                    </div>
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                        <h3 className="text-xl leading-6 font-medium text-gray-900 dark:text-white" id="modal-title">
                            Confirmar Importación
                        </h3>
                        <div className="mt-2">
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Esto reemplazará todos los datos de incidencias y asignaciones. Esta acción no se puede deshacer. ¿Estás seguro de que quieres continuar?
                            </p>
                        </div>
                    </div>
                </div>
                <div className="mt-5 sm:mt-6 sm:flex sm:flex-row-reverse gap-3">
                    <button
                        type="button"
                        className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:w-auto sm:text-sm"
                        onClick={onConfirm}
                    >
                        Sí, importar
                    </button>
                    <button
                        type="button"
                        className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-500 shadow-sm px-4 py-2 bg-white dark:bg-gray-700 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary/50 sm:mt-0 sm:w-auto sm:text-sm"
                        onClick={onClose}
                    >
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ImportConfirmModal;