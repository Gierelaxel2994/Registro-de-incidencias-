// FIX: Removed self-import of Incidencia and Asignacion which are defined in this file.
export type Page = 'incidencias' | 'asignaciones' | 'estadisticas';

export type Category = 'Falla Operador' | 'Falla Operacion Forza' | 'Suciedad' | 'Bolsa con fallas' | 'Otros';

export interface BaseTask {
  id: string;
  consecutivo: number;
  nombre: string;
  fecha: string;
  hora: string;
  clientes: string[];
  personalInvolucrado: string;
  deviceId: string;
  estado: 'en-progreso' | 'resuelta';
  fechaResuelta?: string;
  horaResuelta?: string;
  category?: Category;
  otherCategory?: string;
  isArchived?: boolean;
}

export interface Incidencia extends BaseTask {
  incidencia: string;
  solucion: string;
}

export interface Asignacion extends BaseTask {
  requerimiento: string;
}
