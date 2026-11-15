import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CitaCard } from '../cita-card/cita-card';
import { Cita, EstadoCita, PARTICIPIO_ESTADO } from '../../models/cita';
import { AuthService } from '../../services/auth.service';
import { CitasService } from '../../services/citas.service';
import { mensajeDeError } from '../../utils/errores';

// Componente PADRE: pide las citas a la API y decide que hacer con los eventos de los hijos
@Component({
  selector: 'app-lista-citas',
  imports: [CitaCard, RouterLink],
  templateUrl: './lista-citas.html',
  styleUrl: './lista-citas.scss',
})
export class ListaCitas implements OnInit {
  private servicio = inject(CitasService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  auth = inject(AuthService);

  titulo = computed(() => (this.auth.rol() === 'ADMIN' ? 'Todas las citas' : 'Mis citas'));

  // Estados de la pantalla: datos, cargando, error y exito
  citas = signal<Cita[]>([]);
  cargando = signal(false);
  error = signal('');
  mensaje = signal('');

  ngOnInit(): void {
    // Si venimos de reservar una cita (hecha por el personal): /citas?reservada=CIT-00007
    const reservada = this.route.snapshot.queryParamMap.get('reservada');
    if (reservada) {
      this.mensaje.set(`Cita ${reservada} reservada correctamente.`);
    }
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set('');

    this.servicio.listar().subscribe({
      next: (datos) => {
        this.citas.set(datos);
        this.cargando.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(mensajeDeError(err, 'No se pudieron cargar las citas.'));
        this.cargando.set(false);
      },
    });

  }

  // Llega el evento (seleccionada) de una tarjeta -> navegacion programatica
  verDetalle(codigo: string): void {
    this.router.navigate(['/citas', codigo]);
  }

  // Llega el evento (cancelar) de una tarjeta
  cancelarCita(codigo: string): void {
    this.cambiarEstado(codigo, 'CANCELADA');
  }

  // Llega el evento (cambiarEstado) de una tarjeta: el medico confirma, rechaza o completa
  cambiarEstadoCita(cambio: { codigo: string; estado: EstadoCita }): void {
    this.cambiarEstado(cambio.codigo, cambio.estado);
  }

  // PUT /api/citas/{codigo}/estado  (el backend valida quien puede hacer cada cambio)
  private cambiarEstado(codigo: string, estado: EstadoCita): void {
    this.error.set('');
    this.mensaje.set('');

    this.servicio.cambiarEstado(codigo, estado).subscribe({
      next: (actualizada) => {
        // Reemplaza solo la cita que cambio
        this.citas.update((lista) => lista.map((c) => (c.codigo === codigo ? actualizada : c)));
        this.mensaje.set(`La cita ${codigo} ${PARTICIPIO_ESTADO[estado]}.`);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(mensajeDeError(err, 'No se pudo cambiar el estado de la cita.'));
      },
    });
  }
}
