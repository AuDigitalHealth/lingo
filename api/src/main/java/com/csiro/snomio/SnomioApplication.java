package com.csiro.snomio;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.context.ApplicationContext;
import org.springframework.context.annotation.Bean;
import org.springframework.transaction.annotation.EnableTransactionManagement;

// TODO https://github.com/aehrc/snomio/pull/243/files/cf34f5b81edfe2dc8ab1c8a807062edca808a075#r1337109559
@EnableTransactionManagement
public class SnomioApplication extends Configuration {

  public static void main(String[] args) {
    SpringApplication.run(SnomioApplication.class, args);
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
