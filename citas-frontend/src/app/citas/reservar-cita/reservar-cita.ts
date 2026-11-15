import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { catchError, filter, of, switchMap, tap } from 'rxjs';
import { CitaRequest } from '../../models/cita';
import { Doctor, Especialidad, Horario } from '../../models/doctor';
import { DatosDni } from '../../models/paciente';
import { AuthService } from '../../services/auth.service';
import { CitasService } from '../../services/citas.service';
import { DoctoresService } from '../../services/doctores.service';
import { EspecialidadesService } from '../../services/especialidades.service';
import { PacientesService } from '../../services/pacientes.service';
import { mensajeDeError } from '../../utils/errores';
import { calcularEdad, fechaNacimientoValida, fechaNoPasada, hoyISO } from '../../utils/validadores';

@Component({
  selector: 'app-reservar-cita',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './reservar-cita.html',
  styleUrl: './reservar-cita.scss',
})
export class ReservarCita implements OnInit {
  private citas = inject(CitasService);
  private doctoresSrv = inject(DoctoresService);
  private especialidadesSrv = inject(EspecialidadesService);
  private pacientesSrv = inject(PacientesService);
  private router = inject(Router);
  auth = inject(AuthService);

  hoy = hoyISO();

  // El personal (ADMIN o MEDICO) escribe el DNI: se autocompleta con la ficha guardada
  // o, si el paciente es nuevo, con los datos de RENIEC (la ficha se crea al reservar).
  esMedico = computed(() => this.auth.rol() === 'MEDICO');

  // Estado de la busqueda por DNI
  buscandoDni = signal(false);
  origenDni = signal<DatosDni['origen'] | null>(null);
  avisoDni = signal('');

  // Datos que vienen de la API
  especialidades = signal<Especialidad[]>([]);
  doctores = signal<Doctor[]>([]);
  horarios = signal<Horario[]>([]);

  // Estados de la pantalla
  cargando = signal(false);
  cargandoHorarios = signal(false);
  enviando = signal(false);
  mensaje = signal('');

