package com.csiro.tickets.helper;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.csiro.tickets.models.AdditionalFieldType;
import com.csiro.tickets.models.AdditionalFieldType.Type;
import com.csiro.tickets.models.AdditionalFieldValue;
import com.csiro.tickets.models.Ticket;
import java.time.Instant;
import java.util.Set;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

class AdditionalFieldUtilsTest {

  @Test
  void testFindValueByAdditionalFieldName() {
    Ticket ticket = mock(Ticket.class);

    AdditionalFieldValue afv1 =
        createMockAdditionalFieldValue("Field1", "2023-01-15T12:30:00Z", Type.DATE);
    AdditionalFieldValue afv2 = createMockAdditionalFieldValue("Field2", "Value2", Type.STRING);

    when(ticket.getAdditionalFieldValues()).thenReturn(Set.of(afv1, afv2));

    String dateValue = AdditionalFieldUtils.findValueByAdditionalFieldName("Field1", ticket);

    Assertions.assertEquals("15/01/2023", dateValue);

    String stringValue = AdditionalFieldUtils.findValueByAdditionalFieldName("Field2", ticket);
    Assertions.assertEquals("Value2", stringValue);
  }

  @Test
  void testFormatAdditionalFieldValueForDate() {
    AdditionalFieldValue afv = mock(AdditionalFieldValue.class);
    AdditionalFieldType fieldType = AdditionalFieldType.builder().type(Type.DATE).build();
    when(afv.getAdditionalFieldType()).thenReturn(fieldType);

    when(afv.getValueOf()).thenReturn("2023-01-15T12:30:00Z");

    String expectedFormattedDate = "15/01/2023";

    String actualFormattedValue = AdditionalFieldUtils.formatAdditionalFieldValue(afv);

    Assertions.assertEquals(expectedFormattedDate, actualFormattedValue);
  }

  @Test
  void testFormatDate() {
    Instant instant = Instant.parse("2023-01-15T12:30:00Z");
    String expectedFormattedDate = "15/01/2023";

    String actualFormattedDate = AdditionalFieldUtils.formatDate(instant);
    Assertions.assertEquals(expectedFormattedDate, actualFormattedDate);
  }

  @Test
  void testFormatDateWithNullInstant() {
    Instant instant = null;
    String expectedFormattedDate = "";

    String actualFormattedDate = AdditionalFieldUtils.formatDate(instant);
    Assertions.assertEquals(expectedFormattedDate, actualFormattedDate);
  }

  @Test
  void testFormatDateFromTitle() {
    String formatted = AdditionalFieldUtils.formatDateFromTitle("20231031");

    Assertions.assertEquals("31/10/2023", formatted);

    String sameAsEntered = AdditionalFieldUtils.formatDateFromTitle("SameAsEntered");

    Assertions.assertEquals("SameAsEntered", sameAsEntered);
  }

  private AdditionalFieldValue createMockAdditionalFieldValue(
      String fieldName, String value, Type type) {
    AdditionalFieldValue afv = mock(AdditionalFieldValue.class);
    AdditionalFieldType fieldType = mock(AdditionalFieldType.class);
    when(afv.getAdditionalFieldType()).thenReturn(fieldType);
    when(afv.getValueOf()).thenReturn(value);
    when(fieldType.getName()).thenReturn(fieldName);
    when(fieldType.getType()).thenReturn(type);
    return afv;
  }
}
