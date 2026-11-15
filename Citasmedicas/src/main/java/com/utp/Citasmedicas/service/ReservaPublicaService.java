package com.utp.Citasmedicas.service;

import com.utp.Citasmedicas.dto.*;
import com.utp.Citasmedicas.entity.*;
import com.utp.Citasmedicas.exception.RecursoNoEncontradoException;
import com.utp.Citasmedicas.exception.ReglaNegocioException;
import com.utp.Citasmedicas.repository.CitaRepository;
import com.utp.Citasmedicas.repository.DoctorRepository;
import com.utp.Citasmedicas.repository.EspecialidadRepository;
import com.utp.Citasmedicas.repository.PacienteRepository;
import com.utp.Citasmedicas.repository.PagoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

// Reserva EN LINEA de un paciente SIN cuenta: no se crea ningun usuario.
// Sus datos quedan solo en la ficha del paciente (tabla paciente), identificada por el DNI.
@Service
public class ReservaPublicaService {

    private final PacienteRepository pacienteRepository;
    private final CitaRepository citaRepository;
    private final PagoRepository pagoRepository;
    private final EspecialidadRepository especialidadRepository;
    private final DoctorRepository doctorRepository;
    private final CitaService citaService;
    private final PagoService pagoService;

    public ReservaPublicaService(PacienteRepository pacienteRepository,
                                 CitaRepository citaRepository,
                                 PagoRepository pagoRepository,
                                 EspecialidadRepository especialidadRepository,
                                 DoctorRepository doctorRepository,
                                 CitaService citaService,
                                 PagoService pagoService) {
        this.pacienteRepository = pacienteRepository;
        this.citaRepository = citaRepository;
        this.pagoRepository = pagoRepository;
        this.especialidadRepository = especialidadRepository;
        this.doctorRepository = doctorRepository;
        this.citaService = citaService;
        this.pagoService = pagoService;
    }

    // Solo las especialidades activas, con su precio
    public List<EspecialidadPublica> especialidades() {
        return especialidadRepository.findByActivoTrue().stream()
                .map(e -> new EspecialidadPublica(e.getIdEspecialidad(), e.getNombre(), e.getDescripcion(), e.getPrecio()))
                .toList();
    }

    // Doctores de especialidades activas (opcionalmente de una sola), sin datos de su cuenta
    public List<DoctorPublico> doctores(Long idEspecialidad) {
        return doctorRepository.findAll().stream()
                .filter(d -> d.getEspecialidad() != null && d.getEspecialidad().isActivo())
                .filter(d -> idEspecialidad == null || idEspecialidad.equals(d.getEspecialidad().getIdEspecialidad()))
                .map(d -> new DoctorPublico(d.getColegiatura(), d.getNombres(), d.getApellidos(),
                        d.getEspecialidad().getIdEspecialidad(), d.getEspecialidad().getNombre()))
                .toList();
    }

    // Reserva + pago en UNA transaccion: si la cita no se puede reservar (horario ocupado...)
    // o el pago falla, no queda nada guardado (ni la cita, ni el pago, ni el paciente nuevo).
    @Transactional
    public ReservaPublicaResponse reservar(ReservaPublicaRequest r) {
        // Se paga ANTES de reservar, asi que solo sirven los metodos en linea
        if (r.getMetodo() == MetodoPago.EFECTIVO) {
            throw new ReglaNegocioException("Para reservar en linea pague con tarjeta, Yape, Plin o transferencia");
        }

        // Si el DNI ya existe se reutiliza su ficha (sin sobrescribir sus datos); si no, se crea sin usuario
        Paciente paciente = pacienteRepository.findById(r.getDni()).orElseGet(() ->
                pacienteRepository.save(new Paciente(r.getDni(), r.getNombres().trim(), r.getApellidos().trim(),
                        null, r.getTelefono(), null)));

        CitaRequest solicitud = new CitaRequest();
        solicitud.setColegiaturaDoctor(r.getColegiaturaDoctor());
        solicitud.setFecha(r.getFecha());
        solicitud.setHora(r.getHora());
        solicitud.setMotivo(r.getMotivo().trim());

        Cita cita = citaService.registrarParaPaciente(paciente, solicitud);
        Pago pago = pagoService.cobrarReserva(cita, r.getMetodo()); // el monto lo calcula el servidor
        return ReservaPublicaResponse.de(cita, pago);
    }

    // El paciente consulta su cita con el codigo Y su DNI (los dos deben coincidir)
    @Transactional(readOnly = true)
    public ReservaPublicaResponse consultar(String codigo, String dni) {
        Cita cita = citaRepository.findById(codigo)
                .filter(c -> c.getPaciente().getDni().equals(dni))
                .orElseThrow(() -> new RecursoNoEncontradoException(
                        "No se encontro una cita con ese codigo y DNI"));

        Pago vigente = pagoRepository.findByCitaCodigo(codigo).stream()
                .filter(p -> p.getEstado() != EstadoPago.RECHAZADO)
                .findFirst()
                .orElse(null);
        return ReservaPublicaResponse.de(cita, vigente);
    }
}
