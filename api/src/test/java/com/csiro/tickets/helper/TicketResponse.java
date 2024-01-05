package com.csiro.tickets.helper;

import com.csiro.tickets.controllers.dto.TicketDto;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;
import lombok.Data;
import lombok.Getter;

@Data
public class TicketResponse {

  @JsonProperty("_embedded")
  private Embedded embedded;

  @JsonProperty("_links")
  private Links links;

  @JsonProperty("page")
  private Page page;

  // Getters and setters
  @Data
  public static class Embedded {

    @JsonProperty("ticketDtoList")
    private List<TicketDto> tickets;

    // Getter and setter
  }

  @Data
  public static class Links {

    private Link first;
    private Link prev;

    private Link self;
    private Link next;
    private Link last;

    // Getter and setter
  }

  @Data
  public static class Link {

    private String href;

    // Getter and setter
  }

  @Data
  @Getter
  public static class Page {

    private int size;
    private int totalElements;
    private int totalPages;
    private int number;

    // Getters and setters
  }
}
