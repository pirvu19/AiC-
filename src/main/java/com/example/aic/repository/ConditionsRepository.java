package com.example.aic.repository;

import com.example.aic.model.Conditions;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import org.springframework.data.jpa.repository.EntityGraph;
import java.util.Optional;

@Repository
public interface ConditionsRepository extends JpaRepository<Conditions, Integer>, JpaSpecificationExecutor<Conditions> {
    List<Conditions> findByVisitorId(Integer visitorId);

    @EntityGraph(attributePaths = {"images"})
    Page<Conditions> findByStatus(Conditions.Status status, Pageable pageable);

    @EntityGraph(attributePaths = {"images"})
    Optional<Conditions> findById(Integer id);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE Conditions c SET c.visitor = null WHERE c.visitor.id = :userId")
    void setVisitorToNull(@Param("userId") Integer userId);
}
