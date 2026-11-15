package com.utp.Citasmedicas.controller;

import com.utp.Citasmedicas.dto.DoctorActualizarRequest;
import com.utp.Citasmedicas.dto.DoctorRequest;
import com.utp.Citasmedicas.entity.Doctor;
import com.utp.Citasmedicas.service.DoctorService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/doctores")
public class DoctorController {

    private final DoctorService doctorService;

    public DoctorController(DoctorService doctorService) {
        this.doctorService = doctorService;
    }

    // GET /api/doctores
    @GetMapping
    public ResponseEntity<List<Doctor>> listar() {
        return ResponseEntity.ok(doctorService.listar());
    }

    // GET /api/doctores/mi-perfil -> el MEDICO ve sus datos (segun su token)
    @GetMapping("/mi-perfil")
    @PreAuthorize("hasRole('MEDICO')")
    public ResponseEntity<?> miPerfil(Authentication auth) {
        try {
            return ResponseEntity.ok(doctorService.miPerfil(auth.getName()));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("mensaje", e.getMessage()));
        }
    }

    // GET /api/doctores/045821
    @GetMapping("/{colegiatura}")
    public ResponseEntity<Doctor> buscar(@PathVariable String colegiatura) {
        Doctor doctor = doctorService.buscarPorColegiatura(colegiatura);
        if (doctor == null) {
            return ResponseEntity.notFound().build();   // 404
        }
        return ResponseEntity.ok(doctor);                // 200
    }

    // GET /api/doctores/especialidad/Pediatria
    @GetMapping("/especialidad/{especialidad}")
    public ResponseEntity<List<Doctor>> porEspecialidad(@PathVariable String especialidad) {
        return ResponseEntity.ok(doctorService.buscarPorEspecialidad(especialidad));
    }

    // POST /api/doctores -> el ADMIN crea doctor + su cuenta MEDICO
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public ResponseEntity<?> registrar(@Valid @RequestBody DoctorRequest request) {
        try {
            return ResponseEntity.status(HttpStatus.CREATED).body(doctorService.registrar(request));   // 201
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("mensaje", e.getMessage()));               // 400
        }
    }

    // PUT /api/doctores/045821 -> el ADMIN actualiza datos
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{colegiatura}")
    public ResponseEntity<?> actualizar(@PathVariable String colegiatura,
                                        @Valid @RequestBody DoctorActualizarRequest request) {
        try {
            return ResponseEntity.ok(doctorService.actualizar(colegiatura, request));                  // 200
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("mensaje", e.getMessage()));               // 400
        }
    }
}
