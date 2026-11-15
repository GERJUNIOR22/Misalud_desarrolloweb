import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_URL } from '../config/api';
import { DatosDni, Paciente } from '../models/paciente';

@Injectable({ providedIn: 'root' })
export class PacientesService {
  private http = inject(HttpClient);

  // ADMIN: todos los pacientes (fichas)
  listar() {
    return this.http.get<Paciente[]>(`${API_URL}/api/pacientes`);
  }

  // ADMIN y MEDICO: autocompletar por DNI (ficha guardada o RENIEC)
  consultarDni(dni: string) {
    return this.http.get<DatosDni>(`${API_URL}/api/pacientes/consulta-dni/${dni}`);
  }
}
