import React, { useState, useEffect } from 'react';
import { BaseTask, Category } from '../types';
import { TagIcon } from './icons';

export const CATEGORIES: Category[] = ['Falla Operador', 'Falla Operacion Forza', 'Suciedad', 'Bolsa con fallas', 'Otros'];

interface CategoryModalProps {
    task: BaseTask;
    onSave: (id: string, category: Category, otherCategory?: string) => void;
    onClose: () => void;
}

const CategoryModal: React.FC<CategoryModalProps> = ({ task, onSave, onClose }) => {
    const [selectedCategory, setSelectedCategory] = useState<Category | undefined>(task.category);
    const [otherText, setOtherText] = useState(task.category === 'Otros' ? task.otherCategory || '' : '');

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedCategory) {
            onSave(task.id, selectedCategory, selectedCategory === 'Otros' ? otherText : undefined);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 transition-opacity no-print" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl transform transition-all sm:my-8 sm:max-w-lg sm:w-full p-6 m-4" onClick={(e) => e.stopPropagation()}>
                <form onSubmit={handleSubmit}>
                    <div className="flex items-start">
                        <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-brand-light dark:bg-gray-700 sm:mx-0 sm:h-10 sm:w-10">
                            <TagIcon className="h-6 w-6 text-brand-primary dark:text-brand-light" />
                        </div>
                        <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left flex-1">
                            <h3 className="text-xl leading-6 font-medium text-gray-900 dark:text-white">Categorizar Registro</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Selecciona una categoría para "{task.nombre}".</p>
                        </div>
                    </div>

                    <div className="mt-6 space-y-4">
                        {CATEGORIES.map(cat => (
                            <label key={cat} className="flex items-center gap-3 p-3 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors">
                                <input
                                    type="radio"
                                    name="category"
                                    value={cat}
                                    checked={selectedCategory === cat}
                                    onChange={() => setSelectedCategory(cat)}
                                    className="h-4 w-4 text-brand-primary border-gray-300 focus:ring-brand-primary"
                                />
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{cat}</span>
                            </label>
                        ))}
                        {selectedCategory === 'Otros' && (
                            <div className="pl-10">
                                <label htmlFor="other-category-text" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Especificar "Otros"</label>
                                <input
                                    id="other-category-text"
                                    type="text"
                                    value={otherText}
                                    onChange={(e) => setOtherText(e.target.value)}
                                    placeholder="Describe la categoría"
                                    className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary sm:text-sm"
                                />
                            </div>
                        )}
                    </div>

                    <div className="mt-6 sm:mt-8 sm:flex sm:flex-row-reverse gap-3">
                        <button type="submit" disabled={!selectedCategory} className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-brand-primary text-base font-medium text-white hover:bg-brand-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                            Guardar Categoría
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

export default CategoryModal;