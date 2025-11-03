
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';

import Sidebar from './components/Sidebar';
// FIX: Removed import for missing Footer component.
import TaskList from './components/TaskList';
import TaskForm from './components/TaskForm';
import TaskStats from './components/TaskStats';
import Notification from './components/Notification';
import ResolutionTimeModal from './components/ResolutionTimeModal';
import { Incidencia, Asignacion, Category, Page } from './types';
import DateFilterModal from './components/DateFilterModal';
import ImportConfirmModal from './components/ImportConfirmModal';
import CategoryModal from './components/CategoryModal';
import EstadisticasPage from './components/EstadisticasPage';
import SelectionToolbar from './components/SelectionToolbar';
import SuccessAlert from './components/SuccessAlert';
import ConfirmModal from './components/ConfirmModal';
import LoginModal from './components/LoginModal';
import { logAction, exportLogs } from './utils/logger';

type NotificationState = {
  message: string;
  type: 'success' | 'error';
} | null;

const calculateSLA = (startDate: string, startTime: string, endDate?: string, endTime?: string): string => {
    if (!endDate || !endTime) return '-';
    try {
        const start = new Date(`${startDate}T${startTime}`);
        const end = new Date(`${endDate}T${endTime}`);
        if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) return '-';

        let diff = end.getTime() - start.getTime();

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        diff -= days * (1000 * 60 * 60 * 24);
        
        const hours = Math.floor(diff / (1000 * 60 * 60));
        diff -= hours * (1000 * 60 * 60);

        const minutes = Math.floor(diff / (1000 * 60));

        const parts: string[] = [];
        if (days > 0) parts.push(`${days}d`);
        if (hours > 0) parts.push(`${hours}h`);
        if (minutes > 0) parts.push(`${minutes}m`);

        return parts.length > 0 ? parts.join(' ') : '0m';
    } catch (e) {
        return '-';
    }
};

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [page, setPage] = useState<Page>('incidencias');
  const [incidencias, setIncidencias] = useState<Incidencia[]>([]);
  const [asignaciones, setAsignaciones] = useState<Asignacion[]>([]);
  const [asignacionesView, setAsignacionesView] = useState<'activas' | 'archivadas'>('activas');
  const [incidenciasView, setIncidenciasView] = useState<'activas' | 'archivadas'>('activas');
  
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Partial<Incidencia> | Partial<Asignacion> | null>(null);
  const [notification, setNotification] = useState<NotificationState>(null);
  const [successAlertMessage, setSuccessAlertMessage] = useState<string | null>(null);
  const [modalTask, setModalTask] = useState<Incidencia | Asignacion | null>(null);
  const [categorizeTask, setCategorizeTask] = useState<Incidencia | Asignacion | null>(null);
  const [highlightedTaskId, setHighlightedTaskId] = useState<string | null>(null);

  const [isPdfFilterVisible, setIsPdfFilterVisible] = useState(false);
  const [isExcelFilterVisible, setIsExcelFilterVisible] = useState(false);
  const [isPdfGenerating, setIsPdfGenerating] = useState(false);
  const [isExcelGenerating, setIsExcelGenerating] = useState(false);
  const [isImportConfirmVisible, setIsImportConfirmVisible] = useState(false);
  const [isDeleteConfirmVisible, setIsDeleteConfirmVisible] = useState(false);
  const [fileToImport, setFileToImport] = useState<File | null>(null);

  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const isSelectionMode = useMemo(() => selectedTasks.length > 0, [selectedTasks]);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isFullscreenLocked, setIsFullscreenLocked] = useState(false);
  const tapCountRef = useRef(0);
  const tapTimerRef = useRef<number | null>(null);
  
  const [incidenciasSort, setIncidenciasSort] = useState<'reciente' | 'antiguo'>('reciente');
  const [incidenciasStatusFilter, setIncidenciasStatusFilter] = useState<'todos' | 'en-progreso' | 'resuelta'>('todos');


  // Authentication state is now managed within the component and does not persist across page loads or sessions.

  const runConsecutivoMigration = (incidenciasToMigrate: Incidencia[], asignacionesToMigrate: Asignacion[]): { newIncidencias: Incidencia[], newAsignaciones: Asignacion[] } => {
    
    const renumberTasks = <T extends { fecha: string; hora: string }>(tasks: T[]): T[] => {
        tasks.sort((a, b) => {
            const dateTimeA = `${a.fecha}T${a.hora}`;
            const dateTimeB = `${b.fecha}T${b.hora}`;
            if (dateTimeA < dateTimeB) return -1;
            if (dateTimeA > dateTimeB) return 1;
            return 0;
        });

        return tasks.map((task, index) => ({
            ...task,
            consecutivo: index + 1,
        }));
    };
    
    const newIncidencias = renumberTasks(incidenciasToMigrate);
    const newAsignaciones = renumberTasks(asignacionesToMigrate);

    return { newIncidencias, newAsignaciones };
  };

  useEffect(() => {
    // Set the theme to dark by default on app load
    document.documentElement.classList.add('dark');
    localStorage.setItem('theme', 'dark');
  }, []);
  
  useEffect(() => {
    let loadedIncidencias: Incidencia[] = [];
    let loadedAsignaciones: Asignacion[] = [];

    try {
      const savedIncidencias = localStorage.getItem('incidencias');
      if (savedIncidencias) {
        loadedIncidencias = JSON.parse(savedIncidencias).map((t: Incidencia) => ({ ...t, id: String(t.id) }));
      }
    } catch (e) {
      console.error("Failed to parse incidencias from localStorage:", e);
      localStorage.removeItem('incidencias');
    }

    try {
      const savedAsignaciones = localStorage.getItem('asignaciones');
      if (savedAsignaciones) {
        loadedAsignaciones = JSON.parse(savedAsignaciones).map((t: Asignacion) => ({ ...t, id: String(t.id) }));
      }
    } catch (e) {
      console.error("Failed to parse asignaciones from localStorage:", e);
      localStorage.removeItem('asignaciones');
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    let archivedCount = 0;

    const autoArchivedIncidencias = loadedIncidencias.map(inc => {
        if (!inc.fecha) return inc;
        const incidentDate = new Date(inc.fecha);
        if (!inc.isArchived && incidentDate < thirtyDaysAgo) {
            archivedCount++;
            return { ...inc, isArchived: true };
        }
        return inc;
    });

    if (archivedCount > 0) {
        logAction(`${archivedCount} incidencia(s) antigua(s) archivada(s) automáticamente.`);
        setTimeout(() => {
            setNotification({ message: `${archivedCount} incidencia(s) con más de 30 días se archivaron automáticamente.`, type: 'success' });
        }, 1000);
        loadedIncidencias = autoArchivedIncidencias;
    }

    const { newIncidencias, newAsignaciones } = runConsecutivoMigration(loadedIncidencias, loadedAsignaciones);
    setIncidencias(newIncidencias);
    setAsignaciones(newAsignaciones);
    setSelectedTasks([]); // Explicitly clear selection on initial load.

  }, []);

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().then(() => {
            setIsFullscreenLocked(true);
            logAction('Entró en modo pantalla completa.');
            setNotification({ message: 'Modo completo bloqueado. Toca 3 veces el título para desbloquear.', type: 'success'});
        }).catch(err => {
            console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
        });
    } else if (document.exitFullscreen) {
        document.exitFullscreen().then(() => {
            logAction('Salió del modo pantalla completa.');
        });
    }
  };

  useEffect(() => {
      const handleFullscreenChange = () => {
        const isCurrentlyFullscreen = !!document.fullscreenElement;
        setIsFullscreen(isCurrentlyFullscreen);
        if (!isCurrentlyFullscreen) {
          setIsFullscreenLocked(false);
        }
      };
      document.addEventListener('fullscreenchange', handleFullscreenChange);
      return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
      const handleKeyDown = (event: KeyboardEvent) => {
          if (isFullscreenLocked && (event.key === 'Escape' || event.key === 'F11')) {
              event.preventDefault();
              setNotification({ message: 'Toca 3 veces el título para desbloquear y salir.', type: 'error' });
          }
      };
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreenLocked]);

  const handleHeaderTap = () => {
      if (!isFullscreenLocked) return;

      tapCountRef.current += 1;

      if (tapTimerRef.current) {
          clearTimeout(tapTimerRef.current);
      }

      if (tapCountRef.current === 3) {
          setIsFullscreenLocked(false);
          tapCountRef.current = 0;
          logAction('Desbloqueó el modo pantalla completa.');
          setNotification({ message: 'Modo completo desbloqueado.', type: 'success' });
      } else {
          tapTimerRef.current = window.setTimeout(() => {
              tapCountRef.current = 0;
          }, 1500); // Reset after 1.5 seconds
      }
  };


  useEffect(() => {
    localStorage.setItem('incidencias', JSON.stringify(incidencias));
  }, [incidencias]);

  useEffect(() => {
    localStorage.setItem('asignaciones', JSON.stringify(asignaciones));
  }, [asignaciones]);

  const currentTasks = useMemo(() => {
    if (page === 'incidencias') {
      let filtered = incidencias.filter(i => incidenciasView === 'archivadas' ? i.isArchived === true : !i.isArchived);

      if (incidenciasStatusFilter !== 'todos') {
        filtered = filtered.filter(t => t.estado === incidenciasStatusFilter);
      }

      return filtered.sort((a, b) => {
        if (incidenciasSort === 'reciente') {
          return b.consecutivo - a.consecutivo;
        } else { // 'antiguo'
          return a.consecutivo - b.consecutivo;
        }
      });
    }
    if (page === 'asignaciones') {
      return asignaciones
        .filter(a => asignacionesView === 'archivadas' ? a.isArchived === true : !a.isArchived)
        .sort((a, b) => b.consecutivo - a.consecutivo);
    }
    return [];
  }, [page, incidencias, asignaciones, asignacionesView, incidenciasView, incidenciasSort, incidenciasStatusFilter]);

  const handleBackupData = async (
    incidenciasToBackup: Incidencia[] = incidencias,
    asignacionesToBackup: Asignacion[] = asignaciones,
    isAutomatic: boolean = false
  ) => {
    if (!isAutomatic) {
      logAction('Exportación de copia de seguridad (Backup) iniciada.');
    }
    const dataToExport = {
      incidencias: incidenciasToBackup,
      asignaciones: asignacionesToBackup,
    };
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const timestamp = `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;
    const filename = `backup_registros_${timestamp}.json`;

    // 1. Web Share API (Mobile first)
    if (!isAutomatic && navigator.share) {
      try {
        const file = new File([blob], filename, { type: 'application/json' });
        await navigator.share({
          files: [file],
          title: 'Copia de Seguridad de Registros',
        });
        setNotification({ message: 'Copia de seguridad lista para compartir/guardar.', type: 'success' });
        return;
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          return;
        }
        console.warn('Web Share API failed, falling back to other methods.', error);
      }
    }

    // 2. File System Access API (Modern Desktop Browsers)
    if (!isAutomatic && (window as any).showSaveFilePicker) {
      try {
        const handle = await (window as any).showSaveFilePicker({
          suggestedName: filename,
          types: [{
            description: 'JSON Files',
            accept: { 'application/json': ['.json'] },
          }],
        });
        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
        
        if (!isAutomatic) {
            setNotification({ message: 'Copia de seguridad guardada con éxito.', type: 'success' });
        }
        return;
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
            return;
        }
        console.warn('File System Access API failed, falling back to download link.', error);
      }
    }

    // 3. Fallback to direct download link
    try {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      if (!isAutomatic) {
        setNotification({ message: 'Descarga de copia de seguridad iniciada.', type: 'success' });
      }
    } catch (error) {
      console.error('Fallback download failed:', error);
      if (!isAutomatic) {
        setNotification({ message: 'No se pudo exportar la copia.', type: 'error' });
      }
    }
  };

  const handleSaveTask = (taskData: Omit<Incidencia, 'id' | 'estado'> | Omit<Asignacion, 'id' | 'estado'>) => {
    const taskList = page === 'incidencias' ? incidencias : asignaciones;
    const setTaskList = page === 'incidencias' ? setIncidencias : setAsignaciones;
    const itemTypeCapitalized = page === 'incidencias' ? 'Incidencia' : 'Asignación';

    if (taskToEdit && taskToEdit.id) {
      const updatedTasks = taskList.map(t => {
        if (t.id === taskToEdit.id) {
          // Explicitly preserve the resolution time, as the main edit form doesn't handle it.
          // This prevents it from being accidentally overwritten.
          return { 
            ...t, 
            ...taskData,
            fechaResuelta: t.fechaResuelta,
            horaResuelta: t.horaResuelta,
          };
        }
        return t;
      }) as (Incidencia[] | Asignacion[]);
      
      setTaskList(updatedTasks);
      
      if (page === 'incidencias') {
        handleBackupData(updatedTasks as Incidencia[], asignaciones, true);
      } else {
        handleBackupData(incidencias, updatedTasks as Asignacion[], true);
      }

      logAction(`Registro '${taskData.nombre}' (#${taskToEdit.consecutivo}) actualizado en ${page}.`);
      setNotification({ message: `${itemTypeCapitalized} actualizada con éxito.`, type: 'success'});
    } else {
      const consecutivoValues = taskList
        .map(t => t.consecutivo)
        .filter(c => typeof c === 'number' && isFinite(c));
      const maxConsecutivo = consecutivoValues.length > 0 ? Math.max(...consecutivoValues) : 0;
      const nextConsecutivo = maxConsecutivo + 1;
      
      const newTask: Incidencia | Asignacion = { 
        ...taskData, 
        id: uuidv4(), 
        estado: 'en-progreso' as const,
        consecutivo: nextConsecutivo,
        isArchived: false
      };
      
      const newTaskList = [...taskList, newTask] as (Incidencia[] | Asignacion[]);
      setTaskList(newTaskList);

      logAction(`Registro '${newTask.nombre}' (#${newTask.consecutivo}) creado en ${page}.`);

      if (page === 'incidencias') {
        handleBackupData(newTaskList as Incidencia[], asignaciones, true);
      } else {
        handleBackupData(incidencias, newTaskList as Asignacion[], true);
      }
      setSuccessAlertMessage(page === 'incidencias' ? 'Incidencia Reportada' : 'Asignación Creada');
    }
    setIsFormVisible(false);
    setTaskToEdit(null);
  };
  
  const handleEnterSelectionMode = (id: string) => {
    setSelectedTasks([id]);
  };

  const handleExitSelectionMode = () => {
    setSelectedTasks([]);
  };

  const handleToggleSelection = (id: string) => {
    setSelectedTasks(prev => {
      if (prev.includes(id)) {
        return prev.filter(taskId => taskId !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const handleToggleSelectAll = () => {
    const currentTaskIds = currentTasks.map(t => t.id);
    const allVisibleSelected = currentTaskIds.length > 0 && currentTaskIds.every(id => selectedTasks.includes(id));

    if (allVisibleSelected) {
      setSelectedTasks([]);
    } else {
      setSelectedTasks(currentTaskIds);
    }
  };

  const handlePromptDelete = () => {
    if (selectedTasks.length > 0) {
      setIsDeleteConfirmVisible(true);
    }
  };

  const handleConfirmDelete = () => {
    logAction(`${selectedTasks.length} registro(s) eliminado(s) desde ${page}. IDs: ${selectedTasks.join(', ')}.`);
    const newIncidencias = incidencias.filter(t => !selectedTasks.includes(t.id));
    const newAsignaciones = asignaciones.filter(t => !selectedTasks.includes(t.id));
    
    setIncidencias(newIncidencias);
    setAsignaciones(newAsignaciones);
    
    handleBackupData(newIncidencias, newAsignaciones, true);

    const message = selectedTasks.length === 1 ? '1 registro eliminado.' : `${selectedTasks.length} registros eliminados.`;
    setNotification({ message, type: 'success' });
    handleExitSelectionMode();
    setIsDeleteConfirmVisible(false);
  };

  const handleArchiveSelected = () => {
    const taskCount = selectedTasks.length;
    if (taskCount === 0) return;

    logAction(`${taskCount} registro(s) archivado(s) desde ${page}. IDs: ${selectedTasks.join(', ')}.`);

    if (page === 'incidencias') {
      const updatedIncidencias = incidencias.map(t =>
        selectedTasks.includes(t.id) ? { ...t, isArchived: true } : t
      );
      setIncidencias(updatedIncidencias);
      handleBackupData(updatedIncidencias, asignaciones, true);
    } else { // 'asignaciones'
      const updatedAsignaciones = asignaciones.map(t =>
        selectedTasks.includes(t.id) ? { ...t, isArchived: true } : t
      );
      setAsignaciones(updatedAsignaciones);
      handleBackupData(incidencias, updatedAsignaciones, true);
    }

    const message = taskCount === 1 ? '1 registro archivado.' : `${taskCount} registros archivados.`;
    setNotification({ message, type: 'success' });
    handleExitSelectionMode();
  };

  const handleRestoreSelected = () => {
    const taskCount = selectedTasks.length;
    if (taskCount === 0) return;

    logAction(`${taskCount} registro(s) restaurado(s) desde ${page}. IDs: ${selectedTasks.join(', ')}.`);

    if (page === 'incidencias') {
      const updatedIncidencias = incidencias.map(t =>
        selectedTasks.includes(t.id) ? { ...t, isArchived: false } : t
      );
      setIncidencias(updatedIncidencias);
      handleBackupData(updatedIncidencias, asignaciones, true);
    } else { // 'asignaciones'
      const updatedAsignaciones = asignaciones.map(t =>
        selectedTasks.includes(t.id) ? { ...t, isArchived: false } : t
      );
      setAsignaciones(updatedAsignaciones);
      handleBackupData(incidencias, updatedAsignaciones, true);
    }

    const message = taskCount === 1 ? '1 registro restaurado.' : `${taskCount} registros restaurados.`;
    setNotification({ message, type: 'success' });
    handleExitSelectionMode();
  };


  const handleChangeStatus = (id: string) => {
    const taskList = page === 'incidencias' ? incidencias : asignaciones;
    const setTaskList = page === 'incidencias' ? setIncidencias : setAsignaciones;
    const itemType = page === 'incidencias' ? 'incidencia' : 'asignación';
    
    const task = taskList.find(t => t.id === id);
    if (task) {
      const newStatus = task.estado === 'en-progreso' ? 'resuelta' : 'en-progreso';
      logAction(`Estado del registro '${task.nombre}' (#${task.consecutivo}) cambiado a '${newStatus}'.`);
    }

    setTaskList(prev => prev.map(t => {
      if (t.id === id) {
        const isCompleting = t.estado === 'en-progreso';
        if (isCompleting) {
            const now = new Date();
            return { 
                ...t, 
                estado: 'resuelta' as const,
                fechaResuelta: now.toISOString().split('T')[0],
                horaResuelta: now.toTimeString().split(' ')[0].substring(0, 5),
            };
        }
        const { fechaResuelta, horaResuelta, ...rest } = t;
        return { ...rest, estado: 'en-progreso' as const };
      }
      return t;
    }));
    setNotification({ message: `Estado de la ${itemType} actualizado.`, type: 'success' });
  };
  
  const handleStartEdit = (id: string) => {
    const task = currentTasks.find(t => t.id === id);
    if (task) {
      setTaskToEdit(task as Incidencia | Asignacion);
      setIsFormVisible(true);
      window.scrollTo(0, 0);
    }
  };
  
  const handleDuplicateTask = (id: string) => {
    const task = currentTasks.find(t => t.id === id);
    if (task) {
      logAction(`Registro '#${task.consecutivo} - ${task.nombre}' duplicado.`);
      const { id: oldId, consecutivo, estado, fechaResuelta, horaResuelta, isArchived, ...rest } = task as Asignacion;
      const today = new Date();
      const newTaskData = {
        ...rest,
        nombre: `${task.nombre} (Copia)`,
        fecha: today.toISOString().split('T')[0],
        hora: today.toTimeString().split(' ')[0].substring(0, 5),
      };
      setTaskToEdit(newTaskData);
      setIsFormVisible(true);
      window.scrollTo(0, 0);
      setNotification({ message: 'Registro clonado. Revisa y guarda.', type: 'success' });
    }
  };

  const handleArchiveTask = (id: string) => {
    if (page === 'incidencias') {
        const task = incidencias.find(t => t.id === id);
        if(task) logAction(`Incidencia '#${task.consecutivo} - ${task.nombre}' archivada.`);
        
        const updatedIncidencias = incidencias.map(t => t.id === id ? { ...t, isArchived: true } : t);
        setIncidencias(updatedIncidencias);
        handleBackupData(updatedIncidencias, asignaciones, true);
        setNotification({ message: 'Incidencia archivada.', type: 'success' });
    } else { // Asignaciones
        const task = asignaciones.find(t => t.id === id);
        if(task) logAction(`Asignación '#${task.consecutivo} - ${task.nombre}' archivada.`);
        
        const updatedAsignaciones = asignaciones.map(t => t.id === id ? { ...t, isArchived: true } : t);
        setAsignaciones(updatedAsignaciones);
        handleBackupData(incidencias, updatedAsignaciones, true);
        setNotification({ message: 'Asignación archivada.', type: 'success' });
    }
  };
  
  const handleUnarchiveTask = (id: string) => {
    if (page === 'incidencias') {
        const task = incidencias.find(t => t.id === id);
        if(task) logAction(`Incidencia '#${task.consecutivo} - ${task.nombre}' restaurada.`);

        const updatedIncidencias = incidencias.map(t => t.id === id ? { ...t, isArchived: false } : t);
        setIncidencias(updatedIncidencias);
        handleBackupData(updatedIncidencias, asignaciones, true);
        setNotification({ message: 'Incidencia restaurada.', type: 'success' });
    } else { // Asignaciones
        const task = asignaciones.find(t => t.id === id);
        if(task) logAction(`Asignación '#${task.consecutivo} - ${task.nombre}' restaurada.`);

        const updatedAsignaciones = asignaciones.map(t => t.id === id ? { ...t, isArchived: false } : t);
        setAsignaciones(updatedAsignaciones);
        handleBackupData(incidencias, updatedAsignaciones, true);
        setNotification({ message: 'Asignación restaurada.', type: 'success' });
    }
  };

  const handleTransferTask = (id: string) => {
    const asignacionToTransfer = asignaciones.find(t => t.id === id);
    if (!asignacionToTransfer) return;

    logAction(`Asignación '#${asignacionToTransfer.consecutivo} - ${asignacionToTransfer.nombre}' transferida a Incidencias.`);
    const consecutivoValues = incidencias.map(t => t.consecutivo).filter(c => typeof c === 'number' && isFinite(c));
    const maxConsecutivo = consecutivoValues.length > 0 ? Math.max(...consecutivoValues) : 0;
    const nextConsecutivo = maxConsecutivo + 1;

    const now = new Date();
    const newIncidencia: Incidencia = {
      id: uuidv4(),
      consecutivo: nextConsecutivo,
      nombre: `[Transferido] ${asignacionToTransfer.nombre}`,
      fecha: now.toISOString().split('T')[0],
      hora: now.toTimeString().split(' ')[0].substring(0, 5),
      clientes: asignacionToTransfer.clientes,
      personalInvolucrado: asignacionToTransfer.personalInvolucrado,
      deviceId: asignacionToTransfer.deviceId,
      estado: 'en-progreso',
      category: asignacionToTransfer.category,
      otherCategory: asignacionToTransfer.otherCategory,
      incidencia: asignacionToTransfer.requerimiento,
      solucion: '',
    };
    
    const updatedIncidencias = [...incidencias, newIncidencia];
    setIncidencias(updatedIncidencias);
    handleBackupData(updatedIncidencias, asignaciones, true);
    setNotification({ message: 'Asignación transferida a Incidencias.', type: 'success' });
    setPage('incidencias');
    setHighlightedTaskId(newIncidencia.id);
  };

  const handleStartEditResolution = (id: string) => {
    const task = currentTasks.find(t => t.id === id);
    if (task) setModalTask(task as Incidencia | Asignacion);
  };

  const handleSaveResolutionTime = (id: string, newDate: string, newTime: string) => {
    const task = [...incidencias, ...asignaciones].find(t => t.id === id);
    if(task) logAction(`Fecha de resolución del registro '#${task.consecutivo} - ${task.nombre}' actualizada.`);
    
    const setTaskList = page === 'incidencias' ? setIncidencias : setAsignaciones;
    setTaskList(prev => prev.map(t => {
      if (t.id === id) {
        return { ...t, fechaResuelta: newDate, horaResuelta: newTime };
      }
      return t;
    }));
    setModalTask(null);
    setNotification({ message: 'Fecha de resolución actualizada.', type: 'success' });
  };

    const handleGeneratePdf = (startDate: string, endDate: string) => {
    setIsPdfGenerating(true);
    logAction(`Generación de reporte PDF para ${page} (Rango: ${startDate} - ${endDate}) iniciada.`);
    
    setTimeout(() => {
      try {
        const allTasksForPage = page === 'incidencias' ? incidencias : asignaciones;
        const tasksToPrint = allTasksForPage.filter(task => task.fecha >= startDate && task.fecha <= endDate);
        const { jsPDF } = (window as any).jspdf;
        const doc = new jsPDF();
        
        const typeLabel = page === 'incidencias' ? 'Incidencias' : 'Asignaciones';
        const total = tasksToPrint.length;
        const inProgress = tasksToPrint.filter(t => t.estado === 'en-progreso').length;
        const completed = total - inProgress;

        doc.setFontSize(18);
        doc.text(`Reporte de ${typeLabel}`, 14, 22);
        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Periodo: ${startDate} a ${endDate}`, 14, 29);

        doc.setFontSize(14);
        doc.setTextColor(0);
        doc.text('Resumen', 14, 45);

        const summaryTableColumn = ["Estado", "Cantidad"];
        const summaryTableRows = [
            ["Total", total],
            ["En Progreso", inProgress],
            ["Resueltas", completed]
        ];
        (doc as any).autoTable({
            head: [summaryTableColumn],
            body: summaryTableRows,
            startY: 50,
            theme: 'striped',
            headStyles: { fillColor: [79, 70, 229] },
        });

        let finalY = (doc as any).autoTable.previous.finalY;
        doc.setFontSize(14);
        doc.setTextColor(0);
        doc.text('Detalles', 14, finalY + 15);

        const detailsTableColumn = ['#', 'Título', 'F. Creación', 'F. Resolución', 'SLA', 'Clientes', 'Detalle'];
        const detailsTableRows = tasksToPrint.map(task => {
          const creationDateTime = `${task.fecha} ${task.hora}`;
          const resolutionDateTime = task.estado === 'resuelta' && task.fechaResuelta
              ? `${task.fechaResuelta}${task.horaResuelta ? ' ' + task.horaResuelta : ''}`
              : '-';
          const sla = calculateSLA(task.fecha, task.hora, task.fechaResuelta, task.horaResuelta);
          const detailText = 'incidencia' in task ? `${(task as Incidencia).incidencia || ''}` : `${(task as Asignacion).requerimiento || ''}`;
          
          return [
            task.consecutivo,
            task.nombre,
            creationDateTime,
            resolutionDateTime,
            sla,
            task.clientes.join(', ') || '-',
            detailText
          ];
        });

        (doc as any).autoTable({
          head: [detailsTableColumn],
          body: detailsTableRows,
          startY: finalY + 20,
          theme: 'striped',
          headStyles: { fillColor: [79, 70, 229] },
          columnStyles: {
            0: { cellWidth: 8 },
            1: { cellWidth: 25 },
            2: { cellWidth: 22 },
            3: { cellWidth: 22 },
            4: { cellWidth: 15 },
            5: { cellWidth: 25 },
            6: { cellWidth: 'auto' }
          }
        });

        doc.save(`reporte_${typeLabel}_${new Date().toISOString().split('T')[0]}.pdf`);
      } catch (error) {
        console.error("Error generating PDF:", error);
        setNotification({ message: 'Error al generar el PDF.', type: 'error' });
      } finally {
        setIsPdfGenerating(false);
        setIsPdfFilterVisible(false);
      }
    }, 100);
  };
  
  const handleGenerateExcel = (startDate: string, endDate: string) => {
    setIsExcelGenerating(true);
    logAction(`Generación de reporte Excel para ${page} (Rango: ${startDate} - ${endDate}) iniciada.`);
    setTimeout(() => {
        try {
            const allTasksForPage = page === 'incidencias' ? incidencias : asignaciones;
            const tasksToExport = allTasksForPage.filter(task => task.fecha >= startDate && task.fecha <= endDate);
            const typeLabel = page === 'incidencias' ? 'Incidencias' : 'Asignaciones';

            const { utils, writeFile } = (window as any).XLSX;
            const wb = utils.book_new();

            const total = tasksToExport.length;
            const inProgress = tasksToExport.filter(t => t.estado === 'en-progreso').length;
            const completed = total - inProgress;
            const summaryData = [
                ["Reporte de", typeLabel],
                ["Periodo", `${startDate} a ${endDate}`],
                [],
                ["Estado", "Cantidad"],
                ["Total", total],
                ["En Progreso", inProgress],
                ["Resueltas", completed]
            ];
            const summaryWs = utils.aoa_to_sheet(summaryData);
            summaryWs['!cols'] = [{ wch: 15 }, { wch: 25 }];
            utils.book_append_sheet(wb, summaryWs, 'Resumen');
            
            const headers = ['#', 'Tipo', 'Título', 'F. Creación', 'H. Creación', 'Estado', 'F. Resolución', 'H. Resolución', 'SLA', 'Clientes', 'Detalle (Incidencia/Requerimiento)', 'Solución (si aplica)'];
            const dataRows = tasksToExport.map(task => {
                const isIncidencia = 'incidencia' in task;
                const sla = calculateSLA(task.fecha, task.hora, task.fechaResuelta, task.horaResuelta);
                return [
                    task.consecutivo,
                    isIncidencia ? 'Incidencia' : 'Asignación',
                    task.nombre,
                    task.fecha,
                    task.hora,
                    task.estado === 'resuelta' ? 'Resuelta' : 'En Progreso',
                    task.fechaResuelta || '-',
                    task.horaResuelta || '-',
                    sla,
                    task.clientes.join(', ') || '-',
                    isIncidencia ? (task as Incidencia).incidencia || '-' : (task as Asignacion).requerimiento || '-',
                    isIncidencia ? (task as Incidencia).solucion || '-' : '-'
                ];
            });

            const detailsData = [headers, ...dataRows];
            const detailsWs = utils.aoa_to_sheet(detailsData);
            
            detailsWs['!cols'] = headers.map((_, i) => ({
                wch: detailsData.reduce((w, r) => Math.max(w, String(r[i] || '').length + 2), 10)
            }));
            
            utils.book_append_sheet(wb, detailsWs, 'Detalles');

            writeFile(wb, `reporte_${typeLabel}_${new Date().toISOString().split('T')[0]}.xlsx`);

        } catch (error) {
            console.error("Error generating Excel:", error);
            setNotification({ message: 'Error al generar el archivo Excel.', type: 'error' });
        } finally {
            setIsExcelGenerating(false);
            setIsExcelFilterVisible(false);
        }
    }, 100);
  };

  const handleGenerateInvGateReport = () => {
    setNotification({ message: 'Generando reporte InvGate...', type: 'success' });
    logAction(`Generación de reporte InvGate para ${page} iniciada.`);
    setTimeout(() => {
        try {
            const allTasksForPage = page === 'incidencias' ? incidencias : asignaciones;
            const tasksToExport = allTasksForPage;
            const typeLabel = page === 'incidencias' ? 'Incidencias' : 'Asignaciones';
            if (tasksToExport.length === 0) {
                setNotification({ message: `No hay ${typeLabel.toLowerCase()} para exportar.`, type: 'error' });
                return;
            }

            const { utils, writeFile } = (window as any).XLSX;

            const headers = ['Device ID', 'Fecha y hora de resolución', 'Resumen de la falla', 'Descripción', 'Solución'];

            const dataRows = tasksToExport.map(task => {
                const resolutionDateTime = task.fechaResuelta && task.horaResuelta
                    ? `${task.fechaResuelta} ${task.horaResuelta}`
                    : '-';

                const description = 'incidencia' in task
                    ? (task as Incidencia).incidencia || '-'
                    : (task as Asignacion).requerimiento || '-';

                const solution = 'incidencia' in task
                    ? (task as Incidencia).solucion || '-'
                    : '-';

                return [
                    task.deviceId || '-',
                    resolutionDateTime,
                    task.nombre || '-',
                    description,
                    solution,
                ];
            });

            const ws = utils.aoa_to_sheet([headers, ...dataRows]);

            const headerStyle = {
                font: { color: { rgb: 'FFFFFF' }, bold: true },
                fill: { fgColor: { rgb: '000000' } },
                alignment: { horizontal: 'center', vertical: 'center' },
                border: {
                    top: { style: 'thin' },
                    bottom: { style: 'thin' },
                    left: { style: 'thin' },
                    right: { style: 'thin' },
                },
            };

            const cellStyle = {
                alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
                border: {
                    top: { style: 'thin' },
                    bottom: { style: 'thin' },
                    left: { style: 'thin' },
                    right: { style: 'thin' },
                },
            };
            
            const range = utils.decode_range(ws['!ref']);
            for (let R = range.s.r; R <= range.e.r; ++R) {
                for (let C = range.s.c; C <= range.e.c; ++C) {
                    const cell_address = { c: C, r: R };
                    const cell_ref = utils.encode_cell(cell_address);
                    if (!ws[cell_ref]) continue;
                    ws[cell_ref].s = R === 0 ? headerStyle : cellStyle;
                }
            }

            const columnWidths = headers.map((header, i) => {
                 const maxLength = Math.max(
                    header.length,
                    ...dataRows.map(row => String(row[i] || '').length)
                );
                // Set wider columns for description and solution
                if (i === 3 || i === 4) {
                    return { wch: Math.max(40, maxLength + 2) };
                }
                return { wch: Math.max(20, maxLength + 2) };
            });
            ws['!cols'] = columnWidths;
            ws['!rows'] = [{ hpt: 20 }]; // Set header row height

            const wb = utils.book_new();
            utils.book_append_sheet(wb, ws, 'Reporte InvGate');

            writeFile(wb, `reporte_invgate_${typeLabel}_${new Date().toISOString().split('T')[0]}.xlsx`);
            setNotification({ message: 'Reporte InvGate generado con éxito.', type: 'success' });
        } catch (error) {
            console.error("Error generating InvGate Excel report:", error);
            setNotification({ message: 'Error al generar el reporte InvGate.', type: 'error' });
        }
    }, 100);
  };

  const handleExportActivityLog = () => {
    const success = exportLogs();
    if (success) {
      logAction('Exportación de log de actividad.');
      setNotification({ message: 'Log de actividad exportado con éxito.', type: 'success' });
    } else {
      setNotification({ message: 'No hay actividad para exportar.', type: 'error' });
    }
  };

  const handleFileSelectedForImport = (file: File) => {
    setFileToImport(file);
    setIsImportConfirmVisible(true);
  };

  const handleImportData = () => {
    if (!fileToImport) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result;
        if (typeof text !== 'string') {
          throw new Error("File content is not a string.");
        }
        const data = JSON.parse(text);

        const importedIncidencias = data.incidencias || [];
        const importedAsignaciones = data.asignaciones || [];
        
        logAction(`Datos importados. ${importedIncidencias.length} incidencias y ${importedAsignaciones.length} asignaciones.`);

        const { newIncidencias, newAsignaciones } = runConsecutivoMigration(importedIncidencias, importedAsignaciones);

        setIncidencias(newIncidencias);
        setAsignaciones(newAsignaciones);
        
        setNotification({ message: 'Datos importados con éxito.', type: 'success' });
      } catch (error) {
        console.error('Error importing data:', error);
        setNotification({ message: 'El archivo de importación es inválido.', type: 'error' });
      }
    };
    reader.readAsText(fileToImport);
    setIsImportConfirmVisible(false);
    setFileToImport(null);
  };

  const handleStartCategorize = (id: string) => {
    const task = [...incidencias, ...asignaciones].find(t => t.id === id);
    if (task) setCategorizeTask(task);
  };

  const handleSaveCategory = (id: string, category: Category, otherCategory?: string) => {
    const isIncidencia = incidencias.some(t => t.id === id);
    const setList = isIncidencia ? setIncidencias : setAsignaciones;
    const task = [...incidencias, ...asignaciones].find(t => t.id === id);
    if(task) logAction(`Registro '#${task.consecutivo} - ${task.nombre}' categorizado como '${category === 'Otros' && otherCategory ? otherCategory : category}'.`);
    
    setList(prev => prev.map(t => {
      if (t.id === id) {
        const updatedTask = { ...t, category, otherCategory: undefined };
        if (category === 'Otros') {
          updatedTask.otherCategory = otherCategory;
        }
        return updatedTask;
      }
      return t;
    }));

    setCategorizeTask(null);
    setNotification({ message: 'Categoría actualizada.', type: 'success' });
  };

  const handleGenericChangeStatus = (id: string) => {
    const task = [...incidencias, ...asignaciones].find(t => t.id === id);
    if (!task) return;
    
    const newStatus = task.estado === 'en-progreso' ? 'resuelta' : 'en-progreso';
    logAction(`(Estadísticas) Estado del registro '#${task.consecutivo} - ${task.nombre}' cambiado a '${newStatus}'.`);

    const isIncidencia = 'incidencia' in task;
    const setTaskList = isIncidencia ? setIncidencias : setAsignaciones;

    setTaskList(prev => prev.map(t => {
      if (t.id === id) {
        const isCompleting = t.estado === 'en-progreso';
        if (isCompleting) {
            const now = new Date();
            return { 
                ...t, 
                estado: 'resuelta' as const,
                fechaResuelta: now.toISOString().split('T')[0],
                horaResuelta: now.toTimeString().split(' ')[0].substring(0, 5),
            };
        }
        const { fechaResuelta, horaResuelta, ...rest } = t;
        return { ...rest, estado: 'en-progreso' as const };
      }
      return t;
    }));
    setNotification({ message: `Estado actualizado.`, type: 'success' });
  };
  
  const handleGenericStartEdit = (id: string) => {
    const task = [...incidencias, ...asignaciones].find(t => t.id === id);
    if (!task) return;
    const pageToSet = 'incidencia' in task ? 'incidencias' : 'asignaciones';
    setPage(pageToSet);
    
    setTimeout(() => {
        setTaskToEdit(task as Incidencia | Asignacion);
        setIsFormVisible(true);
        window.scrollTo(0, 0);
    }, 0);
  };
  
  const handleGenericDuplicateTask = (id: string) => {
    const task = [...incidencias, ...asignaciones].find(t => t.id === id);
    if (!task) return;
    
    logAction(`(Estadísticas) Registro '#${task.consecutivo} - ${task.nombre}' duplicado.`);
    
    const pageToSet = 'incidencia' in task ? 'incidencias' : 'asignaciones';
    setPage(pageToSet);

    setTimeout(() => {
        const { id: oldId, consecutivo, estado, fechaResuelta, horaResuelta, ...rest } = task;
        const today = new Date();
        const newTaskData = {
          ...rest,
          nombre: `${task.nombre} (Copia)`,
          fecha: today.toISOString().split('T')[0],
          hora: today.toTimeString().split(' ')[0].substring(0, 5),
        };
        setTaskToEdit(newTaskData);
        setIsFormVisible(true);
        window.scrollTo(0, 0);
        setNotification({ message: 'Registro clonado. Revisa y guarda.', type: 'success' });
    }, 0);
  };
  
  const handleGenericStartEditResolution = (id: string) => {
      const task = [...incidencias, ...asignaciones].find(t => t.id === id);
      if (task) {
          const pageToSet = 'incidencia' in task ? 'incidencias' : 'asignaciones';
          setPage(pageToSet);
          setTimeout(() => setModalTask(task as Incidencia | Asignacion), 0);
      }
  };

  const handleLoginSuccess = () => {
    logAction('Inicio de sesión exitoso.');
    setIsAuthenticated(true);
  };

  const handleSetPage = (p: Page) => {
      handleExitSelectionMode();
      setPage(p);
  };

  const renderContent = () => {
    switch(page) {
      case 'incidencias':
      case 'asignaciones':
        const itemType = page === 'incidencias' ? 'incidencia' : 'asignacion';
        const isIncidenciasPage = page === 'incidencias';
        const currentView = isIncidenciasPage ? incidenciasView : asignacionesView;
        return (
          <>
            <div 
              onClick={handleHeaderTap}
              onDoubleClick={toggleFullScreen}
              className="flex flex-wrap justify-between items-center mb-8 gap-4 cursor-pointer"
              title="Doble clic para pantalla completa"
            >
                <h1 className="text-2xl md:text-3xl font-bold text-brand-dark dark:text-brand-light font-heading">
                    {page === 'incidencias' ? 'Registro de Incidencias' : 'Registro de Asignaciones'}
                </h1>
            </div>
            <TaskStats tasks={currentTasks} type={itemType} />
            <TaskList
              tasks={currentTasks}
              itemType={itemType}
              onChangeStatus={handleChangeStatus}
              onStartEdit={handleStartEdit}
              onStartEditResolution={handleStartEditResolution}
              onStartCategorize={handleStartCategorize}
              onDuplicateTask={handleDuplicateTask}
              onArchiveTask={handleArchiveTask}
              onUnarchiveTask={handleUnarchiveTask}
              onTransferTask={handleTransferTask}
              selectedTasks={selectedTasks}
              isSelectionMode={isSelectionMode}
              onEnterSelectionMode={handleEnterSelectionMode}
              onToggleSelection={handleToggleSelection}
              onToggleSelectAll={handleToggleSelectAll}
              asignacionesView={asignacionesView}
              setAsignacionesView={setAsignacionesView}
              incidenciasView={incidenciasView}
              setIncidenciasView={setIncidenciasView}
              highlightedTaskId={highlightedTaskId}
              setHighlightedTaskId={setHighlightedTaskId}
              incidenciasSort={incidenciasSort}
              setIncidenciasSort={setIncidenciasSort}
              incidenciasStatusFilter={incidenciasStatusFilter}
              setIncidenciasStatusFilter={setIncidenciasStatusFilter}
            />
             { (currentView === 'activas') && (
                  <button 
                    onClick={() => { setTaskToEdit(null); setIsFormVisible(true); window.scrollTo(0, 0); }}
                    className="fixed bottom-24 md:bottom-8 right-4 sm:right-6 lg:right-8 z-40 fab-neon-green text-gray-900 font-bold w-14 h-14 rounded-full shadow-lg transition-all duration-300 transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-opacity-75 flex items-center justify-center"
                    aria-label={`Añadir ${page === 'incidencias' ? 'Incidencia' : 'Asignación'}`}
                    title={`Añadir ${page === 'incidencias' ? 'Incidencia' : 'Asignación'}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
                  </button>
                )}
          </>
        );
      case 'estadisticas':
        return (
          <EstadisticasPage
            incidencias={incidencias}
            asignaciones={asignaciones}
            onChangeStatus={handleGenericChangeStatus}
            onStartEdit={handleGenericStartEdit}
            onStartEditResolution={handleGenericStartEditResolution}
            onStartCategorize={handleStartCategorize}
            onDuplicateTask={handleGenericDuplicateTask}
            onToggleFullScreen={toggleFullScreen}
          />
        );
      default:
        return null;
    }
  };

  if (!isAuthenticated) {
    return <LoginModal onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 min-h-screen font-sans">
      <Sidebar
        page={page}
        setPage={handleSetPage}
        onGeneratePdf={() => setIsPdfFilterVisible(true)}
        isPdfGenerating={isPdfGenerating}
        onGenerateExcel={() => setIsExcelFilterVisible(true)}
        isExcelGenerating={isExcelGenerating}
        onGenerateInvGateReport={handleGenerateInvGateReport}
        hasTasks={currentTasks.length > 0}
        hasAnyTasks={incidencias.length > 0 || asignaciones.length > 0}
        onBackupData={() => handleBackupData()}
        onFileSelectedForImport={handleFileSelectedForImport}
        onExportActivityLog={handleExportActivityLog}
        isSelectionMode={isSelectionMode}
        onDeleteSelected={handlePromptDelete}
        isFullscreen={isFullscreen}
        onToggleFullScreen={toggleFullScreen}
      />
      <main className="md:ml-64 pb-24 md:pb-0">
        <div className="p-4 sm:p-6 lg:p-8">
          {isFormVisible ? (
            <TaskForm
              formType={page === 'incidencias' ? 'incidencia' : 'asignacion'}
              onSave={handleSaveTask}
              onCancel={() => { setIsFormVisible(false); setTaskToEdit(null); }}
              taskToEdit={taskToEdit}
            />
          ) : (
            renderContent()
          )}
        </div>
      </main>

      <SelectionToolbar
        selectedCount={selectedTasks.length}
        onCancel={handleExitSelectionMode}
        onDelete={handlePromptDelete}
        onArchive={handleArchiveSelected}
        onRestore={handleRestoreSelected}
        currentView={page === 'incidencias' ? incidenciasView : asignacionesView}
        isVisible={isSelectionMode}
      />

      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
      {successAlertMessage && (
          <SuccessAlert 
              message={successAlertMessage}
              onClose={() => setSuccessAlertMessage(null)}
          />
      )}
      {modalTask && (
        <ResolutionTimeModal
          task={modalTask}
          onSave={handleSaveResolutionTime}
          onClose={() => setModalTask(null)}
        />
      )}
      {categorizeTask && (
        <CategoryModal 
          task={categorizeTask}
          onSave={handleSaveCategory}
          onClose={() => setCategorizeTask(null)}
        />
      )}
      {isPdfFilterVisible && (
        <DateFilterModal
          tasks={page === 'incidencias' ? incidencias : asignaciones}
          title={`Filtrar ${page === 'incidencias' ? 'Incidencias' : 'Asignaciones'} para PDF`}
          generateButtonText={isPdfGenerating ? 'Generando...' : 'Generar PDF'}
          onGenerate={handleGeneratePdf}
          onClose={() => setIsPdfFilterVisible(false)}
        />
      )}
      {isExcelFilterVisible && (
        <DateFilterModal
          tasks={page === 'incidencias' ? incidencias : asignaciones}
          title={`Filtrar ${page === 'incidencias' ? 'Incidencias' : 'Asignaciones'} para Excel`}
          generateButtonText={isExcelGenerating ? 'Generando...' : 'Generar Excel'}
          onGenerate={handleGenerateExcel}
          onClose={() => setIsExcelFilterVisible(false)}
        />
      )}
      {isImportConfirmVisible && (
        <ImportConfirmModal
          onConfirm={handleImportData}
          onClose={() => setIsImportConfirmVisible(false)}
        />
      )}
      {isDeleteConfirmVisible && (
        <ConfirmModal
          title="Confirmar Eliminación"
          message={`¿Estás seguro de que quieres eliminar ${selectedTasks.length} ${selectedTasks.length === 1 ? 'registro' : 'registros'}? Esta acción no se puede deshacer.`}
          confirmText="Sí, eliminar"
          onConfirm={handleConfirmDelete}
          onClose={() => setIsDeleteConfirmVisible(false)}
        />
      )}
    </div>
  );
};

// FIX: Add default export for App component.
export default App;
