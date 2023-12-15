package com.csiro.tickets.models;

import com.csiro.tickets.IterationDto;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.FetchType;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import java.time.Instant;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;
import org.hibernate.envers.Audited;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

@Data
@SuperBuilder
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "iteration")
@Entity
@Audited
@EntityListeners(AuditingEntityListener.class)
public class Iteration extends BaseAuditableEntity {

  @Column(unique = true)
  private String name;

  @Column private Instant startDate;

  @Column private Instant endDate;

  @Column private boolean active;

  @Column private boolean completed;

  @OneToMany(
      mappedBy = "iteration",
      fetch = FetchType.EAGER,
      cascade = {CascadeType.ALL, CascadeType.REMOVE},
      orphanRemoval = false)
  @Transient
  @JsonIgnore
  private List<Ticket> tickets;

  public static Iteration of(IterationDto iterationDto) {
    if (iterationDto == null) return null;

    return Iteration.builder()
        .name(iterationDto.getName())
        .startDate(iterationDto.getStartDate())
        .endDate(iterationDto.getEndDate())
        .active(iterationDto.isActive())
        .completed(iterationDto.isCompleted())
        .build();
  }
}
