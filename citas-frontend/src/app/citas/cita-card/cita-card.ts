import { Component, computed, input, output } from '@angular/core';
import { accionesPosibles, Cita, ETIQUETA_ACCION, EstadoCita } from '../../models/cita';

// Componente HIJO reutilizable (Semana 12):
//   - recibe datos del padre con input()   -> los datos BAJAN
//   - avisa al padre con output()          -> los eventos SUBEN
@Component({
  selector: 'app-cita-card',
  imports: [],
  templateUrl: './cita-card.html',
  styleUrl: './cita-card.scss',
})
export class CitaCard {
  // El padre entrega la cita: <app-cita-card [cita]="..." />
  cita = input.required<Cita>();

  // true cuando quien mira es el MEDICO: ve al PACIENTE y tiene acciones para gestionar la cita
  // (el ADMIN ve al doctor)
  mostrarPaciente = input(false);

  // El hijo avisa; el padre decide que hacer: <app-cita-card (seleccionada)="..." />
  seleccionada = output<string>();
  cancelar = output<string>();
  cambiarEstado = output<{ codigo: string; estado: EstadoCita }>();


  // Solo se cancela una cita pendiente o confirmada. El medico no cancela (lo exige el backend)
  puedeCancelar = computed(
    () =>
      !this.mostrarPaciente() &&
      (this.cita().estado === 'PENDIENTE' || this.cita().estado === 'CONFIRMADA'),
  );

  // Acciones del medico segun el estado actual: Confirmar / Rechazar / Completar
  acciones = computed(() => (this.mostrarPaciente() ? accionesPosibles(this.cita().estado) : []));

  etiqueta(estado: EstadoCita): string {
    return ETIQUETA_ACCION[estado] ?? estado;
  }

  verDetalle(): void {
    this.seleccionada.emit(this.cita().codigo);
  }

  alCancelar(): void {
    this.cancelar.emit(this.cita().codigo);
  }

  alCambiarEstado(estado: EstadoCita): void {
    this.cambiarEstado.emit({ codigo: this.cita().codigo, estado });
  }
}
