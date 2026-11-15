package com.utp.Citasmedicas.config;

import com.utp.Citasmedicas.security.JwtAuthenticationFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtFilter;

    public SecurityConfig(JwtAuthenticationFilter jwtFilter) {
        this.jwtFilter = jwtFilter;
    }

    // El que revisa usuario y clave en el login
    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration configuration) throws Exception {
        return configuration.getAuthenticationManager();
    }

    // CORS: deja que el frontend Angular (otro puerto) llame a esta API.
    // Los origenes permitidos se cambian con la propiedad app.cors.allowed-origins
    @Bean
    public CorsConfigurationSource corsConfigurationSource(
            @Value("${app.cors.allowed-origins}") String origenes) {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(Arrays.stream(origenes.split(",")).map(String::trim).toList());
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("Authorization", "Content-Type", "Accept"));
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .cors(Customizer.withDefaults())
                .csrf(csrf -> csrf.disable())
                // STATELESS: el servidor no guarda sesiones, solo mira el token
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                // Sin token -> 401
                // (con cuerpo JSON para que Angular pueda mostrar el mensaje)
                .exceptionHandling(e -> e
                        .authenticationEntryPoint((req, res, ex) -> escribir(res, HttpStatus.UNAUTHORIZED,
                                "Sesion invalida o vencida, inicia sesion de nuevo"))
                        .accessDeniedHandler((req, res, ex) -> escribir(res, HttpStatus.FORBIDDEN,
                                "No tienes permiso para esta accion")))
                .authorizeHttpRequests(auth -> auth
                        // El navegador pregunta con OPTIONS (preflight de CORS) antes de cada llamada
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        // Solo el login es publico (no hay registro: las cuentas las crea el ADMIN)
                        .requestMatchers("/auth/login", "/error").permitAll()
                        // Reserva en linea de pacientes SIN cuenta: lo unico publico fuera del login
                        .requestMatchers("/api/publico/**").permitAll()
                        .requestMatchers("/api/usuarios/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/doctores/**").authenticated()
                        .requestMatchers(HttpMethod.POST, "/api/doctores/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/citas").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/citas").hasAnyRole("ADMIN", "MEDICO")
                        .anyRequest().authenticated()
                )
                // El guardia revisa el token antes que todo
                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    private static void escribir(jakarta.servlet.http.HttpServletResponse res, HttpStatus estado, String mensaje)
            throws java.io.IOException {
        res.setStatus(estado.value());
        res.setContentType(MediaType.APPLICATION_JSON_VALUE);
        res.setCharacterEncoding("UTF-8");
        res.getWriter().write("{\"mensaje\":\"" + mensaje + "\"}");
    }
}
