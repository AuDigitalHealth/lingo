package com.poc.mat;

import com.poc.mat.configuration.Configuration;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.context.ApplicationContext;
import org.springframework.context.annotation.Bean;


public class MatApplication extends Configuration {

  public static void main(String[] args) {
    SpringApplication.run(MatApplication.class, args);
  }

  @Bean
  public CommandLineRunner commandLineRunner(ApplicationContext ctx) {
    return args -> {
      System.out.println("Beans");
      String[] beansNames = ctx.getBeanDefinitionNames();
      for (String beanName : beansNames) {
        System.out.println(beanName);
      }
    };
  }

}
