package com.utp.Citasmedicas.controller;

import com.utp.Citasmedicas.dto.LoginRequest;
import com.utp.Citasmedicas.dto.LoginResponse;
import com.utp.Citasmedicas.service.JwtService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    public AuthController(AuthenticationManager authenticationManager, JwtService jwtService) {
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
    }

    // POST /auth/login -> revisa correo y clave, devuelve el token
    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getCorreo(), request.getPassword()));

            UserDetails usuario = (UserDetails) authentication.getPrincipal();
            String token = jwtService.generarToken(usuario);
            String rol = usuario.getAuthorities().iterator().next().getAuthority().replace("ROLE_", "");

            // El sistema interno es solo para el personal (ADMIN y MEDICO). Una cuenta antigua de
            // paciente no recibe token: se rechaza en el servidor, no solo en la pantalla.
            if (rol.equals("PACIENTE")) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("mensaje",
                        "El acceso es solo para el personal de la clinica. Los pacientes reservan desde la pagina principal"));
            }

            return ResponseEntity.ok(new LoginResponse(token, usuario.getUsername(), rol));

        } catch (DisabledException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("mensaje", "Tu cuenta esta desactivada"));
        } catch (AuthenticationException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("mensaje", "Correo o contraseña incorrectos"));
        }
    }

    // No hay registro publico: las cuentas del personal solo las crea el ADMIN (POST /api/doctores).
    // Los pacientes no tienen cuenta: reservan desde /api/publico/**

    // GET /auth/perfil -> ejercicio S09: quien soy segun mi token
    @GetMapping("/perfil")
    public Map<String, String> perfil(Authentication auth) {
        return Map.of(
                "usuario", auth.getName(),
                "roles", auth.getAuthorities().toString());
    }
}
