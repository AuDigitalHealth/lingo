#!/bin/sh -x

# Generates the latest (H2) Schema snapshot so that diffs are simple to generate
# and thus create new Flyway migrations
#
# You will have to exit snomio api with CTRL+C after it completely booted up and
# no more log entries are generated
#

SQL="src/main/resources/db/migration/h2/V1_1__initial.sql"
POSTGRES="src/main/resources/db/migration/postgresql/V1_1__initial.sql"

rm ${SQL}

java \
      -Dspring.datasource.url="jdbc:h2:file:/tmp/db" \
      -Dspring.flyway.enabled="false" \
      -Dspring.jpa.properties.jakarta.persistence.schema-generation.create-source="metadata" \
      -Dspring.jpa.properties.jakarta.persistence.schema-generation.scripts.action="create" \
      -Dspring.jpa.properties.jakarta.persistence.schema-generation.scripts.create-target="${SQL}" \
      -Dspring.profiles.active=h2 \
  -jar target/api-1.0.0-SNAPSHOT.jar




cat <<EOT > $POSTGRES
create or replace function drop_all_tables_in_schema() returns void as \$\$
declare
    r record;
BEGIN
    for r IN (select tablename from pg_tables where schemaname = 'public') loop
        execute 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
    end loop;
    execute 'DROP SEQUENCE IF EXISTS revinfo_seq;';
end;
\$\$ language plpgsql;

create sequence revinfo_seq start with 1 increment by 50;
EOT


cat $SQL | sed -r 's/binary\(255\)|varbinary\(255\)/bytea/g' | sed 's/tinyint/smallint/g' >>$POSTGRES