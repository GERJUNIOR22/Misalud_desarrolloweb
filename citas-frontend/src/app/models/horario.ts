export type DiaSemana = 'LUNES' | 'MARTES' | 'MIERCOLES' | 'JUEVES' | 'VIERNES' | 'SABADO' | 'DOMINGO';

export const DIAS_SEMANA: DiaSemana[] = [
  'LUNES',
  'MARTES',
  'MIERCOLES',
  'JUEVES',
  'VIERNES',
  'SABADO',
  'DOMINGO',
];

// Lo que devuelve GET /api/horarios/mis-horarios y GET /api/horarios
export interface HorarioMedico {
  idHorario: number;
  colegiaturaDoctor: string;
  nombreDoctor: string;
  diaSemana: DiaSemana;
  horaInicio: string; // HH:mm:ss
  horaFin: string;
  activo: boolean;
}

// Lo que se envia a POST /api/horarios/mis-horarios (medico) y POST /api/horarios (admin)
export interface HorarioRequest {
  colegiatura?: string; // solo lo manda el ADMIN; el medico sale del token
  diaSemana: DiaSemana;
  horaInicio: string; // HH:mm
  horaFin: string;
}
