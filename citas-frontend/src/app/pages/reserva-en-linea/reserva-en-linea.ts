import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Horario } from '../../models/doctor';
import { MetodoPago, METODOS_EN_LINEA } from '../../models/pago';
import {
  ConsultaEstado,
  DoctorPublico,
  EspecialidadPublica,
  ReservaPublicaRequest,
} from '../../models/publico';
import { PublicoService } from '../../services/publico.service';
import { mensajeDeError } from '../../utils/errores';
import { fechaNoPasada, hoyISO } from '../../utils/validadores';

// Reserva EN LINEA sin cuenta: se eligen especialidad, doctor y horario, se dejan los datos
// del paciente y se paga. La cita solo queda reservada si el pago se aprueba.
@Component({
  selector: 'app-reserva-en-linea',
  imports: [ReactiveFormsModule, RouterLink, DecimalPipe],
  templateUrl: './reserva-en-linea.html',
  styleUrl: './reserva-en-linea.scss',
})
export class ReservaEnLinea implements OnInit {
  private publico = inject(PublicoService);
  private router = inject(Router);

  hoy = hoyISO();
  metodos = METODOS_EN_LINEA;

  // Datos que vienen de la API publica
  especialidades = signal<EspecialidadPublica[]>([]);
  doctores = signal<DoctorPublico[]>([]);
  horarios = signal<Horario[]>([]);

  // Estados de la pantalla
  cargando = signal(false);
  cargandoDoctores = signal(false);
  cargandoHorarios = signal(false);
  enviando = signal(false);
  mensaje = signal('');

  // Las mismas reglas que valida el backend (ReservaPublicaRequest.java)
  formulario = new FormGroup({
    especialidad: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    doctor: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    fecha: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, fechaNoPasada],
    }),
    hora: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    dni: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/^\d{8}$/)],
    }),
    telefono: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/^\d{9}$/)],
    }),
    nombres: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(60)],
    }),
    apellidos: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(60)],
    }),
    motivo: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(200)],
    }),
    metodo: new FormControl<MetodoPago | ''>('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  // Copia de la especialidad elegida para calcular el precio y el resumen
  private especialidadElegida = signal('');

  especialidadActual = computed(
    () => this.especialidades().find((e) => String(e.idEspecialidad) === this.especialidadElegida()) ?? null,
  );

  // El precio sale de la especialidad (el backend es quien lo cobra)
  precio = computed(() => this.especialidadActual()?.precio ?? null);

  constructor() {
    // Cambia la especialidad: se piden sus doctores y se vacian doctor, hora y horarios
    this.formulario.controls.especialidad.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((valor) => {
        this.especialidadElegida.set(valor);
        this.formulario.controls.doctor.setValue('');
        this.doctores.set([]);
        if (valor) this.cargarDoctores(Number(valor));
      });

    // Cambia el doctor o la fecha: se consulta la disponibilidad de nuevo
    this.formulario.controls.doctor.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.cargarHorarios());
    this.formulario.controls.fecha.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.cargarHorarios());
  }

  ngOnInit(): void {
    this.cargando.set(true);
    this.publico.especialidades().subscribe({
      next: (datos) => {
        this.especialidades.set(datos);
        this.cargando.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.mensaje.set(mensajeDeError(err, 'No se pudieron cargar las especialidades.'));
        this.cargando.set(false);
      },
    });
  }

  private cargarDoctores(idEspecialidad: number): void {
    this.cargandoDoctores.set(true);
    this.publico.doctores(idEspecialidad).subscribe({
      next: (datos) => {
        this.doctores.set(datos);
        this.cargandoDoctores.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.mensaje.set(mensajeDeError(err, 'No se pudieron cargar los doctores.'));
        this.cargandoDoctores.set(false);
      },
    });
  }

  // GET /api/publico/disponibilidad?colegiatura=...&fecha=...
  cargarHorarios(): void {
    const { doctor, fecha } = this.formulario.controls;
    this.formulario.controls.hora.setValue('');
    this.horarios.set([]);

    if (!doctor.value || !fecha.value || fecha.invalid) return;

    this.cargandoHorarios.set(true);
    this.publico.disponibilidad(doctor.value, fecha.value).subscribe({
      next: (datos) => {
        this.horarios.set(datos);
        this.cargandoHorarios.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.cargandoHorarios.set(false);
        this.mensaje.set(mensajeDeError(err, 'No se pudo consultar la disponibilidad.'));
      },
    });
  }

  elegirHora(horario: Horario): void {
    if (!horario.disponible) return;
    this.formulario.controls.hora.setValue(horario.hora);
    this.formulario.controls.hora.markAsTouched();
    this.mensaje.set('');
  }

  elegirMetodo(metodo: MetodoPago): void {
    this.formulario.controls.metodo.setValue(metodo);
    this.formulario.controls.metodo.markAsTouched();
  }

  hayHorariosLibres(): boolean {
    return this.horarios().some((h) => h.disponible);
  }

  // 08:30:00 -> 08:30
  corta(hora: string): string {
    return hora.slice(0, 5);
  }

  nombreDoctor(): string {
    const d = this.doctores().find((x) => x.colegiatura === this.formulario.controls.doctor.value);
    return d ? `Dr. ${d.nombres} ${d.apellidos}` : '';
  }

  reservar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      this.mensaje.set('Revise los campos señalados antes de pagar.');
      return;
    }

    const v = this.formulario.getRawValue();
    // El monto NO se envia: lo calcula el servidor con el precio de la especialidad
    const datos: ReservaPublicaRequest = {
      dni: v.dni.trim(),
      nombres: v.nombres.trim(),
      apellidos: v.apellidos.trim(),
      telefono: v.telefono.trim(),
      colegiaturaDoctor: v.doctor,
      fecha: v.fecha,
      hora: v.hora,
      motivo: v.motivo.trim(),
      metodo: v.metodo as MetodoPago,
    };

    this.mensaje.set('');
    this.enviando.set(true);

    this.publico.reservar(datos).subscribe({
      next: (reserva) => {
        // Se muestra la confirmacion; el DNI viaja en el "state" y no en la URL
        const estado: ConsultaEstado = { codigo: reserva.codigoCita, dni: reserva.dniPaciente, nueva: true };
        this.router.navigate(['/mi-cita'], { state: estado });
      },
      error: (err: HttpErrorResponse) => {
        this.enviando.set(false);
        // Ej: "El doctor ya tiene una cita en ese horario": no se cobro nada
        this.mensaje.set(mensajeDeError(err, 'No fue posible completar la reserva. No se realizó ningún cobro.'));
        this.cargarHorarios();
      },
    });
  }
}
