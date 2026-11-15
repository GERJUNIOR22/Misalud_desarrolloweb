package com.utp.Citasmedicas.controller;

import com.utp.Citasmedicas.dto.DatosDni;
import com.utp.Citasmedicas.dto.PacienteActualizarRequest;
import com.utp.Citasmedicas.entity.Paciente;
import com.utp.Citasmedicas.service.PacienteService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/pacientes")
public class PacienteController {

    private final PacienteService pacienteService;

    public PacienteController(PacienteService pacienteService) {
        this.pacienteService = pacienteService;
    }

    // GET /api/pacientes -> solo ADMIN (datos personales de todos)
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public List<Paciente> listar() {
        return pacienteService.listar();
    }

    // GET /api/pacientes/consulta-dni/71234567 -> ADMIN y MEDICO (autocompletar al reservar)
    // Devuelve la ficha si existe; si no, los datos de RENIEC
    @GetMapping("/consulta-dni/{dni}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MEDICO')")
    public DatosDni consultarDni(@PathVariable String dni) {
        return pacienteService.consultarDni(dni);
    }

    // GET /api/pacientes/71234567 -> solo ADMIN
    @GetMapping("/{dni}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> buscar(@PathVariable String dni) {
        try {
            return ResponseEntity.ok(pacienteService.buscarPorDni(dni));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("mensaje", e.getMessage()));
        }
    }

    // PUT /api/pacientes/71234567 -> solo ADMIN
    @PutMapping("/{dni}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> actualizar(@PathVariable String dni,
                                        @Valid @RequestBody PacienteActualizarRequest request) {
        try {
            return ResponseEntity.ok(pacienteService.actualizarPorDni(dni, request));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("mensaje", e.getMessage()));
        }
    }
}
