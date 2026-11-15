import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_URL } from '../config/api';
import { Horario } from '../models/doctor';
import {
  DoctorPublico,
  EspecialidadPublica,
  ReservaPublicaRequest,
  ReservaPublicaResponse,
} from '../models/publico';

// Llamadas SIN login para que cualquier persona reserve una cita (backend: /api/publico/**)
@Injectable({ providedIn: 'root' })
export class PublicoService {
  private http = inject(HttpClient);
  private api = `${API_URL}/api/publico`;

  especialidades() {
    return this.http.get<EspecialidadPublica[]>(`${this.api}/especialidades`);
  }

  // Doctores de una especialidad (sin correo ni datos de su cuenta)
  doctores(idEspecialidad: number) {
    return this.http.get<DoctorPublico[]>(`${this.api}/doctores`, {
      params: { idEspecialidad },
    });
  }

  // GET /api/publico/disponibilidad?colegiatura=045821&fecha=2026-11-20
  disponibilidad(colegiatura: string, fecha: string) {
    return this.http.get<Horario[]>(`${this.api}/disponibilidad`, { params: { colegiatura, fecha } });
  }

  // Reserva la cita y registra el pago en un solo paso
  reservar(datos: ReservaPublicaRequest) {
    return this.http.post<ReservaPublicaResponse>(`${this.api}/reservas`, datos);
  }

  // Consulta con codigo + DNI (los dos deben coincidir)
  consultar(codigo: string, dni: string) {
    return this.http.get<ReservaPublicaResponse>(`${this.api}/citas/${encodeURIComponent(codigo)}`, {
      params: { dni },
    });
  }
}
