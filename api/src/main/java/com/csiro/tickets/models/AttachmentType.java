package com.csiro.tickets.models;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.NaturalId;
import org.hibernate.envers.Audited;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

@Entity
@Data
@Audited
@Builder
@AllArgsConstructor
@NoArgsConstructor
@EntityListeners(AuditingEntityListener.class)
@Table(name = "attachment_type")
public class AttachmentType {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  // TODO: Review here why we need Name here! During import we generate the names from the mimetype
  // no other info to generate names!
  @Column private String name;

  @Column(unique = true)
  @NaturalId
  private String mimeType;

  public static AttachmentType of(AttachmentType attachmentType) {
    return AttachmentType.builder()
        .name(attachmentType.getName())
        .mimeType(attachmentType.getMimeType())
        .build();
  }

  public static AttachmentType of(String attachmentType) {
    return AttachmentType.builder().name(attachmentType).mimeType(attachmentType).build();
  }
}
