package com.csiro.tickets.models;

import com.csiro.tickets.controllers.dto.StateDto;
import com.fasterxml.jackson.annotation.JsonIdentityInfo;
import com.fasterxml.jackson.annotation.ObjectIdGenerators;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.NaturalId;
import org.hibernate.envers.Audited;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

@Entity
@Data
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "state")
@Audited
@EntityListeners(AuditingEntityListener.class)
@JsonIdentityInfo(
    scope = State.class,
    generator = ObjectIdGenerators.PropertyGenerator.class,
    property = "id")
public class State extends BaseAuditableEntity {

  @Column(name = "label", unique = true)
  @NaturalId
  private String label;

  @Column(name = "description")
  private String description;

  @Column(name = "grouping")
  private Integer grouping;

  public static State of(StateDto stateDto) {
    if (stateDto == null) {
      return null;
    }
    return State.builder()
        .id(stateDto.getId())
        .label(stateDto.getLabel())
        .description(stateDto.getDescription())
        .grouping(stateDto.getGrouping())
        .build();
  }
}
