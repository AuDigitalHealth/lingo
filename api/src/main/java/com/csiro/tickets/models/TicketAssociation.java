package com.csiro.tickets.models;

import com.fasterxml.jackson.annotation.JsonIdentityInfo;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.ObjectIdGenerators;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.util.Objects;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import lombok.experimental.SuperBuilder;
import org.hibernate.envers.Audited;
import org.hibernate.proxy.HibernateProxy;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

@Entity
@Getter
@Setter
@ToString
@SuperBuilder
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "ticket_association")
@Audited
@EntityListeners(AuditingEntityListener.class)
@JsonIdentityInfo(generator = ObjectIdGenerators.PropertyGenerator.class, property = "id")
public class TicketAssociation extends BaseAuditableEntity {

  @ManyToOne
  @JoinColumn(name = "ticket_source_id", nullable = false)
  @JsonIgnoreProperties({
    "iteration",
    "labels",
    "ticket-additional-fields",
    "schedule",
    "comments",
    "attachments",
    "ticketSourceAssociations",
    "ticketTargetAssociations",
    "taskAssociation",
    "priorityBucket",
    "jsonFields",
    "ticketType",
    "version",
    "created",
    "modified",
    "modifiedBy",
    "jiraCreated"
  })
  private Ticket associationSource;

  @ManyToOne
  @JoinColumn(name = "ticket_target_id", nullable = false)
  @JsonIgnoreProperties({
    "iteration",
    "labels",
    "ticket-additional-fields",
    "schedule",
    "comments",
    "attachments",
    "ticketSourceAssociations",
    "ticketTargetAssociations",
    "taskAssociation",
    "priorityBucket",
    "jsonFields",
    "ticketType",
    "version",
    "created",
    "modified",
    "modifiedBy",
    "jiraCreated"
  })
  private Ticket associationTarget;

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
    TicketAssociation that = (TicketAssociation) o;
    return getId() != null && Objects.equals(getId(), that.getId());
  }

  @Override
  @SuppressWarnings("java:S6201") // Suppressed because code is direct from JPABuddy advice
  public final int hashCode() {
    return this instanceof HibernateProxy
        ? ((HibernateProxy) this).getHibernateLazyInitializer().getPersistentClass().hashCode()
        : getClass().hashCode();
  }
}
