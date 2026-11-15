package com.utp.Citasmedicas.service;

import com.utp.Citasmedicas.exception.*;
import com.utp.Citasmedicas.dto.PagoRequest;
import com.utp.Citasmedicas.entity.*;
import com.utp.Citasmedicas.repository.CitaRepository;
import com.utp.Citasmedicas.repository.PagoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

@Service
public class PagoService {

    private final PagoRepository pagoRepository;
    private final CitaRepository citaRepository;

    public PagoService(PagoRepository pagoRepository, CitaRepository citaRepository) {
        this.pagoRepository = pagoRepository;
        this.citaRepository = citaRepository;
    }

    // ADMIN: todos
    public List<Pago> listar() {
        return pagoRepository.findAll();
    }

    // ADMIN: los de una cita
    public List<Pago> deCita(String codigo) {
        return pagoRepository.findByCitaCodigo(codigo);
    }

    // ADMIN: resumen de caja (JPQL con SUM)
    public Map<String, BigDecimal> resumen() {
        return Map.of(
                "cobrado", pagoRepository.totalPorEstado(EstadoPago.COMPLETADO),
                "porCobrar", pagoRepository.totalPorEstado(EstadoPago.PENDIENTE));
    }

    // Cobro en CAJA (lo registra el ADMIN) de una cita atendida: SIMULADO
    @Transactional
    public Pago pagar(PagoRequest request) {
        Cita cita = citaRepository.findById(request.getCodigoCita())
                .orElseThrow(() -> new RecursoNoEncontradoException("No existe la cita " + request.getCodigoCita()));
        return crearPago(cita, request.getMetodo());
    }

    // Cobro de una reserva publica (sin login): el paciente paga ANTES de que la cita quede reservada
    @Transactional
    public Pago cobrarReserva(Cita cita, MetodoPago metodo) {
        return crearPago(cita, metodo);
    }

    // Reglas comunes de TODO pago: estado de la cita, pago unico y monto del servidor
    private Pago crearPago(Cita cita, MetodoPago metodo) {

        // Regla 2: no se paga una cita cancelada o rechazada
        if (cita.getEstado() == EstadoCita.CANCELADA || cita.getEstado() == EstadoCita.RECHAZADA) {
            throw new ReglaNegocioException("No se puede pagar una cita " + cita.getEstado());
        }

        // Regla 3: no pagar dos veces
        if (pagoRepository.existsByCitaCodigoAndEstadoIn(cita.getCodigo(),
                List.of(EstadoPago.PENDIENTE, EstadoPago.COMPLETADO))) {
            throw new ReglaNegocioException("La cita " + cita.getCodigo() + " ya tiene un pago registrado");
        }

        // El monto sale de la especialidad del doctor (el cliente NO lo manda)
        Especialidad especialidad = cita.getDoctor().getEspecialidad();
        if (especialidad == null || especialidad.getPrecio() == null
                || especialidad.getPrecio().signum() <= 0) {
            throw new ReglaNegocioException("El doctor no tiene una especialidad con precio definido");
        }

        Pago pago = new Pago(cita, especialidad.getPrecio(), metodo);

        // Simulacion: efectivo se paga en caja (queda PENDIENTE)
        //             tarjeta, yape, plin y transferencia se aprueban al toque
        if (metodo == MetodoPago.EFECTIVO) {
            pago.setEstado(EstadoPago.PENDIENTE);
        } else {
            pago.setEstado(EstadoPago.COMPLETADO);
            pago.setNumeroOperacion(generarOperacion());
        }
        return pagoRepository.save(pago);
    }

    // ADMIN en caja: confirma (COMPLETADO) o rechaza un pago PENDIENTE
    @Transactional
    public Pago cambiarEstado(Long idPago, EstadoPago nuevo) {
        Pago pago = pagoRepository.findById(idPago)
                .orElseThrow(() -> new RecursoNoEncontradoException("No existe el pago " + idPago));

        if (pago.getEstado() != EstadoPago.PENDIENTE) {
            throw new ReglaNegocioException("Solo se cambia un pago PENDIENTE (este esta " + pago.getEstado() + ")");
        }
        if (nuevo == EstadoPago.PENDIENTE) {
            throw new ReglaNegocioException("El nuevo estado debe ser COMPLETADO o RECHAZADO");
        }

        pago.setEstado(nuevo);
        if (nuevo == EstadoPago.COMPLETADO) {
            pago.setNumeroOperacion(generarOperacion());
        }
        return pagoRepository.save(pago);
    }

    private String generarOperacion() {
        return "OP-" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
    }
}
