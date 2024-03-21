package com.csiro.tickets;

import java.io.IOException;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ClassPathResource;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

public class TicketTestBaseLocal extends TicketTestBase {

  @Autowired private DbInitializer dbInitializer;
  protected final Log logger = LogFactory.getLog(getClass());

  @DynamicPropertySource
  static void setProperties(DynamicPropertyRegistry registry) {
    try {
      String filePath =
          new ClassPathResource("test-jira-export.json")
              .getFile()
              .getParentFile()
              .getAbsolutePath();
      registry.add("snomio.import.allowed.directory", () -> filePath);
    } catch (IOException e) {
      throw new RuntimeException("Failed to load file", e);
    }
  }

  @Override
  @BeforeEach
  void setup() {
    initAuth();
    initDb();
  }

  void initDb() {
    dbInitializer.init();
  }
}
