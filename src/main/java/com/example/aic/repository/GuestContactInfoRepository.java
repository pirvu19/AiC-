package com.example.aic.repository;

import com.example.aic.model.GuestContactInfo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface GuestContactInfoRepository extends JpaRepository<GuestContactInfo, Integer> {
}
