## Snomio OpenTelemetry Setup

### Overview

This document outlines the OpenTelemetry infrastructure setup for Snomio within the NCTS Kubernetes Cluster. The setup provides comprehensive observability for Snomio application by collecting, processing, and visualising telemetry data such as metrics, logs, and traces.

### Component Overview

**Snomio App Namespace:**

* **Snomio:** The primary application being monitored. It generates telemetry data crucial for observability.
* **Nginx Ingress Controller:** Manages external access to the Snomio services, facilitating ingress of HTTP/S traffic into the application.
* **OpenTelemetry Collector:** Positioned within the Snomio App Namespace to gather metrics and traces directly from the Snomio application and logs from the Nginx Ingress Controller, which it then forwards to the relevant backends in the Monitoring Namespace.

### Observability Data Flow

1. **Data Collection:**
   * The OpenTelemetry Collector within the Snomio App Namespace is configured to collect traces and metrics from the application and logs from the Nginx Ingress Controller.
2. **Data Routing and Management:**
   * **Metrics:** Collected metrics are sent from the OpenTelemetry Collector to Prometheus in the Monitoring Namespace.
   * **Logs:** Logs are forwarded to Loki, allowing for aggregation and querying of log data.
   * **Traces:** Traces are provided to Tempo, which specializes in storing and querying distributed traces.
3. **Visualization and Analysis:**
   * **Grafana:** Located in its dedicated namespace, Grafana pulls metrics from Prometheus, logs from Loki, and traces from Tempo. It presents this data in an integrated dashboard that provides real-time visibility into the operational state of the Snomio application.
4. **External Access:**
   * The Nginx Ingress Controller enables external traffic to access the Snomio application, ensuring that it is reachable for user interactions while also capturing ingress logs.

### Conclusion

The OpenTelemetry setup for the Snomio application within the NCTS Kubernetes Cluster is specifically tailored to provide a granular level of observability. The OpenTelemetry Collector is instrumental in capturing telemetry data from the application and the ingress controller. By utilizing the Prometheus, Loki, and Tempo stack within the Monitoring Namespace and visualizing it through Grafana, stakeholders are equipped with the necessary insights to monitor performance, troubleshoot issues, and ensure the Snomio application's reliability and efficiency.

---

This documentation delivers a focused explanation of how OpenTelemetry is applied to the Snomio application within the cluster, emphasizing the flow of telemetry data from collection to visualization.
