# Snodine (ECL Refset Process)

To run this project

```
mvn clean package
```

You need to provide the following values (to connect to Snowstorm), either via application-local.properties, a -D argument, or a pipeline variable

```
ims-username
ims-password
```

The threshold for warning of excessive adds is set to a default value of 0.05 but this can be overridden in the same way with this value

```
refset-percent-change-threshold
```

The pipeline is configured to send emails when the threshold is exceeded.  The following value can be configured in the pipeline to control who recieves the email

```
threshold_exceeded_notification_email
```

An example of running from the command line is

```
$ java -jar -Dspring.profiles.active=prod -Dims-username=XXX -Dims-password=XXX -Drefset-percent-change-threshold=0.06 target/eclrefset-0.0.1-SNAPSHOT.jar

```