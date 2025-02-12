package au.gov.digitalhealth.lingo.util;

import java.io.IOException;
import java.util.Objects;
import lombok.NonNull;
import org.springframework.beans.factory.config.YamlPropertiesFactoryBean;
import org.springframework.core.env.PropertiesPropertySource;
import org.springframework.core.env.PropertySource;
import org.springframework.core.io.support.DefaultPropertySourceFactory;
import org.springframework.core.io.support.EncodedResource;

public class YamlPropertySourceFactory extends DefaultPropertySourceFactory {
  @Override
  public @NonNull PropertySource<?> createPropertySource(String name, EncodedResource resource)
      throws IOException {
    YamlPropertiesFactoryBean factory = new YamlPropertiesFactoryBean();
    factory.setResources(resource.getResource());
    factory.afterPropertiesSet();
    return new PropertiesPropertySource(
        name != null
            ? name
            : Objects.requireNonNull(
                resource.getResource().getFilename(), "File name must not be null"),
        Objects.requireNonNull(factory.getObject()));
  }
}
