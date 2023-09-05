package com.csiro.tickets.models;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.FetchType;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import java.util.List;
import lombok.Data;
import org.hibernate.envers.Audited;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

@Entity
@Data
@Table(name = "priority_bucket")
@Audited
@EntityListeners(AuditingEntityListener.class)
public class PriorityBucket extends BaseAuditableEntity {

  private String name;

  private Integer orderIndex;

  private String description;

  @OneToMany(
      mappedBy = "priorityBucket",
      fetch = FetchType.LAZY,
      cascade = {CascadeType.PERSIST, CascadeType.REMOVE},
      orphanRemoval = false)
  @JsonIgnore
  private List<Ticket> tickets;
}
