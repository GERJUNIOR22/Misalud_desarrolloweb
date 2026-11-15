import { Component, inject, OnInit, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DoctorActualizarRequest, DoctorRequest } from '../../../models/admin';
import { Doctor, Especialidad } from '../../../models/doctor';
import { DoctoresService } from '../../../services/doctores.service';
import { EspecialidadesService } from '../../../services/especialidades.service';
import { mensajeDeError } from '../../../utils/errores';

// Administracion de doctores: registrar uno nuevo (con su cuenta MEDICO) y editar sus datos
@Component({
  selector: 'app-admin-doctores',
  imports: [ReactiveFormsModule],
  templateUrl: './doctores.html',
  styleUrl: './doctores.scss',
})
export class AdminDoctores implements OnInit {
  private doctoresSrv = inject(DoctoresService);
  private especialidadesSrv = inject(EspecialidadesService);

  doctores = signal<Doctor[]>([]);
  especialidades = signal<Especialidad[]>([]);
  cargando = signal(false);
  enviando = signal(false);
  error = signal('');
  mensaje = signal('');

  // null = estoy registrando uno nuevo; con valor = estoy editando ese doctor
  editando = signal<Doctor | null>(null);

  // Las mismas reglas que valida el backend (DoctorRequest.java)
  formulario = new FormGroup({
    colegiatura: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/^\d{4,6}$/)],
    }),
    nombres: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    apellidos: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    especialidad: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    telefono: new FormControl('', {
      nonNullable: true,
      validators: [Validators.pattern(/^\d{9}$/)], // opcional, pero si se escribe: 9 digitos
    }),
    correo: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(6)],
    }),
  });

  private mensajes: Record<string, Record<string, string>> = {
    colegiatura: {
      required: 'La colegiatura es obligatoria.',
      pattern: 'La colegiatura debe tener de 4 a 6 numeros.',
    },
    nombres: { required: 'Los nombres son obligatorios.' },
    apellidos: { required: 'Los apellidos son obligatorios.' },
    especialidad: { required: 'Seleccione una especialidad.' },
    telefono: { pattern: 'El telefono debe tener 9 numeros.' },
    correo: { required: 'El correo es obligatorio.', email: 'Ingrese un correo valido.' },
    password: {
      required: 'La contrasena es obligatoria.',
      minlength: 'La contrasena debe tener al menos 6 caracteres.',
    },
  };

  // Mensaje del PRIMER error del campo (solo si el usuario ya lo toco)
  error_(campo: string): string {
    const control = this.formulario.get(campo);
    if (!control || !control.touched || !control.errors) return '';
    const regla = Object.keys(control.errors)[0];
    return this.mensajes[campo]?.[regla] ?? 'Valor invalido.';
  }

  ngOnInit(): void {
    this.cargar();
    // Solo las especialidades activas se pueden asignar a un doctor
    this.especialidadesSrv.listarActivas().subscribe({
      next: (datos) => this.especialidades.set(datos),
      error: (err: HttpErrorResponse) =>
        this.error.set(mensajeDeError(err, 'No se pudieron cargar las especialidades.')),
    });
  }

  cargar(): void {
    this.cargando.set(true);
    this.doctoresSrv.listar().subscribe({
      next: (datos) => {
        this.doctores.set(datos);
        this.cargando.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(mensajeDeError(err, 'No se pudieron cargar los doctores.'));
        this.cargando.set(false);
      },
    });
  }

  // Carga el doctor en el formulario. La colegiatura, el correo y la clave no se editan.
  editar(doctor: Doctor): void {
    this.editando.set(doctor);
    this.mensaje.set('');
    this.error.set('');
    this.formulario.reset({
      colegiatura: doctor.colegiatura,
      nombres: doctor.nombres,
      apellidos: doctor.apellidos,
      especialidad: String(doctor.especialidad?.idEspecialidad ?? ''),
      telefono: doctor.telefono ?? '',
      correo: doctor.correo ?? '',
      password: '',
    });
    // Un control desactivado no se valida ni se envia
    this.formulario.controls.colegiatura.disable();
    this.formulario.controls.correo.disable();
    this.formulario.controls.password.disable();
  }

  cancelarEdicion(): void {
    this.editando.set(null);
    this.formulario.controls.colegiatura.enable();
    this.formulario.controls.correo.enable();
    this.formulario.controls.password.enable();
    this.formulario.reset({
      colegiatura: '',
      nombres: '',
      apellidos: '',
      especialidad: '',
      telefono: '',
      correo: '',
      password: '',
    });
  }

  guardar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      this.error.set('Corrija los campos senalados antes de guardar.');
      return;
    }

    this.error.set('');
    this.mensaje.set('');
    this.enviando.set(true);

    const v = this.formulario.getRawValue();
    const actual = this.editando();

    if (actual) {
      const datos: DoctorActualizarRequest = {
        nombres: v.nombres.trim(),
        apellidos: v.apellidos.trim(),
        idEspecialidad: Number(v.especialidad),
        telefono: v.telefono || null,
      };
      this.doctoresSrv.actualizar(actual.colegiatura, datos).subscribe({
        next: (guardado) => {
          this.doctores.update((lista) =>
            lista.map((d) => (d.colegiatura === guardado.colegiatura ? guardado : d)),
          );
          this.terminar(`Doctor ${guardado.nombres} ${guardado.apellidos} actualizado.`);
        },
        error: (err: HttpErrorResponse) => this.fallar(err),
      });
      return;
    }

    const datos: DoctorRequest = {
      colegiatura: v.colegiatura,
      nombres: v.nombres.trim(),
      apellidos: v.apellidos.trim(),
      idEspecialidad: Number(v.especialidad),
      telefono: v.telefono || null,
      correo: v.correo.trim(),
      password: v.password,
    };
    this.doctoresSrv.crear(datos).subscribe({
      next: (creado) => {
        this.doctores.update((lista) => [...lista, creado]);
        this.terminar(`Doctor ${creado.nombres} ${creado.apellidos} registrado con su cuenta de medico.`);
      },
      error: (err: HttpErrorResponse) => this.fallar(err),
    });
  }

  private terminar(mensaje: string): void {
    this.enviando.set(false);
    this.mensaje.set(mensaje);
    this.cancelarEdicion();
  }

  private fallar(err: HttpErrorResponse): void {
    this.enviando.set(false);
    // Ej: "Ya existe un doctor con la colegiatura 045821" o "El correo ya esta registrado"
    this.error.set(mensajeDeError(err, 'No se pudo guardar el doctor.'));
  }
}
