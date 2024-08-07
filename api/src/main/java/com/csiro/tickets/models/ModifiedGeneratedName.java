package com.csiro.tickets.models;

import com.csiro.snomio.product.NameGeneratorSpec;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

@Getter
@Setter
@ToString
@SuperBuilder
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "modified_generated_name")
@Entity
@EntityListeners(AuditingEntityListener.class)
public class ModifiedGeneratedName {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column private String identifier;

  @Column(nullable = false, updatable = false)
  @CreatedDate
  private Instant created;

  @Column(updatable = false)
  @CreatedBy
  private String createdBy;

  @Column private String taskId;

  @Column private String generatedFullySpecifiedName;

  @Column private String modifiedFullySpecifiedName;

  @Column private String generatedPreferredTerm;

  @Column private String modifiedPreferredTerm;

  @NotNull
  @JdbcTypeCode(SqlTypes.JSON)
  private NameGeneratorSpec nameGeneratorSpec;
}
