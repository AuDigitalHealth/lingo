package com.csiro.snomio;

import com.csiro.snomio.configuration.Configuration;
import lombok.extern.java.Log;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.context.ApplicationContext;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.EnableAspectJAutoProxy;
import org.springframework.transaction.annotation.EnableTransactionManagement;

@EnableTransactionManagement
@EnableAspectJAutoProxy
@Log
public class SnomioApplication extends Configuration {

  public static void main(String[] args) {
    SpringApplication.run(SnomioApplication.class, args);
  }

  @Bean
  public CommandLineRunner commandLineRunner(ApplicationContext ctx) {
    return args -> {
      log.info("Beans");

      String[] beansNames = ctx.getBeanDefinitionNames();
      for (String beanName : beansNames) {
        log.info(beanName);
      }
    };
  }
}
