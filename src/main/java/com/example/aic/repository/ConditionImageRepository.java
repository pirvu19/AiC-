package com.example.aic.repository;

import com.example.aic.model.ConditionImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ConditionImageRepository extends JpaRepository<ConditionImage, Integer> {
    List<ConditionImage> findByConditionsId(Integer conditionsId);
}
