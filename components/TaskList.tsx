import React from 'react';
import { Incidencia, Asignacion } from '../types';
// FIX: Module '"file:///components/TaskItem"' has no default export.
import { TaskItem } from './TaskItem';

interface TaskListProps {
  tasks: (Incidencia | Asignacion)[];
  itemType: 'incidencia' | 'asignacion';
  onChangeStatus: (id: string) => void;
  onStartEdit: (id: string) => void;
  onStartEditResolution: (id: string) => void;
  onStartCategorize: (id: string) => void;
  onDuplicateTask: (id: string) => void;
  onArchiveTask: (id: string) => void;
  onUnarchiveTask: (id: string) => void;
  onTransferTask: (id: string) => void;
  selectedTasks: string[];
  isSelectionMode: boolean;
  onEnterSelectionMode: (id: string) => void;
  onToggleSelection: (id: string) => void;
  onToggleSelectAll?: () => void;
  asignacionesView: 'activas' | 'archivadas';
  setAsignacionesView: (view: 'activas' | 'archivadas') => void;
  incidenciasView?: 'activas' | 'archivadas';
  setIncidenciasView?: (view: 'activas' | 'archivadas') => void;
  highlightedTaskId?: string | null;
  setHighlightedTaskId?: (id: string | null) => void;
  incidenciasSort?: 'reciente' | 'antiguo';
  setIncidenciasSort?: (sort: 'reciente' | 'antiguo') => void;
  incidenciasStatusFilter?: 'todos' | 'en-progreso' | 'resuelta';
  setIncidenciasStatusFilter?: (filter: 'todos' | 'en-progreso' | 'resuelta') => void;
}

