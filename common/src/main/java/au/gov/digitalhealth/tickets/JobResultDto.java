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
package au.gov.digitalhealth.tickets;

import java.io.Serializable;
import java.time.Instant;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;
import lombok.experimental.SuperBuilder;

@Data
@ToString(callSuper = true)
@EqualsAndHashCode(callSuper = true)
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
public class JobResultDto extends BaseAuditableDto implements Serializable {

  private String jobName;

  private String jobId;

  private Instant finishedTime;

  private List<ResultDto> results;

  private boolean acknowledged;

  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  public static class ResultDto{

    private String name;

    private int count;

    private ResultNotificationDto notification;

    private List<ResultDto> results;

    private List<ResultItemDto> items;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ResultItemDto {

      private String id;

      private String title;

      private String link;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ResultNotificationDto {

      private ResultNotificationType type;
      private String description;

      public enum ResultNotificationType {
        ERROR,
        WARNING,
        SUCCESS
      }
    }
  }
}
