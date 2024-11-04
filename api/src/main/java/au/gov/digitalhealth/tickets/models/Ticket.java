/*
 * Copyright 2024 Australian Digital Health Agency ABN 84 425 496 912.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package au.gov.digitalhealth.tickets.models;

import au.gov.digitalhealth.tickets.models.listeners.TicketEntityListener;
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
import jakarta.persistence.NamedAttributeNode;
import jakarta.persistence.NamedEntityGraph;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
import jakarta.persistence.OrderBy;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Builder.Default;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import lombok.ToString.Exclude;
import lombok.experimental.SuperBuilder;
import org.hibernate.envers.Audited;
import org.hibernate.proxy.HibernateProxy;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

@NamedEntityGraph(
    name = "Ticket.backlogSearch",
    attributeNodes = {
      @NamedAttributeNode("labels"),
      @NamedAttributeNode("externalRequestors"),
    })
@Entity
@SuperBuilder
@Getter
@Setter
@ToString(callSuper = true)
@Audited
@AllArgsConstructor
@NoArgsConstructor
@EntityListeners({AuditingEntityListener.class, TicketEntityListener.class})
@Table(name = "ticket")
public class Ticket extends BaseAuditableEntity {

  @Column private Instant jiraCreated;

  @Column private String title;

  @Column private String ticketNumber;

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
  @Builder.Default
  private Set<Label> labels = new HashSet<>();

  @ManyToMany(
      cascade = {CascadeType.PERSIST},
      fetch = FetchType.LAZY)
  @JoinTable(
      name = "ticket_external_requestors",
      joinColumns = @JoinColumn(name = "ticket_id"),
      inverseJoinColumns = @JoinColumn(name = "external_requestor_id"))
  @JsonProperty("externalRequestors")
  @Default
  @Exclude
  private Set<ExternalRequestor> externalRequestors = new HashSet<>();

  @ManyToMany(
      cascade = {CascadeType.PERSIST, CascadeType.MERGE, CascadeType.REFRESH},
      fetch = FetchType.LAZY)
  @JoinTable(
      name = "ticket_additional_field_values",
      joinColumns = @JoinColumn(name = "ticket_id"),
      inverseJoinColumns = @JoinColumn(name = "additional_field_value_id"))
  @JsonProperty("ticket-additional-fields")
  @Default
  @Exclude
  private Set<AdditionalFieldValue> additionalFieldValues = new HashSet<>();

  @ManyToOne(cascade = {CascadeType.MERGE})
  private State state;

  @ManyToOne(cascade = {CascadeType.MERGE, CascadeType.PERSIST})
  private Schedule schedule;

  @OneToMany(mappedBy = "ticket", cascade = CascadeType.REMOVE, fetch = FetchType.LAZY)
  @OrderBy("created DESC")
  @JsonManagedReference(value = "ticket-comment")
  @Exclude
  @Builder.Default
  private List<Comment> comments = new ArrayList<>();

  @OneToMany(mappedBy = "ticket", cascade = CascadeType.REMOVE, fetch = FetchType.LAZY)
  @JsonManagedReference(value = "ticket-attachment")
  @OrderBy("created DESC")
  @Exclude
  @Builder.Default
  private List<Attachment> attachments = new ArrayList<>();

  @OneToMany(
      mappedBy = "associationSource",
      fetch = FetchType.LAZY,
      cascade = {CascadeType.PERSIST, CascadeType.REMOVE})
  @Default
  @Exclude
  private Set<TicketAssociation> ticketSourceAssociations = new HashSet<>();

  @OneToMany(
      mappedBy = "associationTarget",
      fetch = FetchType.LAZY,
      cascade = {CascadeType.PERSIST, CascadeType.REMOVE})
  @Default
  @Exclude
  private Set<TicketAssociation> ticketTargetAssociations = new HashSet<>();

  @OneToOne(cascade = CascadeType.ALL, fetch = FetchType.LAZY)
  @JsonManagedReference(value = "ticket-task")
  @Exclude
  private TaskAssociation taskAssociation;

  @ManyToOne(cascade = CascadeType.PERSIST, fetch = FetchType.LAZY)
  @Exclude
  private PriorityBucket priorityBucket;

  @Column private String assignee;

  @OneToMany(
      cascade = {CascadeType.PERSIST, CascadeType.REMOVE},
      orphanRemoval = true,
      fetch = FetchType.LAZY,
      mappedBy = "ticket")
  @JsonManagedReference(value = "ticket-product")
  @JsonIgnore
  @Exclude
  @Builder.Default
  private Set<Product> products = new HashSet<>();

  @OneToMany(
      cascade = {CascadeType.PERSIST, CascadeType.REMOVE},
      orphanRemoval = true,
      fetch = FetchType.LAZY,
      mappedBy = "ticket")
  @JsonManagedReference(value = "ticket-bulk-product-action")
  @JsonIgnore
  @Exclude
  @Builder.Default
  private Set<BulkProductAction> bulkProductActions = new HashSet<>();

  @OneToMany(
      mappedBy = "ticket",
      cascade = CascadeType.ALL,
      orphanRemoval = true,
      fetch = FetchType.LAZY)
  @JsonIgnoreProperties("ticket")
  @Default
  @Exclude
  private Set<JsonField> jsonFields = new HashSet<>();

  @PrePersist
  public void prePersist() {
    if (jiraCreated != null) {
      setCreated(jiraCreated);
    }
  }

  @Override
  @SuppressWarnings("java:S6201") // Suppressed because code is direct from JPABuddy advice
  public final boolean equals(Object o) {
    if (this == o) return true;
    if (o == null) return false;
    Class<?> oEffectiveClass =
        o instanceof HibernateProxy
            ? ((HibernateProxy) o).getHibernateLazyInitializer().getPersistentClass()
            : o.getClass();
    Class<?> thisEffectiveClass =
        this instanceof HibernateProxy
            ? ((HibernateProxy) this).getHibernateLazyInitializer().getPersistentClass()
            : this.getClass();
    if (thisEffectiveClass != oEffectiveClass) return false;
    Ticket ticket = (Ticket) o;
    return getId() != null && Objects.equals(getId(), ticket.getId());
  }

  @Override
  @SuppressWarnings("java:S6201") // Suppressed because code is direct from JPABuddy advice
  public final int hashCode() {
    return this instanceof HibernateProxy
        ? ((HibernateProxy) this).getHibernateLazyInitializer().getPersistentClass().hashCode()
        : getClass().hashCode();
  }
}
