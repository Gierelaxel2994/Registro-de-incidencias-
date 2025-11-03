import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Incidencia, Asignacion, Category } from '../types';
import { CATEGORIES } from './CategoryModal';

interface TaskFormProps {
  formType: 'incidencia' | 'asignacion';
  onSave: (task: Omit<Incidencia, 'id' | 'estado'> | Omit<Asignacion, 'id' | 'estado'>) => void;
  onCancel: () => void;
  taskToEdit: Partial<Incidencia> | Partial<Asignacion> | null;
}

const CLIENTES_OPTIONS = [
  'Terpel', 'Machetazo', 'El Fuerte', 'Stevens', 'Campeón',
  'Novey', 'Doit Center', 'Fantástic Casino', 'Titan',
  'Madison', 'Costo', 'Texaco'
];

const TaskForm: React.FC<TaskFormProps> = ({ formType, onSave, onCancel, taskToEdit }) => {
  const [nombre, setNombre] = useState('');
  const [incidencia, setIncidencia] = useState('');
  const [solucion, setSolucion] =useState('');
  const [requerimiento, setRequerimiento] = useState('');
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('');
  const [clientesSeleccionados, setClientesSeleccionados] = useState<string[]>([]);
  const [personalInvolucrado, setPersonalInvolucrado] = useState('');
  const [deviceId, setDeviceId] = useState('');
  const [category, setCategory] = useState<Category | undefined>();
  const [otherCategory, setOtherCategory] = useState('');
  const [error, setError] = useState<string | null>(null);

  const [inputValue, setInputValue] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const DRAFT_KEY = useMemo(() => `form_draft_${formType}`, [formType]);

  const resetForm = () => {
    setNombre('');
    setIncidencia('');
    setSolucion('');
    setRequerimiento('');
    setFecha('');
    setHora('');
    setClientesSeleccionados([]);
    setPersonalInvolucrado('');
    setDeviceId('');
    setCategory(undefined);
    setOtherCategory('');
    setError(null);
  };
  
  useEffect(() => {
    if (taskToEdit) {
      // Editing an existing task: populate from it and clear any unrelated draft.
      localStorage.removeItem(DRAFT_KEY);

      setNombre(taskToEdit.nombre || '');
      setFecha(taskToEdit.fecha || '');
      setHora(taskToEdit.hora || '');
      setClientesSeleccionados(taskToEdit.clientes || []);
      setPersonalInvolucrado(taskToEdit.personalInvolucrado || '');
      setDeviceId(taskToEdit.deviceId || '');
      setCategory(taskToEdit.category);
      setOtherCategory(taskToEdit.category === 'Otros' ? taskToEdit.otherCategory || '' : '');
      if (formType === 'incidencia') {
        const inc = taskToEdit as Partial<Incidencia>;
        setIncidencia(inc.incidencia || '');
        setSolucion(inc.solucion || '');
      } else {
        const asi = taskToEdit as Partial<Asignacion>;
        setRequerimiento(asi.requerimiento || '');
      }
    } else {
      // Creating a new task: try to load a draft.
      const savedDraft = localStorage.getItem(DRAFT_KEY);
      if (savedDraft) {
        try {
          const draft = JSON.parse(savedDraft);
          setNombre(draft.nombre || '');
          setIncidencia(draft.incidencia || '');
          setSolucion(draft.solucion || '');
          setRequerimiento(draft.requerimiento || '');
          setFecha(draft.fecha || '');
          setHora(draft.hora || '');
          setClientesSeleccionados(draft.clientesSeleccionados || []);
          setPersonalInvolucrado(draft.personalInvolucrado || '');
          setDeviceId(draft.deviceId || '');
          setCategory(draft.category);
          setOtherCategory(draft.otherCategory || '');
        } catch (e) {
          console.error("Failed to parse form draft from localStorage:", e);
          localStorage.removeItem(DRAFT_KEY);
          resetForm();
        }
      } else {
        // No draft exists, just reset to a clean state.
        resetForm();
      }
    }
  }, [taskToEdit, formType, DRAFT_KEY]);

  // Effect to save draft data to localStorage for new tasks
  useEffect(() => {
    if (taskToEdit) {
      return; // Don't save drafts while editing
    }
    const draftData = {
      nombre, incidencia, solucion, requerimiento, fecha, hora,
      clientesSeleccionados, personalInvolucrado, deviceId, category, otherCategory
    };
    
    const isDraftEmpty = Object.values(draftData).every(value => {
        if (Array.isArray(value)) return value.length === 0;
        return !value;
    });

    if (!isDraftEmpty) {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draftData));
    }
  }, [
      nombre, incidencia, solucion, requerimiento, fecha, hora, clientesSeleccionados,
      personalInvolucrado, deviceId, category, otherCategory, taskToEdit, DRAFT_KEY
  ]);


  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectCliente = (cliente: string) => {
    if (cliente && !clientesSeleccionados.includes(cliente)) {
      setClientesSeleccionados(prev => [...prev, cliente]);
    }
    setInputValue('');
    setIsDropdownOpen(false);
    inputRef.current?.focus();
  };

  const handleRemoveCliente = (clienteToRemove: string) => {
    setClientesSeleccionados(prev => prev.filter(c => c !== clienteToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim() !== '') {
      e.preventDefault();
      handleSelectCliente(inputValue.trim());
    }
  };

  const filteredOptions = useMemo(() =>
    CLIENTES_OPTIONS.filter(option =>
      !clientesSeleccionados.includes(option) &&
      option.toLowerCase().includes(inputValue.toLowerCase())
    ), [inputValue, clientesSeleccionados]);


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre || !fecha || !hora) {
      setError('Título, Fecha y Hora son obligatorios.');
      return;
    }
    setError(null);

    const commonData = {
      nombre,
      fecha,
      hora,
      clientes: clientesSeleccionados,
      personalInvolucrado,
      deviceId,
      category,
      otherCategory: category === 'Otros' ? otherCategory : undefined,
    };
    
    let taskData;
    if (formType === 'incidencia') {
      taskData = { ...commonData, incidencia, solucion };
    } else {
      taskData = { ...commonData, requerimiento };
    }
    
    // @ts-ignore
    onSave(taskData);
    // Clear draft after successful save
    localStorage.removeItem(DRAFT_KEY);
  };

  const handleCancel = () => {
    // Clear draft on cancel
    localStorage.removeItem(DRAFT_KEY);
    onCancel();
  };

  const isEditing = !!(taskToEdit && taskToEdit.id);
  const formTitle = isEditing 
    ? `Editar ${formType === 'incidencia' ? 'Incidencia' : 'Asignación'}`
    : `Añadir Nueva ${formType === 'incidencia' ? 'Incidencia' : 'Asignación'}`;

  return (
    <div className="my-8 no-print">
      <form onSubmit={handleSubmit} className="space-y-6 bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{formTitle}</h3>
        {error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded" role="alert"><p>{error}</p></div>}
        
        <div>
          <label htmlFor="task-nombre" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Título</label>
          <input id="task-nombre" type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Añade un título descriptivo"
            className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition"
          />
        </div>

        <div>
            <label htmlFor="clientes-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Clientes</label>
            <div ref={dropdownRef} className="relative">
                <div className="flex flex-wrap gap-2 items-center w-full min-h-[42px] px-3 py-1.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus-within:ring-2 focus-within:ring-brand-primary focus-within:border-transparent transition">
                    {clientesSeleccionados.map(cliente => (
                        <span key={cliente} className="flex items-center gap-2 bg-brand-primary/10 text-brand-dark dark:bg-indigo-900 dark:text-indigo-200 text-sm font-medium px-2 py-1 rounded-full">
                            {cliente}
                            <button type="button" onClick={() => handleRemoveCliente(cliente)} className="text-brand-dark dark:text-indigo-200 hover:bg-brand-primary/20 dark:hover:bg-white/20 rounded-full focus:outline-none" aria-label={`Remover ${cliente}`}>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </span>
                    ))}
                    <input id="clientes-input" ref={inputRef} type="text" value={inputValue} onChange={(e) => { setInputValue(e.target.value); if (!isDropdownOpen) setIsDropdownOpen(true); }} onFocus={() => setIsDropdownOpen(true)} onKeyDown={handleKeyDown} placeholder={clientesSeleccionados.length === 0 ? "Seleccione o añada un cliente..." : "Añadir otro..."}
                        className="flex-grow bg-transparent border-none focus:ring-0 outline-none p-1 text-gray-900 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400"
                    />
                </div>
                {isDropdownOpen && (
                    <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 rounded-md shadow-lg max-h-60 overflow-y-auto border border-gray-200 dark:border-gray-700">
                        <ul>
                            {filteredOptions.map(option => ( <li key={option} onClick={() => handleSelectCliente(option)} className="px-4 py-2 text-sm text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">{option}</li> ))}
                            {inputValue.trim() !== '' && !CLIENTES_OPTIONS.map(o => o.toLowerCase()).includes(inputValue.trim().toLowerCase()) && !clientesSeleccionados.includes(inputValue.trim()) && (
                                <li onClick={() => handleSelectCliente(inputValue.trim())} className="px-4 py-2 text-sm text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">Añadir <span className="font-bold">"{inputValue.trim()}"</span></li>
                            )}
                        </ul>
                    </div>
                )}
            </div>
        </div>

        <div>
            <label htmlFor="task-deviceid" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Device ID (Opcional)</label>
            <input id="task-deviceid" type="text" value={deviceId} onChange={(e) => setDeviceId(e.target.value)} placeholder="p. ej., EQ-12345, SN-67890"
              className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition"
            />
        </div>

        <div>
          <label htmlFor="task-category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Categoría (Opcional)</label>
          <select 
              id="task-category" 
              value={category || ''} 
              onChange={(e) => setCategory(e.target.value as Category)}
              className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition"
          >
              <option value="">-- Sin categoría --</option>
              {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
              ))}
          </select>
        </div>
        {category === 'Otros' && (
            <div>
                <label htmlFor="task-other-category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Especificar categoría "Otros"</label>
                <input 
                    id="task-other-category" 
                    type="text" 
                    value={otherCategory} 
                    onChange={(e) => setOtherCategory(e.target.value)} 
                    placeholder="Describe la categoría"
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition"
                />
            </div>
        )}
        
        {formType === 'incidencia' ? (
          <>
            <div>
              <label htmlFor="incidencia-detalle" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Incidencia (Opcional)</label>
              <textarea id="incidencia-detalle" value={incidencia} onChange={(e) => setIncidencia(e.target.value)} placeholder="Detallar la incidencia..."
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition" rows={3}
              />
            </div>
            <div>
              <label htmlFor="incidencia-solucion" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Solución (Opcional)</label>
              <textarea id="incidencia-solucion" value={solucion} onChange={(e) => setSolucion(e.target.value)} placeholder="Detallar la solución aplicada..."
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition" rows={3}
              />
            </div>
          </>
        ) : (
          <div>
            <label htmlFor="asignacion-requerimiento" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Requerimiento (Opcional)</label>
            <textarea id="asignacion-requerimiento" value={requerimiento} onChange={(e) => setRequerimiento(e.target.value)} placeholder="Detallar el requerimiento..."
              className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition" rows={4}
            />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="task-fecha" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{formType === 'asignacion' ? 'Fecha de Asignación' : 'Fecha'}</label>
            <input id="task-fecha" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)}
              className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition"
            />
          </div>
          <div>
            <label htmlFor="task-hora" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{formType === 'asignacion' ? 'Hora de Asignación' : 'Hora'}</label>
            <input id="task-hora" type="time" value={hora} onChange={(e) => setHora(e.target.value)}
              className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition"
            />
          </div>
        </div>

        <div>
            <label htmlFor="task-personal" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{formType === 'asignacion' ? 'Persona a Cargo (opcional)' : 'Personal Involucrado (opcional)'}</label>
            <input id="task-personal" type="text" value={personalInvolucrado} onChange={(e) => setPersonalInvolucrado(e.target.value)} placeholder="p. ej., Juan Pérez (Técnico)"
              className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition"
            />
        </div>

        <div className="flex justify-end gap-4">
          <button type="button" onClick={handleCancel} className="bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-gray-200 font-bold py-2 px-6 rounded-lg shadow-md transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50">
            Cancelar
          </button>
          <button type="submit" className="bg-brand-primary hover:bg-brand-secondary text-white font-bold py-2 px-6 rounded-lg shadow-md transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-opacity-50">
            {isEditing ? 'Actualizar' : 'Guardar'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TaskForm;