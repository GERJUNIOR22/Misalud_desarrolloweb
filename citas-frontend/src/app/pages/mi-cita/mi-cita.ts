import { Component, inject, OnInit, signal } from '@angular/core';
import { DecimalPipe, Location } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ConsultaEstado, ReservaPublicaResponse } from '../../models/publico';
import { PublicoService } from '../../services/publico.service';
import { mensajeDeError } from '../../utils/errores';

// Consulta de una cita con codigo + DNI. Tambien es la pantalla de confirmacion al reservar.
@Component({
  selector: 'app-mi-cita',
  imports: [ReactiveFormsModule, RouterLink, DecimalPipe],
  templateUrl: './mi-cita.html',
  styleUrl: './mi-cita.scss',
})
export class MiCita implements OnInit {
  private publico = inject(PublicoService);
  private ubicacion = inject(Location);

  formulario = new FormGroup({
    codigo: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/^CIT-\d{5}$/i)],
    }),
    dni: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/^\d{8}$/)],
    }),
  });

  reserva = signal<ReservaPublicaResponse | null>(null);
  cargando = signal(false);
  error = signal('');
  esNueva = signal(false); // true cuando se llega justo despues de reservar

  ngOnInit(): void {
    // Si se llega desde la portada o desde la reserva, el codigo y el DNI vienen en el "state"
    const estado = (this.ubicacion.getState() ?? {}) as ConsultaEstado;
    if (estado.codigo && estado.dni) {
      this.formulario.setValue({ codigo: estado.codigo, dni: estado.dni });
      this.esNueva.set(!!estado.nueva);
      this.buscar();
    }
  }

  consultar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }
    this.esNueva.set(false);
    this.buscar();
  }

  private buscar(): void {
    const { codigo, dni } = this.formulario.getRawValue();

    this.cargando.set(true);
    this.error.set('');
    this.reserva.set(null);

    this.publico.consultar(codigo.trim().toUpperCase(), dni.trim()).subscribe({
      next: (datos) => {
        this.reserva.set(datos);
        this.cargando.set(false);
      },
      error: (err: HttpErrorResponse) => {
        // Ej: "No se encontro una cita con ese codigo y DNI"
        this.error.set(mensajeDeError(err, 'No se pudo consultar la cita. Intente de nuevo.'));
        this.cargando.set(false);
      },
    });
  }
}
