import React, { useState, useRef, useEffect } from 'react';
import { Incidencia, Asignacion } from '../types';
import { CalendarIcon, ClockIcon, UsersIcon, CheckCircleIcon, ArrowUturnLeftIcon, EnvelopeIcon, DocumentTextIcon, WrenchScrewdriverIcon, PencilIcon, EllipsisVerticalIcon, WhatsAppIcon, ClipboardDocumentListIcon, CalendarDaysIcon, TagIcon, DocumentDuplicateIcon, CheckBadgeIcon, KeyIcon, ArchiveBoxIcon, ArrowRightCircleIcon } from './icons';

declare global {
    interface Window {
        html2canvas: any;
    }
}

interface TaskItemProps {
  item: Incidencia | Asignacion;
  itemType: 'incidencia' | 'asignacion';
  onChangeStatus?: (id: string) => void;
  onStartEdit?: (id: string) => void;
  onStartEditResolution?: (id: string) => void;
  onStartCategorize?: (id: string) => void;
  onDuplicateTask?: (id: string) => void;
  onArchiveTask?: (id: string) => void;
  onUnarchiveTask?: (id: string) => void;
  onTransferTask?: (id: string) => void;
  isSelected: boolean;
  isSelectionMode: boolean;
  onEnterSelectionMode: (id: string) => void;
  onToggleSelection: (id: string) => void;
  itemView?: 'activas' | 'archivadas';
  highlightedTaskId?: string | null;
  setHighlightedTaskId?: (id: string | null) => void;
}

