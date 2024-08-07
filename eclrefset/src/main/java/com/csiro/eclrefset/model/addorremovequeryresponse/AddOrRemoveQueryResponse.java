package com.csiro.eclrefset.model.addorremovequeryresponse;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AddOrRemoveQueryResponse {
	List<AddRemoveItem> items;
	int total;
	int limit;
	int offset;
	private String searchAfter;
	private List<Long> searchAfterArray;
}