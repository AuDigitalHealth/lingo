package com.csiro.snomio.models.tickets;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import java.util.List;
import lombok.Data;
import org.hibernate.envers.Audited;

@Entity
@Data
@Audited
@Table(name="attachment_type")
public class AttachmentType {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column
  private String name;

  @Column
  private String mimeType;

}
