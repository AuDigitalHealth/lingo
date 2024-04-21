import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { getWebAutoInstrumentations } from '@opentelemetry/auto-instrumentations-web';
import {
  BatchSpanProcessor,
  WebTracerConfig,
  WebTracerProvider,
} from '@opentelemetry/sdk-trace-web';
import { ZipkinExporter } from '@opentelemetry/exporter-zipkin';
import { SEMRESATTRS_SERVICE_NAME } from '@opentelemetry/semantic-conventions';
import { Resource } from '@opentelemetry/resources';
import { B3Propagator, B3InjectEncoding } from '@opentelemetry/propagator-b3';
import axios, { InternalAxiosRequestConfig, AxiosError } from 'axios';
import {
  context,
  trace,
  propagation,
  AttributeValue,
  Span,
} from '@opentelemetry/api';
import { ZoneContextManager } from '@opentelemetry/context-zone';
import { DocumentLoadInstrumentation } from '@opentelemetry/instrumentation-document-load';
import { FetchInstrumentation } from '@opentelemetry/instrumentation-fetch';
import { UserInteractionInstrumentation } from '@opentelemetry/instrumentation-user-interaction';
import { XMLHttpRequestInstrumentation } from '@opentelemetry/instrumentation-xml-http-request';

interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  span?: Span;
}

interface CustomAxiosError extends AxiosError {
  config: CustomAxiosRequestConfig;
}

export function initializeOpenTelemetry(): void {
  const resource = new Resource({
    [SEMRESATTRS_SERVICE_NAME]: 'snomio-ui',
  });

  const providerConfig: WebTracerConfig = {
    resource: resource,
  };
  const provider = new WebTracerProvider(providerConfig);
  const exporter = new ZipkinExporter({
    url: '/api/telemetry',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  provider.addSpanProcessor(new BatchSpanProcessor(exporter));

  provider.register({
    contextManager: new ZoneContextManager(),
    propagator: new B3Propagator({
      injectEncoding: B3InjectEncoding.MULTI_HEADER,
    }),
  });

  const ignoreUrls = [/\/authoring-services\/authoring-services-websocket\//];
  registerInstrumentations({
    instrumentations: [
      new DocumentLoadInstrumentation(),
      new FetchInstrumentation({
        ignoreUrls: ignoreUrls,
      }),
      new UserInteractionInstrumentation(),
      new XMLHttpRequestInstrumentation({
        ignoreUrls: ignoreUrls,
      }),
    ],
  });

  // const tracer = trace.getTracer('axios-tracer');

  // axios.interceptors.request.use(
  //   (config: CustomAxiosRequestConfig) => {
  //     const span = tracer.startSpan(`axios_http_request_${config.method}`, {
  //       attributes: {
  //         url: config.url,
  //         'http.method': config.method ?? 'UNKNOWN',
  //         kind: 'client',
  //       },
  //     });
  //     Object.keys(config.headers).forEach(key => {
  //       const headerValue: AttributeValue = String(config.headers[key]);
  //       span.setAttribute(`http.header.${key}`, headerValue);
  //     });
  //     const currentCtx = trace.setSpan(context.active(), span);

  //     propagation.inject(currentCtx, config.headers);

  //     config.span = span;
  //     return config;
  //   },
  //   error => {
  //     return Promise.reject(error);
  //   },
  // );

  // axios.interceptors.response.use(
  //   response => {
  //     (response.config as CustomAxiosRequestConfig).span?.end();
  //     return response;
  //   },
  //   (error: CustomAxiosError) => {
  //     error.config.span?.end();
  //     return Promise.reject(error);
  //   },
  // );
}
