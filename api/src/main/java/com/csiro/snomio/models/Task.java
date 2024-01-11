package com.csiro.snomio.models;

import java.util.List;
import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class Task {

  private String key;
  private String projectKey;
  private String summary;
  private String status;
  private String branchState;
  private long branchHeadTimestamp;
  private long branchBaseTimestamp;
  private long latestCodeSystemVersionTimestamp;
  private String description;
  private AuthoringPlatformUser assignee;
  private List<AuthoringPlatformUser> reviewers;
  private String created;
  private String updated;
  private LatestClassificationJson latestClassificationJson;
  private String latestValidationStatus;
  private String feedbackMessagesStatus;
  private String branchPath;
  private List<String> labels;

  @Data
  public static class LatestClassificationJson {
    private String completionDate;
    private String creationDate;
    private boolean equivalentConceptsFound;
    private String id;
    private boolean inferredRelationshipChangesFound;
    private String lastCommitDate;
    private String path;
    private String reasonerId;
    private String status;
    private String userId;

    // Constructors, getters, and setters

    // Other necessary methods
  }

  @Data
  public static class AuthoringPlatformUser {
    private String email;
    private String displayName;
    private String username;
    private String avatarUrl;
  }
}
