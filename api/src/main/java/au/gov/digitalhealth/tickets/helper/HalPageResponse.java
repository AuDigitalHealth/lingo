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
package au.gov.digitalhealth.tickets.helper;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.data.domain.Page;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;
import org.springframework.web.util.UriComponentsBuilder;

/**
 * Hand-built {@code _links}/{@code _embedded}/{@code page} wrapper for paged ticket responses.
 *
 * <p>Spring HATEOAS 3.1.1's HAL rendering ({@code HalJacksonModule}) is Jackson 3 only, while this
 * app is pinned to Jackson 2 ({@code spring.http.converters.preferred-json-mapper=jackson2}) for
 * {@code JsonNode}/{@code JsonNullable} support that has no Jackson 3 equivalent yet. Spring
 * HATEOAS's automatic HAL augmentation of the Jackson message converter never runs as a result, so
 * {@code PagedResourcesAssembler} output falls back to plain (non-HAL) Jackson serialisation. This
 * class produces the same shape the UI ({@code pagesResponse.ts}, {@code ticket.ts}) expects
 * directly, serialised through the app's normal Jackson 2 pipeline instead.
 */
public record HalPageResponse<T>(
    @JsonProperty("_links") Map<String, Link> links,
    @JsonProperty("_embedded") Map<String, List<T>> embedded,
    @JsonProperty("page") PageMetadata page) {

  public record Link(String href) {}

  public record PageMetadata(int size, long totalElements, int totalPages, int number) {}

  public static <T> HalPageResponse<T> of(Page<T> page, String embeddedKey) {
    UriComponentsBuilder uriBuilder = ServletUriComponentsBuilder.fromCurrentRequestUri();
    int number = page.getNumber();
    int totalPages = page.getTotalPages();

    Map<String, Link> links = new LinkedHashMap<>();
    links.put("self", linkFor(uriBuilder, number, page.getSize()));
    links.put("first", linkFor(uriBuilder, 0, page.getSize()));
    if (number > 0) {
      links.put("prev", linkFor(uriBuilder, number - 1, page.getSize()));
    }
    if (number < totalPages - 1) {
      links.put("next", linkFor(uriBuilder, number + 1, page.getSize()));
    }
    if (totalPages > 0) {
      links.put("last", linkFor(uriBuilder, Math.max(totalPages - 1, 0), page.getSize()));
    }

    return new HalPageResponse<>(
        links,
        Map.of(embeddedKey, page.getContent()),
        new PageMetadata(page.getSize(), page.getTotalElements(), totalPages, number));
  }

  private static Link linkFor(UriComponentsBuilder builder, int page, int size) {
    String href =
        builder
            .cloneBuilder()
            .replaceQueryParam("page", page)
            .replaceQueryParam("size", size)
            .build()
            .toUriString();
    return new Link(href);
  }
}
