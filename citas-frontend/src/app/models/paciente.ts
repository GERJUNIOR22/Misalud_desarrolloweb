// GET /api/pacientes  (solo ADMIN). El paciente es una ficha: no tiene cuenta ni correo.
export interface Paciente {
  dni: string;
  nombres: string;
  apellidos: string;
  fechaNacimiento: string | null; // los que reservan en linea no la indican
  telefono: string | null;
}

// GET /api/pacientes/consulta-dni/{dni}  (ADMIN y MEDICO)
// FICHA  = ya existe en la base de datos     RENIEC = datos traidos de RENIEC (aun sin ficha)
export interface DatosDni {
  dni: string;
  nombres: string;
  apellidos: string;
  fechaNacimiento: string | null; // RENIEC no la entrega
  telefono: string | null;
  origen: 'FICHA' | 'RENIEC';
}
