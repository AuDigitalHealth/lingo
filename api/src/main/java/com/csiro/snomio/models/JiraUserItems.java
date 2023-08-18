package com.csiro.snomio.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class JiraUserItems {
  private Integer size;

  @JsonProperty("max-results")
  private Integer maxResults;

  @JsonProperty("start-index")
  private Integer startIndex;

  @JsonProperty("end-index")
  private Integer endIndex;

  private List<JiraUser> items;
}
