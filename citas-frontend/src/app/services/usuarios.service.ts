import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_URL } from '../config/api';
import { UsuarioResumen } from '../models/admin';

// Gestion de cuentas (solo ADMIN)
@Injectable({ providedIn: 'root' })
export class UsuariosService {
  private http = inject(HttpClient);
  private api = `${API_URL}/api/usuarios`;

  listar() {
    return this.http.get<UsuarioResumen[]>(this.api);
  }

  // PUT /api/usuarios/5/estado?activo=false   (activar o desactivar una cuenta)
  cambiarEstado(idUsuario: number, activo: boolean) {
    return this.http.put<{ correo: string; activo: boolean }>(`${this.api}/${idUsuario}/estado`, null, {
      params: { activo },
    });
  }
}
