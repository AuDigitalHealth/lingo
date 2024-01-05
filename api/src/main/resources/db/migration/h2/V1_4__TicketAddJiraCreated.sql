alter table ticket add column jira_created timestamp(6) with time zone;
alter table ticket_aud add column jira_created timestamp(6) with time zone;
alter table attachment alter column length type bigint;
alter table attachment_aud alter column length type bigint;