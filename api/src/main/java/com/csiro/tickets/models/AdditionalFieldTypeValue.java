package com.csiro.tickets.models;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.util.List;
import java.util.Objects;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.envers.Audited;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

@Entity
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "additional_field_type_value")
@Audited
@EntityListeners(AuditingEntityListener.class)
public class AdditionalFieldTypeValue extends BaseAuditableEntity {

  @ManyToOne(
      cascade = {CascadeType.PERSIST},
      optional = false)
  private AdditionalFieldType additionalFieldType;

  @ManyToMany(
      mappedBy = "additionalFieldTypeValues",
      cascade = {CascadeType.PERSIST})
  @JsonIgnore
  private List<Ticket> tickets;

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
    AdditionalFieldTypeValue that = (AdditionalFieldTypeValue) o;
    return Objects.equals(additionalFieldType, that.additionalFieldType)
        && Objects.equals(valueOf, that.valueOf);
  }

  @Override
  public int hashCode() {
    return Objects.hash(super.hashCode(), additionalFieldType, valueOf);
  }

  @Column private String valueOf;

  @Column private Integer grouping;
}
