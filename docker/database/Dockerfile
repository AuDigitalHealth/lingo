# dump build stage
FROM postgres:15.4 AS dump

COPY dump.sql /docker-entrypoint-initdb.d/

RUN ["sed", "-i", "s/exec \"$@\"/echo \"skipping...\"/", "/usr/local/bin/docker-entrypoint.sh"]

ENV POSTGRES_USER=postgres
ENV POSTGRES_DB=snomio
ENV POSTGRES_HOST_AUTH_METHOD=trust
ENV PGDATA=/data

RUN ["/usr/local/bin/docker-entrypoint.sh", "postgres"]

# final build stage
FROM postgres:15.4

COPY --from=dump /data $PGDATA

# BUILD:
# docker buildx build --platform linux/amd64,linux/arm64 -t quay.io/aehrc/snomio_test_db:latest .

# PUSH
# docker buildx build --platform linux/amd64,linux/arm64 -t quay.io/aehrc/snomio_test_db:latest --push .

# RUN:
# docker run -d \
#   --name snomio_test_db_1 \
#   -p 5331:5432 \
#   --platform linux/arm64 \
#   -e POSTGRES_HOST_AUTH_METHOD=trust \
#   quay.io/aehrc/snomio_test_db:latest