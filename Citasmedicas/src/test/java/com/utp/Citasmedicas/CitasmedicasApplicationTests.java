package com.utp.Citasmedicas;

import com.utp.Citasmedicas.entity.*;
import com.utp.Citasmedicas.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class CitasmedicasApplicationTests {

    @Autowired MockMvc mvc;
    @Autowired UsuarioRepository usuarios;
    @Autowired EspecialidadRepository especialidades;
    @Autowired DoctorRepository doctores;
    @Autowired PacienteRepository pacientes;
    @Autowired HorarioMedicoRepository horarios;
    @Autowired PasswordEncoder encoder;

    private final LocalDate fechaCita = LocalDate.now().plusDays(7);

    @BeforeEach
    void datos() {
        if (usuarios.existsByCorreo("admin@test.pe")) return;

        Especialidad esp = especialidades.save(new Especialidad("Cardiologia", "Corazon", new BigDecimal("120.00")));
        Usuario uDoc = usuarios.save(new Usuario("doc@test.pe", encoder.encode("clave123"), "MEDICO"));
        Doctor doctor = doctores.save(new Doctor("045821", "Carlos", "Ramirez", "987654321", esp, uDoc));
        horarios.save(new HorarioMedico(doctor, DiaSemana.de(fechaCita.getDayOfWeek()),
                LocalTime.of(9, 0), LocalTime.of(11, 0)));

        // Segundo doctor (para probar que un medico NO agenda en la agenda de otro)
        Especialidad esp2 = especialidades.save(new Especialidad("Pediatria", "Ninos", new BigDecimal("80.00")));
        Usuario uDoc2 = usuarios.save(new Usuario("doc2@test.pe", encoder.encode("clave123"), "MEDICO"));
        Doctor doctor2 = doctores.save(new Doctor("052347", "Lucia", "Fernandez", "976543210", esp2, uDoc2));
        horarios.save(new HorarioMedico(doctor2, DiaSemana.de(fechaCita.getDayOfWeek()),
                LocalTime.of(9, 0), LocalTime.of(11, 0)));

        // El paciente es SOLO una ficha: no tiene usuario ni contrasena
        pacientes.save(new Paciente("71234567", "Ana", "Gonzales", LocalDate.of(1990, 1, 1), "999888777", null));
        // Cuenta ANTIGUA de paciente (de antes del cambio): no debe poder entrar al sistema
        usuarios.save(new Usuario("paciente.antiguo@test.pe", encoder.encode("clave123"), "PACIENTE"));
        usuarios.save(new Usuario("admin@test.pe", encoder.encode("clave123"), "ADMIN"));
    }

    private String token(String correo) throws Exception {
        MvcResult r = mvc.perform(post("/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"correo\":\"" + correo + "\",\"password\":\"clave123\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andReturn();
        String json = r.getResponse().getContentAsString();
        return json.replaceAll(".*\"token\":\"([^\"]+)\".*", "$1");
    }

    @Test
    void corsPermiteAngular() throws Exception {
        mvc.perform(options("/auth/login")
                        .header("Origin", "http://localhost:4200")
                        .header("Access-Control-Request-Method", "POST")
                        .header("Access-Control-Request-Headers", "authorization,content-type"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:4200"));

        mvc.perform(options("/auth/login")
                        .header("Origin", "http://malo.com")
                        .header("Access-Control-Request-Method", "POST"))
                .andExpect(status().isForbidden());
    }

    @Test
    void sinTokenDevuelve401ConMensaje() throws Exception {
        mvc.perform(get("/api/citas/mis-citas"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.mensaje").isNotEmpty());
    }

    @Test
    void validacionDevuelveFormatoUnico() throws Exception {
        mvc.perform(post("/auth/login").contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errores.correo").exists());
    }

    @Test
    void personalReservaYCobraConPrecioDelServidor() throws Exception {
        String pac = "Bearer " + token("admin@test.pe"); // el personal reserva por el paciente

        // 9:00-11:00 con citas de 30 min = 4 espacios libres
        mvc.perform(get("/api/citas/disponibilidad")
                        .param("colegiatura", "045821").param("fecha", fechaCita.toString())
                        .header("Authorization", pac))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(4)))
                .andExpect(jsonPath("$[0].disponible").value(true));

        // El ADMIN reserva las 9:00 para la paciente
        MvcResult r = mvc.perform(post("/api/citas").header("Authorization", pac)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"colegiaturaDoctor\":\"045821\",\"dniPaciente\":\"71234567\",\"fecha\":\"" + fechaCita
                                + "\",\"hora\":\"09:00\",\"motivo\":\"Chequeo\"}"))
                .andExpect(status().isCreated())
                .andReturn();
        String codigo = r.getResponse().getContentAsString()
                .replaceAll(".*\"codigo\":\"([^\"]+)\".*", "$1");

        // Ese espacio ya aparece ocupado y quedan 3 libres
        mvc.perform(get("/api/citas/disponibilidad")
                        .param("colegiatura", "045821").param("fecha", fechaCita.toString())
                        .header("Authorization", pac))
                .andExpect(jsonPath("$[0].disponible").value(false))
                .andExpect(jsonPath("$[?(@.disponible==true)]", hasSize(3)));

        // Mismo horario otra vez -> 400 con mensaje
        mvc.perform(post("/api/citas").header("Authorization", pac)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"colegiaturaDoctor\":\"045821\",\"dniPaciente\":\"71234567\",\"fecha\":\"" + fechaCita
                                + "\",\"hora\":\"09:15\",\"motivo\":\"Otro\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.mensaje", containsString("ya tiene una cita")));

        // Pago: el cliente NO manda monto; el servidor usa el precio de la especialidad (120.00)
        mvc.perform(post("/api/pagos").header("Authorization", pac)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"codigoCita\":\"" + codigo + "\",\"monto\":1,\"metodo\":\"YAPE\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.monto").value(120.00))
                .andExpect(jsonPath("$.estado").value("COMPLETADO"));
    }

    // Fecha distinta (+14 dias, mismo dia de la semana) para no mezclar con el test de disponibilidad
    private String cuerpoCita(String doctor, String dniPaciente, String hora) {
        return "{\"colegiaturaDoctor\":\"" + doctor + "\",\"dniPaciente\":\"" + dniPaciente
                + "\",\"fecha\":\"" + fechaCita.plusDays(7) + "\",\"hora\":\"" + hora
                + "\",\"motivo\":\"Control\"}";
    }

    @Test
    void medicoReservaParaUnPacienteEnSuPropiaAgenda() throws Exception {
        String medico = "Bearer " + token("doc@test.pe");

        mvc.perform(post("/api/citas").header("Authorization", medico)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(cuerpoCita("045821", "71234567", "10:00")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.paciente.dni").value("71234567"))
                .andExpect(jsonPath("$.doctor.colegiatura").value("045821"))
                .andExpect(jsonPath("$.estado").value("PENDIENTE"));
    }

    @Test
    void medicoNoPuedeReservarEnLaAgendaDeOtroDoctor() throws Exception {
        String medico = "Bearer " + token("doc@test.pe");

        mvc.perform(post("/api/citas").header("Authorization", medico)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(cuerpoCita("052347", "71234567", "09:00")))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.mensaje", containsString("propia agenda")));
    }

    @Test
    void medicoDebeIndicarElDniDelPaciente() throws Exception {
        String medico = "Bearer " + token("doc@test.pe");

        mvc.perform(post("/api/citas").header("Authorization", medico)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"colegiaturaDoctor\":\"045821\",\"fecha\":\"" + fechaCita.plusDays(7)
                                + "\",\"hora\":\"10:30\",\"motivo\":\"Control\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.mensaje", containsString("DNI del paciente")));
    }

    @Test
    void adminReservaParaCualquierPacienteConCualquierDoctor() throws Exception {
        String admin = "Bearer " + token("admin@test.pe");

        mvc.perform(post("/api/citas").header("Authorization", admin)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(cuerpoCita("052347", "71234567", "10:00")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.doctor.colegiatura").value("052347"));
    }

    private String estadoBody(String estado, String observacion) {
        return "{\"estado\":\"" + estado + "\""
                + (observacion != null ? ",\"observacion\":\"" + observacion + "\"" : "") + "}";
    }

    @Test
    void cicloDeLaCitaLoGestionaElMedico() throws Exception {
        String medico = "Bearer " + token("doc@test.pe");

        // El medico agenda un control (+21 dias, mismo dia de la semana)
        MvcResult r = mvc.perform(post("/api/citas").header("Authorization", medico)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"colegiaturaDoctor\":\"045821\",\"dniPaciente\":\"71234567\",\"fecha\":\""
                                + fechaCita.plusDays(14) + "\",\"hora\":\"09:00\",\"motivo\":\"Control\"}"))
                .andExpect(status().isCreated())
                .andReturn();
        String codigo = r.getResponse().getContentAsString().replaceAll(".*\"codigo\":\"([^\"]+)\".*", "$1");
        String url = "/api/citas/" + codigo + "/estado";

        // El medico NO cancela
        mvc.perform(put(url).header("Authorization", medico)
                        .contentType(MediaType.APPLICATION_JSON).content(estadoBody("CANCELADA", null)))
                .andExpect(status().isForbidden());

        // No se puede saltar de PENDIENTE a COMPLETADA
        mvc.perform(put(url).header("Authorization", medico)
                        .contentType(MediaType.APPLICATION_JSON).content(estadoBody("COMPLETADA", null)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.mensaje", containsString("No se puede pasar")));

        // El medico confirma y luego completa con una observacion
        mvc.perform(put(url).header("Authorization", medico)
                        .contentType(MediaType.APPLICATION_JSON).content(estadoBody("CONFIRMADA", null)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.estado").value("CONFIRMADA"));

        mvc.perform(put(url).header("Authorization", medico)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(estadoBody("COMPLETADA", "Presion normal, volver en 3 meses")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.estado").value("COMPLETADA"))
                .andExpect(jsonPath("$.observacion").value("Presion normal, volver en 3 meses"));

        // Una cita completada ya no cambia
        mvc.perform(put(url).header("Authorization", medico)
                        .contentType(MediaType.APPLICATION_JSON).content(estadoBody("CONFIRMADA", null)))
                .andExpect(status().isBadRequest());
    }

    // ---------- Reserva PUBLICA (paciente sin cuenta) ----------
    private String cuerpoReserva(String dni, String hora, String metodo) {
        return "{\"dni\":\"" + dni + "\",\"nombres\":\"Maria\",\"apellidos\":\"Lopez\",\"telefono\":\"912345678\","
                + "\"colegiaturaDoctor\":\"045821\",\"fecha\":\"" + fechaCita.plusDays(21) + "\","
                + "\"hora\":\"" + hora + "\",\"motivo\":\"Dolor de pecho\",\"metodo\":\"" + metodo + "\"}";
    }

    @Autowired PagoRepository pagos;
    @Autowired CitaRepository citas;

    @Test
    void publicoListaEspecialidadesYDoctoresSinLoginYSinCorreo() throws Exception {
        mvc.perform(get("/api/publico/especialidades"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.nombre=='Cardiologia')].precio").value(hasItem(120.00)));

        mvc.perform(get("/api/publico/doctores"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.colegiatura=='045821')]").exists())
                .andExpect(jsonPath("$[0].correo").doesNotExist()); // no se expone la cuenta del doctor

        mvc.perform(get("/api/publico/doctores").param("idEspecialidad", "999999"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    void publicoMuestraLaDisponibilidadSinLogin() throws Exception {
        mvc.perform(get("/api/publico/disponibilidad")
                        .param("colegiatura", "045821").param("fecha", fechaCita.plusDays(21).toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].hora").exists());
    }

    @Test
    void reservaPublicaCreaPacienteSinUsuarioCitaYPagoConPrecioDelServidor() throws Exception {
        long usuariosAntes = usuarios.count();

        mvc.perform(post("/api/publico/reservas").contentType(MediaType.APPLICATION_JSON)
                        .content(cuerpoReserva("70112233", "09:00", "YAPE")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.codigoCita").value(startsWith("CIT-")))
                .andExpect(jsonPath("$.estadoCita").value("PENDIENTE"))
                .andExpect(jsonPath("$.monto").value(120.00)) // el servidor decide el monto
                .andExpect(jsonPath("$.estadoPago").value("COMPLETADO"))
                .andExpect(jsonPath("$.numeroOperacion").isNotEmpty())
                .andExpect(jsonPath("$.motivo").doesNotExist()); // dato de salud: no se devuelve

        // El paciente quedo guardado SOLO como ficha (sin usuario) y no se creo ninguna cuenta
        Paciente creado = pacientes.findById("70112233").orElseThrow();
        org.junit.jupiter.api.Assertions.assertNull(creado.getCorreo());
        org.junit.jupiter.api.Assertions.assertEquals(usuariosAntes, usuarios.count());
    }

    @Test
    void reservaPublicaRechazaEfectivoPorqueSePagaAntes() throws Exception {
        mvc.perform(post("/api/publico/reservas").contentType(MediaType.APPLICATION_JSON)
                        .content(cuerpoReserva("70223344", "10:30", "EFECTIVO")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.mensaje", containsString("tarjeta, Yape, Plin o transferencia")));

        org.junit.jupiter.api.Assertions.assertFalse(pacientes.existsById("70223344")); // nada quedo guardado
    }

    @Test
    void reservaPublicaValidaLosDatosYDevuelveErroresPorCampo() throws Exception {
        mvc.perform(post("/api/publico/reservas").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"dni\":\"12\",\"telefono\":\"abc\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errores.dni").exists())
                .andExpect(jsonPath("$.errores.telefono").exists())
                .andExpect(jsonPath("$.errores.metodo").exists());
    }

    @Test
    void reservaPublicaConHorarioOcupadoNoDejaNadaGuardado() throws Exception {
        mvc.perform(post("/api/publico/reservas").contentType(MediaType.APPLICATION_JSON)
                        .content(cuerpoReserva("70334455", "10:00", "TARJETA")))
                .andExpect(status().isCreated());

        // Otra persona intenta el MISMO horario: se rechaza y no se cobra ni se crea su ficha
        long pagosAntes = pagos.count();
        mvc.perform(post("/api/publico/reservas").contentType(MediaType.APPLICATION_JSON)
                        .content(cuerpoReserva("70445566", "10:00", "PLIN")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.mensaje", containsString("ya tiene una cita")));

        org.junit.jupiter.api.Assertions.assertFalse(pacientes.existsById("70445566"));
        org.junit.jupiter.api.Assertions.assertEquals(pagosAntes, pagos.count());
    }

    @Test
    void consultaPublicaExigeCodigoYDniQueCoincidan() throws Exception {
        MvcResult r = mvc.perform(post("/api/publico/reservas").contentType(MediaType.APPLICATION_JSON)
                        .content(cuerpoReserva("70556677", "10:30", "TRANSFERENCIA")))
                .andExpect(status().isCreated())
                .andReturn();
        String codigo = r.getResponse().getContentAsString().replaceAll(".*\"codigoCita\":\"([^\"]+)\".*", "$1");

        mvc.perform(get("/api/publico/citas/" + codigo).param("dni", "70556677"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.codigoCita").value(codigo))
                .andExpect(jsonPath("$.estadoPago").value("COMPLETADO"))
                .andExpect(jsonPath("$.motivo").doesNotExist());

        mvc.perform(get("/api/publico/citas/" + codigo).param("dni", "71234567")) // DNI de otra persona
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.mensaje", containsString("codigo y DNI")));
    }

    @Test
    void elRegistroPublicoYaNoExiste() throws Exception {
        // /auth/registro dejo de ser publico: sin token se responde 401
        mvc.perform(post("/auth/registro").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"correo\":\"x@x.pe\",\"password\":\"clave12345\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void unaCuentaAntiguaDePacienteNoRecibeToken() throws Exception {
        mvc.perform(post("/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"correo\":\"paciente.antiguo@test.pe\",\"password\":\"clave123\"}"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.token").doesNotExist())
                .andExpect(jsonPath("$.mensaje", containsString("solo para el personal")));
    }

    @Test
    void elPersonalSiEntraConSuCuenta() throws Exception {
        mvc.perform(post("/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"correo\":\"doc@test.pe\",\"password\":\"clave123\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.rol").value("MEDICO"));
    }

    @Test
    void lasDemasRutasSiguenProtegidas() throws Exception {
        mvc.perform(get("/api/doctores")).andExpect(status().isUnauthorized());
        mvc.perform(post("/api/citas").contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isUnauthorized());
        mvc.perform(get("/api/pagos")).andExpect(status().isUnauthorized());
    }

    @Test
    void soloAdminListaUsuariosSinClaves() throws Exception {
        mvc.perform(get("/api/usuarios").header("Authorization", "Bearer " + token("doc@test.pe")))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.mensaje").isNotEmpty());

        mvc.perform(get("/api/usuarios").header("Authorization", "Bearer " + token("admin@test.pe")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].correo").exists())
                .andExpect(jsonPath("$[0].password").doesNotExist());
    }
}
