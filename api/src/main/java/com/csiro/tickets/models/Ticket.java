package com.csiro.tickets.models;

import com.csiro.tickets.controllers.dto.TicketDto;
import com.csiro.tickets.controllers.dto.TicketImportDto;
import com.fasterxml.jackson.annotation.JsonIdentityInfo;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.ObjectIdGenerators;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;
import org.hibernate.envers.Audited;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

@Entity
@SuperBuilder
@Data
@Audited
@AllArgsConstructor
@NoArgsConstructor
@EntityListeners(AuditingEntityListener.class)
@Table(name = "ticket")
@JsonIdentityInfo(generator = ObjectIdGenerators.PropertyGenerator.class, property = "id")
public class Ticket extends BaseAuditableEntity {

  @Column private String title;

  @Column(length = 1000000)
  private String description;

  @ManyToOne(cascade = {CascadeType.PERSIST})
  private TicketType ticketType;

  @ManyToOne(cascade = CascadeType.ALL)
  private Iteration iteration;

  @ManyToMany(
      cascade = {CascadeType.PERSIST},
      fetch = FetchType.EAGER)
  @JoinTable(
      name = "ticket_labels",
      joinColumns = @JoinColumn(name = "ticket_id"),
      inverseJoinColumns = @JoinColumn(name = "label_id"))
  @JsonProperty("labels")
  private List<Label> labels;

  // Need EAGER here otherwise api calles like /ticket will fail
  @ManyToMany(cascade = CascadeType.ALL, fetch = FetchType.EAGER)
  @JoinTable(
      name = "ticket_additional_field_values",
      joinColumns = @JoinColumn(name = "ticket_id"),
      inverseJoinColumns = @JoinColumn(name = "additional_field_value_id"))
  @JsonProperty("ticket-additional-fields")
  private Set<AdditionalFieldValue> additionalFieldValues;

  @ManyToOne(cascade = {CascadeType.MERGE, CascadeType.REMOVE})
  private State state;

  @OneToMany(
      mappedBy = "ticket",
      fetch = FetchType.EAGER,
      cascade = {CascadeType.PERSIST, CascadeType.REMOVE},
      orphanRemoval = true)
  @JsonManagedReference(value = "ticket-comment")
  private List<Comment> comments;

  @OneToMany(
      mappedBy = "ticket",
      fetch = FetchType.EAGER,
      cascade = {CascadeType.PERSIST, CascadeType.REMOVE},
      orphanRemoval = false)
  @JsonManagedReference(value = "ticket-attachment")
  private List<Attachment> attachments;

  @OneToMany(
      mappedBy = "associationSource",
      fetch = FetchType.EAGER,
      cascade = {CascadeType.PERSIST, CascadeType.REMOVE},
      orphanRemoval = false)
  @JsonManagedReference(value = "ticket-source-association")
  private List<TicketAssociation> ticketSourceAssociations;

  @OneToMany(
      mappedBy = "associationTarget",
      fetch = FetchType.EAGER,
      cascade = {CascadeType.PERSIST, CascadeType.REMOVE},
      orphanRemoval = false)
  @JsonManagedReference(value = "ticket-target-association")
  private List<TicketAssociation> ticketTargetAssociations;

  @OneToOne
  @JoinColumn(name = "task_association_id", referencedColumnName = "id", nullable = true)
  @JsonManagedReference(value = "ticket-task")
  private TaskAssociation taskAssociation;

  @ManyToOne(cascade = CascadeType.PERSIST, fetch = FetchType.EAGER)
  private PriorityBucket priorityBucket;

  @Column private String assignee;

  @OneToMany(
      cascade = {CascadeType.PERSIST, CascadeType.REMOVE},
      orphanRemoval = true,
      fetch = FetchType.EAGER,
      mappedBy = "ticket")
  @JsonManagedReference(value = "ticket-product")
  @JsonIgnore
  private Set<Product> products;

  public static Ticket of(TicketDto ticketDto) {
    Ticket ticket =
        Ticket.builder()
            .id(ticketDto.getId())
            .created(ticketDto.getCreated())
            .createdBy(ticketDto.getCreatedBy())
            .title(ticketDto.getTitle())
            .description(ticketDto.getDescription())
            .ticketType(ticketDto.getTicketType())
            .state(State.of(ticketDto.getState()))
            .assignee(ticketDto.getAssignee())
            .priorityBucket(PriorityBucket.of(ticketDto.getPriorityBucket()))
            .labels(ticketDto.getLabels())
            .iteration(Iteration.of(ticketDto.getIteration()))
            .build();

    if (ticketDto.getProducts() != null) {
      ticket.setProducts(
          ticketDto.getProducts().stream()
              .map(productDto -> Product.of(productDto, ticket))
              .collect(Collectors.toSet()));
    }

    return ticket;
  }

  public static Ticket of(TicketImportDto ticketImportDto) {
    return Ticket.builder()
        .title(ticketImportDto.getTitle())
        .description(ticketImportDto.getDescription())
        .ticketType(ticketImportDto.getTicketType())
        .labels(ticketImportDto.getLabels())
        .assignee(ticketImportDto.getAssignee())
        .comments(ticketImportDto.getComments())
        .additionalFieldValues(ticketImportDto.getAdditionalFieldValues())
        .attachments(ticketImportDto.getAttachments())
        .comments(ticketImportDto.getComments())
        .state(ticketImportDto.getState())
        .build();
  }
}
