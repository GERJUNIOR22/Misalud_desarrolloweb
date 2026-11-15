package com.utp.Citasmedicas.controller;

import com.utp.Citasmedicas.dto.HorarioRequest;
import com.utp.Citasmedicas.entity.HorarioMedico;
import com.utp.Citasmedicas.service.HorarioMedicoService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/horarios")
public class HorarioMedicoController {

    private final HorarioMedicoService horarioService;

    public HorarioMedicoController(HorarioMedicoService horarioService) {
        this.horarioService = horarioService;
    }

    // GET /api/horarios -> el ADMIN ve los horarios de todos los doctores
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public List<HorarioMedico> todos() {
        return horarioService.listarTodos();
    }

    // GET /api/horarios/doctor/045821 -> cualquiera con token (para saber cuando atiende)
    @GetMapping("/doctor/{colegiatura}")
    public List<HorarioMedico> deDoctor(@PathVariable String colegiatura) {
        return horarioService.listarActivosDeDoctor(colegiatura);
    }

    // GET /api/horarios/mis-horarios -> el MEDICO ve los suyos
    @GetMapping("/mis-horarios")
    @PreAuthorize("hasRole('MEDICO')")
    public ResponseEntity<?> misHorarios(Authentication auth) {
        try {
            return ResponseEntity.ok(horarioService.misHorarios(auth.getName()));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("mensaje", e.getMessage()));
        }
    }

    // POST /api/horarios/mis-horarios -> el MEDICO crea un horario para el
    @PostMapping("/mis-horarios")
    @PreAuthorize("hasRole('MEDICO')")
    public ResponseEntity<?> registrarMio(Authentication auth, @Valid @RequestBody HorarioRequest request) {
        try {
            return ResponseEntity.status(HttpStatus.CREATED).body(horarioService.registrarMio(auth.getName(), request));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("mensaje", e.getMessage()));
        }
    }

    // POST /api/horarios -> el ADMIN crea un horario para cualquier doctor
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> registrarPorAdmin(@Valid @RequestBody HorarioRequest request) {
        try {
            return ResponseEntity.status(HttpStatus.CREATED).body(horarioService.registrarPorAdmin(request));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("mensaje", e.getMessage()));
        }
    }

    // PUT /api/horarios/3/estado?activo=false -> ADMIN o el MEDICO dueño
    @PutMapping("/{id}/estado")
    @PreAuthorize("hasAnyRole('ADMIN', 'MEDICO')")
    public ResponseEntity<?> cambiarEstado(@PathVariable Long id, @RequestParam boolean activo, Authentication auth) {
        boolean esAdmin = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        try {
            HorarioMedico horario = horarioService.cambiarEstado(id, activo, auth.getName(), esAdmin);
            return ResponseEntity.ok(horario);
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("mensaje", e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("mensaje", e.getMessage()));
        }
    }
}
