import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_URL } from '../config/api';
import { LoginRequest, LoginResponse } from '../models/auth';

const CLAVE_SESION = 'sesion';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);

  // La sesion (token, correo y rol). Si recargas la pagina se recupera de sessionStorage.
  private _sesion = signal<LoginResponse | null>(this.leerSesion());

  readonly sesion = this._sesion.asReadonly();
  readonly estaAutenticado = computed(() => this._sesion() !== null);
  readonly rol = computed(() => this._sesion()?.rol ?? null);

  // POST /auth/login  (devuelve un Observable: se ejecuta al hacer subscribe)
  login(datos: LoginRequest) {
    return this.http.post<LoginResponse>(`${API_URL}/auth/login`, datos);
  }

  guardarSesion(respuesta: LoginResponse): void {
    sessionStorage.setItem(CLAVE_SESION, JSON.stringify(respuesta));
    this._sesion.set(respuesta);
  }

  logout(): void {
    sessionStorage.removeItem(CLAVE_SESION);
    this._sesion.set(null);
  }

  get token(): string | null {
    return this._sesion()?.token ?? null;
  }

  private leerSesion(): LoginResponse | null {
    try {
      const texto = sessionStorage.getItem(CLAVE_SESION);
      return texto ? (JSON.parse(texto) as LoginResponse) : null;
    } catch {
      return null;
    }
  }
}
