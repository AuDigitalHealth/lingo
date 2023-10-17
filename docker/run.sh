#!/bin/sh

openssl req -trustout -x509 -nodes -newkey rsa:2048 -keyout ./nginx/key.pem -out ./nginx/cert.pem -sha256 -days 365 \
    -subj "/C=AU/ST=QLD/L=Brisbane/O=CSIRO/OU=CSIRO Department/CN=snomio"

# openssl req -trustout -x509 -newkey rsa:4096 -sha256 -nodes -keyout ./nginx/key.pem -out ./nginx/cert.pem -days 3650

docker-compose up