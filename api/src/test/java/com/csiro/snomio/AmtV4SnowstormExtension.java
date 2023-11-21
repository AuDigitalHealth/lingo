package com.csiro.snomio;

import java.util.Map;
import org.junit.jupiter.api.extension.AfterAllCallback;
import org.junit.jupiter.api.extension.BeforeAllCallback;
import org.junit.jupiter.api.extension.ExtensionContext;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.containers.Network;
import org.testcontainers.containers.wait.strategy.Wait;
import org.testcontainers.junit.jupiter.Testcontainers;

@Testcontainers
public class AmtV4SnowstormExtension implements BeforeAllCallback, AfterAllCallback {

  public static final String SNOWSTORM_CONTAINER_ALIAS = "snowstorm";
  public static final Network network = Network.newNetwork();
  public static final GenericContainer<?> elasticSearchContainer =
      new GenericContainer<>("nctsacr.azurecr.io/reduced-amt-elasticsearch:latest")
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
          .waitingFor(Wait.forHttp("/_cluster/health").forPort(9200));
  public static final GenericContainer<?> snowstormContainer =
      new GenericContainer<>("snomedinternational/snowstorm:9.0.0")
          .withExposedPorts(8080)
          .withCommand("--elasticsearch.urls=http://es:9200")
          .withEnv(
              "JDK_JAVA_OPTIONS",
              """
                 -cp @/app/jib-classpath-file -Xms2g -Xmx4g
                 -Dcache.ecl.enabled=false -Delasticsearch.index.max.terms.count=700000
                 --add-opens java.base/java.lang=ALL-UNNAMED
                 --add-opens=java.base/java.util=ALL-UNNAMED
              """)
          .withNetwork(network)
          .withNetworkAliases(SNOWSTORM_CONTAINER_ALIAS)
          .dependsOn(elasticSearchContainer)
          .waitingFor(Wait.forHttp("/").forPort(8080));

  @Override
  public void beforeAll(ExtensionContext extensionContext) {
    elasticSearchContainer.start();
    snowstormContainer.start();
    System.setProperty(
        "ihtsdo.snowstorm.api.url", "http://localhost:" + snowstormContainer.getMappedPort(8080));
  }

  @Override
  public void afterAll(ExtensionContext extensionContext) {
    // nothing to do
  }
}
