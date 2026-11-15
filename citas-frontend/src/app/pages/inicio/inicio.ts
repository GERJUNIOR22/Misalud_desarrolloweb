import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

interface Acceso {
  titulo: string;
  descripcion: string;
  ruta: string;
}

// Inicio del PERSONAL: accesos rapidos segun el rol de quien inicio sesion
@Component({
  selector: 'app-inicio',
  imports: [RouterLink],
  templateUrl: './inicio.html',
  styleUrl: './inicio.scss',
})
export class Inicio {
  auth = inject(AuthService);

  accesos = computed<Acceso[]>(() => {
    switch (this.auth.rol()) {
      case 'MEDICO':
        return [
          { titulo: 'Mis citas', descripcion: 'Confirme, rechace o complete sus citas.', ruta: '/citas' },
          { titulo: 'Reservar cita', descripcion: 'Agende un control para un paciente.', ruta: '/citas/nueva' },
          { titulo: 'Mis horarios', descripcion: 'Defina los dias y horas que atiende.', ruta: '/horarios' },
        ];
      case 'ADMIN':
        return [
          { titulo: 'Citas', descripcion: 'Todas las citas de la clinica.', ruta: '/citas' },
          { titulo: 'Caja', descripcion: 'Cobros, totales y confirmaciones.', ruta: '/pagos' },
          { titulo: 'Usuarios', descripcion: 'Cuentas del personal: activar o desactivar.', ruta: '/admin/usuarios' },
          { titulo: 'Especialidades', descripcion: 'Especialidades y su precio.', ruta: '/admin/especialidades' },
          { titulo: 'Doctores', descripcion: 'Registre doctores y cree sus cuentas.', ruta: '/admin/doctores' },
          { titulo: 'Horarios', descripcion: 'Agenda de atencion de cada doctor.', ruta: '/horarios' },
          { titulo: 'Pacientes', descripcion: 'Fichas de pacientes por DNI o nombre.', ruta: '/admin/pacientes' },
          { titulo: 'Reservar cita', descripcion: 'Agende una cita para un paciente.', ruta: '/citas/nueva' },
        ];
      default:
        return [];
    }
  });
}
