import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_URL } from '../config/api';
import { EspecialidadRequest } from '../models/admin';
import { Especialidad } from '../models/doctor';

@Injectable({ providedIn: 'root' })
export class EspecialidadesService {
  private http = inject(HttpClient);
  private api = `${API_URL}/api/especialidades`;

  // Solo las especialidades activas (las que se pueden elegir al reservar)
  listarActivas() {
    return this.http.get<Especialidad[]>(`${this.api}/activas`);
  }

  // Todas, activas o no (para la administracion)
  listar() {
    return this.http.get<Especialidad[]>(this.api);
  }

  // POST /api/especialidades   (solo ADMIN)
  crear(datos: EspecialidadRequest) {
    return this.http.post<Especialidad>(this.api, datos);
  }

  // PUT /api/especialidades/1   (solo ADMIN)
  actualizar(id: number, datos: EspecialidadRequest) {
    return this.http.put<Especialidad>(`${this.api}/${id}`, datos);
  }

  // PUT /api/especialidades/1/estado?activo=false   (se "apaga", no se borra)
  cambiarEstado(id: number, activo: boolean) {
    return this.http.put<Especialidad>(`${this.api}/${id}/estado`, null, { params: { activo } });
  }
}
