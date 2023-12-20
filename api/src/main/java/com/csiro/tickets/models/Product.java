package com.csiro.tickets.models;

import com.csiro.snomio.models.product.details.PackageDetails;
import com.csiro.snomio.models.product.details.ProductDetails;
import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode.Exclude;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.envers.Audited;
import org.hibernate.type.SqlTypes;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

@Entity
@SuperBuilder
@Data
@Audited
@AllArgsConstructor
@NoArgsConstructor
@EntityListeners(AuditingEntityListener.class)
@Table(
    name = "product",
    uniqueConstraints =
        @UniqueConstraint(
            name = "product_name_ticket_unique",
            columnNames = {"ticket_id", "name"}))
public class Product extends BaseAuditableEntity {

  @ManyToOne
  @JoinColumn(name = "ticket_id", nullable = false)
  @JsonBackReference(value = "ticket-product")
  @Exclude
  private Ticket ticket;

  @NotNull
  @NotEmpty
  @Column(nullable = false, length = 2048)
  private String name;

  private Long conceptId;

  @NotNull
  @JdbcTypeCode(SqlTypes.JSON)
  private PackageDetails<? extends ProductDetails> packageDetails;
}
