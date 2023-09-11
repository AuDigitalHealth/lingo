import { useEffect, useRef, useState } from 'react'
import './App.css'
import axios from 'axios'
import { Alert, Avatar, Chip, Divider, List, ListItem, ListItemAvatar, ListItemText, Typography } from '@mui/material'
import React from 'react';

interface CustomField {
    self: string;
    disabled: boolean;
    id: string;
    value: string;
}

interface IssueType {
    self: string;
    avatarId: number;
    description: string;
    iconUrl: string;
    id: string;
    name: string;
    subtask: boolean;
}

interface StatusCategory {
    self: string;
    id: number;
    key: string;
    name: string;
    colorName: string;
}

interface Status {
    self: string;
    id: string;
    description: string;
    iconUrl: string;
    name: string;
    statusCategory: StatusCategory;
}

interface Priority {
    id: string;
    self: string;
    name: string;
    iconUrl: string;
}

interface SubTaskField {
    summary: string;
    status: Status;
    priority: Priority;
    issuetype: IssueType;
}

interface SubTask {
    id: string;
    key: string;
    self: string;
    fields: SubTaskField;
}

interface AvatarUrls {
    '48x48': string;
    '24x24': string;
    '16x16': string;
    '32x32': string;
}

interface Author {
    self: string;
    name: string;
    key: string;
    emailAddress: string;
    avatarUrls: AvatarUrls;
    displayName: string;
    active: boolean;
    timeZone: string;
}

interface CommentField {
    self: string;
    id: string;
    author: Author;
    body: string;
    updateAuthor: Author;
    created: string;
    updated: string;
}

interface Comment {
    comments: CommentField[];
    maxResults: number;
    startAt: number;
    total: number;
}

interface AmtJiraFields {
    attachments: string[];
    customfield_10700: string;          // ARTGID
    customfield_11009: string;          // Date requested
    customfield_11900: CustomField[];   // Schedule
    customfield_11901: CustomField[];   // AMT Flags
    customfield_12000: string;          // ARTG Start date
    customfield_12002: string;          // Inactive Date
    customfield_12200: string;          // Effective Date
    customfield_12301: CustomField[];   // Is external request
    customfield_12300: string[];        // External requester or Black Triangle
    description: string;
    issuetype: IssueType;
    labels: string[];
    status: Status;
    subtasks: SubTask[];
    summary: string;
    comment: Comment;
}

interface AmtJiraTicket {
    expand: string;
    fields: AmtJiraFields;
    id: string;
    key: string;
    self: string;
}

interface AmtJiraTickets {
    expand: string;
    issues: AmtJiraTicket[];
    maxResults: number;
    startAt: number;
    total: number;
}

function App() {
  const [count, setCount] = useState(0);
  const [error, setError] = useState('');
  const [tickets, setTickets] = useState<AmtJiraTicket[]>([]);
  const initialised = useRef(false)

  useEffect(() => {
    if(!initialised.current) {
        setTicketCount();
    }
  },[])

  const setTicketCount = async () => {
    axios.get<AmtJiraTickets>(
        '/rest/api/2/search?jql=project%3D%20AA%20AND%20issuetype%20not%20in%20(subTaskIssueTypes())'
        + '&fields=attachment,summary,issuetype,comment,customfield_11900,description,customfield_10700,status,labels,customfield_11901,customfield_12301,customfield_11009,customfield_12200,customfield_12002,customfield_12000,customfield_12300,subtasks'
        + '&maxResults=10'
    ).then(response => {
        setCount(response.data.total);
        setTickets(response.data.issues);
        setError('');
    }).catch(error => {
        setCount(0)
        setError(error.message);
    })
  }

  return (
    <>
      <div>
        { count > 0 ?
            <>
                <Alert variant="filled" severity='info' sx={{ color: 'black' }} >Connected to Jira. Ticket count is {count}</Alert>
                <Divider sx={{ padding: '20px 0 20px 0', '&::before, &::after': {borderColor: 'secondary.light',} }} >
                    <Chip label="Sample tickets" sx={{ bgcolor: 'gray' }} />
                </Divider>
                <List sx={{ bgcolor: 'blue' }}>
                    {tickets.map((ticket) => (
                        <React.Fragment key={ticket.id}>
                            <ListItem alignItems="flex-start">
                                <ListItemAvatar>
                                    <Avatar alt="Remy Sharp" src={ticket.fields.issuetype.iconUrl} />
                                </ListItemAvatar>
                                <ListItemText
                                    primary={ticket.key}
                                    secondary={<React.Fragment>
                                        <Typography
                                            sx={{ display: 'inline' }}
                                            component="span"
                                            variant="body2"
                                            color="text.primary">
                                            {ticket.fields.summary}
                                        </Typography>
                                        {ticket.fields.description}
                                    </React.Fragment>} />
                            </ListItem>
                            <Divider sx={{ paddingBottom: 0, '&::before, &::after': {borderColor: 'primary.light',} }} >-</Divider>
                        </React.Fragment>
                    ))}
                </List></>
            :
            <>
                <button type='submit' onClick={()=>{
                    setTicketCount();
                }}>
                    Log in to Jira
                </button>
            </>
      }
      </div>
      { error != '' ? (<Alert severity='error'>{`Jira Error: ${ error }`}</Alert>) : ''}
    </>
  )
}

export default App
