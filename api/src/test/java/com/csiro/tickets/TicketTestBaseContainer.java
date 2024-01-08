package com.csiro.tickets;

import com.csiro.snomio.Configuration;
import com.csiro.tickets.helper.SnomioDatabaseExtension;
import lombok.Getter;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.SpringBootTest.WebEnvironment;
import org.springframework.test.context.ActiveProfiles;

@Getter
@SpringBootTest(webEnvironment = WebEnvironment.RANDOM_PORT, classes = Configuration.class)
@ActiveProfiles({"test", "testcontainer"})
@ExtendWith(SnomioDatabaseExtension.class)
public class TicketTestBaseContainer extends TicketTestBase {}
