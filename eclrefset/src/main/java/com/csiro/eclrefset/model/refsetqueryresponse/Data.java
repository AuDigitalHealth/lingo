package com.csiro.eclrefset.model.refsetqueryresponse;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.NoArgsConstructor;

@lombok.Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Data {

  private List<Item> items;
  private int total;
  private int limit;
  private int offset;
  private String searchAfter;
  private List<String> searchAfterArray;
}
