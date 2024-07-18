package com.csiro.snomio.extension.sergio.service;

import com.csiro.snomio.extension.SnomioExtension;
import com.csiro.snomio.extension.sergio.configuration.RabbitMQConfig;
import com.csiro.tickets.BatchArtgIdMessageDto;
import com.csiro.tickets.BatchArtgIdWithTicketMessageDto;
import com.csiro.tickets.TicketMinimalDto;
import com.csiro.tickets.service.TicketService;
import com.rabbitmq.client.Channel;
import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.core.Message;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.rabbit.listener.api.ChannelAwareMessageListener;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

@Service
@ConditionalOnProperty(name = "snomio.extensions.sergio.enabled", havingValue = "true")
public class RabbitMQMessageListener implements SnomioExtension, ChannelAwareMessageListener {

  private static final Logger logger = LoggerFactory.getLogger(RabbitMQMessageListener.class);
  private static final Map<String, AtomicInteger> processedMessagesCounterMap = new HashMap<>();
  private final RabbitTemplate rabbitTemplate;
  private final TicketService ticketService;

  @Value("${snomio.rabbitmq.exchangeName}")
  private String exchangeName;

  @Value("${snomio.rabbitmq.matchingTickets.routingKey}")
  private String matchingTicketsRoutingKey;

  public RabbitMQMessageListener(TicketService ticketService, RabbitTemplate rabbitTemplate) {
    this.ticketService = ticketService;
    this.rabbitTemplate = rabbitTemplate;
  }

  @Override
  public void onMessage(Message message, Channel channel) throws Exception {
    BatchArtgIdMessageDto batchMessage =
        RabbitMQConfig.objectMapper().readValue(message.getBody(), BatchArtgIdMessageDto.class);
    try {
      List<String> artgIds = batchMessage.getArtgIds();
      String correlationId = batchMessage.getCorrelationId();

      if (artgIds == null || artgIds.isEmpty()) {
        logger.info("Last message from Sergio for the Job. Resetting counter...");
        channel.basicAck(message.getMessageProperties().getDeliveryTag(), false);
        // Sending Empty message to let Sergio that this is the last one for the job
        sendTicketsWithArtgId(
            List.of(new BatchArtgIdWithTicketMessageDto(correlationId, null, null)));
        processedMessagesCounterMap.remove(correlationId);
        return;
      }

      List<TicketMinimalDto> minimalDtos =
          ticketService.findByAdditionalFieldTypeNameAndListValueOf(
              TicketMinimalDto.ARTGID_ADDITIONAL_FIELD_TYPE, batchMessage.getArtgIds());

      // There can be more than one ticket for an ARTG ID
      Map<String, List<TicketMinimalDto>> ticketMap =
          minimalDtos.stream()
              .collect(
                  Collectors.groupingBy(
                      ticketMinimalDto ->
                          ticketMinimalDto.fetchValueOfAdditionalFieldByType(
                              TicketMinimalDto.ARTGID_ADDITIONAL_FIELD_TYPE)));

      List<BatchArtgIdWithTicketMessageDto> responseList =
          artgIds.stream()
              .map(
                  artgId ->
                      new BatchArtgIdWithTicketMessageDto(
                          correlationId, artgId, ticketMap.getOrDefault(artgId, null)))
              .toList();

      sendTicketsWithArtgId(responseList);
      channel.basicAck(message.getMessageProperties().getDeliveryTag(), false);
      logProgress(correlationId);

    } catch (Exception e) {
      logger.error("Failed to process message: {}", e.getMessage());
      try {
        channel.basicNack(
            message.getMessageProperties().getDeliveryTag(),
            false,
            false); // Do not requeue the failed message so we don't get into a loop
      } catch (IOException nackException) {
        logger.error("Failed to nack message: {}", nackException.getMessage());
      }
    }
  }

  private void sendTicketsWithArtgId(List<BatchArtgIdWithTicketMessageDto> tickets) {
    tickets.forEach(
        ticket -> rabbitTemplate.convertAndSend(exchangeName, matchingTicketsRoutingKey, ticket));
  }

  private void logProgress(String correlationId) {
    int count;
    synchronized (processedMessagesCounterMap) {
      count =
          processedMessagesCounterMap
              .computeIfAbsent(correlationId, k -> new AtomicInteger(0))
              .incrementAndGet();
      if (count % 100 == 0) {
        logger.info("Processed {} messages from Sergio for queue {}", count, correlationId);
      }
    }
  }

  @Override
  public void initialise() {
    logger.info("Sergio Extension initialised.");
  }

  @Override
  public void shutdown() {
    logger.info("Sergio Extension shutdown.");
  }
}
