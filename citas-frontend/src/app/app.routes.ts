import { Routes } from '@angular/router';
import { LayoutPublico } from './layout/layout-publico/layout-publico';
import { LayoutPersonal } from './layout/layout-personal/layout-personal';
import { Portada } from './pages/portada/portada';
import { ReservaEnLinea } from './pages/reserva-en-linea/reserva-en-linea';
import { MiCita } from './pages/mi-cita/mi-cita';
import { Login } from './pages/login/login';
import { Inicio } from './pages/inicio/inicio';
import { ListaCitas } from './citas/lista-citas/lista-citas';
import { CitaDetalle } from './citas/cita-detalle/cita-detalle';
import { ReservarCita } from './citas/reservar-cita/reservar-cita';
import { Pagos } from './pages/pagos/pagos';
import { Horarios } from './pages/horarios/horarios';
import { AdminUsuarios } from './pages/admin/usuarios/usuarios';
import { AdminEspecialidades } from './pages/admin/especialidades/especialidades';
import { AdminDoctores } from './pages/admin/doctores/doctores';
import { AdminPacientes } from './pages/admin/pacientes/pacientes';
import { NoEncontrado } from './pages/no-encontrado/no-encontrado';
import { authGuard } from './guards/auth.guard';
import { rolGuard } from './guards/rol.guard';

// Semana 12: cada URL se asocia con el componente que debe mostrarse
// Semana 14: canActivate protege las rutas del personal (authGuard) o de un rol (rolGuard)
export const routes: Routes = [
  // ---------- PUBLICO: los pacientes NO tienen cuenta, reservan desde aqui ----------
  {
    path: '',
    component: LayoutPublico,
    children: [
      { path: '', component: Portada },
      { path: 'reservar', component: ReservaEnLinea },
      { path: 'mi-cita', component: MiCita },
    ],
  },

  // Acceso del personal
  { path: 'login', component: Login },

  // ---------- PERSONAL: administrador y medicos (requiere sesion) ----------
  {
    path: '',
    component: LayoutPersonal,
    canActivate: [authGuard],
    children: [
      { path: 'inicio', component: Inicio },
      { path: 'citas', component: ListaCitas },
      // OJO: 'citas/nueva' va ANTES de 'citas/:codigo'; si no, "nueva" se tomaria como un codigo de cita
      { path: 'citas/nueva', component: ReservarCita, canActivate: [rolGuard('MEDICO', 'ADMIN')] },
      { path: 'citas/:codigo', component: CitaDetalle }, // ruta con parametro: /citas/CIT-00001
      { path: 'pagos', component: Pagos, canActivate: [rolGuard('ADMIN')] }, // Caja
      { path: 'horarios', component: Horarios, canActivate: [rolGuard('MEDICO', 'ADMIN')] },
      // Administracion: solo el rol ADMIN (el backend tambien lo valida)
      { path: 'admin/usuarios', component: AdminUsuarios, canActivate: [rolGuard('ADMIN')] },
      { path: 'admin/especialidades', component: AdminEspecialidades, canActivate: [rolGuard('ADMIN')] },
      { path: 'admin/doctores', component: AdminDoctores, canActivate: [rolGuard('ADMIN')] },
      { path: 'admin/pacientes', component: AdminPacientes, canActivate: [rolGuard('ADMIN')] },
      { path: 'admin', redirectTo: 'admin/usuarios', pathMatch: 'full' },
    ],
  },

  { path: '**', component: NoEncontrado }, // cualquier otra URL
];
