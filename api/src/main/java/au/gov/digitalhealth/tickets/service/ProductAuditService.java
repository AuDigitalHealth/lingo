package au.gov.digitalhealth.tickets.service;

import au.gov.digitalhealth.tickets.controllers.ProductAuditDto;
import au.gov.digitalhealth.tickets.models.CustomRevInfo;
import au.gov.digitalhealth.tickets.models.Product;
import au.gov.digitalhealth.tickets.repository.ProductRepository;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import java.time.Instant;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.hibernate.envers.AuditReader;
import org.hibernate.envers.AuditReaderFactory;
import org.hibernate.envers.RevisionType;
import org.hibernate.envers.query.AuditEntity;
import org.hibernate.envers.query.AuditQuery;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ProductAuditService {

  private final EntityManager entityManager;
  private final ProductRepository productRepository;

  @Transactional
  public List<ProductAuditDto> getProductAuditRecords(Long productId) {
    AuditReader auditReader = AuditReaderFactory.get(entityManager);

    // Query revisions of Product
    AuditQuery query =
        auditReader
            .createQuery()
            .forRevisionsOfEntity(Product.class, false, true)
            .add(AuditEntity.id().eq(productId));

    @SuppressWarnings("unchecked")
    List<Object[]> results = query.getResultList();

    // Fetch live product for fallback values
    Product product =
        productRepository
            .findById(productId)
            .orElseThrow(() -> new RuntimeException("Product not found: " + productId));

    return results.stream()
        .map(
            row -> {
              Product productSnapshot = (Product) row[0]; // Envers snapshot
              CustomRevInfo revInfo = (CustomRevInfo) row[1]; // Revision info
              RevisionType revType = (RevisionType) row[2]; // ADD, MOD, DEL

              // Map all fields + audit metadata
              return new ProductAuditDto(
                  productSnapshot.getId(),
                  product.getConceptId() != null ? String.valueOf(product.getConceptId()) : null,
                  product.getOriginalConceptId() != null
                      ? String.valueOf(product.getOriginalConceptId())
                      : null,
                  productSnapshot.getName(),
                  productSnapshot.getAction(),
                  revType.name(),
                  Instant.ofEpochMilli(revInfo.getRevtstmp()), // updated time
                  revInfo.getRev(),
                  product.getCreatedBy(), // created By
                  revInfo.getUsername(), // updated By
                  product.getCreated(), // created time
                  productSnapshot.getPackageDetails(),
                  productSnapshot.getOriginalPackageDetails());
            })
        .toList();
  }
}
