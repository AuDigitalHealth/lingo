package com.csiro.tickets.models;

import com.fasterxml.jackson.annotation.JsonIdentityInfo;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.ObjectIdGenerators;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.FetchType;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.ManyToOne;
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
@Data
@SuperBuilder
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "additional_field_value")
@Audited
@EntityListeners(AuditingEntityListener.class)
@JsonIdentityInfo(generator = ObjectIdGenerators.PropertyGenerator.class, property = "id")
public class AdditionalFieldValue extends BaseAuditableEntity {

  @ManyToMany(mappedBy = "additionalFieldValues")
  @JsonIgnore
  private List<Ticket> tickets;

  @ManyToOne(
      cascade = {CascadeType.PERSIST},
      fetch = FetchType.EAGER)
  private AdditionalFieldType additionalFieldType;

  @Column private String valueOf;

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
    AdditionalFieldValue that = (AdditionalFieldValue) o;
    return Objects.equals(additionalFieldType, that.additionalFieldType)
        && Objects.equals(valueOf, that.valueOf);
  }

  @Override
  public int hashCode() {
    return Objects.hash(super.hashCode(), additionalFieldType, valueOf);
  }
}
