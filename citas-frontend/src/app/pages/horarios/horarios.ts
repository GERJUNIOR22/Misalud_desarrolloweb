import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Doctor } from '../../models/doctor';
import { DIAS_SEMANA, DiaSemana, HorarioMedico, HorarioRequest } from '../../models/horario';
import { AuthService } from '../../services/auth.service';
import { DoctoresService } from '../../services/doctores.service';
import { HorariosService } from '../../services/horarios.service';
import { mensajeDeError } from '../../utils/errores';
import { horaFinPosterior } from '../../utils/validadores';

// Una pantalla con dos caras:
//   MEDICO -> "Mis horarios" (los suyos)      ADMIN -> horarios de todos, eligiendo el doctor
@Component({
  selector: 'app-horarios',
  imports: [ReactiveFormsModule],
  templateUrl: './horarios.html',
  styleUrl: './horarios.scss',
})
export class Horarios implements OnInit {
  private servicio = inject(HorariosService);
  private doctoresSrv = inject(DoctoresService);
  auth = inject(AuthService);

  esAdmin = computed(() => this.auth.rol() === 'ADMIN');
  titulo = computed(() => (this.esAdmin() ? 'Horarios de los doctores' : 'Mis horarios'));

  dias = DIAS_SEMANA;
  horarios = signal<HorarioMedico[]>([]);
  doctores = signal<Doctor[]>([]);
  cargando = signal(false);
  enviando = signal(false);
  error = signal('');
  mensaje = signal('');

  formulario = new FormGroup(
    {
      doctor: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      dia: new FormControl<DiaSemana | ''>('', { nonNullable: true, validators: [Validators.required] }),
      inicio: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      fin: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    },
    { validators: horaFinPosterior('inicio', 'fin') }, // validador del GRUPO
  );

  constructor() {
    // El medico no elige doctor: el backend toma el suyo del token
    if (this.auth.rol() !== 'ADMIN') {
      this.formulario.controls.doctor.disable();
    }
  }

  ngOnInit(): void {
    this.cargar();
    if (this.esAdmin()) {
      this.doctoresSrv.listar().subscribe({
        next: (datos) => this.doctores.set(datos),
        error: (err: HttpErrorResponse) =>
          this.error.set(mensajeDeError(err, 'No se pudieron cargar los doctores.')),
      });
    }
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set('');

    const peticion = this.esAdmin() ? this.servicio.listar() : this.servicio.misHorarios();
    peticion.subscribe({
      next: (datos) => {
        this.horarios.set(this.ordenar(datos));
        this.cargando.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(mensajeDeError(err, 'No se pudieron cargar los horarios.'));
        this.cargando.set(false);
      },
    });
  }

  // Por doctor, luego por dia de la semana y por hora
  private ordenar(lista: HorarioMedico[]): HorarioMedico[] {
    return [...lista].sort(
      (a, b) =>
        a.colegiaturaDoctor.localeCompare(b.colegiaturaDoctor) ||
        DIAS_SEMANA.indexOf(a.diaSemana) - DIAS_SEMANA.indexOf(b.diaSemana) ||
        a.horaInicio.localeCompare(b.horaInicio),
    );
  }

  hora(valor: string): string {
    return valor.slice(0, 5); // 08:00:00 -> 08:00
  }

  guardar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      this.error.set('Corrija los campos senalados antes de guardar.');
      return;
    }

    const v = this.formulario.getRawValue();
    const datos: HorarioRequest = {
      diaSemana: v.dia as DiaSemana,
      horaInicio: v.inicio,
      horaFin: v.fin,
    };
    if (this.esAdmin()) {
      datos.colegiatura = v.doctor;
    }

    this.error.set('');
    this.mensaje.set('');
    this.enviando.set(true);

    const peticion = this.esAdmin() ? this.servicio.crearPorAdmin(datos) : this.servicio.crearMio(datos);
    peticion.subscribe({
      next: (creado) => {
        this.horarios.update((lista) => this.ordenar([...lista, creado]));
        this.mensaje.set(`Horario del ${creado.diaSemana} agregado.`);
        this.enviando.set(false);
        // Se conserva el doctor elegido (el admin suele cargar varios dias seguidos)
        this.formulario.reset({ doctor: v.doctor, dia: '', inicio: '', fin: '' });
      },
      error: (err: HttpErrorResponse) => {
        this.enviando.set(false);
        // Ej: "Ese horario se cruza con otro del LUNES"
        this.error.set(mensajeDeError(err, 'No se pudo guardar el horario.'));
      },
    });
  }

  // PUT /api/horarios/{id}/estado?activo=...
  cambiarEstado(horario: HorarioMedico): void {
    const activo = !horario.activo;
    this.error.set('');
    this.mensaje.set('');

    this.servicio.cambiarEstado(horario.idHorario, activo).subscribe({
      next: (actualizado) => {
        this.horarios.update((lista) =>
          lista.map((h) => (h.idHorario === actualizado.idHorario ? actualizado : h)),
        );
        this.mensaje.set(`Horario del ${horario.diaSemana} ${activo ? 'activado' : 'desactivado'}.`);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(mensajeDeError(err, 'No se pudo cambiar el estado del horario.'));
      },
    });
  }
}
