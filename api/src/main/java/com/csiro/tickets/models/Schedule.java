package com.csiro.tickets.models;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.Table;
import java.util.Objects;
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
@Table(name = "schedule")
@Audited
@EntityListeners(AuditingEntityListener.class)
public class Schedule extends BaseAuditableEntity {

  @Column(name = "name", unique = true)
  @NaturalId
  private String name;

  @Column(name = "description")
  private String description;

  @Column(name = "grouping")
  private Integer grouping;

  @Override
  public boolean equals(Object o) {
    if (this == o) {
      return true;
    }
    if (o == null || getClass() != o.getClass()) {
      return false;
    }
    if (!super.equals(o)) {
      return false;
    }
    Schedule that = (Schedule) o;
    return Objects.equals(name, that.name)
        && Objects.equals(description, that.description)
        && Objects.equals(grouping, that.grouping);
  }

  @Override
  public int hashCode() {
    return Objects.hash(super.hashCode(), name, description, grouping);
  }
}
