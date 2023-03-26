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

