# db-auto
Automation of database scripts: turning results to jq to simply scripting for support and diagnostics

## Current state:

We have a command line tool `db-auto` that 'knows' a little about the database structure. This knowledge is
in a file called `db-auto.json`. This file is in the current directory or a parent.

The tool just does simple queries that joins tables together. It is intended for support people that need to walk tables.
Often these people often have a notepad full of  common queries that they copy and paste into the database tool. This
tool is intended to subliment that, and make it easy to do the same thing from the command line.

```shell
db-auto ?                                            # lists the tables
db-auto d?                                           # lists the tables that start with d
db-auto driver 123                                   # lists the driver with id 123
db-auto driver --name phil                           # lists the driver with name phil    
db-auto driver.audit 123                             # lists the audit records for driver 123 (the records for driver are joined to the audit records) 
db-auto driver.mission.audit 123                     # lists the audit records for the missions that driver 123 has been on
db-auto driver.mission.audit 123 -date '2023-6-3'    # lists the audit records for the missions that driver 123 has been on for the given date
                         
```

The sql queries are derived from a knowledge of the database that is in the `db-auto.json` file. Currently,
this has to be populated manually, but I expect to auto generate it from the database schema.

# Features

## -s or --sql or --fullSql
Show the sql instead of executing it. FullSql includes the paging sql (which can be 'noisy')
```shell
 db-auto driver 123 -s            
# select T0.*
#    from DriverTable T0 where T0.driverId=123

db-auto driver 123 --fullSql
# select T0.*
#    from DriverTable T0 where T0.driverId=123
# LIMIT 15 OFFSET 0

```

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

## -c or --count
Show the count of the results instead of the results
```shell
db-auto driver --count   
# count
# 2

db-auto driver --count --notitles
# 2

```

## --distinct
Show the distinct values of the results

## --notitles
Don't show the titles on results. This can help a lot when making scripts that use the output

```shell
db-auto driver --notitles
# 1 phil
# 2 joe
```

## --json
Show the results as json. This is useful for piping to jq

```shell
 db-auto driver --json
# [
#   {
#     "driverid": 1,
#     "name": "phil"
#   },
#   {
#     "driverid": 2,
#     "name": "joe"
#   }
# ]

```

##--onelinejson

```shell
 db-auto driver --onelinejson

# {"driverid":1,"name":"phil"}
# {"driverid":2,"name":"joe"}
```


# Environments

Typically, we have multiple environments. The tool can be configured to use different databases for different environments:
this is in the `db-auto.json` file. The default environment is `dev` (and in current state that's the only one usable)

The environment gives the database type and the connection details

```shell
db-auto envs
# Environment Type     Host      Port Database UserName
# dev         postgres localhost 5432 postgres phil
# test        postgres localhost 5432 postgres phil

```


## Secrets

The username and password don't need to be specified if they are in environment variables:

* DB_AUTO_<env>_USERNAME provides the username. For example `export DB_AUTO_DEV_USERNAME=phil`
* DB_AUTO_<env>_PASSWORD provides the password. For example `export DB_AUTO_DEV_PASSWORD=phil`



