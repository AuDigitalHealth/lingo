package com.csiro.tickets.models;

import com.csiro.snomio.product.details.PackageDetails;
import com.csiro.snomio.product.details.ProductDetails;
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
import java.util.Objects;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode.Exclude;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.envers.Audited;
import org.hibernate.proxy.HibernateProxy;
import org.hibernate.type.SqlTypes;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

@Entity
@SuperBuilder
@Getter
@Setter
@ToString
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

  @Override
  @SuppressWarnings("java:S6201") // Suppressed because code is direct from JPABuddy advice
  public final boolean equals(Object o) {
    if (this == o) return true;
    if (o == null) return false;
    Class<?> oEffectiveClass =
        o instanceof HibernateProxy
            ? ((HibernateProxy) o).getHibernateLazyInitializer().getPersistentClass()
            : o.getClass();
    Class<?> thisEffectiveClass =
        this instanceof HibernateProxy
            ? ((HibernateProxy) this).getHibernateLazyInitializer().getPersistentClass()
            : this.getClass();
    if (thisEffectiveClass != oEffectiveClass) return false;
    Product product = (Product) o;
    return getId() != null && Objects.equals(getId(), product.getId());
  }

  @Override
  @SuppressWarnings("java:S6201") // Suppressed because code is direct from JPABuddy advice
  public final int hashCode() {
    return this instanceof HibernateProxy
        ? ((HibernateProxy) this).getHibernateLazyInitializer().getPersistentClass().hashCode()
        : getClass().hashCode();
  }
}
