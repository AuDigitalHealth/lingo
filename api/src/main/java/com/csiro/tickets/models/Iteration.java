package com.csiro.tickets.models;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.FetchType;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.List;
import lombok.Data;
import org.hibernate.envers.Audited;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

@Data
@Table(name = "iteration")
@Entity
@Audited
@EntityListeners(AuditingEntityListener.class)
public class Iteration extends BaseAuditableEntity {

  @Column
  private String name;

  @Column
  private Instant startDate;

  @Column
  private Instant endDate;

  @Column
  private boolean active;

  @Column
  private boolean completed;

  @OneToMany(
      mappedBy = "iteration",
      fetch = FetchType.LAZY,
      cascade = {CascadeType.PERSIST, CascadeType.REMOVE},
      orphanRemoval = false)
  @JsonIgnore
  private List<Ticket> tickets;
}
