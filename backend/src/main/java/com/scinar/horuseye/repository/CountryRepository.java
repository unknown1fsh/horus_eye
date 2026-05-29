package com.scinar.horuseye.repository;

import com.scinar.horuseye.entity.Country;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CountryRepository extends JpaRepository<Country, Long> {

    @Query("SELECT c FROM Country c JOIN FETCH c.continent WHERE c.isoCode = :isoCode")
    Optional<Country> findByIsoCode(@Param("isoCode") String isoCode);

    @Query("SELECT c FROM Country c JOIN FETCH c.continent WHERE c.continent.id = :continentId AND c.deletedAt IS NULL")
    List<Country> findByContinentId(@Param("continentId") Long continentId);

    @Query("""
            SELECT c FROM Country c JOIN FETCH c.continent
            WHERE c.deletedAt IS NULL
            AND (
                LOWER(c.name) LIKE LOWER(CONCAT('%', :search, '%'))
                OR LOWER(c.nativeName) LIKE LOWER(CONCAT('%', :search, '%'))
                OR LOWER(c.isoCode) LIKE LOWER(CONCAT('%', :search, '%'))
                OR LOWER(c.capital) LIKE LOWER(CONCAT('%', :search, '%'))
            )
            """)
    List<Country> searchByName(@Param("search") String search);

    @Query("SELECT c FROM Country c JOIN FETCH c.continent WHERE c.deletedAt IS NULL")
    List<Country> findAllActive();

    @Query("SELECT c FROM Country c JOIN FETCH c.continent WHERE c.id = :id AND c.deletedAt IS NULL")
    Optional<Country> findActiveById(@Param("id") Long id);
}
