package com.csiro.snomio.extension.sergio.configuration;

import com.csiro.snomio.extension.sergio.service.CustomFatalExceptionStrategy;
import com.csiro.snomio.extension.sergio.service.RabbitMQMessageListener;
import com.csiro.tickets.service.TicketService;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.core.AcknowledgeMode;
import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.rabbit.config.RetryInterceptorBuilder;
import org.springframework.amqp.rabbit.config.SimpleRabbitListenerContainerFactory;
import org.springframework.amqp.rabbit.connection.CachingConnectionFactory;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitAdmin;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.rabbit.listener.ConditionalRejectingErrorHandler;
import org.springframework.amqp.rabbit.listener.SimpleMessageListenerContainer;
import org.springframework.amqp.rabbit.listener.adapter.MessageListenerAdapter;
import org.springframework.amqp.rabbit.retry.RejectAndDontRequeueRecoverer;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.retry.backoff.ExponentialBackOffPolicy;
import org.springframework.retry.interceptor.RetryOperationsInterceptor;
import org.springframework.retry.support.RetryTemplate;

@Configuration
@ConditionalOnProperty(name = "snomio.extensions.sergio.enabled", havingValue = "true")
@Slf4j
public class RabbitMQConfig {

  @Value("${spring.rabbitmq.host}")
  private String host;

  @Value("${spring.rabbitmq.port}")
  private int port;

  @Value("${spring.rabbitmq.username}")
  private String username;

  @Value("${spring.rabbitmq.password}")
  private String password;

  @Value("${snomio.rabbitmq.artg.queueName}")
  private String artgQueueName;

  @Value("${snomio.rabbitmq.matchingTickets.queueName}")
  private String matchingTicketsQueueName;

  @Value("${snomio.rabbitmq.matchingTickets.routingKey}")
  private String matchingTicketsRoutingKey;

  @Value("${snomio.rabbitmq.exchangeName}")
  private String exchangeName;

  // Separate Publisher and Consumer connectionFactories
  // https://docs.spring.io/spring-amqp/docs/3.0.0/reference/html/#blocked-connections-and-resource-constraints

  @Bean
  public ConnectionFactory consumerConnectionFactory() {
    CachingConnectionFactory connectionFactory = new CachingConnectionFactory(host, port);
    connectionFactory.setUsername(username);
    connectionFactory.setPassword(password);
    connectionFactory.setConnectionNameStrategy(connFactory -> "Snomio-Consumer");
    connectionFactory.setCacheMode(CachingConnectionFactory.CacheMode.CHANNEL);
    connectionFactory.setChannelCacheSize(25);
    connectionFactory.setPublisherReturns(true);
    connectionFactory.setRequestedHeartBeat(30);
    connectionFactory.setConnectionTimeout(30000);
    return connectionFactory;
  }

  @Bean
  public ConnectionFactory producerConnectionFactory() {
    CachingConnectionFactory connectionFactory = new CachingConnectionFactory(host, port);
    connectionFactory.setUsername(username);
    connectionFactory.setPassword(password);
    connectionFactory.setConnectionNameStrategy(connFactory -> "Snomio-Producer");
    connectionFactory.setCacheMode(CachingConnectionFactory.CacheMode.CHANNEL);
    connectionFactory.setChannelCacheSize(25);
    connectionFactory.setPublisherReturns(true);
    connectionFactory.setRequestedHeartBeat(30);
    connectionFactory.setConnectionTimeout(30000);
    return connectionFactory;
  }

  @Bean
  public RetryTemplate retryTemplate() {
    RetryTemplate retryTemplate = new RetryTemplate();
    ExponentialBackOffPolicy backOffPolicy = new ExponentialBackOffPolicy();
    backOffPolicy.setInitialInterval(5000); // Initial interval of 5 seconds
    backOffPolicy.setMultiplier(2.0); // Multiplier for the backoff
    backOffPolicy.setMaxInterval(60000); // Maximum backoff interval of 1 minute
    retryTemplate.setBackOffPolicy(backOffPolicy);
    return retryTemplate;
  }

  @Bean
  public SimpleRabbitListenerContainerFactory rabbitListenerContainerFactory() {
    SimpleRabbitListenerContainerFactory factory = new SimpleRabbitListenerContainerFactory();
    factory.setConnectionFactory(producerConnectionFactory());
    factory.setMessageConverter(jackson2JsonMessageConverter(objectMapper()));
    factory.setAcknowledgeMode(AcknowledgeMode.MANUAL);
    factory.setConcurrentConsumers(5);
    factory.setMaxConcurrentConsumers(10);
    factory.setErrorHandler(
        new ConditionalRejectingErrorHandler(new CustomFatalExceptionStrategy()));
    factory.setAdviceChain(rabbitRetryInterceptor());
    return factory;
  }

