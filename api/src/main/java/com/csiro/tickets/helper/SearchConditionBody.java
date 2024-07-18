package com.csiro.tickets.helper;

import java.io.Serializable;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SearchConditionBody implements Serializable {

  private OrderCondition orderCondition;
  private List<SearchCondition> searchConditions;
}
