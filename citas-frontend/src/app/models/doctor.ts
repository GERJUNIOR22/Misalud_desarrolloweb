export interface Especialidad {
  idEspecialidad: number;
  nombre: string;
  descripcion: string | null;
  precio: number;
  activo: boolean;
}

export interface Doctor {
  colegiatura: string;
  nombres: string;
  apellidos: string;
  telefono: string | null;
  correo?: string;
  especialidad: Especialidad | null;
}

// Un espacio de la agenda del doctor (GET /api/citas/disponibilidad)
export interface Horario {
  hora: string; // HH:mm:ss
  horaFin: string;
  disponible: boolean;
}
