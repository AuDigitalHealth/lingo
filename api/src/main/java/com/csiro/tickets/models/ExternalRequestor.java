package com.csiro.tickets.models;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
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
@Table(name = "external_requestor")
@Audited
@EntityListeners(AuditingEntityListener.class)
public class ExternalRequestor extends BaseAuditableEntity {

  @ManyToMany(mappedBy = "externalRequestors")
  @JsonIgnore
  private List<Ticket> ticket;

  @Column(unique = true)
  private String name;

  private String description;

  // Can be success, error, warning, info, secondary, primary or some hex value
  private String displayColor;

  public static ExternalRequestor of(ExternalRequestor label) {
    return ExternalRequestor.builder()
        .name(label.getName())
        .description(label.getDescription())
        .displayColor(label.getDisplayColor())
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
    ExternalRequestor that = (ExternalRequestor) o;
    return Objects.equals(name, that.name)
        && Objects.equals(description, that.description)
        && Objects.equals(displayColor, that.displayColor);
  }

  @Override
  public int hashCode() {
    return Objects.hash(super.hashCode(), name, description, displayColor);
  }
}
