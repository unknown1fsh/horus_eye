package com.scinar.horuseye.repository;

import com.scinar.horuseye.entity.Continent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ContinentRepository extends JpaRepository<Continent, Long> {
    Optional<Continent> findByCode(String code);
}
