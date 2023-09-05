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

insert into ADDITIONAL_FIELD_TYPE(ID,  DESCRIPTION, NAME)
VALUES (100, 'An additional field that holds the task data', 'task_data');

insert into LABEL_TYPE(ID,  CREATED, CREATED_BY, VERSION, MODIFIED_BY, MODIFIED, NAME, DESCRIPTION, DISPLAY_COLOR )
VALUES (100, '2023-08-23', 'cgillespie', 1, null, null, 'S8', 'Schedule 8 drugs (urgent)', 'error');

insert into LABEL_TYPE(ID,  CREATED, CREATED_BY, VERSION, MODIFIED_BY, MODIFIED, NAME, DESCRIPTION, DISPLAY_COLOR )
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

insert into TICKET (ID, TICKET_TYPE_ID, CREATED_BY, CREATED, MODIFIED_BY, MODIFIED, VERSION, TITLE, DESCRIPTION, STATE_ID, ITERATION_ID, PRIORITY_BUCKET_ID)
VALUES (200, 100, 'cgillespie', '2023-08-23', null, null, 1, 'test ticket', 'some test values', 200, 200, 300);

insert into COMMENT(ID,  CREATED, CREATED_BY, VERSION, TICKET_ID, TEXT)
VALUES (100, '2023-08-23', 'cgillespie', 1, 100, '@sjose bloody love ya work mate, keep it up');

insert into COMMENT(ID,  CREATED, CREATED_BY, VERSION, TICKET_ID, TEXT)
VALUES (200, '2023-08-23', 'cgillespie', 1, 100, '@cgillespie bloody love ya work mate, keep it up');

insert into ADDITIONAL_FIELD(ID,  CREATED, CREATED_BY, VERSION, TICKET_ID, ADDITIONAL_FIELD_TYPE_ID, VALUE_OF)
VALUES (100, '2023-08-23', 'cgillespie', 1, 100, 100, '@cgillespie bloody love ya work mate, keep it up');

insert into LABELS( LABEL_TYPE_ID, TICKET_ID )
VALUES ( 100, 100);

insert into LABELS( LABEL_TYPE_ID, TICKET_ID )
VALUES ( 200, 100);



-- insert into LABEL(ID,  CREATED, CREATED_BY, VERSION, MODIFIED_BY, MODIFIED, LABEL_TYPE_ID, TICKET_ID )
-- VALUES (420, '2023-08-23', 'cgillespie', 1, null, null, 200, 100);

