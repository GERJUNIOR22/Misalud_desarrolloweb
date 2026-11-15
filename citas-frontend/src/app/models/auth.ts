// Solo el PERSONAL tiene cuenta. Los pacientes no inician sesion: reservan desde la portada.
export type Rol = 'ADMIN' | 'MEDICO';

// Lo que se envia a POST /auth/login
export interface LoginRequest {
  correo: string;
  password: string;
}

// Lo que responde POST /auth/login
export interface LoginResponse {
  token: string;
  correo: string;
  rol: Rol;
}
