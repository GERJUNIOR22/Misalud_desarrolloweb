import { Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

// Acceso del PERSONAL (administrador y medicos). No hay registro: las cuentas las crea el administrador.
@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  private auth = inject(AuthService);
  private router = inject(Router);

  // Formulario reactivo: el modelo vive aqui, en TypeScript
  formulario = new FormGroup({
    correo: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  mensaje = signal('');
  cargando = signal(false);

  constructor() {
    // Al escribir de nuevo, se limpia el mensaje anterior
    this.formulario.valueChanges.subscribe(() => this.mensaje.set(''));
  }

  entrar(): void {
    // 1) Validar antes de enviar
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      this.mensaje.set('Revise los campos señalados.');
      return;
    }

    this.mensaje.set('');
    this.cargando.set(true);

    // 2) Enviar al backend
    this.auth.login(this.formulario.getRawValue()).subscribe({
      next: (respuesta) => {
        this.auth.guardarSesion(respuesta);
        this.router.navigate(['/inicio']);
      },
      error: (err: HttpErrorResponse) => {
        this.cargando.set(false);
        if (err.status === 0) {
          this.mensaje.set('No hay conexión con el servidor. Verifique que el backend esté encendido.');
        } else if (err.status === 401 || err.status === 403) {
          // 401: credenciales incorrectas o cuenta desactivada · 403: cuenta que no es del personal
          this.mensaje.set(err.error?.mensaje ?? 'Correo o contraseña incorrectos.');
        } else {
          this.mensaje.set('No fue posible iniciar sesión. Intente de nuevo.');
        }
      },
    });
  }
}
