# dump build stage
FROM postgres:15.4 as dump

COPY dump.sql /docker-entrypoint-initdb.d/

RUN ["sed", "-i", "s/exec \"$@\"/echo \"skipping...\"/", "/usr/local/bin/docker-entrypoint.sh"]

ENV POSTGRES_USER=postgres
ENV POSTGRES_HOST_AUTH_METHOD=trust
ENV PGDATA=/data

RUN ["/usr/local/bin/docker-entrypoint.sh", "postgres"]

# final build stage
FROM postgres:15.4

COPY --from=dump /data $PGDATA

# BUILD:
# docker image build . -t nctsacr.azurecr.io/snomio_test_db:latest

# PUSH
# docker push nctsacr.azurecr.io/snomio_test_db:latest

# RUN:
# docker run -d \                                     
#   --name snomio_test_db_1 \
#   -p 5331:5432 \
#   --platform linux/arm64 \
#   -e POSTGRES_HOST_AUTH_METHOD=trust \
#   nctsacr.azurecr.io/snomio_test_db:latest