import React, { useMemo } from 'react';
import { Incidencia, Asignacion } from '../types';
import { ListBulletIcon, ClockIcon, CheckCircleIcon } from './icons';

interface TaskStatsProps {
  tasks: (Incidencia | Asignacion)[];
  type: 'incidencia' | 'asignacion';
}

const TaskStats: React.FC<TaskStatsProps> = ({ tasks, type }) => {
  const stats = useMemo(() => {
    const total = tasks.length;
    const inProgress = tasks.filter(task => task.estado === 'en-progreso').length;
    const completed = total - inProgress;
    return { total, inProgress, completed };
  }, [tasks]);

  if (stats.total === 0) {
    return null;
  }

  const typeLabel = type === 'incidencia' ? 'Incidencias' : 'Asignaciones';

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 no-print">
      <StatCard
        icon={<ListBulletIcon className="h-6 w-6 text-brand-primary" />}
        label={`Total ${typeLabel}`}
        value={stats.total}
        className="neon-border-white"
      />
      <StatCard
        icon={<ClockIcon className="h-6 w-6 text-yellow-400" />}
        label="En Progreso"
        value={stats.inProgress}
        className="neon-border-white"
      />
      <StatCard
        icon={<CheckCircleIcon className="h-6 w-6 text-green-400" />}
        label="Resueltas"
        value={stats.completed}
        className="neon-border-white"
      />
    </div>
  );
};

interface StatCardProps {
    icon: React.ReactNode;
    label: string;
    value: number;
    className?: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, className = ''}) => {
    return (
        <div className={`bg-white dark:bg-gray-800 p-4 rounded-lg flex items-center gap-4 border border-gray-200 dark:border-gray-700 shadow-sm transition-all duration-200 ${className}`}>
            <div className="flex-shrink-0">{icon}</div>
            <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{value}</div>
                <div className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</div>
            </div>
        </div>
    )
}

export default TaskStats;