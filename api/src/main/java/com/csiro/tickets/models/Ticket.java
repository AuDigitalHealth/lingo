package com.csiro.tickets.models;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.fasterxml.jackson.annotation.JsonProperty;
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
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.List;
import java.util.Set;
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
public class Ticket extends BaseAuditableEntity {

  @Column private Instant jiraCreated;

  @Column private String title;

  @Column(length = 1000000)
  private String description;

  @ManyToOne(cascade = {CascadeType.PERSIST})
  private TicketType ticketType;

  @ManyToOne(cascade = CascadeType.PERSIST)
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

  @ManyToMany(
      cascade = {CascadeType.PERSIST},
      fetch = FetchType.EAGER)
  @JoinTable(
      name = "ticket_external_requestors",
      joinColumns = @JoinColumn(name = "ticket_id"),
      inverseJoinColumns = @JoinColumn(name = "external_requestor_id"))
  @JsonProperty("externalRequestors")
  private List<ExternalRequestor> externalRequestors;

  // Need EAGER here otherwise api calles like /ticket will fail
  @ManyToMany(
      cascade = {CascadeType.PERSIST, CascadeType.MERGE, CascadeType.REFRESH},
      fetch = FetchType.EAGER)
  @JoinTable(
      name = "ticket_additional_field_values",
      joinColumns = @JoinColumn(name = "ticket_id"),
      inverseJoinColumns = @JoinColumn(name = "additional_field_value_id"))
  @JsonProperty("ticket-additional-fields")
  private Set<AdditionalFieldValue> additionalFieldValues;

  @ManyToOne(cascade = {CascadeType.MERGE})
  private State state;

  @ManyToOne(cascade = {CascadeType.MERGE, CascadeType.PERSIST})
  private Schedule schedule;

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
      orphanRemoval = true)
  private List<TicketAssociation> ticketSourceAssociations;

  @OneToMany(
      mappedBy = "associationTarget",
      fetch = FetchType.EAGER,
      cascade = {CascadeType.PERSIST, CascadeType.REMOVE},
      orphanRemoval = true)
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

  @OneToMany(
      mappedBy = "ticket",
      cascade = CascadeType.ALL,
      orphanRemoval = true,
      fetch = FetchType.EAGER)
  @JsonIgnoreProperties("ticket")
  private List<JsonField> jsonFields;

  @PrePersist
  public void prePersist() {
    if (jiraCreated != null) {
      setCreated(jiraCreated);
    }
  }

  public void removeAdditionalFieldsBaseOnType() {}
}
