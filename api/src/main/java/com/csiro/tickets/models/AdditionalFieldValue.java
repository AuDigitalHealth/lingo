package com.csiro.tickets.models;

import com.csiro.tickets.controllers.dto.AdditionalFieldValueForListTypeDto;
import com.fasterxml.jackson.annotation.JsonIdentityInfo;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.ObjectIdGenerators;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.ColumnResult;
import jakarta.persistence.ConstructorResult;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.FetchType;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.NamedNativeQuery;
import jakarta.persistence.SqlResultSetMapping;
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
@SqlResultSetMapping(
    name = "AdditionalFieldValueForListTypeDtoMapping",
    classes =
        @ConstructorResult(
            targetClass = AdditionalFieldValueForListTypeDto.class,
            columns = {
              @ColumnResult(name = "typeId", type = Long.class),
              @ColumnResult(name = "typeName", type = String.class),
              @ColumnResult(name = "valueIds", type = String.class),
              @ColumnResult(name = "value", type = String.class)
            }))
@NamedNativeQuery(
    name = "findAdditionalFieldValuesForListType",
    query =
        "select a2_0.id typeId,a2_0.name typeName,string_agg(cast(a1_0.id as text),',') valueIds,a1_0.value_of value from additional_field_value a1_0 join additional_field_type a2_0 on a2_0.id=a1_0.additional_field_type_id where a2_0.list_type=true group by a2_0.id,a2_0.name,a1_0.value_of;",
    resultSetMapping = "AdditionalFieldValueForListTypeDtoMapping")
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
