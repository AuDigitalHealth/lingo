package com.csiro.snomio.controllerTests;

import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.csiro.snomio.controllers.HomeController;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;

@SpringBootTest(classes = HomeController.class)
@AutoConfigureMockMvc
class HomeControllerTest {

  @Autowired private MockMvc mvc;

  @Test
  void getHello() throws Exception {
    mvc.perform(MockMvcRequestBuilders.get("/").accept(MediaType.APPLICATION_JSON))
        .andExpect(status().is(401));
  }
}