  @Bean
  public SimpleMessageListenerContainer simpleMessageListenerContainer(
      TicketService ticketService) {
    SimpleMessageListenerContainer container = new SimpleMessageListenerContainer();
    container.setConnectionFactory(consumerConnectionFactory());
    container.setQueueNames(artgQueueName);
    container.setMessageListener(listenerAdapter(ticketService));
    container.setAcknowledgeMode(AcknowledgeMode.MANUAL);
    container.setConcurrentConsumers(2);
    container.setMaxConcurrentConsumers(5);
    container.setErrorHandler(
        new ConditionalRejectingErrorHandler(new CustomFatalExceptionStrategy()));
    container.setAdviceChain(rabbitRetryInterceptor());
    return container;
  }

  @Bean
  public RetryOperationsInterceptor rabbitRetryInterceptor() {
    return RetryInterceptorBuilder.stateless()
        .maxAttempts(5)
        .backOffPolicy(backOffPolicy())
        .recoverer(new RejectAndDontRequeueRecoverer())
        .build();
  }

  @Bean
  public ExponentialBackOffPolicy backOffPolicy() {
    ExponentialBackOffPolicy policy = new ExponentialBackOffPolicy();
    policy.setInitialInterval(5000);
    policy.setMultiplier(2.0);
    policy.setMaxInterval(60000);
    return policy;
  }

  @Bean
  public RabbitTemplate rabbitTemplate() {
    RabbitTemplate rabbitTemplate = new RabbitTemplate(producerConnectionFactory());
    rabbitTemplate.setUsePublisherConnection(true);
    rabbitTemplate.setMessageConverter(jackson2JsonMessageConverter(objectMapper()));
    rabbitTemplate.setRecoveryCallback(
        (context -> {
          log.warn("Attempting to recover RabbitMQ connection...");
          return null;
        }));
    return rabbitTemplate;
  }

  @Bean
  public Queue artgQueue() {
    return new Queue(artgQueueName, true);
  }

  @Bean
  public Queue matchingTicketsQueue() {
    return new Queue(matchingTicketsQueueName, true);
  }

  @Bean
  public TopicExchange exchange() {
    return new TopicExchange(exchangeName);
  }

  @Bean
  public Binding artgQueueBinding(Queue artgQueue, TopicExchange exchange) {
    return BindingBuilder.bind(artgQueue).to(exchange).with(artgQueueName);
  }

  @Bean
  public Binding matchingTicketsQueueBinding(Queue matchingTicketsQueue, TopicExchange exchange) {
    return BindingBuilder.bind(matchingTicketsQueue).to(exchange).with(matchingTicketsRoutingKey);
  }

  @Bean
  public RabbitAdmin rabbitAdmin() {
    RabbitAdmin rabbitAdmin = new RabbitAdmin(consumerConnectionFactory());
    rabbitAdmin.declareQueue(artgQueue());
    rabbitAdmin.declareQueue(matchingTicketsQueue());
    rabbitAdmin.declareExchange(exchange());
    rabbitAdmin.declareBinding(artgQueueBinding(artgQueue(), exchange()));
    rabbitAdmin.declareBinding(matchingTicketsQueueBinding(matchingTicketsQueue(), exchange()));
    return rabbitAdmin;
  }

  @Bean
  public Jackson2JsonMessageConverter jackson2JsonMessageConverter(ObjectMapper objectMapper) {
    Jackson2JsonMessageConverter converter = new Jackson2JsonMessageConverter(objectMapper);
    converter.setDefaultCharset("UTF-8"); // Ensure correct encoding
    return converter;
  }

  @Bean
  @Autowired
  public MessageListenerAdapter listenerAdapter(TicketService ticketService) {
    MessageListenerAdapter listenerAdapter =
        new MessageListenerAdapter(rabbitMQMessageListener(ticketService), "onMessage");
    listenerAdapter.setMessageConverter(jackson2JsonMessageConverter(objectMapper()));
    return listenerAdapter;
  }

  @Bean
  public RabbitMQMessageListener rabbitMQMessageListener(TicketService ticketService) {
    return new RabbitMQMessageListener(ticketService, rabbitTemplate());
  }

  // Move Jackson2JsonMessage ObjectMapper here
  public static ObjectMapper objectMapper() {
    ObjectMapper objectMapper = new ObjectMapper();
    objectMapper.registerModule(new JavaTimeModule());
    objectMapper.configure(DeserializationFeature.ACCEPT_EMPTY_STRING_AS_NULL_OBJECT, true);
    objectMapper.configure(DeserializationFeature.ACCEPT_EMPTY_ARRAY_AS_NULL_OBJECT, true);
    objectMapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
    return objectMapper;
  }
}
