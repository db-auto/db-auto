# dbpath

Helps with automation of database scripts. Makes it much easier to query a database using an approach like jpath or
xpath. Can be called from command line/scripts and produces either column data or json for tools like jq.

## Getting started

```shell
npm install -g dbpath
dbpath getting-started     # This gives instructions on how to start using dbpath
```

## Motivation

It is mediumly challenging to execute sql scripts with command line scripts. One reason is that sql is extremely verbose

This project introduces `dbpath` that allows us to specify queries in a more concise way, and these queries
can then be executed from the command line, or a script or a program.

## Current state:

We have a command line tool `dbpath` that 'knows' a little about the database structure. This knowledge is
in a file called `dbpath.json`. This file is in the current directory or a parent.

The tool just does simple queries that joins tables together. It is intended for support people that need to walk
tables. Often these people often have a notepad full of common queries that they copy and paste into the database tool.
This tool is intended to supliment that, and make it easy to do the same thing from the command line.

```shell
dbpath ?                                                # lists the tables
dbpath d?                                               # lists the tables that start with d
dbpath driver 123                                       # lists the driver with id 123
dbpath driver --name phil                               # lists the driver with name phil    
dbpath driver.audit 123                                 # lists the audit records for driver 123 (the records for driver are joined to the audit records) 
dbpath driver.mission.audit 123                         # lists the audit records for the missions that driver 123 has been on
dbpath driver.mission.audit 123 --where date='2023-6-3' # lists the audit records for the missions that driver 123 has been on for the given date
dbpath driver[name]                                     # lists the driver names
dbpath driver[name].mission[id,mission]                 # lists the driver names and the id and mission they are on
```

The sql queries are derived from a knowledge of the database structure. This requires the database to be scraped to get
the structure.
The simplest way to do that is

```shell
dbpath metadata refresh                  # scrapes the current environment
dbpath metadata refresh --env test       # scrapes the 'test' environment
```

The command `dbpath metadata` will list the metadata commands that are available. It is rare that you will need anything
other than `refresh`

## Direct sql

It is possible to call sql straight from the command line. Most of the options can be used for paging or
control of the display (json/titles...), as can the -e for environment

```shell
dbpath sql "select * from drivertable where driverId=123"
dbpath sql select * from drivertable --page 2 --onelinejson               
```

Updates can be done as well but need the `-u` or `--update` option

```shell    
dbpath sql "update drivertable set name='phil' where driverId=1" -u
```

With the sql it is sometimes useful to have a file holding the sql

```shell
dbpath sql -f sqlfile.sql            
```

# Options

## -s or --sql or --fullSql

Show the sql instead of executing it. FullSql includes the paging sql (which can be 'noisy')

```shell
 dbpath driver 123 -s            
# select T0.*
#    from drivertable T0 where T0.driverId=123

dbpath driver 123 --fullSql
# select T0.*
#    from drivertable T0 where T0.driverId=123
# LIMIT 15 OFFSET 0

```

## -t or --trace

Execute the command one step at a time, showing the sql and the results

```shell
dbpath driver.mission.audit 123 -ts
```

## -w or --where

Add a where clause to the query. Typically you would do a `-s` first to find the alias name

```shell
dbpath driver.mission.audit  -w 'audit.id = 123'
dbpath driver -w "T0.name = 'phil'"             # Note the need for the quotes. This is because the shell is parsing the command line
```

## -c or --count

Show the count of the results instead of the results

```shell
dbpath driver --count   
# count
# 2

dbpath driver --count --notitles
# 2

```

## --distinct

Show the distinct values of the results

## --notitles

Don't show the titles on results. This can help a lot when making scripts that use the output

```shell
dbpath driver --notitles
# 1 phil
# 2 joe
```

## --json

Show the results as json. This is useful for piping to jq

```shell
 dbpath driver --json
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
 dbpath driver --onelinejson

# {"driverid":1,"name":"phil"}
# {"driverid":2,"name":"joe"}
```

# Environments

Typically, we have multiple environments. The tool can be configured to use different databases for different
environments:
this is in the `dbpath.json` file. The default environment is `dev` (and in current state that's the only one usable)

The environment gives the database type and the connection details

```shell
dbpath admin envs
# Current environment is dev
# Environment Type     Host      Port Database UserName
# dev         postgres localhost 5432 postgres phil
# test        postgres localhost 5432 postgres phil

```

## Current environment

This defaults to 'dev'.

It can be changed to another legal value by

```shell
dbpath admin env test
```

## Checking the environments are accessible

```shell
dbpath admin status
#Environment Type     Host             Port Database UserName Up
#dev         postgres localhost        5432 postgres phil     true
#test        postgres test.example.com 5432 postgres phil     true

```

## Secrets

The username and password don't need to be specified if they are in environment variables:

* DB_AUTO_<env>_USERNAME provides the username. For example `export DB_AUTO_DEV_USERNAME=phil`
* DB_AUTO_<env>_PASSWORD provides the password. For example `export DB_AUTO_DEV_PASSWORD=phil`

