package com.csiro.eclrefset.model.refsetqueryresponse;

import java.util.ArrayList;
import java.util.List;

public class Data {

	List<Item> items;
	int total;
	int limit;
	int offset;
	private String searchAfter;
	private List<String> searchAfterArray;


	public Data() {
		items = new ArrayList<Item>();
	}

	public List<Item> getItems() {
		return items;
	}

	public void setItems(List<Item> items) {
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

	public List<String> getSearchAfterArray() {
		return searchAfterArray;
	}

	public void setSearchAfterArray(List<String> searchAfterArray) {
		this.searchAfterArray = searchAfterArray;
	}
}
