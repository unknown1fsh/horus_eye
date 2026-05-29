package com.scinar.horuseye;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class HorusEyeApplication {

    public static void main(String[] args) {
        SpringApplication.run(HorusEyeApplication.class, args);
    }
}
