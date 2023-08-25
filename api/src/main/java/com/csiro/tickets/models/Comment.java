package com.csiro.tickets.models;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import java.time.Instant;
import lombok.Data;
import lombok.Getter;
import org.hibernate.envers.Audited;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

@Entity
@Data
@Table(name = "comment")
@Audited
@EntityListeners(AuditingEntityListener.class)
public class Comment {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne
  @JoinColumn(name = "ticket_id")
  @JsonBackReference(value = "ticket-comment")
  private Ticket ticket;

  @Version private Integer version;

  @Column(name = "created", nullable = false, updatable = false)
  @CreatedDate
  private Instant created;

  @Column(name = "created_by", updatable = false)
  @CreatedBy
  private String createdBy;

  @Column(name = "modified")
  @LastModifiedDate
  private Instant modified;

  @Column private String text;
}
