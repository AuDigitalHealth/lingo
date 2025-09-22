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

import java.util.Map;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.extension.AfterAllCallback;
import org.junit.jupiter.api.extension.BeforeAllCallback;
import org.junit.jupiter.api.extension.ExtensionContext;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.containers.Network;
import org.testcontainers.containers.output.Slf4jLogConsumer;
import org.testcontainers.containers.wait.strategy.Wait;
import org.testcontainers.junit.jupiter.Testcontainers;

@Slf4j
@Testcontainers
public class AmtV4SnowstormExtension implements BeforeAllCallback, AfterAllCallback {

  public static final String SNOWSTORM_CONTAINER_ALIAS = "snowstorm";
  public static final Network network = Network.newNetwork();
  public static final Slf4jLogConsumer LOG_CONSUMER =
      new Slf4jLogConsumer(log).withSeparateOutputStreams();
  public static final GenericContainer<?> elasticSearchContainer =
      new GenericContainer<>("quay.io/aehrc/reduced-amt-elasticsearch:20231130-9.0.0")
          .withExposedPorts(9200)
          .withEnv(
              Map.of(
                  "node.name",
                  SNOWSTORM_CONTAINER_ALIAS,
                  "cluster.name",
                  "snowstorm-cluster",
                  "cluster.initial_master_nodes",
                  SNOWSTORM_CONTAINER_ALIAS,
                  "ES_JAVA_OPTS",
                  "-Xms4g -Xmx4g"))
          .withNetwork(network)
          .withNetworkAliases("es")
          .waitingFor(
              new org.testcontainers.containers.wait.strategy.LogMessageWaitStrategy()
                  .withRegEx(".*Cluster health status changed from.*"))
          .withLogConsumer(LOG_CONSUMER);
  public static final GenericContainer<?> snowstormContainer =
      new GenericContainer<>("snomedinternational/snowstorm:9.0.0")
          .withExposedPorts(8080)
          .withCommand("--elasticsearch.urls=http://es:9200")
          .withEnv(
              "JDK_JAVA_OPTIONS",
              """
                 -cp @/app/jib-classpath-file -Xms2g -Xmx4g
                 -Dcache.ecl.enabled=false -Delasticsearch.index.max.terms.count=700000 -Dlogging.level.org.snomed.snowstorm=DEBUG
                 --add-opens java.base/java.lang=ALL-UNNAMED
                 --add-opens=java.base/java.util=ALL-UNNAMED
              """)
          .withNetwork(network)
          .withNetworkAliases(SNOWSTORM_CONTAINER_ALIAS)
          .dependsOn(elasticSearchContainer)
          .waitingFor(Wait.forHttp("/").forPort(8080))
          .withLogConsumer(LOG_CONSUMER);

  @Override
  public void beforeAll(ExtensionContext extensionContext) {
    elasticSearchContainer.start();
    snowstormContainer.start();
    System.setProperty(
        "ihtsdo.snowstorm.api.url", "http://localhost:" + snowstormContainer.getMappedPort(8080));
  }

  @Override
  public void afterAll(ExtensionContext extensionContext) {
    // nothing to do here
  }
}
