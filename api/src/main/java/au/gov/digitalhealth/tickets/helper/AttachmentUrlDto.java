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

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.validator.constraints.URL;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AttachmentUrlDto {

  @NotBlank(message = "fileName must not be blank")
  @Size(max = 255, message = "fileName must be at most 255 characters")
  private String fileName;

  @NotNull(message = "sizeMb must not be null")
  @DecimalMin(
      value = "0.0",
      inclusive = true,
      message = "sizeMb must be greater than or equal to 0")
  private Double sizeMb;

  @NotBlank(message = "url must not be blank")
  @Size(max = 2048, message = "url must be at most 2048 characters")
  @URL(message = "url must be a valid URL")
  private String url;
}
