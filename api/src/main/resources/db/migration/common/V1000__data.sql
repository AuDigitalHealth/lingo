insert into TICKET_TYPE(ID,  CREATED, CREATED_BY, VERSION, MODIFIED_BY, MODIFIED, NAME, DESCRIPTION)
VALUES (100, '2023-08-23', 'cgillespie', 1, null, null, 'Tga', 'A ticket created by a tga release');

-- The state's desired for the AMT team - these can actually be anything
-- They will represent something on our jira board

insert into STATE(ID,  CREATED, CREATED_BY, VERSION, MODIFIED_BY, MODIFIED, LABEL, DESCRIPTION, GROUPING)
values(100, '2023-08-23', 'cgillespie', 1, null, null, 'Backlog', 'A historical ticket', 0);

insert into STATE(ID,  CREATED, CREATED_BY, VERSION, MODIFIED_BY, MODIFIED, LABEL, DESCRIPTION, GROUPING)
values(200, '2023-08-23', 'cgillespie', 1, null, null, 'Open', 'A ticket in the current work list', 1);

insert into STATE(ID,  CREATED, CREATED_BY, VERSION, MODIFIED_BY, MODIFIED, LABEL, DESCRIPTION, GROUPING)
values(300, '2023-08-23', 'cgillespie', 1, null, null, 'In Assesment', 'A ticket in the discovery phase', 2);

insert into STATE(ID,  CREATED, CREATED_BY, VERSION, MODIFIED_BY, MODIFIED, LABEL, DESCRIPTION, GROUPING)
values(400, '2023-08-23', 'cgillespie', 1, null, null, 'Review', 'A ticket with the original authors work being completed, now being reviewed.', 3);

insert into STATE(ID,  CREATED, CREATED_BY, VERSION, MODIFIED_BY, MODIFIED, LABEL, DESCRIPTION, GROUPING)
values(500, '2023-08-23', 'cgillespie', 1, null, null, 'Complete', 'A ticket that has been finished & reviewed, but not yet released into the AMT', 4);

insert into STATE(ID,  CREATED, CREATED_BY, VERSION, MODIFIED_BY, MODIFIED, LABEL, DESCRIPTION, GROUPING)
values(600, '2023-08-23', 'cgillespie', 1, null, null, 'Released', 'A finished ticket, that has been released in the latest version of the AMT', 5);

insert into STATE(ID,  CREATED, CREATED_BY, VERSION, MODIFIED_BY, MODIFIED, LABEL, DESCRIPTION, GROUPING)
values(700, '2023-08-23', 'cgillespie', 1, null, null, 'Reopened', 'A ticket that has been completed, that now needs additional work', 6);

insert into ADDITIONAL_FIELD_TYPE(ID, CREATED, CREATED_BY, NAME,  DESCRIPTION)
VALUES (100, '2023-08-23', 'cgillespie', 'Schedule', 'A field to store the schedule of the drug');

insert into ADDITIONAL_FIELD_TYPE_VALUE(ID, CREATED, CREATED_BY, ADDITIONAL_FIELD_TYPE_ID, VALUE_OF, GROUPING)
VALUES(100, '2023-08-23', 'cgillespie',100, 'S8', 0);

insert into ADDITIONAL_FIELD_TYPE_VALUE(ID, CREATED, CREATED_BY, ADDITIONAL_FIELD_TYPE_ID, VALUE_OF, GROUPING)
VALUES(200, '2023-08-23', 'cgillespie', 100, 'S7', 1);

insert into ADDITIONAL_FIELD_TYPE_VALUE(ID, CREATED, CREATED_BY, ADDITIONAL_FIELD_TYPE_ID, VALUE_OF, GROUPING)
VALUES(300, '2023-08-23', 'cgillespie', 100, 'S6', 2);

insert into ADDITIONAL_FIELD_TYPE_VALUE(ID, CREATED, CREATED_BY, ADDITIONAL_FIELD_TYPE_ID, VALUE_OF, GROUPING)
VALUES(400, '2023-08-23', 'cgillespie', 100, 'S5', 3);

insert into ADDITIONAL_FIELD_TYPE_VALUE(ID, CREATED, CREATED_BY, ADDITIONAL_FIELD_TYPE_ID, VALUE_OF, GROUPING)
VALUES(500, '2023-08-23', 'cgillespie', 100, 'S4', 5);

