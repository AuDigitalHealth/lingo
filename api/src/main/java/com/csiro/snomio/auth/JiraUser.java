package com.csiro.snomio.auth;

import java.util.HashMap;
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

  private HashMap<String, String> avatarUrls;
}
