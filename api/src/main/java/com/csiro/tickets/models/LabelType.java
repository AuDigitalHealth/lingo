package com.csiro.tickets.models;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import java.util.List;
import lombok.Data;
import org.hibernate.envers.Audited;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

@Entity
@Data
@Table(name = "label_type")
@Audited
@EntityListeners(AuditingEntityListener.class)
public class LabelType extends BaseAuditableEntity {

  @OneToMany
  @JsonBackReference(value = "label-type")
  private List<Label> label;

  private String name;

  private String description;

  // Can be success, error, warning, info, secondary, primary or some hex value
  private String displayColor;
}