const TaskList: React.FC<TaskListProps> = ({ 
    tasks, itemType, onChangeStatus, onStartEdit, onStartEditResolution, 
    onStartCategorize, onDuplicateTask, onArchiveTask, onUnarchiveTask, onTransferTask,
    selectedTasks, isSelectionMode, onEnterSelectionMode, onToggleSelection, onToggleSelectAll,
    asignacionesView, setAsignacionesView, incidenciasView, setIncidenciasView,
    highlightedTaskId, setHighlightedTaskId,
    incidenciasSort, setIncidenciasSort, incidenciasStatusFilter, setIncidenciasStatusFilter
}) => {
  const areAllSelected = tasks.length > 0 && tasks.every(t => selectedTasks.includes(t.id));

  const FilterBar = () => (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-y-4 gap-x-6 p-3 bg-white dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700/50">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
        {/* Sorting controls */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Ordenar:</span>
          <div className="inline-flex rounded-md shadow-sm" role="group">
            <button onClick={() => setIncidenciasSort && setIncidenciasSort('reciente')} type="button" className={`px-4 py-1.5 text-sm font-medium transition-colors duration-200 rounded-l-lg ${incidenciasSort === 'reciente' ? 'bg-brand-primary text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300'}`}>Más Reciente</button>
            <button onClick={() => setIncidenciasSort && setIncidenciasSort('antiguo')} type="button" className={`px-4 py-1.5 text-sm font-medium transition-colors duration-200 rounded-r-lg ${incidenciasSort === 'antiguo' ? 'bg-brand-primary text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300'}`}>Más Antiguo</button>
          </div>
        </div>
        {/* Status filter controls */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Estado:</span>
          <div className="inline-flex rounded-md shadow-sm" role="group">
            <button onClick={() => setIncidenciasStatusFilter && setIncidenciasStatusFilter('todos')} type="button" className={`px-4 py-1.5 text-sm font-medium transition-colors duration-200 rounded-l-lg ${incidenciasStatusFilter === 'todos' ? 'bg-brand-primary text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300'}`}>Todos</button>
            <button onClick={() => setIncidenciasStatusFilter && setIncidenciasStatusFilter('en-progreso')} type="button" className={`px-4 py-1.5 text-sm font-medium transition-colors duration-200 ${incidenciasStatusFilter === 'en-progreso' ? 'neon-border-white text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300'}`}>En Progreso</button>
            <button onClick={() => setIncidenciasStatusFilter && setIncidenciasStatusFilter('resuelta')} type="button" className={`px-4 py-1.5 text-sm font-medium transition-colors duration-200 rounded-r-lg ${incidenciasStatusFilter === 'resuelta' ? 'neon-border-white text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300'}`}>Resueltas</button>
          </div>
        </div>
      </div>
      
      {onToggleSelectAll && (
        <div className="flex items-center gap-2">
            <input
                id="select-all"
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-brand-primary focus:ring-brand-primary dark:bg-gray-700 cursor-pointer"
                checked={areAllSelected}
                onChange={onToggleSelectAll}
                disabled={tasks.length === 0}
            />
            <label htmlFor="select-all" className="text-sm font-medium text-gray-600 dark:text-gray-400 cursor-pointer">
                Seleccionar todos
            </label>
        </div>
      )}
    </div>
  );

  const Tabs = () => {
    const isIncidencia = itemType === 'incidencia';
    const currentView = isIncidencia ? incidenciasView : asignacionesView;
    const setView = isIncidencia ? setIncidenciasView : setAsignacionesView;

    if (!setView || !currentView) return null;

    return (
      <div className="mb-4 border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-6" aria-label="Tabs">
          <button onClick={() => setView('activas')} className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${currentView === 'activas' ? 'border-brand-primary text-brand-secondary dark:text-brand-light dark:border-brand-light' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-500'}`}>
            Activas
          </button>
          <button onClick={() => setView('archivadas')} className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${currentView === 'archivadas' ? 'border-brand-primary text-brand-secondary dark:text-brand-light dark:border-brand-light' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-500'}`}>
            Archivadas
          </button>
        </nav>
      </div>
    );
  };

  if (tasks.length === 0) {
    const isIncidencia = itemType === 'incidencia';
    const currentView = isIncidencia ? incidenciasView : asignacionesView;
    const emptyStateMessages = {
      incidencia: {
        activas: { title: "No hay incidencias activas", subtitle: "Comienza añadiendo una nueva incidencia." },
        archivadas: { title: "No hay incidencias archivadas", subtitle: "Puedes archivar incidencias desde la vista de activas." }
      },
      asignacion: {
        activas: { title: "No hay asignaciones activas", subtitle: "Comienza añadiendo una nueva asignación." },
        archivadas: { title: "No hay asignaciones archivadas", subtitle: "Puedes archivar asignaciones desde la vista de activas." }
      }
    };
    const message = emptyStateMessages[itemType][currentView || 'activas'];

    return (
      <>
        {itemType === 'incidencia' && <FilterBar />}
        <Tabs />
        <div className="text-center py-12 px-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2-2z" />
          </svg>
          <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">{message.title}</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{message.subtitle}</p>
        </div>
      </>
    );
  }

  return (
    <>
      {itemType === 'incidencia' && <FilterBar />}
      <Tabs />
      <div className="space-y-4">
        {tasks.map((task) => (
          <TaskItem 
            key={task.id} 
            item={task}
            itemType={itemType}
            onChangeStatus={onChangeStatus}
            onStartEdit={onStartEdit}
            onStartEditResolution={onStartEditResolution}
            onStartCategorize={onStartCategorize}
            onDuplicateTask={onDuplicateTask}
            onArchiveTask={onArchiveTask}
            onUnarchiveTask={onUnarchiveTask}
            onTransferTask={onTransferTask}
            isSelected={selectedTasks.includes(task.id)}
            isSelectionMode={isSelectionMode}
            onEnterSelectionMode={onEnterSelectionMode}
            onToggleSelection={onToggleSelection}
            itemView={itemType === 'incidencia' ? incidenciasView : asignacionesView}
            highlightedTaskId={highlightedTaskId}
            setHighlightedTaskId={setHighlightedTaskId}
          />
        ))}
      </div>
    </>
  );
};

export default TaskList;