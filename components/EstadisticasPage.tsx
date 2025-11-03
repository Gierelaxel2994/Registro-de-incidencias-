import React, { useState, useMemo, useEffect } from 'react';
import { Incidencia, Asignacion } from '../types';
import { PrinterIcon, TableCellsIcon } from './icons';
// FIX: Module '"file:///components/TaskItem"' has no default export.
import { TaskItem } from './TaskItem';

interface EstadisticasPageProps {
  incidencias: Incidencia[];
  asignaciones: Asignacion[];
  onChangeStatus: (id: string) => void;
  onStartEdit: (id: string) => void;
  onStartEditResolution: (id: string) => void;
  onStartCategorize: (id: string) => void;
  onDuplicateTask: (id: string) => void;
  onToggleFullScreen: () => void;
}

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

const EstadisticasPage: React.FC<EstadisticasPageProps> = ({ 
    incidencias, 
    asignaciones,
    onChangeStatus,
    onStartEdit,
    onStartEditResolution,
    onStartCategorize,
    onDuplicateTask,
    onToggleFullScreen,
}) => {
    const [includedTypes, setIncludedTypes] = useState<('incidencias' | 'asignaciones')[]>(['incidencias']);
    
    const allTasks = useMemo(() => {
        const tasks: (Incidencia | Asignacion)[] = [];
        if (includedTypes.includes('incidencias')) {
            tasks.push(...incidencias);
        }
        if (includedTypes.includes('asignaciones')) {
            tasks.push(...asignaciones);
        }
        return tasks;
    }, [incidencias, asignaciones, includedTypes]);

    const { minDate, maxDate, allCategories } = useMemo(() => {
        if (allTasks.length === 0) {
            const today = new Date().toISOString().split('T')[0];
            return { minDate: today, maxDate: today, allCategories: [] };
        }
        const dates = allTasks.map(t => t.fecha);
        const min = dates.reduce((a, b) => a < b ? a : b, dates[0]);
        const max = dates.reduce((a, b) => a > b ? a : b, dates[0]);
        
        const categories = new Set<string>();
        allTasks.forEach(task => {
            if (task.category) {
                const key = (task.category === 'Otros' && task.otherCategory ? task.otherCategory : task.category);
                if (key) categories.add(key);
            }
        });

        return { minDate: min, maxDate: max, allCategories: Array.from(categories).sort() };
    }, [allTasks]);

    const [startDate, setStartDate] = useState(minDate);
    const [endDate, setEndDate] = useState(maxDate);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [isPdfGenerating, setIsPdfGenerating] = useState(false);
    const [isExcelGenerating, setIsExcelGenerating] = useState(false);
    
    useEffect(() => {
        setStartDate(minDate);
        setEndDate(maxDate);
    }, [minDate, maxDate]);

    const filteredTasks = useMemo(() => {
        return allTasks.filter(task => {
            const isWithinDate = task.fecha >= startDate && task.fecha <= endDate;
            if (!isWithinDate) return false;

            if (selectedCategory === 'all') return true;
            
            const taskCategory = (task.category === 'Otros' && task.otherCategory ? task.otherCategory : task.category) || null;
            return taskCategory === selectedCategory;
        }).sort((a, b) => b.consecutivo - a.consecutivo);
    }, [allTasks, startDate, endDate, selectedCategory]);

    const groupedTasks = useMemo(() => {
        return filteredTasks.reduce<Record<string, (Incidencia | Asignacion)[]>>((acc, task) => {
            const key = (task.category === 'Otros' && task.otherCategory ? task.otherCategory : task.category) || 'Sin Categoría';
            if (!acc[key]) {
                acc[key] = [];
            }
            acc[key].push(task);
            return acc;
        }, {});
    }, [filteredTasks]);

    const handleTypeToggle = (type: 'incidencias' | 'asignaciones') => {
        setIncludedTypes(prev => {
            const newTypes = prev.includes(type)
                ? prev.filter(t => t !== type)
                : [...prev, type];
            
            if (newTypes.length === 0) {
                setSelectedCategory('all');
            }
            return newTypes;
        });
    };

    const handleGeneratePdf = () => {
        setIsPdfGenerating(true);

        setTimeout(() => {
            try {
                const { jsPDF } = (window as any).jspdf;
                const doc = new jsPDF();
            
                doc.setFontSize(18);
                doc.text('Reporte de Estadísticas por Categoría', 14, 22);
                doc.setFontSize(11);
                doc.setTextColor(100);
                doc.text(`Periodo: ${startDate} a ${endDate}`, 14, 29);
                doc.text(`Categoría: ${selectedCategory === 'all' ? 'Todas' : selectedCategory}`, 14, 36);
            
                let finalY = 45;
            
                Object.keys(groupedTasks).sort().forEach(category => {
                    const tasks = groupedTasks[category];
                    if (tasks.length === 0) return;
            
                    if (finalY > 260) {
                        doc.addPage();
                        finalY = 20;
                    }
                    
                    doc.setFontSize(14);
                    doc.setTextColor(0);
                    doc.text(`${category} (${tasks.length})`, 14, finalY);
                    finalY += 8;
            
                    const detailsTableColumn = ['#', 'Título', 'F. Creación', 'F. Resolución', 'SLA', 'Clientes', 'Detalle'];
                    const detailsTableRows = tasks.map(task => {
                        const detailText = 'incidencia' in task 
                            ? `${(task as Incidencia).incidencia || ''}`
                            : `${(task as Asignacion).requerimiento || ''}`;
                        
                        const creationDateTime = `${task.fecha} ${task.hora}`;
                        
                        const resolutionDateTime = task.estado === 'resuelta' && task.fechaResuelta
                            ? `${task.fechaResuelta}${task.horaResuelta ? ' ' + task.horaResuelta : ''}`
                            : '-';
                        
                        const sla = calculateSLA(task.fecha, task.hora, task.fechaResuelta, task.horaResuelta);
                            
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
                        startY: finalY,
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
                        },
                        didDrawPage: (data: any) => {
                            finalY = data.cursor.y;
                        }
                    });
            
                    finalY = (doc as any).autoTable.previous.finalY + 15;
                });
            
                doc.save(`reporte_estadisticas_${new Date().toISOString().split('T')[0]}.pdf`);
            } catch (error) {
                console.error("Error generating PDF:", error);
                alert("Hubo un error al generar el PDF. Por favor, inténtelo de nuevo.");
            } finally {
                setIsPdfGenerating(false);
            }
        }, 100);
    };

    const handleGenerateExcel = () => {
        setIsExcelGenerating(true);
        try {
            const { utils, writeFile } = (window as any).XLSX;
            const wb = utils.book_new();

            Object.keys(groupedTasks).sort().forEach(category => {
                const tasks = groupedTasks[category];
                if (tasks.length === 0) return;

                const sheetName = category.replace(/[\\/*?:"<>|]/g, "").substring(0, 31);
                
                const headers = ['#', 'Tipo', 'Título', 'F. Creación', 'H. Creación', 'Estado', 'F. Resolución', 'H. Resolución', 'SLA', 'Clientes', 'Detalle (Incidencia/Requerimiento)', 'Solución (si aplica)'];

                const dataRows = tasks.map(task => {
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

                const sheetData = [headers, ...dataRows];
                const ws = utils.aoa_to_sheet(sheetData);

                ws['!cols'] = headers.map((_, i) => ({
                    wch: sheetData.reduce((w, r) => Math.max(w, String(r[i] || '').length + 2), 15)
                }));
                
                utils.book_append_sheet(wb, ws, sheetName);
            });

            writeFile(wb, `reporte_estadisticas_${new Date().toISOString().split('T')[0]}.xlsx`);
        } catch (error) {
            console.error("Error generating Excel:", error);
            alert("Hubo un error al generar el archivo Excel. Por favor, inténtelo de nuevo.");
        } finally {
            setIsExcelGenerating(false);
        }
    };

    const handleClearFilters = () => {
        setStartDate(minDate);
        setEndDate(maxDate);
        setSelectedCategory('all');
    };

  return (
    <div>
        <div 
            onDoubleClick={onToggleFullScreen} 
            className="flex flex-wrap justify-between items-center mb-8 gap-4 cursor-pointer"
            title="Doble clic para pantalla completa"
        >
            <h1 className="text-2xl md:text-3xl font-bold text-brand-dark dark:text-brand-light font-heading">Estadísticas por Categoría</h1>
        </div>
        
        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm mb-8 no-print">
            <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tipos de Registros a Incluir</label>
                <div className="flex flex-wrap gap-x-6 gap-y-2">
                    <label htmlFor="include-incidencias" className="flex items-center gap-2 cursor-pointer">
                        <input
                            id="include-incidencias"
                            type="checkbox"
                            checked={includedTypes.includes('incidencias')}
                            onChange={() => handleTypeToggle('incidencias')}
                            className="h-4 w-4 rounded border-gray-300 text-brand-primary focus:ring-brand-primary dark:bg-gray-900 dark:border-gray-600"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">Incidencias</span>
                    </label>
                    <label htmlFor="include-asignaciones" className="flex items-center gap-2 cursor-pointer">
                        <input
                            id="include-asignaciones"
                            type="checkbox"
                            checked={includedTypes.includes('asignaciones')}
                            onChange={() => handleTypeToggle('asignaciones')}
                            className="h-4 w-4 rounded border-gray-300 text-brand-primary focus:ring-brand-primary dark:bg-gray-900 dark:border-gray-600"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">Asignaciones</span>
                    </label>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                <div>
                    <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Desde</label>
                    <input id="start-date" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary sm:text-sm" />
                </div>
                <div>
                    <label htmlFor="end-date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Hasta</label>
                    <input id="end-date" type="date" value={endDate} min={startDate} onChange={e => setEndDate(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary sm:text-sm" />
                </div>
                <div className="lg:col-span-1">
                    <label htmlFor="category-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Categoría</label>
                    <select id="category-filter" value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary sm:text-sm">
                        <option value="all">Todas las categorías</option>
                        {allCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                </div>
                <div className="lg:col-span-2 flex flex-col sm:flex-row gap-2">
                    <button onClick={handleClearFilters} className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-gray-200 font-bold py-2 px-4 rounded-lg shadow-sm transition-colors text-sm">Limpiar</button>
                    <button onClick={handleGenerateExcel} disabled={filteredTasks.length === 0 || isExcelGenerating} className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm">
                        <TableCellsIcon className="h-5 w-5" />
                        <span>{isExcelGenerating ? 'Generando...' : 'Excel'}</span>
                    </button>
                    <button onClick={handleGeneratePdf} disabled={filteredTasks.length === 0 || isPdfGenerating} className="w-full flex items-center justify-center gap-2 bg-brand-primary hover:bg-brand-secondary text-white font-bold py-2 px-4 rounded-lg shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm">
                        <PrinterIcon className="h-5 w-5" />
                        <span>{isPdfGenerating ? 'Generando...' : 'PDF'}</span>
                    </button>
                </div>
            </div>
        </div>

        <div>
            {filteredTasks.length > 0 ? (
                <div className="space-y-8">
                    {Object.keys(groupedTasks).sort().map((category) => {
                        const tasks = groupedTasks[category];
                        return (
                            <div key={category}>
                                <h2 className="text-xl font-bold text-brand-dark dark:text-brand-light mb-4 pb-2 border-b-2 border-brand-primary/50">{category} ({tasks.length})</h2>
                                <div className="space-y-4">
                                    {tasks.map(task => {
                                        const itemType = 'incidencia' in task ? 'incidencia' : 'asignacion';
                                        return (
                                            <TaskItem
                                                key={task.id}
                                                item={task}
                                                itemType={itemType}
                                                onChangeStatus={onChangeStatus}
                                                onStartEdit={onStartEdit}
                                                onStartEditResolution={onStartEditResolution}
                                                onStartCategorize={onStartCategorize}
                                                onDuplicateTask={onDuplicateTask}
                                                isSelected={false}
                                                isSelectionMode={false}
                                                onEnterSelectionMode={() => {}}
                                                onToggleSelection={() => {}}
                                            />
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                 <div className="text-center py-12 px-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                    <svg className="mx-auto h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" /></svg>
                    <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">Sin datos para los filtros seleccionados</h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Prueba a cambiar el rango de fechas o la categoría.</p>
                </div>
            )}
        </div>
    </div>
  );
};

export default EstadisticasPage;