This allows us to config Environments. i.e. 'dev', 'test', 'prod'. For these we need to say things like 'database type', how to get to the database
and what the credentials are.

This project 'uses' all the dal projects (such as @dbpath/oracle, @dbpath/postgres, @dbpath/mysql) to provide 
a point of access to the database abstraction layer.