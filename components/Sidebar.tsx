import React, { useState, useRef, useEffect } from 'react';
import { 
    ArrowDownTrayIcon, ArrowUpTrayIcon, TrashIcon, 
    ArrowsPointingOutIcon, ArrowsPointingInIcon, ClipboardDocumentListIcon, 
    ChartBarIcon, EllipsisHorizontalIcon, SunIcon, MoonIcon, TableCellsIcon, DocumentTextIcon
} from './icons';

interface SidebarProps {
  page: string;
  setPage: (page: string) => void;
  onGeneratePdf: () => void;
  isPdfGenerating: boolean;
  onGenerateExcel: () => void;
  isExcelGenerating: boolean;
  onGenerateInvGateReport: () => void;
  hasTasks: boolean;
  hasAnyTasks: boolean;
  onBackupData: () => void;
  onFileSelectedForImport: (file: File) => void;
  onExportActivityLog: () => void;
  isSelectionMode: boolean;
  onDeleteSelected: () => void;
  isFullscreen: boolean;
  onToggleFullScreen: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ page, setPage, onGeneratePdf, isPdfGenerating, onGenerateExcel, isExcelGenerating, onGenerateInvGateReport, hasTasks, hasAnyTasks, onBackupData, onFileSelectedForImport, onExportActivityLog, isSelectionMode, onDeleteSelected, isFullscreen, onToggleFullScreen }) => {
    const [isMobileActionsOpen, setIsMobileActionsOpen] = useState(false);
    const [isDesktopActionsOpen, setIsDesktopActionsOpen] = useState(false);
    const importInputRef = useRef<HTMLInputElement>(null);
    const mobileActionsRef = useRef<HTMLDivElement>(null);
    const desktopActionsRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (mobileActionsRef.current && !mobileActionsRef.current.contains(event.target as Node)) {
                setIsMobileActionsOpen(false);
            }
             if (desktopActionsRef.current && !desktopActionsRef.current.contains(event.target as Node)) {
                setIsDesktopActionsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleImportClick = () => importInputRef.current?.click();

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            onFileSelectedForImport(file);
            event.target.value = '';
        }
    };

    const NavLink: React.FC<{ pageName: string; label: string; icon: React.ReactNode }> = ({ pageName, label, icon }) => (
        <button
            onClick={() => setPage(pageName)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors relative ${
                page === pageName
                    ? 'active-nav-link-desktop'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
        >
            {icon}
            <span>{label}</span>
        </button>
    );

    const ActionButton: React.FC<{ onClick?: () => void, disabled?: boolean, title: string, children: React.ReactNode, className?: string, isDanger?: boolean }> = ({ onClick, disabled, title, children, className = '', isDanger = false }) => (
        <button
            onClick={onClick}
            disabled={disabled}
            title={title}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                isDanger
                ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
                : 'text-neon-green hover:bg-gray-200 dark:hover:bg-gray-700'
            } ${className}`}
        >
            {children}
        </button>
    );
    
    const MobileNavButton: React.FC<{ pageName: string; label: string; icon: React.ReactNode }> = ({ pageName, label, icon }) => (
        <button
            onClick={() => setPage(pageName)}
            className={`relative flex-1 flex flex-col items-center justify-center gap-1.5 h-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary rounded-t-lg ${
                page === pageName
                    ? 'text-white'
                    : 'text-gray-500 dark:text-gray-400 hover:text-brand-secondary dark:hover:text-brand-light'
            }`}
        >
            <div className={`absolute top-0 h-1 w-10 bg-neon-green rounded-b-full transition-transform duration-300 ease-out ${page === pageName ? 'scale-x-100' : 'scale-x-0'}`}></div>
            {React.cloneElement(icon as React.ReactElement, { className: 'h-7 w-7' })}
            <span className="text-xs font-medium tracking-wide">{label}</span>
        </button>
    );

    const actions = (
      <>
        {page === 'incidencias' || page === 'asignaciones' ? (
          <>
            <ActionButton
                onClick={onGeneratePdf}
                disabled={isPdfGenerating || !hasTasks}
                title={isPdfGenerating ? 'Generando PDF...' : 'Descargar reporte PDF'}
            >
                <ArrowDownTrayIcon className="h-5 w-5"/>
                <span>Descargar PDF</span>
            </ActionButton>
             <ActionButton
                onClick={onGenerateExcel}
                disabled={isExcelGenerating || !hasTasks}
                title={isExcelGenerating ? 'Generando Excel...' : 'Descargar reporte Excel'}
            >
                <TableCellsIcon className="h-5 w-5"/>
                <span>Descargar Excel</span>
            </ActionButton>
            <ActionButton
                onClick={onGenerateInvGateReport}
                disabled={!hasTasks}
                title="Exportar reporte para InvGate"
            >
                <TableCellsIcon className="h-5 w-5"/>
                <span>Reporte InvGate</span>
            </ActionButton>
            <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
            <ActionButton
                onClick={onBackupData}
                disabled={!hasAnyTasks}
                title="Extraer copia de seguridad (JSON)"
            >
                 <ArrowDownTrayIcon className="h-5 w-5"/>
                 <span>Extraer Backup</span>
            </ActionButton>
            <ActionButton onClick={handleImportClick} title="Importar datos (JSON)">
                <ArrowUpTrayIcon className="h-5 w-5"/>
                <span>Importar JSON</span>
            </ActionButton>
            <ActionButton
                onClick={onExportActivityLog}
                title="Descargar registro de todas las acciones realizadas"
            >
                <DocumentTextIcon className="h-5 w-5" />
                <span>Descargar Log</span>
            </ActionButton>
            <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
             <ActionButton
                onClick={onDeleteSelected}
                disabled={!isSelectionMode}
                title="Eliminar registros seleccionados"
                isDanger
            >
                <TrashIcon className="h-5 w-5"/>
                <span>Eliminar Selección</span>
            </ActionButton>
          </>
        ) : null}
      </>
    );

    return (
        <>
            {/* --- Desktop Sidebar --- */}
            <aside className="hidden md:flex flex-col w-64 h-screen fixed top-0 left-0 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 shadow-md p-4">
                <div className="mb-8 px-2">
                  <h1 className="text-2xl font-bold text-brand-dark dark:text-brand-light font-heading">Gestor</h1>
                </div>

                <nav className="flex flex-col gap-2">
                    <NavLink pageName="incidencias" label="Incidencias" icon={<ClipboardDocumentListIcon className="h-5 w-5"/>} />
                    <NavLink pageName="asignaciones" label="Asignaciones" icon={<ClipboardDocumentListIcon className="h-5 w-5"/>} />
                    <NavLink pageName="estadisticas" label="Estadísticas" icon={<ChartBarIcon className="h-5 w-5"/>} />
                </nav>

                <div className="mt-auto">
                    {(page === 'incidencias' || page === 'asignaciones') && (
                        <div ref={desktopActionsRef} className="border-t border-gray-200 dark:border-gray-700 pt-3 mb-3">
                           <ActionButton
                                onClick={() => setIsDesktopActionsOpen(prev => !prev)}
                                title="Mostrar/ocultar acciones"
                           >
                                <EllipsisHorizontalIcon className="h-5 w-5" />
                                <span>Acciones</span>
                           </ActionButton>
                            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isDesktopActionsOpen ? 'max-h-96' : 'max-h-0'}`}>
                               <div className="pl-4 mt-2 space-y-1 border-l-2 border-gray-200 dark:border-gray-600 ml-1 pt-1">
                                    {actions}
                               </div>
                            </div>
                        </div>
                    )}
                    <div className="flex flex-col gap-1 border-t border-gray-200 dark:border-gray-700 pt-3">
                         <ActionButton onClick={onToggleFullScreen} title={isFullscreen ? 'Salir de pantalla completa' : 'Maximizar'}>
                            {isFullscreen ? <ArrowsPointingInIcon className="h-5 w-5"/> : <ArrowsPointingOutIcon className="h-5 w-5"/>}
                            <span>{isFullscreen ? 'Minimizar' : 'Maximizar'}</span>
                        </ActionButton>
                    </div>
                </div>
            </aside>

            {/* --- Mobile Bottom Nav --- */}
            <nav className="md:hidden fixed bottom-0 left-0 w-full bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 shadow-[0_-2px_10px_rgba(0,0,0,0.1)] flex justify-around items-center h-20 z-50 no-print">
                <MobileNavButton pageName="incidencias" label="Incidencias" icon={<ClipboardDocumentListIcon />} />
                <MobileNavButton pageName="asignaciones" label="Asignaciones" icon={<ClipboardDocumentListIcon />} />
                <MobileNavButton pageName="estadisticas" label="Estadísticas" icon={<ChartBarIcon />} />
                <div ref={mobileActionsRef} className="relative flex-1 flex flex-col items-center justify-center h-full">
                    <button 
                        onClick={() => setIsMobileActionsOpen(!isMobileActionsOpen)}
                        className={`relative w-full flex-1 flex flex-col items-center justify-center gap-1.5 h-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary rounded-t-lg ${
                            isMobileActionsOpen
                                ? 'text-white'
                                : 'text-gray-500 dark:text-gray-400 hover:text-brand-secondary dark:hover:text-brand-light'
                        }`}
                    >
                        <div className={`absolute top-0 h-1 w-10 bg-neon-green rounded-b-full transition-transform duration-300 ease-out ${isMobileActionsOpen ? 'scale-x-100' : 'scale-x-0'}`}></div>
                        <EllipsisHorizontalIcon className="h-7 w-7"/>
                        <span className="text-xs font-medium tracking-wide">Más</span>
                    </button>
                    {isMobileActionsOpen && (
                        <div className="absolute bottom-full right-0 mb-3 w-56 rounded-lg shadow-xl bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 p-2 space-y-1">
                           {actions}
                           <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                            <ActionButton onClick={onToggleFullScreen} title={isFullscreen ? 'Salir de pantalla completa' : 'Maximizar'}>
                                {isFullscreen ? <ArrowsPointingInIcon className="h-5 w-5"/> : <ArrowsPointingOutIcon className="h-5 w-5"/>}
                                <span>{isFullscreen ? 'Minimizar' : 'Maximizar'}</span>
                            </ActionButton>
                        </div>
                    )}
                </div>
            </nav>
            
            <input type="file" ref={importInputRef} onChange={handleFileChange} className="hidden" accept="application/json" />
        </>
    );
};

export default Sidebar;