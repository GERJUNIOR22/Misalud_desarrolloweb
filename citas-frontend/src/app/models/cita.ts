// Forma de los datos que devuelve la API Spring Boot (GET /api/citas/mis-citas)
export type EstadoCita = 'PENDIENTE' | 'CONFIRMADA' | 'RECHAZADA' | 'CANCELADA' | 'COMPLETADA';

// Lo que se envia a POST /api/citas
// El PACIENTE no manda su DNI (sale del token); el ADMIN y el MEDICO si lo mandan
export interface CitaRequest {
  dniPaciente?: string;
  // Solo se usan si el DNI aun no tiene ficha (el backend la crea al reservar)
  nombresPaciente?: string;
  apellidosPaciente?: string;
  fechaNacimientoPaciente?: string | null; // AAAA-MM-DD
  colegiaturaDoctor: string;
  fecha: string; // AAAA-MM-DD
  hora: string; // HH:mm:ss
  motivo: string;
}

export interface Cita {
  codigo: string;
  doctor: {
    colegiatura: string;
    nombres: string;
    apellidos: string;
    especialidad: { nombre: string; precio: number };
  };
  paciente: {
    dni: string;
    nombres: string;
    apellidos: string;
  };
  fecha: string; // AAAA-MM-DD
  hora: string; // HH:mm:ss
  horaFin: string;
  duracionMinutos: number;
  motivo: string;
  estado: EstadoCita;
  observacion: string | null;
}

// Cambios de estado que puede hacer el MEDICO (o el ADMIN) segun el ciclo de la cita:
//   PENDIENTE -> CONFIRMADA o RECHAZADA        CONFIRMADA -> COMPLETADA
// (el backend vuelve a validar estas reglas)
export function accionesPosibles(estado: EstadoCita | undefined): EstadoCita[] {
  if (estado === 'PENDIENTE') return ['CONFIRMADA', 'RECHAZADA'];
  if (estado === 'CONFIRMADA') return ['COMPLETADA'];
  return [];
}

export const ETIQUETA_ACCION: Partial<Record<EstadoCita, string>> = {
  CONFIRMADA: 'Confirmar',
  RECHAZADA: 'Rechazar',
  COMPLETADA: 'Marcar como completada',
};

export const PARTICIPIO_ESTADO: Record<EstadoCita, string> = {
  PENDIENTE: 'quedo pendiente',
  CONFIRMADA: 'fue confirmada',
  RECHAZADA: 'fue rechazada',
  CANCELADA: 'fue cancelada',
  COMPLETADA: 'fue completada',
};