insert into ADDITIONAL_FIELD_TYPE_VALUE(ID, CREATED, CREATED_BY, ADDITIONAL_FIELD_TYPE_ID, VALUE_OF, GROUPING)
VALUES(600, '2023-08-23', 'cgillespie', 100, 'S3', 6);

insert into ADDITIONAL_FIELD_TYPE_VALUE(ID, CREATED, CREATED_BY, ADDITIONAL_FIELD_TYPE_ID, VALUE_OF, GROUPING)
VALUES(700, '2023-08-23', 'cgillespie', 100, 'S2', 7);

insert into ADDITIONAL_FIELD_TYPE_VALUE(ID, CREATED, CREATED_BY, ADDITIONAL_FIELD_TYPE_ID, VALUE_OF, GROUPING)
VALUES(800, '2023-08-23', 'cgillespie', 100, 'S1', 8);

insert into ADDITIONAL_FIELD_TYPE_VALUE(ID, CREATED, CREATED_BY, ADDITIONAL_FIELD_TYPE_ID, VALUE_OF, GROUPING)
VALUES(900, '2023-08-23', 'cgillespie', 100, 'S9', 9);

insert into ADDITIONAL_FIELD_TYPE_VALUE(ID, CREATED, CREATED_BY, ADDITIONAL_FIELD_TYPE_ID, VALUE_OF, GROUPING)
VALUES(1000, '2023-08-23', 'cgillespie', 100, 'S10', 10);

insert into ADDITIONAL_FIELD_TYPE(ID, CREATED, CREATED_BY, NAME,  DESCRIPTION)
VALUES (200, '2023-08-23', 'cgillespie', 'Black Label Scheme', 'A field to store the black label status of the drug');

insert into ADDITIONAL_FIELD_TYPE_VALUE(ID, CREATED, CREATED_BY, ADDITIONAL_FIELD_TYPE_ID, VALUE_OF, GROUPING)
VALUES(1100, '2023-08-23', 'cgillespie', 200, 'Yes', 0);

insert into LABEL(ID,  CREATED, CREATED_BY, VERSION, MODIFIED_BY, MODIFIED, NAME, DESCRIPTION, DISPLAY_COLOR )
VALUES (100, '2023-08-23', 'cgillespie', 1, null, null, 'S8', 'Schedule 8 drugs (urgent)', 'error');

insert into LABEL(ID,  CREATED, CREATED_BY, VERSION, MODIFIED_BY, MODIFIED, NAME, DESCRIPTION, DISPLAY_COLOR )
VALUES (200, '2023-08-23', 'cgillespie', 1, null, null, 'Nestle Crunch', 'Kids love Nestle Crunch!', 'success');

insert into ITERATION(NAME, START_DATE, END_DATE, ACTIVE, COMPLETED, ID,  CREATED, CREATED_BY)
values('August Release', '2023-08-01', '2023-08-31', false, true, 100, '2023-08-01', 'cgillespie');

insert into ITERATION(NAME, START_DATE, END_DATE, ACTIVE, COMPLETED, ID,  CREATED, CREATED_BY)
values('September Release', '2023-09-23', '2023-09-30', true, false, 200, '2023-08-01', 'cgillespie');

insert into ITERATION(NAME, START_DATE, END_DATE, ACTIVE, COMPLETED, ID,  CREATED, CREATED_BY)
values('October Release', '2023-10-01', '2023-10-31', false, false, 300, '2023-08-01', 'cgillespie');

insert into PRIORITY_BUCKET(ID, NAME, DESCRIPTION, ORDER_INDEX, CREATED, CREATED_BY)
values(100, 'asap', 'get it done', 0, '2023-08-23', 'cgillespie');

insert into PRIORITY_BUCKET(ID, NAME, DESCRIPTION, ORDER_INDEX, CREATED, CREATED_BY)
values(300, 'soon', 'get it done soon', 1, '2023-08-23', 'cgillespie');

insert into PRIORITY_BUCKET(ID, NAME, DESCRIPTION, ORDER_INDEX, CREATED, CREATED_BY)
values(200, 'whenevs', 'get it done whenevs', 2, '2023-08-23', 'cgillespie');

-- Tickets come last, as they require some setup

