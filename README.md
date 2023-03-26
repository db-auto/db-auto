# db-auto
Automation of database scripts: turning results to jq to simply scripting for support and diagnostics

## Current state:

We have a command line tool `db-auto` that 'knows' a little about the database structure. This knowledge is
in a file called `db-auto.json`. This file is in the current directory or a parent.

The tool just does simple queries that joins tables together. It is intended for support people that need to walk tables.
Often these people often have a notepad full of  common queries that they copy and paste into the database tool. This
tool is intended to subliment that, and make it easy to do the same thing from the command line.

```shell
db-auto ?                                            lists the tables
db-auto d?                                           lists the tables that start with d
db-auto driver 123                                   lists the driver with id 123
db-auto driver --name phil                           lists the driver with name phil    
db-auto driver.audit 123                             lists the audit records for driver 123 (the records for driver are joined to the audit records) 
db-auto driver.mission.audit 123                     lists the audit records for the missions that driver 123 has been on
db-auto driver.mission.audit 123 -date '2023-6-3'    lists the audit records for the missions that driver 123 has been on for the given date
                          
```

The sql queries are derived from a knowledge of the database that is in the `db-auto.json` file. Currently,
this has to be populated manually, but I expect to auto generate it from the database schema.

# Features

## -s or --sql
Show the sql instead of executing it

## -t or --trace
Execute the command one step at a time, showing the sql and the results
```shell
db-auto driver.mission.audit 123 -ts
```

## -w or --where
Add a where clause to the query. Typically you would do a `-s` first to find the alias name
```shell
db-auto driver.mission.audit  -w 'audit.id = 123'
db-auto driver -w 'T0.name = "phil"'             # Note the need for the quotes. This is because the shell is parsing the command line
```

# Environments

Typicaly, we have multiple environments. The tool can be configured to use different databases for different environments:
this is in the `db-auto.json` file. The default environment is `dev` (and in current state that's the only one usable)

The environment gives the database type and the connection details

## Secrets

The username and password don't need to be specified if they are in environment variables:

* DB_AUTO_<env>_USERNAME provides the username. For example `export DB_AUTO_DEV_USERNAME=phil`
* DB_AUTO_<env>_PASSWORD provides the password. For example `export DB_AUTO_DEV_PASSWORD=phil`



