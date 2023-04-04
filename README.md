# dbpath

Approaches like JPath and XPath are great for navigating JSON and XML documents. It is quite hard to navigate a database though.
Sql is powerful but very verbose. DBPath is a way of navigating a database using a path notation. Currently it is primarily
focused on  executing sql scripts from the command line, and get the results in a format that is easy to use
in a script (json for jq or columns for linux commands like awk).

Because dbpath understands the database structure it can often work out how to join tables together without you telling it how.
If there is only one foreign key between the two tables you mention, then you don't need to tell it what the join is. 
Because the queries are quite simple, they are easy to read and understand.

* [Documentation](https://github.com/db-path/dbpath/blob/main/code/modules/dbpath/README.md)
* [Github repo](https://github.com/db-path/dbpath)
* [Npm package](https://www.npmjs.com/package/dbpath)


We don't execute `select * from table where ...` etc because that is not very useful from the command line. It is very verbose, hard to remember and easy to make mistakes with 
Instead we give a list of tables and the tool joins them together to give the results we want. 

```shell
dbpath ?                                            # lists the tables
dbpath d?                                           # lists the tables that start with d
dbpath driver.a?                                    # lists the tables that the table driver and link to which start with a  
dbpath driver 123                                   # lists the driver with id 123
dbpath driver -w name='phil'                        # lists the driver with name phil    
dbpath driver.audit 123                             # lists the audit records for driver 123 (the records for driver are joined to the audit records) 
dbpath driver.mission.audit 123                     # lists the audit records for the missions that driver 123 has been on
dbpath driver.mission.audit 123 -w data='2023-6-3'  # lists the audit records for the missions that driver 123 has been on for the given date
```

# TODO

## Done
* Make sure schema you specify in environment is the one you get 
* Auto-detect the database details and populate the config - done for oracle and postgres

## Done needing more testing
* manually saying which fields we want (views or fields) 

## Powerful capability/important hygiene
* Finish Oracle -- needs limits
* environment lists - be able to run the same command in multiple environments... e.g. dev, test, prod
  * And how do we show the results with table/json?
* Start using ? notation and stored procedures so that we can avoid sql injection
* Improve the wheres so that you don't need to quote the values -- this is actually the same as the sql injection problem
* `dbpath validate` Validate the config/summaries
* History of the commands run and their result.
* Unions

# Schemas
* foreign keys and schemas... if we do `s0:table1.s1:table2` without an xx we needs to sort out schemas properly
   * Need to update metadata scraping, and the validate code.


## To make it easier to use:
* Add wheres to the joins directly so that they can be part of the query 
* What is our dbpath for linking to a different schema? Can't use '.' Needs to be script friendly. #?
* Change () to {} for the join notation because it is more script friendly (avoids need for ")
* Make it so that you can change things like 'audit' based on the previous file.
* Let tables have 'short form wheres' in the join. For example 'active' should mean 'alias.actif = 1'. This adds enormously to human readability and documents the structure nicely
* Allow short form name for the wheres
* views so that we can restrict the columns visible  simply
* Make it so that all tables can have an audit becased on the previous file name. (e.g. drivertable_aud, mission_aud) because our tables work like that
* Composite keys (left because they are harder and we wanted to experiment with the simpler case to see if the approach works..and we have a workaround)
* Allow join notation (e.g. join ... on ... instead of select). 


## To do more
* Mysql/sqllite support oracle and postgres done
* Scripting: making it easy to run scripts that are dbpath commands for people in support environemnts
* Secrets in a 'secrets file' that is not checked in as well as environment variables because it's just easier (although not better)
* Work out how to do a left join `dbpath driver+mission+audit 123` use + instead of . ?
* nice documentation
* video

# Error handling still to do
What if types aren't right? 

```shell
dbpath driver someThingNotANumber
# db-auto driver someThingNotANumber
# (node:15960) UnhandledPromiseRejectionWarning: error: column "somethingnotanumber" does not exist
```

# Things to contemplate
If the same field is in multiple tables we just see the 'latest' value. Do we care for this? If we do care how do we let people tweak it

## Scripting

An example script is 'find me the email sent because the driver had an issue on this date...'
This walks to the audits, and if there was an audit action of 'email' then it will show the email that was sent.

We should be able to make this quickly from 'the last executed command'.


```shell
dbpath driver.mission.detailed.audit.email --where 'T3.action="/email"' --view email -w phil
```
This script is a bit long, so why not have a shortcut for it? We can have a short and a long description as well.

```shell
dbpath .emailForMissingVehicles  --name phil --date today()
```



## Full definition


driver[f1,#,#view].(id=id)tablename
driver[f1,#,#view].mission!fk_driver_mission

