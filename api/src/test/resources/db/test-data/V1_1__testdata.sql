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

insert into LABEL_TYPE(ID,  CREATED, CREATED_BY, VERSION, MODIFIED_BY, MODIFIED, NAME, DESCRIPTION )
VALUES (100, '2023-08-23', 'cgillespie', 1, null, null, 'September Release', 'A label to sort by the september release');

-- Tickets come last, as they require some setup

insert into TICKET (ID, TICKET_TYPE_ID, CREATED_BY, CREATED, MODIFIED_BY, MODIFIED, VERSION, TITLE, DESCRIPTION, STATE_ID)
VALUES (100, 100, 'cgillespie', '2023-08-23', null, null, 1, 'test ticket', 'some test values', 100);

insert into TICKET (ID, TICKET_TYPE_ID, CREATED_BY, CREATED, MODIFIED_BY, MODIFIED, VERSION, TITLE, DESCRIPTION, STATE_ID)
VALUES (200, 100, 'cgillespie', '2023-08-23', null, null, 1, 'test ticket', 'some test values', 200);

insert into COMMENT(ID,  CREATED, CREATED_BY, VERSION, TICKET_ID, TEXT)
VALUES (100, '2023-08-23', 'cgillespie', 1, 100, '@sjose bloody love ya work mate, keep it up');

insert into COMMENT(ID,  CREATED, CREATED_BY, VERSION, TICKET_ID, TEXT)
VALUES (200, '2023-08-23', 'cgillespie', 1, 100, '@cgillespie bloody love ya work mate, keep it up');

insert into ADDITIONAL_FIELD(ID,  CREATED, CREATED_BY, VERSION, TICKET_ID, ADDITIONAL_FIELD_TYPE_ID, VALUE_OF)
VALUES (100, '2023-08-23', 'cgillespie', 1, 100, 100, '@cgillespie bloody love ya work mate, keep it up');

insert into LABEL(ID,  CREATED, CREATED_BY, VERSION, MODIFIED_BY, MODIFIED, LABEL_TYPE_ID, TICKET_ID )
VALUES (69, '2023-08-23', 'cgillespie', 1, null, null, 100, 100);

