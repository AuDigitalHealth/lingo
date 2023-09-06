package com.csiro.tickets;

import com.csiro.tickets.models.AdditionalFieldType;
import com.csiro.tickets.models.Iteration;
import com.csiro.tickets.models.Label;
import com.csiro.tickets.models.PriorityBucket;
import com.csiro.tickets.models.State;
import com.csiro.tickets.models.Ticket;
import com.csiro.tickets.models.TicketType;
import com.csiro.tickets.repository.AdditionalFieldRepository;
import com.csiro.tickets.repository.IterationRepository;
import com.csiro.tickets.repository.LabelRepository;
import com.csiro.tickets.repository.PriorityBucketRepository;
import com.csiro.tickets.repository.StateRepository;
import com.csiro.tickets.repository.TicketRepository;
import com.csiro.tickets.repository.TicketTypeRepository;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZoneOffset;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public class DbInitializer {

  @Autowired private TicketTypeRepository ticketTypeRepository;

  @Autowired private StateRepository stateRepository;

  @Autowired private AdditionalFieldRepository additionalFieldRepository;

  @Autowired private LabelRepository labelRepository;

  @Autowired private IterationRepository iterationRepository;

  @Autowired private PriorityBucketRepository priorityBucketRepository;

  @Autowired private TicketRepository ticketRepository;

  public void init() {
    TicketType ticketType =
        TicketType.builder()
            .name("Test Ticket Type")
            .description("A ticketType Description")
            .build();
    ticketTypeRepository.save(ticketType);

    initState();
    initAdditionalFieldType();
    initLabel();
    initIteration();
    initPriorityBucket();
    initTickets();
  }

  public void initState() {
    State state0 =
        State.builder().label("Backlog").description("A historical Item").grouping(0).build();

    State state1 =
        State.builder().label("Open").description("A historical Item").grouping(1).build();

    State state2 =
        State.builder().label("In Assesment").description("A historical Item").grouping(2).build();

    State state3 =
        State.builder().label("Review").description("A historical Item").grouping(3).build();

    State state4 =
        State.builder().label("Complete").description("A historical Item").grouping(4).build();

    State state5 =
        State.builder().label("Reopened").description("A historical Item").grouping(5).build();

    stateRepository.save(state0);
    stateRepository.save(state1);
    stateRepository.save(state2);
    stateRepository.save(state3);
    stateRepository.save(state4);
    stateRepository.save(state5);
  }

  public void initAdditionalFieldType() {
    AdditionalFieldType additionalFieldType =
        AdditionalFieldType.builder()
            .name("task_data")
            .description("An additional field that holds the task data")
            .build();
    additionalFieldRepository.save(additionalFieldType);
  }

  public void initLabel() {
    Label label0 =
        Label.builder()
            .name("S8")
            .description("Schedule 8 drugs (urgent)")
            .displayColor("error")
            .build();

    Label label1 =
        Label.builder()
            .name("Nestle Crunch")
            .description("Kids Love Nestle Crunch!")
            .displayColor("Success")
            .build();

    labelRepository.save(label0);
    labelRepository.save(label1);
  }

  public void initIteration() {
    LocalDate localDate = LocalDate.parse("2023-08-01");
    LocalDateTime localDateTime = localDate.atStartOfDay();
    Instant startOfAugust = localDateTime.toInstant(ZoneOffset.of("+10:00"));

    LocalDate localDate1 = LocalDate.parse("2023-08-31");
    LocalDateTime localDateTime1 = localDate1.atStartOfDay();
    Instant endOfAugust = localDateTime1.toInstant(ZoneOffset.of("+10:00"));

    LocalDate localDate2 = LocalDate.parse("2023-09-01");
    LocalDateTime localDateTime2 = localDate2.atStartOfDay();
    Instant startOfSept = localDateTime2.toInstant(ZoneOffset.of("+10:00"));

    LocalDate localDate3 = LocalDate.parse("2023-08-31");
    LocalDateTime localDateTime4 = localDate3.atStartOfDay();
    Instant endOfSept = localDateTime4.toInstant(ZoneOffset.of("+10:00"));

    Iteration iteration0 =
        Iteration.builder()
            .name("August Release")
            .startDate(startOfAugust)
            .endDate(endOfAugust)
            .active(false)
            .completed(true)
            .build();

    Iteration iteration1 =
        Iteration.builder()
            .name("September Release")
            .startDate(startOfSept)
            .endDate(endOfSept)
            .active(true)
            .completed(false)
            .build();

    iterationRepository.save(iteration0);
    iterationRepository.save(iteration1);
  }

  public void initPriorityBucket() {
    PriorityBucket priorityBucket0 =
        PriorityBucket.builder().name("asap").description("do me first").orderIndex(0).build();

    PriorityBucket priorityBucket1 =
        PriorityBucket.builder().name("soon").description("do me soon").orderIndex(1).build();

    PriorityBucket priorityBucket2 =
        PriorityBucket.builder().name("whenevs").description("do me whenevs").orderIndex(2).build();

    priorityBucketRepository.save(priorityBucket0);
    priorityBucketRepository.save(priorityBucket1);
    priorityBucketRepository.save(priorityBucket2);
  }

  public void initTickets() {
    Ticket ticket =
        Ticket.builder()
            .title("An initial Test ticket")
            .description("An initial test description")
            .build();

    ticketRepository.save(ticket);
  }
}
