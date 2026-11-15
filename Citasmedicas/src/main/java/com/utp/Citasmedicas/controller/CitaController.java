package com.utp.Citasmedicas.controller;

import com.utp.Citasmedicas.dto.CambioEstadoRequest;
import com.utp.Citasmedicas.dto.CitaRequest;
import com.utp.Citasmedicas.dto.SlotDisponible;
import com.utp.Citasmedicas.entity.EstadoCita;
import org.springframework.format.annotation.DateTimeFormat;
import java.time.LocalDate;
import com.utp.Citasmedicas.entity.Cita;
import com.utp.Citasmedicas.service.CitaService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/citas")
public class CitaController {

    private final CitaService citaService;

    public CitaController(CitaService citaService) {
        this.citaService = citaService;
    }

    // GET /api/citas -> ADMIN ve todas
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Cita>> listar(
            @RequestParam(required = false) String colegiatura,
            @RequestParam(required = false) String dni,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha,
            @RequestParam(required = false) EstadoCita estado) {
        return ResponseEntity.ok(citaService.listar(colegiatura, dni, fecha, estado));
    }

    // GET /api/citas/disponibilidad?colegiatura=045821&fecha=2026-11-20&duracion=30
    // -> los espacios del doctor ese dia, libres u ocupados (cualquiera con token)
    @GetMapping("/disponibilidad")
    public ResponseEntity<List<SlotDisponible>> disponibilidad(
            @RequestParam String colegiatura,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha,
            @RequestParam(required = false) Integer duracion) {
        return ResponseEntity.ok(citaService.disponibilidad(colegiatura, fecha, duracion));
    }

    // GET /api/citas/CIT-00001 -> el detalle (ADMIN cualquiera; el MEDICO solo las de su agenda)
    @GetMapping("/{codigo}")
    public ResponseEntity<Cita> detalle(@PathVariable String codigo, Authentication auth) {
        return ResponseEntity.ok(citaService.buscar(codigo, auth.getName(), rol(auth)));
    }

    // GET /api/citas/mis-citas -> el MEDICO ve las de su agenda
    @GetMapping("/mis-citas")
    @PreAuthorize("hasRole('MEDICO')")
    public ResponseEntity<?> misCitas(Authentication auth) {
        try {
            return ResponseEntity.ok(citaService.misCitas(auth.getName(), rol(auth)));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("mensaje", e.getMessage()));
        }
    }

    // POST /api/citas -> ADMIN (cualquier paciente y doctor) o MEDICO (un paciente, solo en su propia agenda).
    // Los pacientes sin cuenta reservan por POST /api/publico/reservas
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MEDICO')")
    public ResponseEntity<?> registrar(@Valid @RequestBody CitaRequest request, Authentication auth) {
        try {
            Cita cita = citaService.registrar(request, auth.getName(), rol(auth));
            return ResponseEntity.status(HttpStatus.CREATED).body(cita);                  // 201
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("mensaje", e.getMessage()));   // 403
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("mensaje", e.getMessage()));  // 400
        }
    }

    // PUT /api/citas/CIT-00001/estado -> confirmar, rechazar, cancelar o completar
    @PutMapping("/{codigo}/estado")
    public ResponseEntity<?> cambiarEstado(@PathVariable String codigo,
                                           @Valid @RequestBody CambioEstadoRequest request,
                                           Authentication auth) {
        try {
            return ResponseEntity.ok(citaService.cambiarEstado(codigo, request, auth.getName(), rol(auth)));
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("mensaje", e.getMessage()));   // 403
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("mensaje", e.getMessage()));                    // 400
        }
    }

    // ADMIN o MEDICO (sale del token)
    private String rol(Authentication auth) {
        return auth.getAuthorities().iterator().next().getAuthority().replace("ROLE_", "");
    }
}
