package com.example.aic.repository;

import com.example.aic.model.Avalanche;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AvalancheRepository extends JpaRepository<Avalanche, Integer>, JpaSpecificationExecutor<Avalanche> {
    Page<Avalanche> findByStatus(Avalanche.Status status, Pageable pageable);

    List<Avalanche> findByVisitorId(Integer visitorId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE Avalanche a SET a.visitor = null WHERE a.visitor.id = :userId")
    void setVisitorToNull(@Param("userId") Integer userId);

    @Query("SELECT a FROM Avalanche a WHERE a.link IS NOT NULL AND TRIM(a.link) != ''")
    List<Avalanche> findAllWithLink();
}
