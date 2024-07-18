package com.csiro.tickets.models;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.Table;
import java.util.Objects;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.Cache;
import org.hibernate.annotations.CacheConcurrencyStrategy;
import org.hibernate.envers.Audited;
import org.hibernate.proxy.HibernateProxy;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

@Entity
@SuperBuilder(toBuilder = true)
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@ToString
@Table(name = "external_requestor")
@Audited
@EntityListeners(AuditingEntityListener.class)
@Cache(usage = CacheConcurrencyStrategy.READ_WRITE)
public class ExternalRequestor extends BaseAuditableEntity {

  @Column(unique = true)
  private String name;

  private String description;

  // Can be success, error, warning, info, secondary, primary or some hex value
  private String displayColor;

  public static ExternalRequestor of(ExternalRequestor label) {
    return ExternalRequestor.builder()
        .name(label.getName())
        .description(label.getDescription())
        .displayColor(label.getDisplayColor())
        .build();
  }

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
    ExternalRequestor that = (ExternalRequestor) o;
    return getId() != null && Objects.equals(getId(), that.getId());
  }

  @Override
  @SuppressWarnings("java:S6201") // Suppressed because code is direct from JPABuddy advice
  public final int hashCode() {
    return this instanceof HibernateProxy
        ? ((HibernateProxy) this).getHibernateLazyInitializer().getPersistentClass().hashCode()
        : getClass().hashCode();
  }
}
