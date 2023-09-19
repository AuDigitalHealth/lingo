package com.csiro.tickets.models;

import com.csiro.tickets.controllers.dto.TicketDto;
import com.csiro.tickets.controllers.dto.TicketImportDto;
import com.fasterxml.jackson.annotation.JsonIdentityInfo;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.ObjectIdGenerators;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import java.time.Instant;
import java.util.List;
import java.util.Set;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.envers.Audited;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedBy;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

@Entity
@Builder
@Data
@NoArgsConstructor
@AllArgsConstructor
@Audited
@EntityListeners(AuditingEntityListener.class)
@Table(name = "ticket")
@JsonIdentityInfo(generator = ObjectIdGenerators.PropertyGenerator.class, property = "id")
public class Ticket {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Version private Integer version;

  @Column(name = "created", nullable = false, updatable = false)
  @CreatedDate
  private Instant created;

  @Column(name = "modified")
  @LastModifiedDate
  private Instant modified;

  @Column(name = "created_by", updatable = false)
  @CreatedBy
  private String createdBy;

  @Column(name = "modified_by")
  @LastModifiedBy
  private String modifiedBy;

  @Column private String title;

  @Column(length = 100000)
  private String description;

  @ManyToOne(cascade = {CascadeType.PERSIST})
  private TicketType ticketType;

  @ManyToOne(cascade = CascadeType.ALL)
  private Iteration iteration;

  @ManyToMany(cascade = {CascadeType.PERSIST})
  @JoinTable(
      name = "labels",
      joinColumns = @JoinColumn(name = "ticket_id"),
      inverseJoinColumns = @JoinColumn(name = "label_id"))
  @JsonProperty("ticket-labels")
  private List<Label> labels;

  @ManyToMany(fetch = FetchType.EAGER, cascade = CascadeType.ALL)
  @JoinTable(
      name = "ticket_additional_field_types",
      joinColumns = @JoinColumn(name = "ticket_id"),
      inverseJoinColumns = @JoinColumn(name = "additional_field_type_value_id"))
  @JsonProperty(value = "ticket-additional-fields")
  private Set<AdditionalFieldTypeValue> additionalFieldTypeValues;

  @ManyToOne(cascade = {CascadeType.PERSIST, CascadeType.REMOVE})
  private State state;

  @OneToMany(
      mappedBy = "ticket",
      fetch = FetchType.LAZY,
      cascade = {CascadeType.PERSIST, CascadeType.REMOVE},
      orphanRemoval = true)
  @JsonManagedReference(value = "ticket-comment")
  private List<Comment> comments;

  @OneToMany(
      mappedBy = "ticket",
      fetch = FetchType.LAZY,
      cascade = {CascadeType.PERSIST, CascadeType.REMOVE},
      orphanRemoval = false)
  @JsonManagedReference(value = "ticket-attachment")
  private List<Attachment> attachments;

  @OneToMany(
      mappedBy = "associationSource",
      fetch = FetchType.LAZY,
      cascade = {CascadeType.PERSIST, CascadeType.REMOVE},
      orphanRemoval = false)
  @JsonManagedReference(value = "ticket-source-association")
  private List<TicketAssociation> ticketSourceAssociations;

  @OneToMany(
      mappedBy = "associationTarget",
      fetch = FetchType.LAZY,
      cascade = {CascadeType.PERSIST, CascadeType.REMOVE},
      orphanRemoval = false)
  @JsonManagedReference(value = "ticket-target-association")
  private List<TicketAssociation> ticketTargetAssociations;

  @ManyToOne(cascade = CascadeType.PERSIST)
  private PriorityBucket priorityBucket;

  @Column private String assignee;

  public static Ticket of(TicketDto ticketDto) {
    return Ticket.builder()
        .id(ticketDto.getId())
        .created(ticketDto.getCreated())
        .createdBy(ticketDto.getCreatedBy())
        .title(ticketDto.getTitle())
        .description(ticketDto.getDescription())
        .ticketType(ticketDto.getTicketType())
        .state(ticketDto.getState())
        .assignee(ticketDto.getAssignee())
        .priorityBucket(ticketDto.getPriorityBucket())
        .labels(ticketDto.getLabels())
        .iteration(ticketDto.getIteration())
        .build();
  }

  public static Ticket of(TicketImportDto ticketImportDto) {
    return Ticket.builder()
        .title(ticketImportDto.getTitle())
        .description(ticketImportDto.getDescription())
        .ticketType(ticketImportDto.getTicketType())
        .labels(ticketImportDto.getLabels())
        .comments(ticketImportDto.getComments())
        .additionalFieldTypeValues(ticketImportDto.getAdditionalFieldTypeValues())
        .attachments(ticketImportDto.getAttachments())
        .comments(ticketImportDto.getComments())
        .state(ticketImportDto.getState())
        .build();
  }
}
