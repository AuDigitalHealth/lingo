package com.csiro.snomio.models;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class JiraUser {

  private String name;

  private String key;

  private String emailAddress;

  private String displayName;

  private boolean active;
}
