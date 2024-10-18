/*
 * Copyright 2024 Australian Digital Health Agency ABN 84 425 496 912.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package au.gov.digitalhealth.lingo.exception;

import org.springframework.http.HttpStatus;

public class ProductModelProblem extends LingoProblem {

  public ProductModelProblem(String type, Long productId, SingleConceptExpectedProblem e) {
    super(
        "product-model-problem",
        "Product model problem",
        HttpStatus.INTERNAL_SERVER_ERROR,
        "Product "
            + productId
            + " is expected to have 1 "
            + type
            + " but has "
            + e.getSize()
            + ". "
            + e.getBody().getDetail(),
        e);
  }

  public ProductModelProblem(String message) {
    super(
        "product-model-problem",
        "Product model problem",
        HttpStatus.INTERNAL_SERVER_ERROR,
        message);
  }
}
