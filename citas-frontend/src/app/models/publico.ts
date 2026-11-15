import { MetodoPago } from './pago';

// Datos de la reserva EN LINEA (pacientes sin cuenta). Vienen de /api/publico/**

export interface EspecialidadPublica {
  idEspecialidad: number;
  nombre: string;
  descripcion: string | null;
  precio: number;
}

export interface DoctorPublico {
  colegiatura: string;
  nombres: string;
  apellidos: string;
  idEspecialidad: number;
  especialidad: string;
}

// POST /api/publico/reservas  (el monto NO se manda: lo calcula el servidor)
export interface ReservaPublicaRequest {
  dni: string;
  nombres: string;
  apellidos: string;
  telefono: string;
  colegiaturaDoctor: string;
  fecha: string; // AAAA-MM-DD
  hora: string; // HH:mm:ss
  motivo: string;
  metodo: MetodoPago;
}

// Respuesta de la reserva y de la consulta por codigo + DNI (no trae datos de salud)
export interface ReservaPublicaResponse {
  codigoCita: string;
  estadoCita: string;
  fecha: string;
  hora: string;
  horaFin: string;
  doctor: string;
  especialidad: string | null;
  paciente: string;
  dniPaciente: string;
  monto: number | null;
  metodoPago: string | null;
  estadoPago: string | null;
  numeroOperacion: string | null;
}

// Lo que viaja en el "state" de la navegacion hacia /mi-cita (asi el DNI no queda en la URL)
export interface ConsultaEstado {
  codigo?: string;
  dni?: string;
  nueva?: boolean;
}
