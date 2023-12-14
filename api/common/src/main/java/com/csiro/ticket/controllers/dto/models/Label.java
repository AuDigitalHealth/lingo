package com.csiro.ticket.controllers.dto.models;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.Table;
import java.util.List;
import java.util.Objects;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;
import org.hibernate.envers.Audited;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

@Entity
@SuperBuilder(toBuilder = true)
@AllArgsConstructor
@NoArgsConstructor
@Data
@Table(name = "label")
@Audited
@EntityListeners(AuditingEntityListener.class)
public class Label extends BaseAuditableEntity {

  @ManyToMany(mappedBy = "labels")
  @JsonIgnore
  private List<Ticket> ticket;

  @Column(unique = true)
  private String name;

  private String description;

  // Can be success, error, warning, info, secondary, primary or some hex value
  private String displayColor;

  public static Label of(Label label) {
    return Label.builder()
        .name(label.getName())
        .description(label.getDescription())
        .displayColor(label.getDescription())
        .build();
  }

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
    Label that = (Label) o;
    return Objects.equals(name, that.name)
        && Objects.equals(description, that.description)
        && Objects.equals(displayColor, that.displayColor);
  }

  @Override
  public int hashCode() {
    return Objects.hash(super.hashCode(), name, description, displayColor);
  }
}
