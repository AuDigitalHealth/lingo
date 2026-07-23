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

import static au.gov.digitalhealth.lingo.util.CacheConstants.ALL_TASKS_CACHE;
import static au.gov.digitalhealth.lingo.util.CacheConstants.AP_STATUS_CACHE;
import static au.gov.digitalhealth.lingo.util.CacheConstants.BRAND_SEMANTIC_TAG;
import static au.gov.digitalhealth.lingo.util.CacheConstants.COMPOSITE_UNIT_CACHE;
import static au.gov.digitalhealth.lingo.util.CacheConstants.DESCRIPTION_VALIDATION_REGEX;
import static au.gov.digitalhealth.lingo.util.CacheConstants.FHIR_CONCEPTS;
import static au.gov.digitalhealth.lingo.util.CacheConstants.JIRA_USERS_CACHE;
import static au.gov.digitalhealth.lingo.util.CacheConstants.PREFERRED_TERM_MAX_LENGTH;
import static au.gov.digitalhealth.lingo.util.CacheConstants.SNOWSTORM_BROWSER_CONCEPTS;
import static au.gov.digitalhealth.lingo.util.CacheConstants.SNOWSTORM_CONCEPT;
import static au.gov.digitalhealth.lingo.util.CacheConstants.SNOWSTORM_CONCEPTS_BY_IDS;
import static au.gov.digitalhealth.lingo.util.CacheConstants.SNOWSTORM_CONCEPTS_BY_TERM;
import static au.gov.digitalhealth.lingo.util.CacheConstants.SNOWSTORM_CONCEPTS_FOR_BRANCH;
import static au.gov.digitalhealth.lingo.util.CacheConstants.SNOWSTORM_CONCEPTS_FROM_ECL;
import static au.gov.digitalhealth.lingo.util.CacheConstants.SNOWSTORM_CONCEPTS_IDS_FROM_ECL;
import static au.gov.digitalhealth.lingo.util.CacheConstants.SNOWSTORM_CONCEPT_IDS_EXIST;
import static au.gov.digitalhealth.lingo.util.CacheConstants.SNOWSTORM_HIST_ASSOC_FOR_BRANCH;
import static au.gov.digitalhealth.lingo.util.CacheConstants.SNOWSTORM_REFSET_MEMBERS;
import static au.gov.digitalhealth.lingo.util.CacheConstants.SNOWSTORM_RELATIONSHIPS;
import static au.gov.digitalhealth.lingo.util.CacheConstants.SNOWSTORM_STATUS_CACHE;
import static au.gov.digitalhealth.lingo.util.CacheConstants.UNIT_NUMERATOR_DENOMINATOR_CACHE;
import static au.gov.digitalhealth.lingo.util.CacheConstants.USERS_CACHE;
import static au.gov.digitalhealth.lingo.util.CacheConstants.VALIDATION_EXCLUDED_SUBSTANCES;

import com.github.benmanes.caffeine.cache.Caffeine;
import java.time.Duration;
import java.util.List;
import org.springframework.cache.CacheManager;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Defines the single Caffeine-backed {@link CacheManager} used for every Spring
 * {@code @Cacheable}/{@code @CacheEvict} cache in the application.
 *
 * <p>Ehcache (and {@code ehcache.xml}) is used only by Hibernate's second-level cache, which
 * bootstraps its own JCache manager via the {@code spring.jpa.properties.*} settings and never
 * touches this bean. Spring-abstraction caches all live here on Caffeine because Spring's
 * {@code @Cacheable} support for reactive return types ({@code Mono} methods in {@code
 * SnowstormClient}/{@code FhirClient}) goes through the async {@code Cache.retrieve(key)} API,
 * which the JCache adapter does not implement. Every cache below is registered as a Caffeine {@code
 * AsyncCache}, which supports both synchronous and reactive callers, so any {@code @Cacheable}
 * method works regardless of return type and no per-annotation {@code cacheManager} pinning is
 * needed.
 *
 * <p>The manager is defined manually (rather than via {@code spring.cache.*} properties) because
 * Boot's property-driven Caffeine auto-configuration only supports a single spec for all caches,
 * and the caches below need per-cache TTLs/sizes (carried over unchanged from the templates that
 * previously configured them in {@code ehcache.xml}). Note that any manually defined {@code
 * CacheManager} bean disables Boot's cache auto-configuration entirely, so {@code spring.cache.*}
 * properties are never consulted.
 *
 * <p>Deliberately its own standalone {@code @Configuration} with no other bean dependencies: this
 * bean is needed to build Spring's caching proxy infrastructure (which resolves every registered
 * {@code CacheManager} up front), so if it lived on a class with its own constructor dependencies
 * (e.g. {@code CachingConfig}, which depends on {@code JiraUserManagerService}), and one of those
 * dependencies is itself a caching-proxied bean, Spring cannot satisfy the resulting circular
 * dependency.
 */
