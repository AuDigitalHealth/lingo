#!/bin/bash

# $1 - PEM file location
# $2 - SSH User

rsync -avz -e "ssh -i $1" --rsync-path='sudo rsync' $2@jira.aws.tooling:/home/jira/jira-home/data/attachments/AA/ /opt/jira-export/attachments/