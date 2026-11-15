export type MetodoPago = 'EFECTIVO' | 'TARJETA' | 'YAPE' | 'PLIN' | 'TRANSFERENCIA';
export type EstadoPago = 'PENDIENTE' | 'COMPLETADO' | 'RECHAZADO';

// Lo que devuelve GET /api/pagos y GET /api/pagos/mis-pagos
export interface Pago {
  idPago: number;
  codigoCita: string;
  dniPaciente: string;
  paciente: string;
  monto: number;
  metodo: MetodoPago;
  estado: EstadoPago;
  fechaPago: string; // 2026-10-12T00:45:26
  numeroOperacion: string | null;
}

// Lo que se envia a POST /api/pagos  (el monto NO se manda: lo calcula el servidor)
export interface PagoRequest {
  codigoCita: string;
  metodo: MetodoPago;
}

// GET /api/pagos/resumen  (solo ADMIN)
export interface ResumenPagos {
  cobrado: number;
  porCobrar: number;
}

// Metodos que acepta Caja (el personal puede cobrar tambien en efectivo)
export const METODOS_PAGO: MetodoPago[] = ['TARJETA', 'YAPE', 'PLIN', 'TRANSFERENCIA', 'EFECTIVO'];

// Metodos de la reserva en linea: se paga ANTES de reservar, asi que no hay efectivo
export const METODOS_EN_LINEA: MetodoPago[] = ['TARJETA', 'YAPE', 'PLIN', 'TRANSFERENCIA'];
