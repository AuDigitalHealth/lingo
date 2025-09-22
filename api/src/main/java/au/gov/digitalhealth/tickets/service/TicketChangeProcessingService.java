/*
 * Copyright 2024 Australian Digital Health Agency ABN 84 425 496 912.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package au.gov.digitalhealth.tickets.service;

import au.gov.digitalhealth.tickets.TicketHistoryEntryDto;
import au.gov.digitalhealth.tickets.TicketHistoryValueDto;
import au.gov.digitalhealth.tickets.models.CustomRevInfo;
import au.gov.digitalhealth.tickets.models.ExternalRequestor;
import au.gov.digitalhealth.tickets.models.Iteration;
import au.gov.digitalhealth.tickets.models.Label;
import au.gov.digitalhealth.tickets.models.PriorityBucket;
import au.gov.digitalhealth.tickets.models.State;
import au.gov.digitalhealth.tickets.models.TaskAssociation;
import au.gov.digitalhealth.tickets.models.Ticket;
import au.gov.digitalhealth.tickets.repository.ExternalRequestorRepository;
import au.gov.digitalhealth.tickets.repository.IterationRepository;
import au.gov.digitalhealth.tickets.repository.LabelRepository;
import au.gov.digitalhealth.tickets.repository.PriorityBucketRepository;
import au.gov.digitalhealth.tickets.repository.StateRepository;
import au.gov.digitalhealth.tickets.repository.TaskAssociationRepository;
import au.gov.digitalhealth.tickets.repository.TicketRepository;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import org.springframework.stereotype.Service;

@Service
public class TicketChangeProcessingService {

  private final StateRepository stateRepository;
  private final LabelRepository labelRepository;

  private final TaskAssociationRepository taskAssociationRepository;
  private final IterationRepository iterationRepository;
  private final PriorityBucketRepository priorityBucketRepository;
  private final ExternalRequestorRepository externalRequestorRepository;
  private final TicketRepository ticketRepository;

  public TicketChangeProcessingService(
      TaskAssociationRepository taskAssociationRepository,
      StateRepository stateRepository,
      LabelRepository labelRepository,
      IterationRepository iterationRepository,
      PriorityBucketRepository priorityBucketRepository,
      ExternalRequestorRepository externalRequestorRepository,
      TicketRepository ticketRepository) {
    this.taskAssociationRepository = taskAssociationRepository;
    this.stateRepository = stateRepository;
    this.labelRepository = labelRepository;
    this.iterationRepository = iterationRepository;
    this.priorityBucketRepository = priorityBucketRepository;
    this.externalRequestorRepository = externalRequestorRepository;
    this.ticketRepository = ticketRepository;
  }

  public List<TicketHistoryEntryDto> processFieldChanges(
      Object[] fieldData, CustomRevInfo revInfo) {
    List<TicketHistoryEntryDto> changes = new ArrayList<>();
    LocalDateTime timestamp = convertTimestamp(revInfo.getRevtstmp());

    // Process each field change
    changes.addAll(
        processStringFieldChange(
            "title", (String) fieldData[0], (String) fieldData[1], revInfo, timestamp));
    changes.addAll(
        processStringFieldChange(
            "description", (String) fieldData[2], (String) fieldData[3], revInfo, timestamp));
    changes.addAll(
        processStringFieldChange(
            "assignee", (String) fieldData[4], (String) fieldData[5], revInfo, timestamp));
    changes.addAll(
        processEntityFieldChange(
            "state",
            (Number) fieldData[6],
            (Number) fieldData[7],
            this::getStateName,
            revInfo,
            timestamp));
    changes.addAll(
        processEntityFieldChange(
            "priority",
            (Number) fieldData[8],
            (Number) fieldData[9],
            this::getPriorityBucketName,
            revInfo,
            timestamp));
    changes.addAll(
        processEntityFieldChange(
            "iteration",
            (Number) fieldData[10],
            (Number) fieldData[11],
            this::getIterationName,
            revInfo,
            timestamp));

    return changes;
  }

  public List<TicketHistoryEntryDto> processLabelChanges(List<Object[]> labelData) {
    return labelData.stream().map(this::processLabelChange).toList();
  }

  public List<TicketHistoryEntryDto> processCommentChanges(List<Object[]> commentData) {
    return commentData.stream().map(this::processCommentChange).toList();
  }

  public List<TicketHistoryEntryDto> processExternalRequestorChanges(List<Object[]> requestorData) {
    return requestorData.stream().map(this::processExternalRequestorChange).toList();
  }

  // Private helper methods
  private List<TicketHistoryEntryDto> processStringFieldChange(
      String fieldName,
      String oldValue,
      String newValue,
      CustomRevInfo revInfo,
      LocalDateTime timestamp) {
    List<TicketHistoryEntryDto> changes = new ArrayList<>();

    if (!Objects.equals(oldValue, newValue)) {
      TicketHistoryValueDto oldValueDto = TicketHistoryValueDto.builder().value(oldValue).build();
      TicketHistoryValueDto newValueDto = TicketHistoryValueDto.builder().value(newValue).build();

      changes.add(
          new TicketHistoryEntryDto(
              (long) revInfo.getRev(),
              timestamp,
              "UPDATE",
              fieldName,
              oldValueDto,
              newValueDto,
              capitalizeFirst(fieldName) + " changed",
              revInfo.getUsername()));
    }

    return changes;
  }

  private List<TicketHistoryEntryDto> processEntityFieldChange(
      String fieldName,
      Number oldId,
      Number newId,
      EntityNameResolver resolver,
      CustomRevInfo revInfo,
      LocalDateTime timestamp) {
    List<TicketHistoryEntryDto> changes = new ArrayList<>();

    Long oldEntityId = oldId != null ? oldId.longValue() : null;
    Long newEntityId = newId != null ? newId.longValue() : null;

    if (!Objects.equals(oldEntityId, newEntityId)) {
      String oldName = resolver.resolve(oldEntityId);
      String newName = resolver.resolve(newEntityId);

      TicketHistoryValueDto oldValueDto =
          TicketHistoryValueDto.builder().entityId(oldEntityId).value(oldName).build();
      TicketHistoryValueDto newValueDto =
          TicketHistoryValueDto.builder().entityId(newEntityId).value(newName).build();

      changes.add(
          new TicketHistoryEntryDto(
              (long) revInfo.getRev(),
              timestamp,
              "UPDATE",
              fieldName,
              oldValueDto,
              newValueDto,
              capitalizeFirst(fieldName) + " changed from " + oldName + " to " + newName,
              revInfo.getUsername()));
    }

    return changes;
  }

  private TicketHistoryEntryDto processLabelChange(Object[] result) {
    Long labelId = ((Number) result[0]).longValue();
    Integer revisionNumber = ((Number) result[1]).intValue();
    Short revType = ((Number) result[2]).shortValue();
    Long revTimestamp = ((Number) result[3]).longValue();
    String username = (String) result[4];

    LocalDateTime timestamp = convertTimestamp(revTimestamp);
    String labelName = getLabelName(labelId);
    String action = getRevisionAction(revType);
    String operationType = getRevisionOperationType(revType);

    TicketHistoryValueDto value =
        TicketHistoryValueDto.builder().entityId(labelId).value(labelName).build();

    return new TicketHistoryEntryDto(
        revisionNumber.longValue(),
        timestamp,
        operationType,
        "label",
        revType == 0 ? null : value,
        revType == 0 ? value : null,
        "Label " + labelName + " " + action,
        username);
  }

  private TicketHistoryEntryDto processCommentChange(Object[] result) {
    Long commentId = ((Number) result[0]).longValue();
    String text = (String) result[1];
    Integer revisionNumber = ((Number) result[2]).intValue();
    Long revTimestamp = ((Number) result[3]).longValue();
    String username = (String) result[4];

    LocalDateTime timestamp = convertTimestamp(revTimestamp);
    TicketHistoryValueDto changedValue = TicketHistoryValueDto.builder().value(text).build();

    return new TicketHistoryEntryDto(
        revisionNumber.longValue(),
        timestamp,
        "INSERT",
        "comment",
        null,
        changedValue,
        "Comment added",
        username);
  }

  private TicketHistoryEntryDto processExternalRequestorChange(Object[] result) {
    Long requestorId = ((Number) result[0]).longValue();
    Integer revisionNumber = ((Number) result[1]).intValue();
    Short revType = ((Number) result[2]).shortValue();
    Long revTimestamp = ((Number) result[3]).longValue();
    String username = (String) result[4];

    LocalDateTime timestamp = convertTimestamp(revTimestamp);
    String requestorName = getExternalRequestorName(requestorId);
    String action = getRevisionAction(revType);
    String operationType = getRevisionOperationType(revType);

    TicketHistoryValueDto value =
        TicketHistoryValueDto.builder().entityId(requestorId).value(requestorName).build();

    return new TicketHistoryEntryDto(
        revisionNumber.longValue(),
        timestamp,
        operationType,
        "external_requestor",
        revType == 0 ? null : value,
        revType == 0 ? value : null,
        "External requestor " + requestorName + " " + action,
        username);
  }

  // Utility methods
  private LocalDateTime convertTimestamp(Long timestamp) {
    return Instant.ofEpochMilli(timestamp).atZone(ZoneId.systemDefault()).toLocalDateTime();
  }

  private String capitalizeFirst(String str) {
    if (str == null || str.isEmpty()) return str;
    return str.substring(0, 1).toUpperCase() + str.substring(1);
  }

  private String getRevisionAction(Short revType) {
    return switch (revType) {
      case 0 -> "added";
      case 1 -> "modified";
      case 2 -> "removed";
      default -> "changed";
    };
  }

  private String getRevisionOperationType(Short revType) {
    return switch (revType) {
      case 0 -> "INSERT";
      case 1 -> "UPDATE";
      case 2 -> "DELETE";
      default -> "UPDATE";
    };
  }

  // Entity name resolvers
  private String getStateName(Long stateId) {
    if (stateId == null) return null;
    return stateRepository.findById(stateId).map(State::getLabel).orElse("Unknown State");
  }

  private String getPriorityBucketName(Long priorityId) {
    if (priorityId == null) return null;
    return priorityBucketRepository
        .findById(priorityId)
        .map(PriorityBucket::getName)
        .orElse("Unknown Priority");
  }

  private String getIterationName(Long iterationId) {
    if (iterationId == null) return null;
    return iterationRepository
        .findById(iterationId)
        .map(Iteration::getName)
        .orElse("Unknown Iteration");
  }

  private String getLabelName(Long labelId) {
    if (labelId == null) return null;
    return labelRepository.findById(labelId).map(Label::getName).orElse("Unknown Label");
  }

  private String getExternalRequestorName(Long requestorId) {
    if (requestorId == null) return null;
    return externalRequestorRepository
        .findById(requestorId)
        .map(ExternalRequestor::getName)
        .orElse("Unknown Requestor");
  }

  public List<TicketHistoryEntryDto> processAdditionalFieldData(List<Object[]> results) {
    List<TicketHistoryEntryDto> fieldValueChanges = new ArrayList<>();
    for (Object[] result : results) {
      Long fieldValueId = ((Number) result[0]).longValue();
      Integer revisionNumber = ((Number) result[2]).intValue();
      Short revType = ((Number) result[3]).shortValue();
      Long revTimestamp = ((Number) result[4]).longValue();
      String username = (String) result[5];
      String fieldValue = (String) result[6];
      String fieldName = (String) result[7];

      LocalDateTime timestamp =
          Instant.ofEpochMilli(revTimestamp).atZone(ZoneId.systemDefault()).toLocalDateTime();

      String action = getRevisionAction(revType);
      String operationType = getRevisionOperationType(revType);

      String displayValue = fieldName != null ? fieldName + ": " + fieldValue : fieldValue;

      TicketHistoryValueDto value =
          TicketHistoryValueDto.builder().entityId(fieldValueId).value(displayValue).build();

      fieldValueChanges.add(
          new TicketHistoryEntryDto(
              revisionNumber.longValue(),
              timestamp,
              operationType,
              "additional_field",
              revType == 0 ? null : value,
              revType == 0 ? value : null,
              "Additional field " + displayValue + " " + action,
              username));
    }

    return fieldValueChanges;
  }

  public List<TicketHistoryEntryDto> processTicketAssociationData(
      List<Object[]> results, Long ticketId) {
    List<TicketHistoryEntryDto> associationChanges = new ArrayList<>();
    Map<Long, AssociationData> associationCache = new HashMap<>();

    // First pass: build cache of association data and identify relevant associations
    Set<Long> relevantAssociationIds = new HashSet<>();
    Set<Long> ticketIdsToFetch = new HashSet<>();

    for (Object[] result : results) {
      Long associationId = ((Number) result[0]).longValue();
      Long sourceId = result[1] != null ? ((Number) result[1]).longValue() : null;
      Long targetId = result[2] != null ? ((Number) result[2]).longValue() : null;
      Short revType = ((Number) result[4]).shortValue();

      // Cache CREATE records
      if (revType == 0 && sourceId != null && targetId != null) {
        associationCache.put(associationId, new AssociationData(sourceId, targetId));

        // Check if this association involves our ticket
        if (Objects.equals(sourceId, ticketId) || Objects.equals(targetId, ticketId)) {
          relevantAssociationIds.add(associationId);
          // Add the "other" ticket ID to our fetch set
          ticketIdsToFetch.add(Objects.equals(sourceId, ticketId) ? targetId : sourceId);
        }
      }

      // For UPDATE/DELETE records, use cached data if needed
      if (revType != 0 && (sourceId == null || targetId == null)) {
        AssociationData cachedData = associationCache.get(associationId);
        if (cachedData != null) {
          sourceId = sourceId != null ? sourceId : cachedData.sourceId;
          targetId = targetId != null ? targetId : cachedData.targetId;

          // Check if this association involves our ticket
          if (Objects.equals(sourceId, ticketId) || Objects.equals(targetId, ticketId)) {
            relevantAssociationIds.add(associationId);
            ticketIdsToFetch.add(Objects.equals(sourceId, ticketId) ? targetId : sourceId);
          }
        }
      } else if (revType != 0) {
        // UPDATE record with non-null values
        if (Objects.equals(sourceId, ticketId) || Objects.equals(targetId, ticketId)) {
          relevantAssociationIds.add(associationId);
          ticketIdsToFetch.add(Objects.equals(sourceId, ticketId) ? targetId : sourceId);
        }
      }
    }

    // Batch fetch all needed ticket numbers
    Map<Long, String> ticketNumberCache = fetchTicketNumbers(ticketIdsToFetch);

    // Second pass: process only relevant associations
    for (Object[] result : results) {
      Long associationId = ((Number) result[0]).longValue();

      // Skip if this association doesn't involve our ticket
      if (!relevantAssociationIds.contains(associationId)) {
        continue;
      }

      Long sourceId = result[1] != null ? ((Number) result[1]).longValue() : null;
      Long targetId = result[2] != null ? ((Number) result[2]).longValue() : null;
      Integer revisionNumber = ((Number) result[3]).intValue();
      Short revType = ((Number) result[4]).shortValue();
      Long revTimestamp = ((Number) result[5]).longValue();
      String username = (String) result[6];

      // Use cached data for DELETE records if needed
      if (revType == 2 && (sourceId == null || targetId == null)) {
        AssociationData cachedData = associationCache.get(associationId);
        if (cachedData != null) {
          sourceId = sourceId != null ? sourceId : cachedData.sourceId;
          targetId = targetId != null ? targetId : cachedData.targetId;
        }
      }

      // Skip if we still don't have the IDs we need
      if (sourceId == null || targetId == null) {
        continue;
      }

      LocalDateTime timestamp =
          Instant.ofEpochMilli(revTimestamp).atZone(ZoneId.systemDefault()).toLocalDateTime();

      // Determine association direction
      boolean isSource = Objects.equals(sourceId, ticketId);
      Long otherTicketId = isSource ? targetId : sourceId;

      // Get the other ticket's number from our cache
      String otherTicketNumber = ticketNumberCache.getOrDefault(otherTicketId, "Unknown Ticket");

      String direction = isSource ? "Associated To" : "Associated From";
      String action = getRevisionAction(revType);
      String operationType = getRevisionOperationType(revType);

      TicketHistoryValueDto oldValue = null;
      TicketHistoryValueDto newValue = null;

      if (revType == 0) { // ADD
        newValue =
            TicketHistoryValueDto.builder()
                .entityId(associationId)
                .value(direction + ": " + otherTicketNumber)
                .build();
      } else if (revType == 2) { // DELETE
        oldValue =
            TicketHistoryValueDto.builder()
                .entityId(associationId)
                .value(direction + ": " + otherTicketNumber)
                .build();
      }

      String description =
          "Ticket association " + action + " (" + direction + ": " + otherTicketNumber + ")";

      associationChanges.add(
          new TicketHistoryEntryDto(
              revisionNumber.longValue(),
              timestamp,
              operationType,
              "ticket_association",
              oldValue,
              newValue,
              description,
              username));
    }

    return associationChanges;
  }

  // Helper method to batch fetch ticket numbers
  private Map<Long, String> fetchTicketNumbers(Set<Long> ticketIds) {
    if (ticketIds.isEmpty()) {
      return new HashMap<>();
    }

    Map<Long, String> ticketNumbers = new HashMap<>();

    // Batch fetch ticket numbers
    List<Ticket> tickets = ticketRepository.findAllById(ticketIds);
    for (Ticket ticket : tickets) {
      ticketNumbers.put(ticket.getId(), ticket.getTicketNumber());
    }

    return ticketNumbers;
  }

  public List<TicketHistoryEntryDto> processTaskAssociationData(List<Object[]> results) {
    List<TicketHistoryEntryDto> taskAssociationChanges = new ArrayList<>();

    // Process consecutive revisions to detect changes
    for (int i = 1; i < results.size(); i++) {
      Object[] previousResult = results.get(i - 1);
      Object[] currentResult = results.get(i);

      Long prevTaskAssociationId =
          previousResult[0] != null ? ((Number) previousResult[0]).longValue() : null;
      Long currTaskAssociationId =
          currentResult[0] != null ? ((Number) currentResult[0]).longValue() : null;

      // Check if task_association_id changed
      if (!Objects.equals(prevTaskAssociationId, currTaskAssociationId)) {
        Integer revisionNumber = ((Number) currentResult[1]).intValue();
        Long revTimestamp = ((Number) currentResult[2]).longValue();
        String username = (String) currentResult[3];

        LocalDateTime timestamp =
            Instant.ofEpochMilli(revTimestamp).atZone(ZoneId.systemDefault()).toLocalDateTime();

        // Determine the type of change
        String action;
        String operationType;
        TicketHistoryValueDto oldValue = null;
        TicketHistoryValueDto newValue = null;

        if (prevTaskAssociationId == null && currTaskAssociationId != null) {
          // Task association added
          action = "added";
          operationType = "INSERT";
          String taskId = getTaskIdFromAssociation(currTaskAssociationId);
          newValue =
              TicketHistoryValueDto.builder().entityId(currTaskAssociationId).value(taskId).build();
        } else if (prevTaskAssociationId != null && currTaskAssociationId == null) {
          // Task association removed
          action = "removed";
          operationType = "DELETE";
          String taskId = getTaskIdFromAssociation(prevTaskAssociationId);
          oldValue =
              TicketHistoryValueDto.builder().entityId(prevTaskAssociationId).value(taskId).build();
        } else {
          // Task association changed (from one to another)
          action = "changed";
          operationType = "UPDATE";
          String oldTaskId = getTaskIdFromAssociation(prevTaskAssociationId);
          String newTaskId = getTaskIdFromAssociation(currTaskAssociationId);
          oldValue =
              TicketHistoryValueDto.builder()
                  .entityId(prevTaskAssociationId)
                  .value(oldTaskId)
                  .build();
          newValue =
              TicketHistoryValueDto.builder()
                  .entityId(currTaskAssociationId)
                  .value(newTaskId)
                  .build();
        }

        String description = createTaskAssociationDescription(action, oldValue, newValue);

        taskAssociationChanges.add(
            new TicketHistoryEntryDto(
                revisionNumber.longValue(),
                timestamp,
                operationType,
                "task_association",
                oldValue,
                newValue,
                description,
                username));
      }
    }

    return taskAssociationChanges;
  }

  private String getTaskIdFromAssociation(Long taskAssociationId) {
    if (taskAssociationId == null) return null;

    Optional<TaskAssociation> ta = taskAssociationRepository.findById(taskAssociationId);

    if (ta.isPresent()) {
      return ta.get().getTaskId();
    } else {
      return "Unknown Task";
    }
  }

  // Helper method to create appropriate description
  private String createTaskAssociationDescription(
      String action, TicketHistoryValueDto oldValue, TicketHistoryValueDto newValue) {
    switch (action) {
      case "added":
        return "Task association added: " + (newValue != null ? newValue.getValue() : "Unknown");
      case "removed":
        return "Task association removed: " + (oldValue != null ? oldValue.getValue() : "Unknown");
      case "changed":
        String oldTask = oldValue != null ? oldValue.getValue() : "Unknown";
        String newTask = newValue != null ? newValue.getValue() : "Unknown";
        return "Task association changed from " + oldTask + " to " + newTask;
      default:
        return "Task association " + action;
    }
  }

  @FunctionalInterface
  private interface EntityNameResolver {
    String resolve(Long entityId);
  }

  private record AssociationData(Long sourceId, Long targetId) {}
}
