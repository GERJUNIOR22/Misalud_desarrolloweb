import { Rol } from './auth';

// GET /api/usuarios  (solo ADMIN, sin contrasenas)
export interface UsuarioResumen {
  idUsuario: number;
  correo: string;
  rol: Rol;
  activo: boolean;
}

// POST y PUT /api/especialidades
export interface EspecialidadRequest {
  nombre: string;
  descripcion: string | null;
  precio: number;
}

// POST /api/doctores  (crea el doctor y su cuenta MEDICO)
export interface DoctorRequest {
  colegiatura: string;
  nombres: string;
  apellidos: string;
  idEspecialidad: number;
  telefono: string | null;
  correo: string;
  password: string;
}

// PUT /api/doctores/{colegiatura}  (la colegiatura, el correo y la clave no se cambian aqui)
export interface DoctorActualizarRequest {
  nombres: string;
  apellidos: string;
  idEspecialidad: number;
  telefono: string | null;
}
