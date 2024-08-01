package com.csiro.snomio.controllers.swagger;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.servers.Server;
import java.util.ArrayList;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenAPIConfig {

  @Value("${snomio.base.url:/}")
  public String baseUrl;

  @Bean
  public OpenAPI customOpenAPI() {

    List<Server> servers = new ArrayList<>();
    servers.add(new Server().url(baseUrl).description("Default server url"));

    return new OpenAPI()
        .info(
            new Info()
                .title("Snomio")
                .version("1.0")
                .description(
                    "An application that allows authoring of medicinal products through the IHTSDO Authoring Platform."))
        .servers(servers);
  }
}
