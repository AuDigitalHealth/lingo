package au.gov.digitalhealth.tickets.controllers;

import au.gov.digitalhealth.tickets.models.ProductAction;
import java.time.Instant;

public record ProductAuditDto(
    Long id,
    String conceptId,
    String originalConceptId,
    String name,
    ProductAction action,
    String revisionType,
    Instant revisionDate,
    Number revisionNumber,
    String createdBy,
    String modifiedBy,
    Instant created,
    Object packageDetails,
    Object originalPackageDetails) {}
