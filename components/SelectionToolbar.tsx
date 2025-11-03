

import React from 'react';
import { TrashIcon, XCircleIcon, ArchiveBoxIcon, ArrowUturnLeftIcon } from './icons';

interface SelectionToolbarProps {
  selectedCount: number;
  onCancel: () => void;
  onDelete: () => void;
  onArchive: () => void;
  onRestore: () => void;
  currentView: 'activas' | 'archivadas';
  isVisible: boolean;
}

const SelectionToolbar: React.FC<SelectionToolbarProps> = ({ selectedCount, onCancel, onDelete, onArchive, onRestore, currentView, isVisible }) => {
  return (
    <div className={`fixed bottom-20 md:bottom-0 left-0 md:left-64 right-0 z-40 transition-transform duration-300 ease-in-out ${isVisible ? 'translate-y-0' : 'translate-y-full'}`}>
      <div className="bg-white dark:bg-gray-800 shadow-lg border-t dark:border-gray-700 mx-auto max-w-screen-xl p-3 flex justify-between items-center">
        <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-neon-green text-gray-900 text-sm font-bold">
                {selectedCount}
            </span>
            <span className="font-medium text-gray-700 dark:text-gray-200">
                {selectedCount === 1 ? 'seleccionado' : 'seleccionados'}
            </span>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={onCancel}
            className="flex items-center gap-2 text-sm font-medium py-2 px-4 rounded-lg transition-colors duration-200 bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-white"
            aria-label="Cancelar selección"
          >
            <XCircleIcon className="h-5 w-5"/>
            <span className="hidden sm:inline">Cancelar</span>
          </button>
          {currentView === 'activas' ? (
            <button 
              onClick={onArchive}
              className="flex items-center gap-2 text-sm font-medium py-2 px-4 rounded-lg transition-colors duration-200 bg-brand-primary hover:bg-brand-secondary text-white"
              aria-label="Archivar seleccionados"
            >
              <ArchiveBoxIcon className="h-5 w-5"/>
              <span className="hidden sm:inline">Archivar</span>
            </button>
          ) : (
            <button
              onClick={onRestore}
              className="flex items-center gap-2 text-sm font-medium py-2 px-4 rounded-lg transition-colors duration-200 bg-green-500 hover:bg-green-600 text-white"
              aria-label="Restaurar seleccionados"
            >
              <ArrowUturnLeftIcon className="h-5 w-5" />
              <span className="hidden sm:inline">Restaurar</span>
            </button>
          )}
          <button 
            onClick={onDelete}
            className="flex items-center gap-2 text-sm font-medium py-2 px-4 rounded-lg transition-colors duration-200 bg-red-500 hover:bg-red-600 text-white"
            aria-label="Eliminar seleccionados"
          >
            <TrashIcon className="h-5 w-5"/>
            <span className="hidden sm:inline">Eliminar</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SelectionToolbar;
