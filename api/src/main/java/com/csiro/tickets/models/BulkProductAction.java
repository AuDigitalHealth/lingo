package com.csiro.tickets.models;

import com.csiro.snomio.product.bulk.BulkProductActionDetails;
import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.Set;
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
    name = "bulk_product_action",
    uniqueConstraints =
        @UniqueConstraint(
            name = "bulk_product_name_ticket_unique",
            columnNames = {"ticket_id", "name"}))
public class BulkProductAction extends BaseAuditableEntity {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne
  @JoinColumn(name = "ticket_id", nullable = false)
  @JsonBackReference(value = "ticket-bulk-product-action")
  @Exclude
  private Ticket ticket;

  @NotNull
  @NotEmpty
  @Column(nullable = false, length = 2048)
  private String name;

  @ElementCollection(fetch = FetchType.EAGER)
  @CollectionTable(name = "bulk_concept_ids", joinColumns = @JoinColumn(name = "id"))
  @Column(name = "concept_id")
  private Set<Long> conceptIds;

  @NotNull
  @JdbcTypeCode(SqlTypes.JSON)
  private BulkProductActionDetails details;
}
