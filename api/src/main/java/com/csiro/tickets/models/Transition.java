package com.csiro.tickets.models;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.envers.Audited;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "transition")
@Audited
public class Transition extends BaseAuditableEntity {

  @Column private String name;
}
