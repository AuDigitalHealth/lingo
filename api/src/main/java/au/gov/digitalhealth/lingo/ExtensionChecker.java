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
package au.gov.digitalhealth.lingo;

import au.gov.digitalhealth.lingo.extension.LingoExtension;
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

    String[] extensionBeanNames = applicationContext.getBeanNamesForType(LingoExtension.class);
    if (extensionBeanNames.length > 0) {
      logger.info("The following extensions have been found and will be initialised:");
      for (String beanName : extensionBeanNames) {
        LingoExtension extension = (LingoExtension) applicationContext.getBean(beanName);
        logger.info(" - {}", beanName);
        extension.initialise();
      }
    } else {
      logger.warn("No extensions found.");
    }
  }
}
