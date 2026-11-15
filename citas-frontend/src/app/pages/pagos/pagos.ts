import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { of, switchMap } from 'rxjs';
import { Cita } from '../../models/cita';
import { EstadoPago, MetodoPago, METODOS_PAGO, Pago, ResumenPagos } from '../../models/pago';
import { CitasService } from '../../services/citas.service';
import { PagosService } from '../../services/pagos.service';
import { mensajeDeError } from '../../utils/errores';

// Caja (solo ADMIN): totales, citas atendidas sin cobro y todos los pagos.
// Los pacientes pagan EN LINEA al reservar; aqui se cobran las citas creadas por el personal.
@Component({
  selector: 'app-pagos',
  imports: [DatePipe, DecimalPipe],
  templateUrl: './pagos.html',
  styleUrl: './pagos.scss',
})
export class Pagos implements OnInit {
  private servicio = inject(PagosService);
  private citas = inject(CitasService);

  pagos = signal<Pago[]>([]);
  resumen = signal<ResumenPagos | null>(null);
  cargando = signal(false);
  error = signal('');
  mensaje = signal('');

  // Citas completadas que todavia no tienen un cobro registrado
  private completadas = signal<Cita[]>([]);
  metodos = METODOS_PAGO;
  sinCobro = computed(() =>
    this.completadas().filter(
      (c) => !this.pagos().some((p) => p.codigoCita === c.codigo && p.estado !== 'RECHAZADO'),
    ),
  );

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set('');

    this.servicio.listar().subscribe({
      next: (datos) => {
        this.pagos.set(datos);
        this.cargando.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(mensajeDeError(err, 'No se pudieron cargar los pagos.'));
        this.cargando.set(false);
      },
    });

    this.cargarResumen();
    this.cargarCompletadas();
  }

  private cargarResumen(): void {
    this.servicio.resumen().subscribe({
      next: (datos) => this.resumen.set(datos),
      error: () => this.resumen.set(null), // el resumen es un extra: si falla no se bloquea la pantalla
    });
  }

  // GET /api/citas (ADMIN) y se quedan solo las COMPLETADAS
  private cargarCompletadas(): void {
    this.citas.listar().subscribe({
      next: (datos) => this.completadas.set(datos.filter((c) => c.estado === 'COMPLETADA')),
      error: (err: HttpErrorResponse) =>
        this.error.set(mensajeDeError(err, 'No se pudieron cargar las citas completadas.')),
    });
  }

  // Caja registra el cobro de una cita completada: POST /api/pagos (el monto lo calcula el servidor).
  // Si es en efectivo, el backend lo deja PENDIENTE; con "confirmar" se confirma en el mismo paso
  // (PUT /api/pagos/{id}/estado?estado=COMPLETADO), porque el dinero se recibe en el mostrador.
  cobrar(cita: Cita, metodo: string, confirmar: boolean): void {
    this.error.set('');
    this.mensaje.set('');

    this.servicio
      .pagar({ codigoCita: cita.codigo, metodo: metodo as MetodoPago })
      .pipe(
        switchMap((pago) =>
          confirmar && pago.estado === 'PENDIENTE'
            ? this.servicio.cambiarEstado(pago.idPago, 'COMPLETADO')
            : of(pago),
        ),
      )
      .subscribe({
        next: (pago) => {
          this.pagos.update((lista) => [pago, ...lista]); // la cita sale sola de "sin cobro"
          this.mensaje.set(
            pago.estado === 'PENDIENTE'
              ? `Cobro de la cita ${cita.codigo} registrado en efectivo: confirmelo cuando reciba el dinero.`
              : `Cobro de la cita ${cita.codigo} registrado y confirmado.`,
          );
          this.cargarResumen();
        },
        error: (err: HttpErrorResponse) => {
          this.error.set(mensajeDeError(err, 'No se pudo registrar el cobro.'));
          this.cargar(); // por si el pago se creo pero no alcanzo a confirmarse: se vuelve a leer
        },
      });
  }

  // ADMIN en caja: confirma (COMPLETADO) o rechaza (RECHAZADO) un pago PENDIENTE
  cambiarEstado(pago: Pago, estado: EstadoPago): void {
    this.error.set('');
    this.mensaje.set('');

    this.servicio.cambiarEstado(pago.idPago, estado).subscribe({
      next: (actualizado) => {
        this.pagos.update((lista) => lista.map((p) => (p.idPago === pago.idPago ? actualizado : p)));
        this.mensaje.set(
          estado === 'COMPLETADO'
            ? `Pago de la cita ${pago.codigoCita} confirmado.`
            : `Pago de la cita ${pago.codigoCita} rechazado.`,
        );
        this.cargarResumen(); // los totales cambian
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(mensajeDeError(err, 'No se pudo cambiar el estado del pago.'));
      },
    });
  }
}
