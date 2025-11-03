import React, { useState, useEffect } from 'react';
import { Incidencia, Asignacion } from '../types';

interface ResolutionTimeModalProps {
    task: Incidencia | Asignacion;
    onSave: (id: string, newDate: string, newTime: string) => void;
    onClose: () => void;
}

const ResolutionTimeModal: React.FC<ResolutionTimeModalProps> = ({ task, onSave, onClose }) => {
    const [fecha, setFecha] = useState(task.fechaResuelta || '');
    const [hora, setHora] = useState(task.horaResuelta || '');

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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (fecha && hora) {
            onSave(task.id, fecha, hora);
        }
    };

    const itemType = 'incidencia' in task ? 'la incidencia' : 'la asignación';
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 transition-opacity no-print" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl transform transition-all sm:my-8 sm:max-w-lg sm:w-full p-6 m-4" onClick={(e) => e.stopPropagation()}>
                <form onSubmit={handleSubmit}>
                    <h3 className="text-xl leading-6 font-medium text-gray-900 dark:text-white" id="modal-title">
                        Editar Fecha y Hora de Resolución
                    </h3>
                    <div className="mt-4 space-y-4">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Ajusta la fecha y hora en que se completó {itemType} <span className="font-semibold text-brand-dark dark:text-brand-light">"{task.nombre}"</span>.</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="resolution-fecha" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Fecha de Resolución</label>
                                <input id="resolution-fecha" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary sm:text-sm" />
                            </div>
                            <div>
                                <label htmlFor="resolution-hora" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Hora de Resolución</label>
                                <input id="resolution-hora" type="time" value={hora} onChange={(e) => setHora(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary sm:text-sm" />
                            </div>
                        </div>
                    </div>
                    <div className="mt-6 sm:mt-8 sm:flex sm:flex-row-reverse gap-3">
                        <button type="submit" className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-brand-primary text-base font-medium text-white hover:bg-brand-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary sm:w-auto sm:text-sm">
                            Guardar Cambios
                        </button>
                        <button type="button" onClick={onClose} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-500 shadow-sm px-4 py-2 bg-white dark:bg-gray-700 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary/50 sm:mt-0 sm:w-auto sm:text-sm">
                            Cancelar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ResolutionTimeModal;