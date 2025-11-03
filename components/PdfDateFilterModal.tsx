import React, { useState, useMemo, useEffect } from 'react';
import { Incidencia, Asignacion } from '../types';
import { FilterIcon } from './icons';

interface DateFilterModalProps {
    tasks: (Incidencia | Asignacion)[];
    title: string;
    generateButtonText: string;
    onGenerate: (startDate: string, endDate: string) => void;
    onClose: () => void;
}

const DateFilterModal: React.FC<DateFilterModalProps> = ({ tasks, title, generateButtonText, onGenerate, onClose }) => {
    const [minDate, maxDate] = useMemo(() => {
        if (tasks.length === 0) {
            const today = new Date().toISOString().split('T')[0];
            return [today, today];
        }
        const dates = tasks.map(t => new Date(t.fecha));
        const min = new Date(Math.min.apply(null, dates as any));
        const max = new Date(Math.max.apply(null, dates as any));
        return [min.toISOString().split('T')[0], max.toISOString().split('T')[0]];
    }, [tasks]);

    const [startDate, setStartDate] = useState(minDate);
    const [endDate, setEndDate] = useState(maxDate);

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
        onGenerate(startDate, endDate);
    };
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 transition-opacity no-print" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl transform transition-all sm:my-8 sm:max-w-lg sm:w-full p-6 m-4" onClick={(e) => e.stopPropagation()}>
                <form onSubmit={handleSubmit}>
                    <div className="flex items-start">
                        <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-brand-light dark:bg-gray-700 sm:mx-0 sm:h-10 sm:w-10">
                            <FilterIcon className="h-6 w-6 text-brand-primary dark:text-brand-light" />
                        </div>
                        <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left flex-1">
                            <h3 className="text-xl leading-6 font-medium text-gray-900 dark:text-white" id="modal-title">
                                {title}
                            </h3>
                            <div className="mt-2">
                                <p className="text-sm text-gray-500 dark:text-gray-400">Selecciona el rango de fechas para generar tu reporte.</p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Desde</label>
                                <input id="start-date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary sm:text-sm" />
                            </div>
                            <div>
                                <label htmlFor="end-date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Hasta</label>
                                <input id="end-date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required min={startDate} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary sm:text-sm" />
                            </div>
                        </div>
                    </div>
                    <div className="mt-6 sm:mt-8 sm:flex sm:flex-row-reverse gap-3">
                        <button type="submit" className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-brand-primary text-base font-medium text-white hover:bg-brand-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary sm:w-auto sm:text-sm">
                            {generateButtonText}
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

export default DateFilterModal;