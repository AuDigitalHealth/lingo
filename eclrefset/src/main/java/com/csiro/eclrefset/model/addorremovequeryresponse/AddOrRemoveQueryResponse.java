package com.csiro.eclrefset.model.addorremovequeryresponse;

import java.util.ArrayList;
import java.util.List;

public class AddOrRemoveQueryResponse {
	List<AddRemoveItem> items;
	int total;
	int limit;
	int offset;
	private String searchAfter;
	private List<Long> searchAfterArray;

	public AddOrRemoveQueryResponse() {
		items = new ArrayList<AddRemoveItem>();
	}

	public List<AddRemoveItem> getItems() {
		return items;
	}

	public void setItems(List<AddRemoveItem> items) {
		this.items = items;
	}

	public int getTotal() {
		return total;
	}

	public void setTotal(int total) {
		this.total = total;
	}

	public int getLimit() {
		return limit;
	}

	public void setLimit(int limit) {
		this.limit = limit;
	}

	public int getOffset() {
		return offset;
	}

	public void setOffset(int offset) {
		this.offset = offset;
	}

	public String getSearchAfter() {
		return searchAfter;
	}

	public void setSearchAfter(String searchAfter) {
		this.searchAfter = searchAfter;
	}

	public List<Long> getSearchAfterArray() {
		return searchAfterArray;
	}

	public void setSearchAfterArray(List<Long> searchAfterArray) {
		this.searchAfterArray = searchAfterArray;
	}
}