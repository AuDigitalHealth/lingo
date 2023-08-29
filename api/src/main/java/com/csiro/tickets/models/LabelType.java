package com.csiro.tickets.models;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.Entity;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import java.util.List;
import lombok.Data;
import org.hibernate.envers.Audited;

@Entity
@Data
@Table(name = "label_type")
@Audited
public class LabelType extends BaseAuditableEntity {

  @OneToMany
  @JsonBackReference(value = "label-type")
  private List<Label> label;

  private String name;

  private String description;
}
