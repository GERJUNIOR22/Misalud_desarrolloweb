package com.utp.Citasmedicas.controller;

import com.utp.Citasmedicas.dto.*;
import com.utp.Citasmedicas.service.CitaService;
import com.utp.Citasmedicas.service.ReservaPublicaService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

// Endpoints PUBLICOS (sin login) para que cualquier persona reserve una cita.
// Todo lo demas de la API sigue protegido con JWT. Los errores los formatea GlobalExceptionHandler.
@RestController
@RequestMapping("/api/publico")
public class PublicoController {

    private final ReservaPublicaService reservaService;
    private final CitaService citaService;

    public PublicoController(ReservaPublicaService reservaService, CitaService citaService) {
        this.reservaService = reservaService;
        this.citaService = citaService;
    }

    // GET /api/publico/especialidades
    @GetMapping("/especialidades")
    public List<EspecialidadPublica> especialidades() {
        return reservaService.especialidades();
    }

    // GET /api/publico/doctores?idEspecialidad=1
    @GetMapping("/doctores")
    public List<DoctorPublico> doctores(@RequestParam(required = false) Long idEspecialidad) {
        return reservaService.doctores(idEspecialidad);
    }

    // GET /api/publico/disponibilidad?colegiatura=045821&fecha=2026-11-20
    @GetMapping("/disponibilidad")
    public List<SlotDisponible> disponibilidad(
            @RequestParam String colegiatura,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha) {
        return citaService.disponibilidad(colegiatura, fecha, null);
    }

    // POST /api/publico/reservas -> reserva la cita y registra el pago, todo junto
    @PostMapping("/reservas")
    public ResponseEntity<ReservaPublicaResponse> reservar(@Valid @RequestBody ReservaPublicaRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(reservaService.reservar(request));
    }

    // GET /api/publico/citas/CIT-00007?dni=71234567 -> estado de la cita (sin datos de salud)
    @GetMapping("/citas/{codigo}")
    public ReservaPublicaResponse consultar(@PathVariable String codigo, @RequestParam String dni) {
        return reservaService.consultar(codigo, dni);
    }
}
