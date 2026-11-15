package com.utp.Citasmedicas.repository;

import com.utp.Citasmedicas.entity.EstadoPago;
import com.utp.Citasmedicas.entity.Pago;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;

public interface PagoRepository extends JpaRepository<Pago, Long> {

    // Pagos de un paciente (mas recientes primero)
    List<Pago> findByCitaPacienteDniOrderByFechaPagoDesc(String dni);

    // Pagos de una cita
    List<Pago> findByCitaCodigo(String codigo);

    // ¿La cita ya tiene un pago pendiente o completado? (para no pagar 2 veces)
    boolean existsByCitaCodigoAndEstadoIn(String codigo, List<EstadoPago> estados);

    // JPQL: total de dinero cobrado
    @Query("SELECT COALESCE(SUM(p.monto), 0) FROM Pago p WHERE p.estado = :estado")
    BigDecimal totalPorEstado(@Param("estado") EstadoPago estado);
}