export const TaskItem: React.FC<TaskItemProps> = ({ 
    item, itemType, onChangeStatus, onStartEdit, onStartEditResolution, onStartCategorize, onDuplicateTask,
    onArchiveTask, onUnarchiveTask, onTransferTask, isSelected, isSelectionMode, onEnterSelectionMode, onToggleSelection, 
    itemView, highlightedTaskId, setHighlightedTaskId
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const doubleClickGuard = useRef(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setIsMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const currentCardRef = cardRef.current;
    if (highlightedTaskId === item.id && currentCardRef && setHighlightedTaskId) {
        currentCardRef.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        const animationEndHandler = () => {
            currentCardRef?.classList.remove('animate-flash-bounce');
            setHighlightedTaskId(null);
        };

        currentCardRef.classList.add('animate-flash-bounce');
        currentCardRef.addEventListener('animationend', animationEndHandler, { once: true });
        
        return () => {
          currentCardRef?.removeEventListener('animationend', animationEndHandler);
        }
    }
  }, [highlightedTaskId, item.id, setHighlightedTaskId]);


  const handleDoubleClick = () => {
    if (!isSelectionMode && onEnterSelectionMode) {
      doubleClickGuard.current = true;
      onEnterSelectionMode(item.id);
      setTimeout(() => {
        doubleClickGuard.current = false;
      }, 300); // Previene que el evento de clic único deseleccione el elemento
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;

    if (doubleClickGuard.current) {
        return; // Ignora el clic único que sigue a un doble clic
    }

    if (isSelectionMode) {
        onToggleSelection(item.id);
    }
  };
  
  const formattedDate = new Date(item.fecha + 'T00:00:00').toLocaleDateString();
  const formattedTime = new Date('1970-01-01T' + item.hora).toLocaleTimeString(undefined, {
    hour: '2-digit', minute: '2-digit', hour12: true,
  });

  const isCompleted = item.estado === 'resuelta';
  const typeLabel = itemType === 'incidencia' ? 'Incidencia' : 'Asignación';
  const categoryDisplay = item.category ? (item.category === 'Otros' && item.otherCategory ? item.otherCategory : item.category) : null;

  const statusBadge = (
    <span className={`text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full ${isCompleted ? 'text-green-800 bg-green-100 dark:text-green-300 dark:bg-green-800' : 'bg-neon-yellow text-gray-900'}`}>
      {isCompleted ? 'Resuelta' : 'En Progreso'}
    </span>
  );

  const createReportBody = (format: 'email' | 'whatsapp') => {
    const isEmail = format === 'email';
    const nl = isEmail ? '\n' : '\n';
    const boldStart = isEmail ? '' : '*';
    const boldEnd = isEmail ? '' : '*';
    const sectionBreak = isEmail ? '=====================' : '---------------------';
    const bullet = '•';

    const bodyParts = [];
    bodyParts.push(`${boldStart}INFORME DE ${typeLabel.toUpperCase()} #${item.consecutivo}${boldEnd}`);
    if (isEmail) bodyParts.push(sectionBreak);

    if (isEmail) {
        bodyParts.push(nl + 'DETALLES GENERALES');
        bodyParts.push('------------------');
    }
    bodyParts.push(`${bullet} ${boldStart}Título:${boldEnd} ${item.nombre}`);
    if (item.deviceId) bodyParts.push(`${bullet} ${boldStart}Device ID:${boldEnd} ${item.deviceId}`);
    bodyParts.push(`${bullet} ${boldStart}Estado:${boldEnd} ${isCompleted ? 'Resuelta' : 'En Progreso'}`);
    if (categoryDisplay) bodyParts.push(`${bullet} ${boldStart}Categoría:${boldEnd} ${categoryDisplay}`);

    const dateLabel = itemType === 'asignacion' ? 'Fecha y Hora de Asignación' : 'Fecha y Hora';
    bodyParts.push(`${bullet} ${boldStart}${dateLabel}:${boldEnd} ${new Date(item.fecha + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'})}, ${formattedTime}`);

    if (item.clientes.length > 0) {
        bodyParts.push(nl + `${boldStart}CLIENTES${boldEnd}`);
        if(isEmail) bodyParts.push('-----------');
        item.clientes.forEach(cliente => bodyParts.push(`${bullet} ${cliente}`));
    }

    if (itemType === 'incidencia') {
        const inc = item as Incidencia;
        bodyParts.push(nl + `${boldStart}DESCRIPCIÓN DEL CASO${boldEnd}`);
        if(isEmail) bodyParts.push('--------------------');
        bodyParts.push(`${boldStart}Incidencia:${boldEnd}`);
        bodyParts.push(inc.incidencia || 'No proporcionada.');
        if (inc.solucion) {
            bodyParts.push(nl + `${boldStart}Solución Aplicada:${boldEnd}`);
            bodyParts.push(inc.solucion);
        }
    } else {
        const asi = item as Asignacion;
        bodyParts.push(nl + `${boldStart}REQUERIMIENTO${boldEnd}`);
        if(isEmail) bodyParts.push('----------------');
        bodyParts.push(asi.requerimiento || 'No proporcionado.');
    }

    if (item.personalInvolucrado) {
        const personnelLabel = itemType === 'asignacion' ? 'PERSONA A CARGO' : 'PERSONAL INVOLUCRADO';
        bodyParts.push(nl + `${boldStart}${personnelLabel}${boldEnd}`);
        if(isEmail) bodyParts.push('----------------');
        bodyParts.push(item.personalInvolucrado);
    }

    if (isCompleted && item.fechaResuelta && item.horaResuelta) {
        const resolutionDateTime = new Date(`${item.fechaResuelta}T${item.horaResuelta}`);
        const resolutionDate = resolutionDateTime.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'});
        const resolutionTime = resolutionDateTime.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: true });
        bodyParts.push(nl + `${boldStart}FECHA DE RESOLUCIÓN${boldEnd}`);
        if(isEmail) bodyParts.push('-------------------');
        bodyParts.push(`${resolutionDate}, ${resolutionTime}`);
    }

    return bodyParts.join(nl);
  };

  const handleShare = async (format: 'email' | 'whatsapp') => {
    const subject = `Informe de ${typeLabel}: ${item.nombre}`;
  
    if (format === 'email') {
      const body = createReportBody('email');
      window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      return;
    }

    // --- WhatsApp Sharing ---
    const shareAsText = () => {
        const body = createReportBody('whatsapp');
        if (navigator.share) {
            navigator.share({ title: subject, text: body }).catch((error) => {
                if (error.name !== 'AbortError') {
                    console.error("Error sharing text with navigator.share:", error);
                    window.open(`https://wa.me/?text=${encodeURIComponent(body)}`, '_blank');
                }
            });
        } else {
            window.open(`https://wa.me/?text=${encodeURIComponent(body)}`, '_blank');
        }
    };
    
    if (!navigator.share || !navigator.canShare || !cardRef.current || !window.html2canvas) {
        shareAsText();
        return;
    }

    try {
        const originalClasses = cardRef.current.className;
        cardRef.current.className = `relative bg-white dark:bg-gray-800 rounded-lg shadow-md neon-border-green w-[${cardRef.current.offsetWidth}px]`;

        const canvas = await window.html2canvas(cardRef.current, {
            scale: 3,
            useCORS: true,
            backgroundColor: document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff'
        });

        if (cardRef.current) {
            cardRef.current.className = originalClasses;
        }

        const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
        
        if (!blob) {
            throw new Error('Canvas to Blob conversion failed');
        }

        const fileName = `${typeLabel}_${item.consecutivo}_${item.nombre.replace(/ /g, '_')}.png`;
        const file = new File([blob], fileName, { type: 'image/png' });
        
        if (navigator.canShare({ files: [file] })) {
            await navigator.share({
                files: [file],
                title: subject,
                text: `Informe: ${item.nombre}`,
            });
        } else {
            shareAsText();
        }
    } catch (error) {
        console.error("Error generating or sharing image:", error);
        if (error instanceof Error && error.name !== 'AbortError') {
            shareAsText();
        }
    }
  };

  const handleGenerateImage = () => {
    if (cardRef.current) {
        const originalClasses = cardRef.current.className;
        cardRef.current.className = `relative bg-white dark:bg-gray-800 rounded-lg shadow-md neon-border-green w-[${cardRef.current.offsetWidth}px]`;
        
        window.html2canvas(cardRef.current, {
            scale: 3,
            useCORS: true,
            backgroundColor: document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff'
        }).then((canvas: any) => {
            const link = document.createElement('a');
            link.download = `${typeLabel}_${item.consecutivo}_${item.nombre.replace(/ /g, '_')}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
            
            if (cardRef.current) {
                cardRef.current.className = originalClasses;
            }
        });
    }
  };

  const DetailItem = ({ icon, label, value, colSpan = false }: { icon: React.ReactNode, label:string, value:string, colSpan?:boolean }) => (
    <div className={`flex items-start gap-2 text-sm ${colSpan ? 'sm:col-span-2' : ''}`}>
        <div className="flex-shrink-0 text-gray-400 dark:text-gray-500 mt-0.5">{React.cloneElement(icon as React.ReactElement, { className: 'h-4 w-4' })}</div>
        <div>
            <span className="font-semibold text-gray-700 dark:text-gray-300">{label}: </span>
            <span className="text-gray-600 dark:text-gray-400">{value}</span>
        </div>
    </div>
  );

  const MenuItem = ({ icon, text, onClick }: { icon: React.ReactNode, text: string, onClick: () => void }) => (
    <a href="#" onClick={(e) => { e.preventDefault(); onClick(); }} className="text-neon-green hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-3 px-4 py-2 text-sm" role="menuitem">
        {React.cloneElement(icon as React.ReactElement, { className: 'h-5 w-5' })}
        <span>{text}</span>
    </a>
  );

  return (
    <div
      ref={cardRef}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      className={`relative bg-white dark:bg-gray-800 rounded-lg shadow-md transition-all duration-200 neon-border-green ${
        isSelected
            ? 'ring-2 ring-brand-primary/50'
            : ''
      } ${isSelectionMode ? 'cursor-pointer' : ''}`}
    >
      {isSelectionMode && (
        <div className="absolute top-3 left-3 z-10">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggleSelection(item.id)}
            className="h-5 w-5 rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      <div className={`p-4 ${isSelectionMode ? 'pl-10' : ''}`}>
        <header className="flex justify-between items-start gap-4 pr-10">
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-sm font-bold text-brand-secondary dark:text-brand-light bg-brand-light dark:bg-gray-700 px-2.5 py-1 rounded-full">
                #{item.consecutivo}
              </span>
              <h3 className="text-lg font-bold text-gray-800 dark:text-white leading-tight">
                {item.nombre}
              </h3>
            </div>
            {categoryDisplay && (
                <div className="mt-2">
                    <span className="text-xs font-semibold inline-flex items-center gap-1.5 py-1 px-2.5 rounded-full text-gray-600 bg-gray-100 dark:text-gray-300 dark:bg-gray-700">
                        <TagIcon className="h-3.5 w-3.5" />
                        {categoryDisplay}
                    </span>
                </div>
            )}
          </div>
          <div className="flex flex-col items-end gap-2">
            {statusBadge}
            {isCompleted && item.fechaResuelta && item.horaResuelta && (
                <span className="text-xs text-green-600 dark:text-green-400 font-medium inline-flex items-center gap-1.5">
                    <CheckBadgeIcon className="h-4 w-4" />
                    {new Date(`${item.fechaResuelta}T${item.horaResuelta}`).toLocaleString(undefined, {
                        year: 'numeric', month: 'short', day: 'numeric',
                        hour: 'numeric', minute: '2-digit', hour12: true
                    })}
                </span>
            )}
          </div>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <DetailItem icon={<CalendarIcon />} label={itemType === 'asignacion' ? 'F. Asignación' : 'F. Incidencia'} value={formattedDate} />
          <DetailItem icon={<ClockIcon />} label={itemType === 'asignacion' ? 'H. Asignación' : 'H. Incidencia'} value={formattedTime} />
          {item.clientes.length > 0 && (
            <DetailItem icon={<UsersIcon />} label="Cliente(s)" value={item.clientes.join(', ')} colSpan />
          )}
          {item.deviceId && (
            <DetailItem icon={<KeyIcon />} label="Device ID" value={item.deviceId} colSpan />
          )}
          {item.personalInvolucrado && (
            <DetailItem icon={<WrenchScrewdriverIcon />} label={itemType === 'asignacion' ? 'A Cargo de' : 'Personal'} value={item.personalInvolucrado} colSpan />
          )}
        </div>

        <div className="mt-4 space-y-2">
            {itemType === 'incidencia' ? (
                <>
                    <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap break-words">
                        <strong>Incidencia:</strong> { (item as Incidencia).incidencia || <span className="text-gray-400 italic">No especificada</span> }
                    </p>
                    {(item as Incidencia).solucion && (
                         <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 whitespace-pre-wrap break-words">
                            <strong>Solución:</strong> { (item as Incidencia).solucion }
                        </p>
                    )}
                </>
            ) : (
                <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap break-words">
                    <strong>Requerimiento:</strong> { (item as Asignacion).requerimiento || <span className="text-gray-400 italic">No especificado</span> }
                </p>
            )}
        </div>
      </div>
      
      {!isSelectionMode && onChangeStatus && onStartEdit && onDuplicateTask && onStartCategorize && onStartEditResolution && (
         <div className="absolute top-3 right-3">
            <div ref={menuRef} className="relative">
                <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-800 focus:ring-brand-primary">
                    <EllipsisVerticalIcon className="h-5 w-5" />
                </button>
                {isMenuOpen && (
                    <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white dark:bg-gray-900 ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                        <div className="py-1" role="menu" aria-orientation="vertical">
                          <MenuItem icon={<PencilIcon />} text="Editar" onClick={() => { setIsMenuOpen(false); onStartEdit(item.id); }} />
                          <MenuItem icon={<DocumentDuplicateIcon />} text="Duplicar" onClick={() => { setIsMenuOpen(false); onDuplicateTask(item.id); }} />
                           {itemType === 'asignacion' && onTransferTask && (
                                <MenuItem icon={<ArrowRightCircleIcon />} text="Transferir a Incidencias" onClick={() => { setIsMenuOpen(false); onTransferTask(item.id); }} />
                           )}
                          <MenuItem icon={<TagIcon />} text="Categorizar" onClick={() => { setIsMenuOpen(false); onStartCategorize(item.id); }} />
                          <div className="border-t border-gray-100 dark:border-gray-700 my-1" />
                          {isCompleted ? (
                              <>
                                <MenuItem icon={<ArrowUturnLeftIcon />} text="Marcar En Progreso" onClick={() => { setIsMenuOpen(false); onChangeStatus(item.id); }} />
                                <MenuItem icon={<CalendarDaysIcon />} text="Editar T. Resolución" onClick={() => { setIsMenuOpen(false); onStartEditResolution(item.id); }} />
                              </>
                          ) : (
                              <MenuItem icon={<CheckCircleIcon />} text="Marcar como Resuelta" onClick={() => { setIsMenuOpen(false); onChangeStatus(item.id); }} />
                          )}
                          {(itemType === 'incidencia' || itemType === 'asignacion') && onArchiveTask && onUnarchiveTask && (
                            <>
                              <div className="border-t border-gray-100 dark:border-gray-700 my-1" />
                              {itemView === 'archivadas' ? (
                                <MenuItem icon={<ArrowUturnLeftIcon />} text="Restaurar" onClick={() => { setIsMenuOpen(false); onUnarchiveTask(item.id); }} />
                              ) : (
                                <MenuItem icon={<ArchiveBoxIcon />} text="Archivar" onClick={() => { setIsMenuOpen(false); onArchiveTask(item.id); }} />
                              )}
                            </>
                          )}
                          <div className="border-t border-gray-100 dark:border-gray-700 my-1" />
                          <MenuItem icon={<EnvelopeIcon />} text="Enviar por Email" onClick={() => { setIsMenuOpen(false); handleShare('email'); }} />
                          <MenuItem icon={<WhatsAppIcon />} text="Enviar por WhatsApp" onClick={() => { setIsMenuOpen(false); setTimeout(() => handleShare('whatsapp'), 100); }} />
                          <MenuItem icon={<DocumentTextIcon />} text="Generar Imagen" onClick={() => { setIsMenuOpen(false); setTimeout(() => handleGenerateImage(), 100); }} />
                        </div>
                    </div>
                )}
            </div>
         </div>
      )}
    </div>
  );
};