@Configuration
public class CacheManagerConfig {

  /** Used by {@code @Cacheable}/{@code @CacheEvict} in the auth module ({@code ImsService}). */
  private static final String AUTH_COOKIE_CACHE = "authCookie";

  /** Used by {@code @Cacheable} in {@code NameGenerationClient}. */
  private static final String NAME_GENERATOR_CACHE = "nameGenerator";

  /**
   * Every cache is pre-registered here with an explicit policy (the same "all caches pre-declared"
   * convention {@code ehcache.xml} used); dynamic cache creation is disabled, so a
   * {@code @Cacheable} referencing an unregistered name fails fast at resolution rather than
   * silently getting a default cache.
   */
  @Bean
  public CacheManager cacheManager() {
    CaffeineCacheManager manager = new CaffeineCacheManager();

    // Snowstorm and AP status (evicted every 60 s by scheduler)
    register(manager, spec(Duration.ofMinutes(5), 100), SNOWSTORM_STATUS_CACHE, AP_STATUS_CACHE);

    // Snowstorm/FHIR terminology lookups
    register(
        manager,
        spec(Duration.ofMinutes(20), 10_000),
        SNOWSTORM_CONCEPTS_IDS_FROM_ECL,
        SNOWSTORM_CONCEPTS_FROM_ECL,
        SNOWSTORM_CONCEPTS_BY_TERM,
        SNOWSTORM_CONCEPTS_BY_IDS,
        SNOWSTORM_CONCEPT_IDS_EXIST,
        SNOWSTORM_CONCEPT,
        SNOWSTORM_REFSET_MEMBERS,
        SNOWSTORM_BROWSER_CONCEPTS,
        SNOWSTORM_RELATIONSHIPS,
        SNOWSTORM_CONCEPTS_FOR_BRANCH,
        SNOWSTORM_HIST_ASSOC_FOR_BRANCH,
        FHIR_CONCEPTS);

    // Task list from AP (evicted on configurable schedule)
    register(manager, spec(Duration.ofMinutes(30), 1_000), ALL_TASKS_CACHE);

    // IMS user lookup, JIRA user list, name generator results
    register(
        manager,
        spec(Duration.ofHours(1), 1_000),
        USERS_CACHE,
        JIRA_USERS_CACHE,
        NAME_GENERATOR_CACHE);

    // IMS auth cookie (evicted on refresh schedule), unit caches (evicted hourly by scheduler),
    // and effectively-static field-binding config
    register(
        manager,
        spec(Duration.ofHours(25), 100),
        AUTH_COOKIE_CACHE,
        COMPOSITE_UNIT_CACHE,
        UNIT_NUMERATOR_DENOMINATOR_CACHE,
        VALIDATION_EXCLUDED_SUBSTANCES,
        BRAND_SEMANTIC_TAG,
        PREFERRED_TERM_MAX_LENGTH,
        DESCRIPTION_VALIDATION_REGEX);

    // Fixed cache set: setCacheNames with an (empty) list flips the manager to static mode without
    // disturbing the custom caches registered above.
    manager.setCacheNames(List.of());
    return manager;
  }

  private static Caffeine<Object, Object> spec(Duration ttl, long maximumSize) {
    // recordStats() keeps cache hit/miss metrics available to Micrometer, matching the
    // enable-statistics JSR-107 default previously set in ehcache.xml.
    return Caffeine.newBuilder().expireAfterWrite(ttl).maximumSize(maximumSize).recordStats();
  }

  private static void register(
      CaffeineCacheManager manager, Caffeine<Object, Object> spec, String... cacheNames) {
    for (String cacheName : cacheNames) {
      // Registered async so Spring's reactive @Cacheable adaptation (Cache.retrieve) works;
      // synchronous @Cacheable/@CacheEvict callers are served via AsyncCache.synchronous().
      manager.registerCustomCache(cacheName, spec.buildAsync());
    }
  }
}
