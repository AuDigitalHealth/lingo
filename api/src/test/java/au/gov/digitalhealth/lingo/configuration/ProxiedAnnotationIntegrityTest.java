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

import static org.assertj.core.api.Assertions.assertThat;

import java.lang.annotation.Annotation;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.parallel.Isolated;
import org.springframework.aop.support.AopUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.config.BeanDefinition;
import org.springframework.beans.factory.config.ConfigurableListableBeanFactory;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.CachePut;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.core.annotation.AnnotatedElementUtils;
import org.springframework.scheduling.annotation.Async;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.util.ClassUtils;
import org.springframework.util.ReflectionUtils;

/**
 * Fails if any application bean declares an annotation that only works through an AOP proxy -
 * {@code @Cacheable}, {@code @CacheEvict}, {@code @CachePut}, {@code @Caching}, {@code @Async} -
 * but is not actually proxied, because such a bean silently does nothing at runtime with no error
 * anywhere.
 *
 * <p>This is the failure mode behind #1972 ({@code /api/users} never serving Jira users from
 * cache). A bean escapes auto-proxying when it is instantiated before {@code BeanPostProcessor}
 * registration finishes - typically by being a constructor dependency of a class Spring must
 * resolve while wiring its own caching/async infrastructure, e.g. a {@code CachingConfigurer} or
 * {@code AsyncConfigurer}. Spring logs those beans at startup as "not eligible for getting
 * processed by all BeanPostProcessors", but nothing fails, and whether the proxy survives depends
 * on bean-creation order, so the same code can cache correctly in tests and never cache in
 * production.
 *
 * <p>Checked against the real application context rather than by static analysis, because the
 * property that matters ("is this bean, as wired, actually advised?") only exists at runtime.
 */
@SpringBootTest(classes = Configuration.class)
@ActiveProfiles("test")
@Isolated
class ProxiedAnnotationIntegrityTest {

  /** Annotations whose behaviour is implemented by an AOP interceptor, so they need a proxy. */
  private static final Set<Class<? extends Annotation>> PROXY_BACKED_ANNOTATIONS =
      Set.of(Cacheable.class, CacheEvict.class, CachePut.class, Caching.class, Async.class);

  private static final String APPLICATION_PACKAGE = "au.gov.digitalhealth";

  @Autowired ConfigurableApplicationContext context;

  @Test
  void everyBeanDeclaringProxyBackedAnnotationsIsActuallyProxied() {
    ConfigurableListableBeanFactory beanFactory = context.getBeanFactory();
    List<String> unproxied = new ArrayList<>();

    for (String beanName : context.getBeanDefinitionNames()) {
      BeanDefinition definition = beanFactory.getBeanDefinition(beanName);
      if (definition.isAbstract() || !definition.isSingleton()) {
        continue;
      }

      Class<?> beanType = context.getType(beanName);
      if (beanType == null) {
        continue;
      }

      Class<?> userClass = ClassUtils.getUserClass(beanType);
      if (!userClass.getName().startsWith(APPLICATION_PACKAGE)
          || !declaresProxyBackedAnnotation(userClass)) {
        continue;
      }

      if (!AopUtils.isAopProxy(context.getBean(beanName))) {
        unproxied.add(beanName + " (" + userClass.getName() + ")");
      }
    }

    assertThat(unproxied)
        .as(
            "These beans declare @Cacheable/@CacheEvict/@CachePut/@Caching/@Async but are not AOP"
                + " proxies, so those annotations do nothing at runtime. The usual cause is the"
                + " bean being instantiated before BeanPostProcessor registration completes - check"
                + " the startup log for \"not eligible for getting processed by all"
                + " BeanPostProcessors\" and break the eager dependency chain that pulls it in.")
        .isEmpty();
  }

  private static boolean declaresProxyBackedAnnotation(Class<?> userClass) {
    for (Class<? extends Annotation> annotation : PROXY_BACKED_ANNOTATIONS) {
      if (AnnotatedElementUtils.hasAnnotation(userClass, annotation)) {
        return true;
      }
    }

    boolean[] found = {false};
    ReflectionUtils.doWithMethods(
        userClass,
        method -> {
          for (Class<? extends Annotation> annotation : PROXY_BACKED_ANNOTATIONS) {
            if (AnnotatedElementUtils.hasAnnotation(method, annotation)) {
              found[0] = true;
              return;
            }
          }
        },
        method ->
            !found[0] && method.getDeclaringClass().getName().startsWith(APPLICATION_PACKAGE));
    return found[0];
  }
}
