package com.csiro.eclrefset.model.addorremovequeryresponse;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
class Term {
	private String term;
	private String lang;
}