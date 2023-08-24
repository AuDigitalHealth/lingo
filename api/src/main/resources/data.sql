insert into TICKET_TYPE(ID,  CREATED, CREATED_BY, VERSION, MODIFIED_BY, MODIFIED, NAME, DESCRIPTION)
VALUES (1, '2023-08-23', 'cgillespie', 1, null, null, 'September Release', 'A label to sort by the september release');

insert into TICKET (ID, TICKET_TYPE_ID, CREATED_BY, CREATED, MODIFIED_BY, MODIFIED, VERSION, TITLE, DESCRIPTION)
VALUES (1, 1, 'cgillespie', '2023-08-23', null, null, 1, 'test ticket', 'some test values');

insert into TICKET (ID, TICKET_TYPE_ID, CREATED_BY, CREATED, MODIFIED_BY, MODIFIED, VERSION, TITLE, DESCRIPTION)
VALUES (2, 1, 'cgillespie', '2023-08-23', null, null, 1, 'test ticket', 'some test values');

insert into COMMENT(ID,  CREATED, CREATED_BY, VERSION, TICKET_ID, TEXT)
VALUES (1, '2023-08-23', 'cgillespie', 1, 1, '@sjose bloody love ya work mate, keep it up');

insert into COMMENT(ID,  CREATED, CREATED_BY, VERSION, TICKET_ID, TEXT)
VALUES (2, '2023-08-23', 'cgillespie', 1, 1, '@cgillespie bloody love ya work mate, keep it up');

insert into ADDITIONAL_FIELD_TYPE(ID,  DESCRIPTION, NAME)
VALUES (1, 'An additional field that holds the task data', 'task_data');

insert into ADDITIONAL_FIELD(ID,  CREATED, CREATED_BY, VERSION, TICKET_ID, ADDITIONAL_FIELD_TYPE_ID, VALUE_OF)
VALUES (1, '2023-08-23', 'cgillespie', 1, 1, 1, '@cgillespie bloody love ya work mate, keep it up');

insert into LABEL(ID,  CREATED, CREATED_BY, VERSION, MODIFIED_BY, MODIFIED, NAME, DESCRIPTION )
VALUES (1, '2023-08-23', 'cgillespie', 1, null, null, 'September Release', 'A label to sort by the september release');

