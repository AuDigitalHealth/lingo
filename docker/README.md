# How to run

First you will need the set up in your /etc/hosts file which is setting snomio.ihtsdotools.org for localhost.

Secondly you will need to log into the nctsacr through the docker cli.

Add the attachments to ./files/attachments directory so you will have ./files/attachments/1...n (this is optional, it will run without the attachments but you won't be able to download them if you don't do this)

change the line after the comment in the docker-compose.yaml file to be the name of the image that you want to run

```
sh run.sh
```

If you want to update the postgres image, get the latest snomio-jira-export file and place it in this directory, update it to create user 'snomioapi' and give it full rights to DB 'snomio', build it with the dockerfile and push it to snomio_postgres_db:latest