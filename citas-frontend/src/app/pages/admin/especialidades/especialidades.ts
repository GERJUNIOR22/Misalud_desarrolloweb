import { Component, inject, OnInit, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { EspecialidadRequest } from '../../../models/admin';
import { Especialidad } from '../../../models/doctor';
import { EspecialidadesService } from '../../../services/especialidades.service';
import { mensajeDeError } from '../../../utils/errores';

// Administracion de especialidades: crear, editar (con su precio) y activar o desactivar
@Component({
  selector: 'app-admin-especialidades',
  imports: [ReactiveFormsModule, DecimalPipe],
  templateUrl: './especialidades.html',
  styleUrl: './especialidades.scss',
})
export class AdminEspecialidades implements OnInit {
  private servicio = inject(EspecialidadesService);

  especialidades = signal<Especialidad[]>([]);
  cargando = signal(false);
  enviando = signal(false);
  error = signal('');
  mensaje = signal('');

  // null = estoy creando una nueva; con valor = estoy editando esa
  editando = signal<Especialidad | null>(null);

  // Las mismas reglas que valida el backend (EspecialidadRequest.java)
  formulario = new FormGroup({
    nombre: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(100)],
    }),
    descripcion: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(255)],
    }),
    precio: new FormControl<number | null>(null, [
      Validators.required,
      Validators.min(1),
      Validators.max(5000),
    ]),
  });

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set('');

    this.servicio.listar().subscribe({
      next: (datos) => {
        this.especialidades.set(datos);
        this.cargando.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(mensajeDeError(err, 'No se pudieron cargar las especialidades.'));
        this.cargando.set(false);
      },
    });
  }

  // Carga la especialidad en el formulario para modificarla
  editar(especialidad: Especialidad): void {
    this.editando.set(especialidad);
    this.mensaje.set('');
    this.error.set('');
    this.formulario.setValue({
      nombre: especialidad.nombre,
      descripcion: especialidad.descripcion ?? '',
      precio: especialidad.precio,
    });
  }

  cancelarEdicion(): void {
    this.editando.set(null);
    this.formulario.reset({ nombre: '', descripcion: '', precio: null });
  }

  guardar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      this.error.set('Corrija los campos senalados antes de guardar.');
      return;
    }

    const valores = this.formulario.getRawValue();
    const datos: EspecialidadRequest = {
      nombre: valores.nombre.trim(),
      descripcion: valores.descripcion.trim() || null,
      precio: valores.precio as number,
    };

    this.error.set('');
    this.mensaje.set('');
    this.enviando.set(true);

    const actual = this.editando();
    const peticion = actual
      ? this.servicio.actualizar(actual.idEspecialidad, datos) // PUT
      : this.servicio.crear(datos); // POST

    peticion.subscribe({
      next: (guardada) => {
        this.especialidades.update((lista) =>
          actual
            ? lista.map((e) => (e.idEspecialidad === guardada.idEspecialidad ? guardada : e))
            : [...lista, guardada],
        );
        this.mensaje.set(
          actual
            ? `Especialidad ${guardada.nombre} actualizada.`
            : `Especialidad ${guardada.nombre} creada.`,
        );
        this.enviando.set(false);
        this.cancelarEdicion();
      },
      error: (err: HttpErrorResponse) => {
        this.enviando.set(false);
        // Ej: "Ya existe la especialidad Pediatria"
        this.error.set(mensajeDeError(err, 'No se pudo guardar la especialidad.'));
      },
    });
  }

  // PUT /api/especialidades/{id}/estado?activo=...  (se apaga, no se borra)
  cambiarEstado(especialidad: Especialidad): void {
    const activo = !especialidad.activo;
    this.error.set('');
    this.mensaje.set('');

    this.servicio.cambiarEstado(especialidad.idEspecialidad, activo).subscribe({
      next: (actualizada) => {
        this.especialidades.update((lista) =>
          lista.map((e) => (e.idEspecialidad === actualizada.idEspecialidad ? actualizada : e)),
        );
        this.mensaje.set(
          `Especialidad ${actualizada.nombre} ${activo ? 'activada' : 'desactivada'}.`,
        );
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(mensajeDeError(err, 'No se pudo cambiar el estado.'));
      },
    });
  }
}