insert into TICKET (ID, TICKET_TYPE_ID, CREATED_BY, CREATED, MODIFIED_BY, MODIFIED, VERSION, TITLE, DESCRIPTION, STATE_ID, ITERATION_ID, PRIORITY_BUCKET_ID)
VALUES (100, 100, 'cgillespie', '2023-08-23', null, null, 1, 'test ticket', 'some test values', 100, 100, 100);

insert into TICKET_ADDITIONAL_FIELD_TYPES( TICKET_ID, additional_field_type_value_id)
    values(100, 100);

insert into TICKET_ADDITIONAL_FIELD_TYPES( TICKET_ID, additional_field_type_value_id)
    values(100, 1100);

insert into TICKET (ID, TICKET_TYPE_ID, CREATED_BY, CREATED, MODIFIED_BY, MODIFIED, VERSION, TITLE, DESCRIPTION, STATE_ID, ITERATION_ID, PRIORITY_BUCKET_ID)
VALUES (200, 100, 'cgillespie', '2023-08-23', null, null, 1, 'test ticket', 'some test values', 200, 200, 300);

insert into TICKET_ADDITIONAL_FIELD_TYPES( TICKET_ID, additional_field_type_value_id)
values(200, 100);
--
-- insert into TICKET (ID, TICKET_TYPE_ID, CREATED_BY, CREATED, MODIFIED_BY, MODIFIED, VERSION, TITLE, DESCRIPTION, STATE_ID, ITERATION_ID, PRIORITY_BUCKET_ID)
-- VALUES (300, 100, 'cgillespie', '2023-08-23', null, null, 1, 'test ticket', 'some test values', 200, 200, 300);
--
-- insert into TICKET (ID, TICKET_TYPE_ID, CREATED_BY, CREATED, MODIFIED_BY, MODIFIED, VERSION, TITLE, DESCRIPTION, STATE_ID, ITERATION_ID, PRIORITY_BUCKET_ID)
-- VALUES (400, 100, 'cgillespie', '2023-08-23', null, null, 1, 'test ticket', 'some test values', 200, 200, 300);
--
-- insert into TICKET (ID, TICKET_TYPE_ID, CREATED_BY, CREATED, MODIFIED_BY, MODIFIED, VERSION, TITLE, DESCRIPTION, STATE_ID, ITERATION_ID, PRIORITY_BUCKET_ID)
-- VALUES (500, 100, 'cgillespie', '2023-08-23', null, null, 1, 'test ticket', 'some test values', 200, 200, 300);
--
-- insert into TICKET (ID, TICKET_TYPE_ID, CREATED_BY, CREATED, MODIFIED_BY, MODIFIED, VERSION, TITLE, DESCRIPTION, STATE_ID, ITERATION_ID, PRIORITY_BUCKET_ID)
-- VALUES (600, 100, 'cgillespie', '2023-08-23', null, null, 1, 'test ticket', 'some test values', 200, 200, 300);
--
-- insert into TICKET (ID, TICKET_TYPE_ID, CREATED_BY, CREATED, MODIFIED_BY, MODIFIED, VERSION, TITLE, DESCRIPTION, STATE_ID, ITERATION_ID, PRIORITY_BUCKET_ID)
-- VALUES (700, 100, 'cgillespie', '2023-08-23', null, null, 1, 'test ticket', 'some test values', 200, 200, 300);
--
-- insert into TICKET (ID, TICKET_TYPE_ID, CREATED_BY, CREATED, MODIFIED_BY, MODIFIED, VERSION, TITLE, DESCRIPTION, STATE_ID, ITERATION_ID, PRIORITY_BUCKET_ID)
-- VALUES (800, 100, 'cgillespie', '2023-08-23', null, null, 1, 'test ticket', 'some test values', 200, 200, 300);
--
-- insert into TICKET (ID, TICKET_TYPE_ID, CREATED_BY, CREATED, MODIFIED_BY, MODIFIED, VERSION, TITLE, DESCRIPTION, STATE_ID, ITERATION_ID, PRIORITY_BUCKET_ID)
-- VALUES (900, 100, 'cgillespie', '2023-08-23', null, null, 1, 'test ticket', 'some test values', 200, 200, 300);
--
-- insert into TICKET (ID, TICKET_TYPE_ID, CREATED_BY, CREATED, MODIFIED_BY, MODIFIED, VERSION, TITLE, DESCRIPTION, STATE_ID, ITERATION_ID, PRIORITY_BUCKET_ID)
-- VALUES (1000, 100, 'cgillespie', '2023-08-23', null, null, 1, 'test ticket', 'some test values', 200, 200, 300);
--
-- insert into TICKET (ID, TICKET_TYPE_ID, CREATED_BY, CREATED, MODIFIED_BY, MODIFIED, VERSION, TITLE, DESCRIPTION, STATE_ID, ITERATION_ID, PRIORITY_BUCKET_ID)
-- VALUES (1200, 100, 'cgillespie', '2023-08-23', null, null, 1, 'test ticket', 'some test values', 200, 200, 300);
--
-- insert into TICKET (ID, TICKET_TYPE_ID, CREATED_BY, CREATED, MODIFIED_BY, MODIFIED, VERSION, TITLE, DESCRIPTION, STATE_ID, ITERATION_ID, PRIORITY_BUCKET_ID)
-- VALUES (1300, 100, 'cgillespie', '2023-08-23', null, null, 1, 'test ticket', 'some test values', 200, 200, 300);
--
-- insert into TICKET (ID, TICKET_TYPE_ID, CREATED_BY, CREATED, MODIFIED_BY, MODIFIED, VERSION, TITLE, DESCRIPTION, STATE_ID, ITERATION_ID, PRIORITY_BUCKET_ID)
-- VALUES (1400, 100, 'cgillespie', '2023-08-23', null, null, 1, 'test ticket', 'some test values', 200, 200, 300);
--
-- insert into TICKET (ID, TICKET_TYPE_ID, CREATED_BY, CREATED, MODIFIED_BY, MODIFIED, VERSION, TITLE, DESCRIPTION, STATE_ID, ITERATION_ID, PRIORITY_BUCKET_ID)
-- VALUES (1500, 100, 'cgillespie', '2023-08-23', null, null, 1, 'test ticket', 'some test values', 200, 200, 300);
--
-- insert into TICKET (ID, TICKET_TYPE_ID, CREATED_BY, CREATED, MODIFIED_BY, MODIFIED, VERSION, TITLE, DESCRIPTION, STATE_ID, ITERATION_ID, PRIORITY_BUCKET_ID)
-- VALUES (1600, 100, 'cgillespie', '2023-08-23', null, null, 1, 'test ticket', 'some test values', 200, 200, 300);
--
-- insert into TICKET (ID, TICKET_TYPE_ID, CREATED_BY, CREATED, MODIFIED_BY, MODIFIED, VERSION, TITLE, DESCRIPTION, STATE_ID, ITERATION_ID, PRIORITY_BUCKET_ID)
-- VALUES (1700, 100, 'cgillespie', '2023-08-23', null, null, 1, 'test ticket', 'some test values', 200, 200, 300);
--
-- insert into TICKET (ID, TICKET_TYPE_ID, CREATED_BY, CREATED, MODIFIED_BY, MODIFIED, VERSION, TITLE, DESCRIPTION, STATE_ID, ITERATION_ID, PRIORITY_BUCKET_ID)
-- VALUES (1800, 100, 'cgillespie', '2023-08-23', null, null, 1, 'test ticket', 'some test values', 200, 200, 300);
--
-- insert into TICKET (ID, TICKET_TYPE_ID, CREATED_BY, CREATED, MODIFIED_BY, MODIFIED, VERSION, TITLE, DESCRIPTION, STATE_ID, ITERATION_ID, PRIORITY_BUCKET_ID)
-- VALUES (1900, 100, 'cgillespie', '2023-08-23', null, null, 1, 'test ticket', 'some test values', 200, 200, 300);

insert into COMMENT(ID,  CREATED, CREATED_BY, VERSION, TICKET_ID, TEXT)
VALUES (100, '2023-08-23', 'cgillespie', 1, 100, '@sjose bloody love ya work mate, keep it up');

insert into COMMENT(ID,  CREATED, CREATED_BY, VERSION, TICKET_ID, TEXT)
VALUES (200, '2023-08-23', 'cgillespie', 1, 100, '@cgillespie bloody love ya work mate, keep it up');

insert into LABELS( LABEL_ID, TICKET_ID )
VALUES ( 100, 100);

insert into LABELS( LABEL_ID, TICKET_ID )
VALUES ( 200, 100);


