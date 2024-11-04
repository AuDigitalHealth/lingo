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
package au.gov.digitalhealth.lingo.util;

import com.fasterxml.jackson.annotation.JsonProperty;
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
  private Status status;
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

  public enum Status {
    @JsonProperty("New")
    NEW("New"),
    @JsonProperty("In Progress")
    IN_PROGRESS("In Progress"),
    @JsonProperty("In Review")
    IN_REVIEW("In Review"),
    @JsonProperty("Review Completed")
    REVIEW_COMPLETED("Review Completed"),
    @JsonProperty("Promoted")
    PROMOTED("Promoted"),
    @JsonProperty("Completed")
    COMPLETED("Completed"),
    @JsonProperty("Deleted")
    DELETED("Deleted"),
    @JsonProperty("Unknown")
    UNKNOWN("Unknown");

    private final String value;

    Status(String value) {
      this.value = value;
    }

    public String getValue() {
      return value;
    }
  }
}
