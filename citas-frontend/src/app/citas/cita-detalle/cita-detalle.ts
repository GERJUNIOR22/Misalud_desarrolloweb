import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  accionesPosibles,
  Cita,
  ETIQUETA_ACCION,
  EstadoCita,
  PARTICIPIO_ESTADO,
} from '../../models/cita';
import { AuthService } from '../../services/auth.service';
import { CitasService } from '../../services/citas.service';
import { mensajeDeError } from '../../utils/errores';

// Vista de DETALLE: /citas/:codigo  (ruta con parametro)
@Component({
  selector: 'app-cita-detalle',
  imports: [RouterLink, ReactiveFormsModule],
  templateUrl: './cita-detalle.html',
  styleUrl: './cita-detalle.scss',
})
export class CitaDetalle implements OnInit {
  private route = inject(ActivatedRoute);
  private servicio = inject(CitasService);
  private auth = inject(AuthService);

  // Lee el parametro ":codigo" de la URL con ActivatedRoute
  codigo = this.route.snapshot.paramMap.get('codigo');

  cita = signal<Cita | null>(null);
  cargando = signal(false);
  error = signal('');
  mensaje = signal('');

  // Observacion opcional que el medico deja al cambiar el estado (el backend admite 300 caracteres)
  observacion = new FormControl('', {
    nonNullable: true,
    validators: [Validators.maxLength(300)],
  });

  // El medico no cancela (lo exige el backend); el paciente y el admin si
  puedeCancelar = computed(() => {
    const estado = this.cita()?.estado;
    return this.auth.rol() !== 'MEDICO' && (estado === 'PENDIENTE' || estado === 'CONFIRMADA');
  });

  // El MEDICO y el ADMIN gestionan la cita: Confirmar, Rechazar o Completar segun su estado
  acciones = computed(() => {
    const rol = this.auth.rol();
    return rol === 'MEDICO' || rol === 'ADMIN' ? accionesPosibles(this.cita()?.estado) : [];
  });

  etiqueta(estado: EstadoCita): string {
    return ETIQUETA_ACCION[estado] ?? estado;
  }

  ngOnInit(): void {
    if (!this.codigo) {
      this.error.set('No se indico el codigo de la cita.');
      return;
    }

    this.cargando.set(true);
    this.servicio.buscar(this.codigo).subscribe({
      next: (cita) => {
        this.cita.set(cita);
        this.cargando.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(mensajeDeError(err, 'No se pudo cargar la cita.'));
        this.cargando.set(false);
      },
    });
  }

  cancelar(): void {
    this.cambiarEstado('CANCELADA');
  }

  // PUT /api/citas/{codigo}/estado  con la observacion opcional
  cambiarEstado(estado: EstadoCita): void {
    if (!this.codigo) return;

    if (this.observacion.invalid) {
      this.observacion.markAsTouched();
      return;
    }

    this.error.set('');
    this.mensaje.set('');
    const texto = this.observacion.value.trim();

    this.servicio.cambiarEstado(this.codigo, estado, texto || undefined).subscribe({
      next: (actualizada) => {
        this.cita.set(actualizada);
        this.observacion.reset('');
        this.mensaje.set(`La cita ${actualizada.codigo} ${PARTICIPIO_ESTADO[estado]}.`);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(mensajeDeError(err, 'No se pudo cambiar el estado de la cita.'));
      },
    });
  }
}
