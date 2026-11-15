import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_URL } from '../config/api';
import { DoctorActualizarRequest, DoctorRequest } from '../models/admin';
import { Doctor } from '../models/doctor';

@Injectable({ providedIn: 'root' })
export class DoctoresService {
  private http = inject(HttpClient);
  private api = `${API_URL}/api/doctores`;

  listar() {
    return this.http.get<Doctor[]>(this.api);
  }

  // GET /api/doctores/mi-perfil  (solo el MEDICO: sus propios datos)
  miPerfil() {
    return this.http.get<Doctor>(`${this.api}/mi-perfil`);
  }

  // POST /api/doctores   (solo ADMIN: crea el doctor y su cuenta de MEDICO)
  crear(datos: DoctorRequest) {
    return this.http.post<Doctor>(this.api, datos);
  }

  // PUT /api/doctores/045821   (solo ADMIN)
  actualizar(colegiatura: string, datos: DoctorActualizarRequest) {
    return this.http.put<Doctor>(`${this.api}/${colegiatura}`, datos);
  }
}
