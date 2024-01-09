package com.csiro.tickets;

import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;

public class TicketTestBaseLocal extends TicketTestBase {

  @Autowired private DbInitializer dbInitializer;

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
