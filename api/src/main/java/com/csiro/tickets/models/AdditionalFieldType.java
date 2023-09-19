package com.csiro.tickets.models;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.FetchType;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.NaturalId;
import org.hibernate.envers.Audited;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

@Entity
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "additional_field_type")
@Audited
@EntityListeners(AuditingEntityListener.class)
public class AdditionalFieldType extends BaseAuditableEntity {

  @Column(unique = true)
  @NaturalId
  private String name;

  @Column private String description;

  @OneToMany(
      mappedBy = "additionalFieldType",
      fetch = FetchType.EAGER,
      cascade = {CascadeType.PERSIST, CascadeType.REMOVE},
      orphanRemoval = true)
  private List<AdditionalFieldTypeValue> additionalFieldTypeValues;

  @Override
  public String toString() {
    return "AdditionalFieldType{" + "name='" + name + '\'' + '}';
  }
}
