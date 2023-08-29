insert into TICKET_TYPE(ID,  CREATED, CREATED_BY, VERSION, MODIFIED_BY, MODIFIED, NAME, DESCRIPTION)
VALUES (100, '2023-08-23', 'cgillespie', 1, null, null, 'Tga', 'A ticket created by a tga release');

insert into TICKET (ID, TICKET_TYPE_ID, CREATED_BY, CREATED, MODIFIED_BY, MODIFIED, VERSION, TITLE, DESCRIPTION)
VALUES (100, 100, 'cgillespie', '2023-08-23', null, null, 1, 'test ticket', 'some test values');

insert into TICKET (ID, TICKET_TYPE_ID, CREATED_BY, CREATED, MODIFIED_BY, MODIFIED, VERSION, TITLE, DESCRIPTION)
VALUES (200, 100, 'cgillespie', '2023-08-23', null, null, 1, 'test ticket', 'some test values');

insert into COMMENT(ID,  CREATED, CREATED_BY, VERSION, TICKET_ID, TEXT)
VALUES (100, '2023-08-23', 'cgillespie', 1, 100, '@sjose bloody love ya work mate, keep it up');

insert into COMMENT(ID,  CREATED, CREATED_BY, VERSION, TICKET_ID, TEXT)
VALUES (200, '2023-08-23', 'cgillespie', 1, 100, '@cgillespie bloody love ya work mate, keep it up');

insert into ADDITIONAL_FIELD_TYPE(ID,  DESCRIPTION, NAME)
VALUES (100, 'An additional field that holds the task data', 'task_data');

insert into ADDITIONAL_FIELD(ID,  CREATED, CREATED_BY, VERSION, TICKET_ID, ADDITIONAL_FIELD_TYPE_ID, VALUE_OF)
VALUES (100, '2023-08-23', 'cgillespie', 1, 100, 100, '@cgillespie bloody love ya work mate, keep it up');

insert into LABEL_TYPE(ID,  CREATED, CREATED_BY, VERSION, MODIFIED_BY, MODIFIED, NAME, DESCRIPTION )
VALUES (100, '2023-08-23', 'cgillespie', 1, null, null, 'September Release', 'A label to sort by the september release');

insert into LABEL(ID,  CREATED, CREATED_BY, VERSION, MODIFIED_BY, MODIFIED, LABEL_TYPE_ID, TICKET_ID )
VALUES (100, '2023-08-23', 'cgillespie', 1, null, null, 100, 100);

