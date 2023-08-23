package com.csiro.snomio.controllers;

import com.csiro.snomio.models.tickets.Ticket;
import com.csiro.snomio.repository.TicketRepository;
import java.util.ArrayList;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/ticket")
public class TicketController {

  @Autowired
  TicketRepository ticketRepository;

  @GetMapping("")
  public ResponseEntity<List<Ticket>> getAllTickets(){
    System.out.println("ticket durrrrr");
    List<Ticket> tickets = new ArrayList<>();

    ticketRepository.findAll().forEach(tickets::add);

    return new ResponseEntity<>(tickets, HttpStatus.OK);
  }
}
