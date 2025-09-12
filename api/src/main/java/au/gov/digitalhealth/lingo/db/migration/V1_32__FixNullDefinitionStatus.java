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
package au.gov.digitalhealth.lingo.db.migration;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.fasterxml.jackson.databind.node.TextNode;
import lombok.extern.java.Log;

/**
 * A Flyway migration to fix any occurrences of null "definitionStatus" fields in JSON data by
 * replacing them with "PRIMITIVE".
 */
@Log
@SuppressWarnings("squid:S00101")
public class V1_32__FixNullDefinitionStatus extends BaseProductMigration {

  private static final String FIELD_NAME = "definitionStatus";
  private static final TextNode PRIMITIVE = TextNode.valueOf("PRIMITIVE");

  private static void traverse(JsonNode node) {
    if (node == null) return;

    if (node.isObject()) {
      ObjectNode obj = (ObjectNode) node;

      // If the field exists and is null, replace it with "PRIMITIVE"
      JsonNode ds = obj.get(FIELD_NAME);
      if (ds != null && ds.isNull()) {
        obj.set(FIELD_NAME, PRIMITIVE);
      }

      // Recurse into child fields
      obj.fields().forEachRemaining(entry -> traverse(entry.getValue()));

    } else if (node.isArray()) {
      ArrayNode arr = (ArrayNode) node;
      for (int i = 0; i < arr.size(); i++) {
        traverse(arr.get(i));
      }
    }
    // primitives: nothing to do
  }

  @Override
  protected void processNode(ObjectNode root) {
    if (root == null) return;
    traverse(root);
  }
}
