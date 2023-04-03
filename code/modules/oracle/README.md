Oracle Database Abstraction Layer for dbpath






```sql


create user phil;

alter user phil
    default tablespace users
    temporary tablespace temp
    quota unlimited on users;

grant create session,
    create view,
    create sequence,
    create procedure,
    create table,
    create trigger,
    create type,
    create materialized view
    to phil;
        
ALTER USER phil IDENTIFIED BY phil;
```