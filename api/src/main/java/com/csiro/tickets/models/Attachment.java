package com.csiro.tickets.models;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Lob;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import javax.sql.rowset.serial.SerialBlob;
import lombok.Data;
import org.hibernate.envers.Audited;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

@Entity
@Data
@Table(name = "attachment")
@Audited
@EntityListeners(AuditingEntityListener.class)
public class Attachment extends BaseAuditableEntity {

  @ManyToOne
  @JoinColumn(name = "ticket_id")
  @JsonBackReference(value = "ticket-attachment")
  private Ticket ticket;

  @Column private String description;

  @Column String filename;

  @Column @Lob private SerialBlob data;

  @Column private Integer length;

  @Column private String sha256;

  @ManyToOne(cascade = {CascadeType.PERSIST})
  private AttachmentType attachmentType;
}
