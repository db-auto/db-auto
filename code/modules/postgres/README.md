Postgres database abstraction layer for db-auto

Useful links
https://www.postgresql.org/docs/current/information-schema.html


# Tables:
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';


# Columns
https://www.postgresql.org/docs/current/infoschema-columns.html
SELECT *
FROM information_schema.columns
WHERE table_schema = 'your_schema'
AND table_name   = 'your_table' ;

Good columns: 
column_name
data_type  