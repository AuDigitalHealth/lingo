package com.csiro.snomio;

import com.csiro.snomio.extension.SnomioExtension;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.ApplicationContext;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.PropertySource;
import org.springframework.stereotype.Component;

@Component
@Configuration
@PropertySource(value = "classpath:application-extension.properties", ignoreResourceNotFound = true)
@SuppressWarnings("java:S6813")
public class ExtensionChecker implements ApplicationRunner {

  private static final Logger logger = LoggerFactory.getLogger(ExtensionChecker.class);

  @Value("${snomio.extensions.sergio.enabled}")
  boolean sergioEnabled;

  // SonarLint no good here don't remove this
  @Autowired private ApplicationContext applicationContext;

  @Override
  public void run(ApplicationArguments args) throws Exception {
    if (!sergioEnabled) {
      logger.warn("Sergio extension is disabled.");
      return;
    }

    String[] extensionBeanNames = applicationContext.getBeanNamesForType(SnomioExtension.class);
    if (extensionBeanNames.length > 0) {
      logger.info("The following extensions have been found and will be initialised:");
      for (String beanName : extensionBeanNames) {
        SnomioExtension extension = (SnomioExtension) applicationContext.getBean(beanName);
        logger.info(" - {}", beanName);
        extension.initialise();
      }
    } else {
      logger.warn("No extensions found.");
    }
  }
}
