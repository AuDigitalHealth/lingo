package com.csiro.ticket.controllers.dto.models;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.FetchType;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.Objects;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;
import org.hibernate.envers.Audited;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

@Entity
@Data
@Table(name = "attachment")
@Audited
@SuperBuilder
@AllArgsConstructor
@NoArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class Attachment extends BaseAuditableEntity {

  @Column private String description;

  @Column private String filename;

  @Column private String location;

  @Column private String thumbnailLocation;

  @Column private Integer length;

  @Column private String sha256;

  @Column private Instant jiraCreated;

  @ManyToOne(
      cascade = {CascadeType.PERSIST},
      fetch = FetchType.EAGER)
  private AttachmentType attachmentType;

  @ManyToOne
  @JsonBackReference(value = "ticket-attachment")
  private Ticket ticket;

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
    Attachment that = (Attachment) o;
    return Objects.equals(description, that.description)
        && Objects.equals(filename, that.filename)
        && Objects.equals(jiraCreated, that.jiraCreated)
        && Objects.equals(length, that.length)
        && Objects.equals(location, that.location)
        && Objects.equals(sha256, that.sha256);
  }

  @Override
  public int hashCode() {
    return Objects.hash(
        super.hashCode(), location, filename, description, jiraCreated, length, sha256);
  }
}
