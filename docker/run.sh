#!/bin/sh

openssl req -x509 -nodes -newkey rsa:2048 -keyout ./nginx/key.pem -out ./nginx/cert.pem -days 365 -subj "/C=AU/ST=QLD/L=Brisbane/O=CSIRO/OU=CSIRO Department/CN=snomio"


docker-compose up