  formulario = new FormGroup({
    dniPaciente: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/^\d{8}$/)],
    }),
    nombres: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(60)],
    }),
    apellidos: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(60)],
    }),
    fechaNacimiento: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, fechaNacimientoValida],
    }),
    especialidad: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    doctor: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    fecha: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, fechaNoPasada],
    }),
    hora: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    motivo: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(200)],
    }),
  });

  // Copia del valor elegido en "especialidad" para poder calcular listas derivadas
  private especialidadElegida = signal('');

  // La edad se calcula sola a partir de la fecha de nacimiento
  private fechaNacimientoElegida = signal('');
  edad = computed(() => calcularEdad(this.fechaNacimientoElegida()));

  // Solo los doctores de la especialidad elegida
  doctoresFiltrados = computed(() =>
    this.doctores().filter((d) => String(d.especialidad?.idEspecialidad) === this.especialidadElegida()),
  );

  // El precio sale de la especialidad (el backend es quien lo cobra)
  precio = computed(
    () =>
      this.especialidades().find((e) => String(e.idEspecialidad) === this.especialidadElegida())
        ?.precio ?? null,
  );

  constructor() {
    // Cuando el DNI llega a 8 digitos: se buscan sus datos (ficha o RENIEC).
    // switchMap cancela la busqueda anterior si el usuario sigue escribiendo.
    this.formulario.controls.dniPaciente.valueChanges
      .pipe(
        tap(() => this.limpiarPaciente()),
        filter((dni) => /^\d{8}$/.test(dni)),
        tap(() => this.buscandoDni.set(true)),
        switchMap((dni) =>
          this.pacientesSrv.consultarDni(dni).pipe(
            catchError((err: HttpErrorResponse) => {
              this.avisoDni.set(
                mensajeDeError(err, 'No se encontraron datos para ese DNI.') +
                  ' Puede ingresar los datos manualmente.',
              );
              return of(null);
            }),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((datos) => {
        this.buscandoDni.set(false);
        if (datos) this.autocompletar(datos);
      });

    this.formulario.controls.fechaNacimiento.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((valor) => this.fechaNacimientoElegida.set(valor));

    // Cuando cambia la especialidad: se vacian el doctor, la hora y los horarios
    this.formulario.controls.especialidad.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((valor) => {
        this.especialidadElegida.set(valor);
        this.formulario.controls.doctor.setValue('');
      });

    // Cuando cambia el doctor o la fecha: se pide la disponibilidad de nuevo
    this.formulario.controls.doctor.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.cargarHorarios());
    this.formulario.controls.fecha.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.cargarHorarios());
  }

  ngOnInit(): void {
    this.cargando.set(true);

    this.especialidadesSrv.listarActivas().subscribe({
      next: (datos) => this.especialidades.set(datos),
      error: (err: HttpErrorResponse) =>
        this.mensaje.set(mensajeDeError(err, 'No se pudieron cargar las especialidades.')),
    });

    this.doctoresSrv.listar().subscribe({
      next: (datos) => {
        this.doctores.set(datos);
        this.cargando.set(false);
        if (this.esMedico()) {
          this.fijarDoctorDelMedico();
        }
      },
      error: (err: HttpErrorResponse) => {
        this.mensaje.set(mensajeDeError(err, 'No se pudieron cargar los doctores.'));
        this.cargando.set(false);
      },
    });
  }

  // El MEDICO solo reserva en su propia agenda: su especialidad y su nombre quedan fijos
  private fijarDoctorDelMedico(): void {
    this.doctoresSrv.miPerfil().subscribe({
      next: (yo) => {
        const { especialidad, doctor } = this.formulario.controls;
        especialidad.setValue(String(yo.especialidad?.idEspecialidad ?? ''));
        doctor.setValue(yo.colegiatura);
        // emitEvent:false evita que "disable" dispare valueChanges y vacie el doctor recien fijado
        especialidad.disable({ emitEvent: false });
        doctor.disable({ emitEvent: false });
      },
      error: (err: HttpErrorResponse) =>
        this.mensaje.set(mensajeDeError(err, 'No se pudo cargar su perfil de medico.')),
    });
  }

  // GET /api/citas/disponibilidad?colegiatura=...&fecha=...
  cargarHorarios(): void {
    const { doctor, fecha } = this.formulario.controls;
    this.formulario.controls.hora.setValue('');
    this.horarios.set([]);

    if (!doctor.value || !fecha.value || fecha.invalid) return;

    this.cargandoHorarios.set(true);
    this.citas.disponibilidad(doctor.value, fecha.value).subscribe({
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

  hayHorariosLibres(): boolean {
    return this.horarios().some((h) => h.disponible);
  }

  // Muestra 09:00:00 como 09:00
  corta(hora: string): string {
    return hora.slice(0, 5);
  }

  // Llena nombres, apellidos y fecha con lo que devolvio el backend
  private autocompletar(datos: DatosDni): void {
    const { nombres, apellidos, fechaNacimiento } = this.formulario.controls;
    this.origenDni.set(datos.origen);
    nombres.setValue(datos.nombres);
    apellidos.setValue(datos.apellidos);
    // Nombres y apellidos son oficiales (ficha o RENIEC): no se editan
    nombres.disable();
    apellidos.disable();

    if (datos.fechaNacimiento) {
      fechaNacimiento.setValue(datos.fechaNacimiento);
      fechaNacimiento.disable();
    }

    this.avisoDni.set(
      datos.origen === 'FICHA'
        ? 'Paciente registrado: datos cargados de su ficha.'
        : 'Paciente nuevo: datos obtenidos de RENIEC. Se creara su ficha al reservar.',
    );
  }

  // Al cambiar el DNI se vacian y habilitan los datos del paciente anterior
  private limpiarPaciente(): void {
    if (this.origenDni() === null && !this.avisoDni()) return;
    const { nombres, apellidos, fechaNacimiento } = this.formulario.controls;
    for (const control of [nombres, apellidos, fechaNacimiento]) {
      control.enable({ emitEvent: false });
      control.reset('', { emitEvent: false });
    }
    this.fechaNacimientoElegida.set('');
    this.origenDni.set(null);
    this.avisoDni.set('');
  }

  reservar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      this.mensaje.set('Complete los datos del paciente y de la cita: doctor, fecha, hora y motivo.');
      return;
    }

    // getRawValue incluye tambien los controles desactivados (el doctor fijo del medico)
    const valores = this.formulario.getRawValue();
    const datos: CitaRequest = {
      dniPaciente: valores.dniPaciente.trim(),
      nombresPaciente: valores.nombres.trim(),
      apellidosPaciente: valores.apellidos.trim(),
      fechaNacimientoPaciente: valores.fechaNacimiento || null,
      colegiaturaDoctor: valores.doctor,
      fecha: valores.fecha,
      hora: valores.hora,
      motivo: valores.motivo.trim(),
    };

    this.mensaje.set('');
    this.enviando.set(true);

    this.citas.reservar(datos).subscribe({
      next: (cita) =>
        this.router.navigate(['/citas'], { queryParams: { reservada: cita.codigo } }),
      error: (err: HttpErrorResponse) => {
        this.enviando.set(false);
        // Error de negocio del backend (por ejemplo "el doctor ya tiene una cita en ese horario")
        this.mensaje.set(mensajeDeError(err, 'No fue posible reservar la cita.'));
        this.cargarHorarios();
      },
    });
  }
}
