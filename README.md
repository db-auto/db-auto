# db-auto
Automation of database scripts: turning results to jq to simply scripting for support and diagnostics

* [Documentation](https://github.com/db-auto/db-auto/blob/main/code/modules/db-auto/README.md)
* [Github repo](https://github.com/db-auto/db-auto)
* [Npm package](https://www.npmjs.com/package/db-auto)

This allows us to execute sql scripts from the command line, and get the results in a format that is easy to use 
in a script.

We don't execute `select * from table where ...` etc because that is not very useful from the command line. It is very verbose, hard to remember and easy to make mistakes with 
Instead we give a list of tables and the tool joins them together to give the results we want. 

```shell
db-auto ?                                            # lists the tables
db-auto d?                                           # lists the tables that start with d
db-auto driver.a?                                    # lists the tables that the table driver and link to which start with a  
db-auto driver 123                                   # lists the driver with id 123
db-auto driver --name phil                           # lists the driver with name phil    
db-auto driver.audit 123                             # lists the audit records for driver 123 (the records for driver are joined to the audit records) 
db-auto driver.mission.audit 123                     # lists the audit records for the missions that driver 123 has been on
db-auto driver.mission.audit 123 -date '2023-6-3'    # lists the audit records for the missions that driver 123 has been on for the given date
```

# TODO


* Start using ? notation and stored procedures so that we can avoid sql injection
* Allow join notation. 
* Work out how to do a left join `db-auto driver+mission+audit 123` use + instead of . ?
* `db-auto status` which checks each of the environments in the db-auto.json file
* `db-auto validate` Validate the db-auto.json file
* views so that we can restrict the columns visible 
* Auto-detect the database details and populate db-auto.json
* manually saying which fields we want (views or fields)
* Oracle/Mysql/sqllite support
* History of the commands run
* Scripting 
* Secrets in a 'secrets file' that is not checked in as well as environment variables because it's just easier (although not better)

# Error handling still to do
What if types aren't right? 
```shell
db-auto driver someThingNotANumber
db-auto driver 123 -date 123
```


# Things to contemplate
If the same field is in multiple tables we just see the 'latest' value. Do we care for this? If we do care how do we let people tweak it

## Scripting

An example script is 'find me the email sent because the driver had an issue on this date...'
This walks to the audits, and if there was an audit action of 'email' then it will show the email that was sent.

We should be able to make this quickly from 'the last executed command'.


```shell
db-audit driver.mission.detailed.audit.email --where 'T3.action="/email"' --view email --name phil
```
This script is a bit long, so why not have a shortcut for it? We can have a short and a long description as well.

```shell
db-audit .emailForMissingVehicles  --name phil --date today()
```



