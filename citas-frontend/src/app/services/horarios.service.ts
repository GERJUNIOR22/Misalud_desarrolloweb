import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_URL } from '../config/api';
import { HorarioMedico, HorarioRequest } from '../models/horario';

// Agenda de atencion de los doctores. El interceptor agrega el token.
@Injectable({ providedIn: 'root' })
export class HorariosService {
  private http = inject(HttpClient);
  private api = `${API_URL}/api/horarios`;

  // MEDICO: sus propios horarios (activos y no)
  misHorarios() {
    return this.http.get<HorarioMedico[]>(`${this.api}/mis-horarios`);
  }

  // ADMIN: los horarios de todos los doctores
  listar() {
    return this.http.get<HorarioMedico[]>(this.api);
  }

  // MEDICO: crea un horario para si mismo
  crearMio(datos: HorarioRequest) {
    return this.http.post<HorarioMedico>(`${this.api}/mis-horarios`, datos);
  }

  // ADMIN: crea un horario para cualquier doctor (manda su colegiatura)
  crearPorAdmin(datos: HorarioRequest) {
    return this.http.post<HorarioMedico>(this.api, datos);
  }

  // PUT /api/horarios/3/estado?activo=false   (ADMIN o el medico duenio)
  cambiarEstado(id: number, activo: boolean) {
    return this.http.put<HorarioMedico>(`${this.api}/${id}/estado`, null, { params: { activo } });
  }
}
