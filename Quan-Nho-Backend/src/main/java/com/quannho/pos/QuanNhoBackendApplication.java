package com.quannho.pos;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class QuanNhoBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(QuanNhoBackendApplication.class, args);
    }

}
