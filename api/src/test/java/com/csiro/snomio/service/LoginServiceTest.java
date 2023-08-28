package com.csiro.snomio.service;

import static org.junit.jupiter.api.Assertions.*;

import com.csiro.snomio.controllers.HomeController;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest(classes = HomeController.class)
@AutoConfigureMockMvc
public class LoginServiceTest {

  @BeforeEach
  void setUp() {}

  @Test
  public void getUserByToken() {
    // TODO

  }
}
