Oracle Database Abstraction Layer for dbpath

# LimitFn
In order to do simple pagings in versions of Oracle before 12 it was ... _incredibly_ ... painful to implement 
paging. Effectively impossible to do automatically for any reasonably complex select statement

Thus we have a 'bodge' in place for these older versions:
* We add the rownum to each column
* We limit to rownum < the max we want (with a specific fieldname)
* We throw away the rows we don't want
* We remove the rownum filed name

It is especially 'hacky' how we sort out the 'throw away the rows we don't want. We include that in comments 
in the select statement

For later versions (still to be implemented) we will just use `limit`







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