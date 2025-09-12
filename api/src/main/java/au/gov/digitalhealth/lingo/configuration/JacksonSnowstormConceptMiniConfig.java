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
package au.gov.digitalhealth.lingo.configuration;

import au.csiro.snowstorm_client.model.SnowstormConceptMini;
import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.*;
import com.fasterxml.jackson.databind.Module;
import com.fasterxml.jackson.databind.deser.BeanDeserializerModifier;
import com.fasterxml.jackson.databind.deser.ContextualDeserializer;
import com.fasterxml.jackson.databind.deser.ResolvableDeserializer;
import com.fasterxml.jackson.databind.jsontype.TypeDeserializer;
import com.fasterxml.jackson.databind.module.SimpleModule;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class JacksonSnowstormConceptMiniConfig {

  @Bean
  public Module snowstormConceptMiniDefaultsModule() {
    SimpleModule module = new SimpleModule();
    module.setDeserializerModifier(
        new BeanDeserializerModifier() {
          @Override
          public JsonDeserializer<?> modifyDeserializer(
              DeserializationConfig config,
              BeanDescription beanDesc,
              JsonDeserializer<?> deserializer) {
            if (beanDesc.getBeanClass().equals(SnowstormConceptMini.class)) {
              @SuppressWarnings("unchecked")
              JsonDeserializer<Object> delegate = (JsonDeserializer<Object>) deserializer;
              return new PostProcessingDeserializer(delegate);
            }
            return deserializer;
          }
        });
    return module;
  }

  static final class PostProcessingDeserializer extends JsonDeserializer<Object>
      implements ContextualDeserializer, ResolvableDeserializer {

    private final JsonDeserializer<Object> delegate;

    PostProcessingDeserializer(JsonDeserializer<Object> delegate) {
      this.delegate = delegate;
    }

    @Override
    public Object deserialize(JsonParser p, DeserializationContext ctxt)
        throws java.io.IOException {
      Object value = delegate.deserialize(p, ctxt);
      return applyDefault(value);
    }

    @Override
    public Object deserializeWithType(
        JsonParser p, DeserializationContext ctxt, TypeDeserializer typeDeserializer)
        throws java.io.IOException {
      Object value = delegate.deserializeWithType(p, ctxt, typeDeserializer);
      return applyDefault(value);
    }

    private Object applyDefault(Object value) {
      if (value == null) {
        return null;
      }
      if (value instanceof SnowstormConceptMini scm) {
        String status = scm.getDefinitionStatus();
        if (status == null || status.isBlank()) {
          scm.setDefinitionStatus("PRIMITIVE");
        }
      }
      return value;
    }

    // Ensure delegate is properly contextualized for nested/generic locations
    @Override
    public JsonDeserializer<?> createContextual(DeserializationContext ctxt, BeanProperty property)
        throws JsonMappingException {
      JsonDeserializer<?> ctxDelegate = delegate;
      if (delegate instanceof ContextualDeserializer cd) {
        ctxDelegate = cd.createContextual(ctxt, property);
      }
      @SuppressWarnings("unchecked")
      JsonDeserializer<Object> cast = (JsonDeserializer<Object>) ctxDelegate;
      return new PostProcessingDeserializer(cast);
    }

    // Ensure delegate can resolve its own dependencies
    @Override
    public void resolve(DeserializationContext ctxt) throws JsonMappingException {
      if (delegate instanceof ResolvableDeserializer rd) {
        rd.resolve(ctxt);
      }
    }

    // Preserve delegate behavior for nulls
    @Override
    public Object getNullValue(DeserializationContext ctxt) throws JsonMappingException {
      return delegate.getNullValue(ctxt);
    }
  }
}
