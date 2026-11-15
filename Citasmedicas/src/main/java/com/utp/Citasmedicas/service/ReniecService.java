package com.utp.Citasmedicas.service;

import com.utp.Citasmedicas.dto.DatosDni;
import com.utp.Citasmedicas.exception.RecursoNoEncontradoException;
import com.utp.Citasmedicas.exception.ReglaNegocioException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;

import java.util.Map;

// Consulta los datos de una persona en RENIEC a partir de su DNI.
// Se llama desde el BACKEND (no desde Angular) para no exponer el token
// y porque estas APIs no permiten llamadas directas desde el navegador (CORS).
@Service
public class ReniecService {

    private final RestClient http;
    private final String url;
    private final String token;

    public ReniecService(@Value("${reniec.api.url}") String url,
                         @Value("${reniec.api.token:}") String token) {
        SimpleClientHttpRequestFactory fabrica = new SimpleClientHttpRequestFactory();
        fabrica.setConnectTimeout(5000);
        fabrica.setReadTimeout(8000);
        this.http = RestClient.builder().requestFactory(fabrica).build();
        this.url = url;
        this.token = token;
    }

    @SuppressWarnings("unchecked")
    public DatosDni consultar(String dni) {
        if (token == null || token.isBlank()) {
            throw new ReglaNegocioException(
                    "La consulta a RENIEC no esta configurada (falta reniec.api.token). Ingrese los datos manualmente");
        }

        Map<String, Object> respuesta;
        try {
            respuesta = http.get()
                    .uri(url + "?numero={dni}", dni)
                    .header("Authorization", "Bearer " + token)
                    .header("Accept", "application/json")
                    .retrieve()
                    .body(Map.class);
        } catch (RestClientResponseException e) {
            int codigo = e.getStatusCode().value();
            if (codigo == 401 || codigo == 403) {
                throw new ReglaNegocioException("El token de RENIEC es invalido o vencio. Ingrese los datos manualmente");
            }
            if (codigo == 429) {
                throw new ReglaNegocioException("Se agotaron las consultas a RENIEC por hoy. Ingrese los datos manualmente");
            }
            throw new RecursoNoEncontradoException("RENIEC no encontro el DNI " + dni);
        } catch (RestClientException e) {
            throw new ReglaNegocioException("No se pudo conectar con RENIEC. Ingrese los datos manualmente");
        }

        if (respuesta == null) {
            throw new RecursoNoEncontradoException("RENIEC no encontro el DNI " + dni);
        }
        // Algunas versiones de la API envuelven los datos en "data"
        if (respuesta.get("data") instanceof Map<?, ?> data) {
            respuesta = (Map<String, Object>) data;
        }

        String nombres = texto(respuesta, "first_name", "nombres", "nombre");
        String paterno = texto(respuesta, "first_last_name", "apellido_paterno", "apellidoPaterno", "paterno");
        String materno = texto(respuesta, "second_last_name", "apellido_materno", "apellidoMaterno", "materno");
        String apellidos = (paterno + " " + materno).trim();
        if (apellidos.isEmpty()) {
            apellidos = texto(respuesta, "apellidos", "apellido", "last_name");
        }

        if (nombres.isEmpty() || apellidos.isEmpty()) {
            throw new RecursoNoEncontradoException("RENIEC no encontro el DNI " + dni);
        }
        // RENIEC (version gratuita) no entrega fecha de nacimiento ni telefono
        return new DatosDni(dni, capitalizar(nombres), capitalizar(apellidos), null, null, "RENIEC");
    }

    // Devuelve el primer campo que exista (cada proveedor usa nombres distintos)
    private static String texto(Map<String, Object> mapa, String... claves) {
        for (String clave : claves) {
            Object valor = mapa.get(clave);
            if (valor != null && !valor.toString().isBlank()) {
                return valor.toString().trim();
            }
        }
        return "";
    }

    // "JUAN CARLOS" -> "Juan Carlos"
    private static String capitalizar(String texto) {
        StringBuilder sb = new StringBuilder();
        for (String palabra : texto.toLowerCase().split("\\s+")) {
            if (palabra.isEmpty()) continue;
            if (!sb.isEmpty()) sb.append(' ');
            sb.append(Character.toUpperCase(palabra.charAt(0))).append(palabra.substring(1));
        }
        return sb.toString();
    }
}
