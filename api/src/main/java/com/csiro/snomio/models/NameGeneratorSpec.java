package com.csiro.snomio.models;

public class NameGeneratorSpec {

  String tag;
  String owl;

  public NameGeneratorSpec() {}

  public NameGeneratorSpec(String tag, String owl) {
    this.tag = tag;
    this.owl = owl;
  }

  public String getTag() {
    return tag;
  }

  public void setTag(String tag) {
    this.tag = tag;
  }

  public String getOwl() {
    return owl;
  }

  public void setOwl(String owl) {
    this.owl = owl;
  }
}
