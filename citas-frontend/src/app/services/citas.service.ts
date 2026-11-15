import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_URL } from '../config/api';
import { Cita, CitaRequest, EstadoCita } from '../models/cita';
import { Horario } from '../models/doctor';
import { AuthService } from './auth.service';

// Servicio que centraliza TODAS las llamadas HTTP de citas (Semana 14).
// Los componentes no conocen URLs: solo llaman a estos metodos.
// El interceptor agrega el token automaticamente.
@Injectable({ providedIn: 'root' })
export class CitasService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private api = `${API_URL}/api/citas`;

  // El ADMIN ve todas las citas; el PACIENTE y el MEDICO ven las suyas
  listar() {
    const url = this.auth.rol() === 'ADMIN' ? this.api : `${this.api}/mis-citas`;
    return this.http.get<Cita[]>(url);
  }

  // GET /api/citas/CIT-00001
  buscar(codigo: string) {
    return this.http.get<Cita>(`${this.api}/${codigo}`);
  }

  // GET /api/citas/disponibilidad?colegiatura=045821&fecha=2026-11-20  (consulta con parametros)
  disponibilidad(colegiatura: string, fecha: string) {
    return this.http.get<Horario[]>(`${this.api}/disponibilidad`, {
      params: { colegiatura, fecha },
    });
  }

  // POST /api/citas  (reservar una cita nueva)
  reservar(datos: CitaRequest) {
    return this.http.post<Cita>(this.api, datos);
  }

  // PUT /api/citas/CIT-00001/estado   (cancelar, confirmar, rechazar, completar)
  cambiarEstado(codigo: string, estado: EstadoCita, observacion?: string) {
    return this.http.put<Cita>(`${this.api}/${codigo}/estado`, { estado, observacion });
  }
}
