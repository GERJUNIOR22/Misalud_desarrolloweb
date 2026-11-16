import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CitasService } from '../../services/citas.service';
import { DoctoresService } from '../../services/doctores.service';
import { PacientesService } from '../../services/pacientes.service';
import { Cita, EstadoCita } from '../../models/cita';

interface SegmentoEstado {
  estado: EstadoCita;
  etiqueta: string;
  color: string;
  cantidad: number;
  porcentaje: number;
  dasharray: string;
  dashoffset: number;
}

const MESES_CORTOS = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
];

const ESTADOS_META: { estado: EstadoCita; etiqueta: string; color: string }[] = [
  { estado: 'PENDIENTE', etiqueta: 'Pendiente', color: '#f5b800' },
  { estado: 'CONFIRMADA', etiqueta: 'Confirmada', color: '#0d6efd' },
  { estado: 'COMPLETADA', etiqueta: 'Completada', color: '#19a974' },
  { estado: 'RECHAZADA', etiqueta: 'Rechazada', color: '#dc3545' },
  { estado: 'CANCELADA', etiqueta: 'Cancelada', color: '#6c757d' },
];

const RADIO_DONA = 62;
const CIRCUNFERENCIA_DONA = 2 * Math.PI * RADIO_DONA;

// Inicio del PERSONAL: panel principal con resumen, indicadores y próximas citas
@Component({
  selector: 'app-inicio',
  imports: [RouterLink],
  templateUrl: './inicio.html',
  styleUrl: './inicio.scss',
})
export class Inicio implements OnInit {
  auth = inject(AuthService);
  private citasService = inject(CitasService);
  private doctoresService = inject(DoctoresService);
  private pacientesService = inject(PacientesService);

  citas = signal<Cita[]>([]);
  totalDoctores = signal(0);
  totalPacientes = signal(0);
  nombreMedico = signal('');
  cargando = signal(true);

  readonly radioDona = RADIO_DONA;
  readonly circunferenciaDona = CIRCUNFERENCIA_DONA;

  private hoyDate = new Date();
  readonly hoyIso = this.formatearIso(this.hoyDate);
  readonly fechaFormateada = `${this.hoyDate.getDate()} de ${MESES_CORTOS[this.hoyDate.getMonth()]}, ${this.hoyDate.getFullYear()}`;

  nombreSaludo = computed(() => {
    if (this.auth.rol() === 'ADMIN') {
      return 'Administrador Principal';
    }
    if (this.nombreMedico()) {
      return this.nombreMedico();
    }
    return this.auth.sesion()?.correo ?? 'Médico';
  });

  citasHoy = computed(() =>
    this.citas().filter((c) => c.fecha === this.hoyIso).length
  );

  citasConfirmadas = computed(() =>
    this.citas().filter((c) => c.estado === 'CONFIRMADA').length
  );

  citasCompletadas = computed(() =>
    this.citas().filter((c) => c.estado === 'COMPLETADA').length
  );

  proximasCitas = computed(() =>
    this.citas()
      .filter(
        (c) =>
          (c.estado === 'PENDIENTE' || c.estado === 'CONFIRMADA') &&
          c.fecha >= this.hoyIso
      )
      .sort((a, b) => `${a.fecha} ${a.hora}`.localeCompare(`${b.fecha} ${b.hora}`))
      .slice(0, 6)
  );

  segmentosEstado = computed<SegmentoEstado[]>(() => {
    const lista = this.citas();
    const total = lista.length;
    if (total === 0) return [];

    let acumulado = 0;
    const segmentos: SegmentoEstado[] = [];

    for (const meta of ESTADOS_META) {
      const cantidad = lista.filter((c) => c.estado === meta.estado).length;
      if (cantidad === 0) continue;

      const fraccion = cantidad / total;
      const longitud = fraccion * CIRCUNFERENCIA_DONA;
      const dashoffset = -acumulado;
      acumulado += longitud;

      segmentos.push({
        estado: meta.estado,
        etiqueta: meta.etiqueta,
        color: meta.color,
        cantidad,
        porcentaje: Math.round(fraccion * 100),
        dasharray: `${longitud} ${CIRCUNFERENCIA_DONA - longitud}`,
        dashoffset,
      });
    }

    return segmentos;
  });

  ngOnInit(): void {
    this.cargarPanel();
  }

  cargarPanel(): void {
    this.cargando.set(true);

    this.citasService.listar().subscribe({
      next: (datos) => {
        this.citas.set(datos);
        this.cargando.set(false);
      },
      error: () => {
        this.cargando.set(false);
      },
    });

    if (this.auth.rol() === 'ADMIN') {
      this.doctoresService.listar().subscribe({
        next: (docs) => this.totalDoctores.set(docs.length),
        error: () => {},
      });
      this.pacientesService.listar().subscribe({
        next: (pacs) => this.totalPacientes.set(pacs.length),
        error: () => {},
      });
    } else if (this.auth.rol() === 'MEDICO') {
      this.doctoresService.miPerfil().subscribe({
        next: (doc) => this.nombreMedico.set(`Dr. ${doc.nombres} ${doc.apellidos}`),
        error: () => {},
      });
    }
  }

  claseEstado(estado: EstadoCita): string {
    return `badge-${estado.toLowerCase()}`;
  }

  etiquetaEstado(estado: EstadoCita): string {
    return ESTADOS_META.find((e) => e.estado === estado)?.etiqueta ?? estado;
  }

  private formatearIso(d: Date): string {
    const anio = d.getFullYear();
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const dia = String(d.getDate()).padStart(2, '0');
    return `${anio}-${mes}-${dia}`;
  }
}
