import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Paciente } from '../../../models/paciente';
import { PacientesService } from '../../../services/pacientes.service';
import { mensajeDeError } from '../../../utils/errores';

// El ADMIN consulta los pacientes (util para conocer el DNI al reservar una cita por ellos)
@Component({
  selector: 'app-admin-pacientes',
  imports: [],
  templateUrl: './pacientes.html',
  styleUrl: './pacientes.scss',
})
export class AdminPacientes implements OnInit {
  private servicio = inject(PacientesService);

  pacientes = signal<Paciente[]>([]);
  cargando = signal(false);
  error = signal('');
  filtro = signal('');

  // Filtra por DNI, nombre o apellido
  filtrados = computed(() => {
    const texto = this.filtro().trim().toLowerCase();
    if (!texto) return this.pacientes();
    return this.pacientes().filter((p) =>
      `${p.dni} ${p.nombres} ${p.apellidos}`.toLowerCase().includes(texto),
    );
  });

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set('');

    this.servicio.listar().subscribe({
      next: (datos) => {
        this.pacientes.set(datos);
        this.cargando.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(mensajeDeError(err, 'No se pudieron cargar los pacientes.'));
        this.cargando.set(false);
      },
    });
  }

  alEscribir(evento: Event): void {
    this.filtro.set((evento.target as HTMLInputElement).value);
  }
}
