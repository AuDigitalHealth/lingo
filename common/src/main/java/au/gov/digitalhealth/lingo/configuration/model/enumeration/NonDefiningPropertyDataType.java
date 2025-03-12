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
package au.gov.digitalhealth.lingo.configuration.model.enumeration;

import au.csiro.snowstorm_client.model.SnowstormConcreteValue.DataTypeEnum;
import au.gov.digitalhealth.lingo.util.PartionIdentifier;
import au.gov.digitalhealth.lingo.util.SnomedIdentifierUtil;
import java.net.URI;
import java.net.URISyntaxException;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeParseException;

public enum NonDefiningPropertyDataType {
  DECIMAL {
    @Override
    public boolean isValidValue(String value) {
      if (value == null) {
        return false;
      }
      try {
        Double.parseDouble(value);
        return true;
      } catch (NumberFormatException e) {
        return false;
      }
    }

    @Override
    public DataTypeEnum getSnowstormDatatype() {
      return DataTypeEnum.DECIMAL;
    }
  },
  INTEGER {
    @Override
    public boolean isValidValue(String value) {
      if (value == null) {
        return false;
      }
      try {
        Integer.parseInt(value);
        return true;
      } catch (NumberFormatException e) {
        return false;
      }
    }

    @Override
    public DataTypeEnum getSnowstormDatatype() {
      return DataTypeEnum.INTEGER;
    }
  },
  STRING {
    @Override
    public boolean isValidValue(String value) {
      return value != null;
    }

    @Override
    public DataTypeEnum getSnowstormDatatype() {
      return DataTypeEnum.STRING;
    }
  },
  DATE {
    @Override
    public boolean isValidValue(String value) {
      if (value == null) {
        return false;
      }
      try {
        LocalDate.parse(value);
        return true;
      } catch (DateTimeParseException e) {
        return false;
      }
    }

    @Override
    public DataTypeEnum getSnowstormDatatype() {
      return DataTypeEnum.STRING;
    }
  },
  TIME {
    @Override
    public boolean isValidValue(String value) {
      if (value == null) {
        return false;
      }
      try {
        LocalTime.parse(value);
        return true;
      } catch (DateTimeParseException e) {
        return false;
      }
    }

    @Override
    public DataTypeEnum getSnowstormDatatype() {
      return DataTypeEnum.STRING;
    }
  },
  UNSIGNED_INTEGER {
    @Override
    public boolean isValidValue(String value) {
      if (value == null) {
        return false;
      }
      try {
        int intValue = Integer.parseInt(value);
        return intValue >= 0;
      } catch (NumberFormatException e) {
        return false;
      }
    }

    @Override
    public DataTypeEnum getSnowstormDatatype() {
      return DataTypeEnum.INTEGER;
    }
  },
  URI {
    @Override
    public boolean isValidValue(String value) {
      if (value == null) {
        return false;
      }
      try {
        new URI(value);
        return true;
      } catch (URISyntaxException e) {
        return false;
      }
    }

    @Override
    public DataTypeEnum getSnowstormDatatype() {
      return DataTypeEnum.STRING;
    }
  },
  CONCEPT {
    @Override
    public boolean isValidValue(String value) {
      return value != null && SnomedIdentifierUtil.isValid(value, PartionIdentifier.CONCEPT);
    }

    @Override
    public DataTypeEnum getSnowstormDatatype() {
      throw new UnsupportedOperationException("CONCEPT is not a valid datatype for Snowstorm");
    }
  };

  public abstract boolean isValidValue(String value);

  public abstract DataTypeEnum getSnowstormDatatype();
}
