package com.csiro.snomio.configuration;

import com.csiro.tickets.helper.CustomStringToInstant;
import java.io.IOException;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.format.FormatterRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.resource.PathResourceResolver;

@Configuration
public class SpaConfig implements WebMvcConfigurer {

  @Override
  public void addResourceHandlers(ResourceHandlerRegistry registry) {

    // By setting this, you instruct Spring to prioritize this handler above the
    // default one (which is order 0), obviously don't do this. But it's good to
    // understand.
    // -- registry.setOrder(-1);

    registry
        // Capture everything (REST controllers get priority over this, see above)
        .addResourceHandler("/**")
        // Add locations where files might be found
        .addResourceLocations("classpath:/static/**")
        // Needed to allow use of `addResolver` below
        .resourceChain(true)
        // This thing is what does all the resolving. This impl. is responsible for
        // resolving ALL files. Meaning nothing gets resolves automatically by pointing
        // out "static" above.
        .addResolver(
            new PathResourceResolver() {
              @Override
              protected Resource getResource(String resourcePath, Resource location)
                  throws IOException {
                Resource requestedResource = location.createRelative(resourcePath);

                // If we actually hit a file, serve that. This is stuff like .js and .css files.
                if (requestedResource.exists() && requestedResource.isReadable()) {
                  return requestedResource;
                }

                // Anything else returns the index.
                return new ClassPathResource("/static/index.html");
              }
            });
  }

  @Bean
  public CustomStringToInstant stringToInstantConverter() {
    return new CustomStringToInstant();
  }

  @Bean
  public WebMvcConfigurer webMvcConfigurer() {
    return new WebMvcConfigurer() {
      @Override
      public void addFormatters(FormatterRegistry registry) {
        registry.addConverter(stringToInstantConverter());
      }
    };
  }
}
