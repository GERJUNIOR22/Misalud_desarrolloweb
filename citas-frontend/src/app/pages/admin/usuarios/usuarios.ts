import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { UsuarioResumen } from '../../../models/admin';
import { AuthService } from '../../../services/auth.service';
import { UsuariosService } from '../../../services/usuarios.service';
import { mensajeDeError } from '../../../utils/errores';

// Administracion de cuentas: ver todas y activar o desactivar
@Component({
  selector: 'app-admin-usuarios',
  imports: [],
  templateUrl: './usuarios.html',
  styleUrl: './usuarios.scss',
})
export class AdminUsuarios implements OnInit {
  private servicio = inject(UsuariosService);
  private auth = inject(AuthService);

  usuarios = signal<UsuarioResumen[]>([]);
  cargando = signal(false);
  error = signal('');
  mensaje = signal('');

  // El admin no puede desactivar su propia cuenta (se quedaria sin acceso)
  miCorreo = computed(() => this.auth.sesion()?.correo ?? '');

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set('');

    this.servicio.listar().subscribe({
      next: (datos) => {
        this.usuarios.set(datos);
        this.cargando.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(mensajeDeError(err, 'No se pudieron cargar los usuarios.'));
        this.cargando.set(false);
      },
    });
  }

  // PUT /api/usuarios/{id}/estado?activo=...
  cambiarEstado(usuario: UsuarioResumen): void {
    const activo = !usuario.activo;
    this.error.set('');
    this.mensaje.set('');

    this.servicio.cambiarEstado(usuario.idUsuario, activo).subscribe({
      next: () => {
        this.usuarios.update((lista) =>
          lista.map((u) => (u.idUsuario === usuario.idUsuario ? { ...u, activo } : u)),
        );
        this.mensaje.set(`La cuenta ${usuario.correo} fue ${activo ? 'activada' : 'desactivada'}.`);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(mensajeDeError(err, 'No se pudo cambiar el estado de la cuenta.'));
      },
    });
  }
}
