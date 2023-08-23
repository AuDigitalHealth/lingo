package com.csiro.snomio;

import jakarta.servlet.annotation.WebServlet;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.web.servlet.ServletRegistrationBean;
import org.springframework.context.ApplicationContext;
import org.springframework.context.annotation.Bean;

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
//  @Bean
//  public ServletRegistrationBean h2servletRegistration() {
//    ServletRegistrationBean registration = new ServletRegistrationBean();
//    registration.addUrlMappings("/h2-console/*");
//    return registration;
//  }
}
