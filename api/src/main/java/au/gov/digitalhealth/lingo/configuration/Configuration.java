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

import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@SpringBootApplication(
    scanBasePackages = {"au.gov.digitalhealth.lingo", "au.gov.digitalhealth.tickets"})
@EnableConfigurationProperties
@ConfigurationPropertiesScan(
    basePackages = {"au.gov.digitalhealth.lingo", "au.gov.digitalhealth.tickets"})
@EntityScan("au.gov.digitalhealth")
@ComponentScan(basePackages = {"au.gov.digitalhealth.lingo", "au.gov.digitalhealth.tickets"})
@EnableJpaRepositories(
    basePackages = {"au.gov.digitalhealth.lingo", "au.gov.digitalhealth.tickets"})
public abstract class Configuration {}
