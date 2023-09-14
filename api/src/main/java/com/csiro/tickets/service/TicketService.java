package com.csiro.tickets.service;

import com.csiro.snomio.exception.ResourceNotFoundProblem;
import com.csiro.snomio.exception.TicketImportProblem;
import com.csiro.tickets.controllers.dto.TicketDto;
import com.csiro.tickets.controllers.dto.TicketImportDto;
import com.csiro.tickets.models.Ticket;
import com.csiro.tickets.repository.TicketRepository;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public class TicketService {

  @Autowired TicketRepository ticketRepository;

  private double importProgress = 0;

  public List<TicketDto> findAllTickets() {
    List<TicketDto> tickets = new ArrayList<>();

    ticketRepository.findAll().forEach(ticket -> tickets.add(TicketDto.of(ticket)));

    return tickets;
  }

  public Ticket updateTicket(Long ticketId, TicketDto ticketDto) {
    Optional<Ticket> optional = ticketRepository.findById(ticketId);

    if (optional.isPresent()) {
      Ticket ticket = optional.get();
      ticket.setTitle(ticketDto.getTitle());
      ticket.setDescription(ticketDto.getDescription());
      ticket.setModified(Instant.now());
      return ticketRepository.save(ticket);
    } else {
      throw new ResourceNotFoundProblem(String.format("Ticket not found with id %s", ticketId));
    }
  }

  public Long importTickets(TicketImportDto[] importDtos, File importDirectory) {
    Long importedTicketNumber = 0l;
    for (TicketImportDto dto : importDtos) {
      Ticket newTicket = Ticket.of(dto);
      newTicket
          .getAttachments()
          .forEach(
              attachment -> {
                try {
                  String fileName = attachment.getData();
                  byte[] fileData =
                      Files.readAllBytes(
                          Paths.get(importDirectory.getAbsolutePath() + "/" + fileName));
                  attachment.setData(new String(fileData, "UTF-8"));
                } catch (IOException e) {
                  throw new TicketImportProblem(e.getMessage());
                }
              });
      ticketRepository.save(newTicket);
      importedTicketNumber++;
      setImportProgress((importedTicketNumber/importDtos.length)*100);
    }
    return importedTicketNumber;
  }

    public double getImportProgress() {
      return importProgress;
    }

    private void setImportProgress(double progress) {
      this.importProgress = progress;
    }

}
