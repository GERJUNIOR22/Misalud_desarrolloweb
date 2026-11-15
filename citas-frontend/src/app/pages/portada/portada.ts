import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ConsultaEstado } from '../../models/publico';

// Portada publica de "Mi salud": reservar una cita o consultar una ya reservada (sin cuenta)
@Component({
  selector: 'app-portada',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './portada.html',
  styleUrl: './portada.scss',
})
export class Portada {
  private router = inject(Router);

  pasos = [
    { numero: '01', texto: 'Elige especialidad y horario' },
    { numero: '02', texto: 'Paga tu consulta' },
    { numero: '03', texto: 'Recibe tu código de cita' },
  ];

  // Consulta de una cita ya reservada: codigo + DNI
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

  consultar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    const { codigo, dni } = this.formulario.getRawValue();
    // El DNI viaja en el "state" de la navegacion y no en la URL (no queda en el historial)
    const estado: ConsultaEstado = { codigo: codigo.trim().toUpperCase(), dni: dni.trim() };
    this.router.navigate(['/mi-cita'], { state: estado });
  }
}
