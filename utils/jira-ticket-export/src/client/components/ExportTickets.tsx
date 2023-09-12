import { Alert, Box, Button, Chip, CircularProgress, Divider, LinearProgress, TextField} from "@mui/material";
import { useState } from "react";
import './ExportTickets.css'
import { AdditionalField, AmtJiraTicket, AmtJiraTickets, Attachment, Labels, TicketDto, Comment } from "../ticket-types";
import axios, { AxiosError } from "axios";
import pako from 'pako'

type Props = {
    total: number;
}

function ExportTickets(props: Props) {
    const [directoryName, setDirectoryName] = useState('/tmp');
    const [total, setTotal] = useState(props.total);
    const [currentTicket, setCurrentTicket] = useState(0);
    const [error, setError] = useState('');
    const [isWorking, setIsWorking] = useState(false);
    const pageSize = 1000;

    async function writeTickets(filepath: string, jsontosave: string) {
        const dataToSend = {
            filepath: filepath,
            jsontosave: jsontosave,
        }
        const compressedData = pako.gzip(JSON.stringify(dataToSend));
        axios.post(
            'api/savejson',
            compressedData, {
                headers: {
                    'Content-Type': 'application/json', // Set the content type
                    'Content-Encoding': 'gzip', // Indicate gzip encoding
                },
            }
        ).then((response) => {
            console.log(response.data);
        }).catch((err) => {
            const error = err as AxiosError;
            setError(error.message);
            throw err;
        });
    }


    async function getTickets(current: number, size: number): Promise<AmtJiraTicket[]> {
        try {
            const jiraResponse = await axios.get<AmtJiraTickets>(
                '/rest/api/2/search?jql=project%3D%20AA%20AND%20issuetype%20not%20in%20(subTaskIssueTypes())'
                + '&fields=attachment,summary,issuetype,comment,customfield_11900,description,customfield_10700,status,labels,customfield_11901,customfield_12301,customfield_11009,customfield_12200,customfield_12002,customfield_12000,customfield_12300,subtasks,assignee'
                + '&startAt='+current
                + '&maxResults='+size);
            setError('');
            if (jiraResponse.data.total != total) {
                setError("Aborting Export! New ticket(s) have been added to Jira since the export started.");
                setCurrentTicket(0);
                setTotal(total);
                return [];
            }
            return jiraResponse.data.issues;
        } catch (err) {
            const error = err as AxiosError;
            setCurrentTicket(0);
            setError(error.message);
            throw err;
        }
        return [];
    }

    async function doExport() {
        const ticketsToSave: TicketDto[] = [];
        setIsWorking(true);
        for (let i = 0; i < 2000; i += pageSize) {
            setCurrentTicket(i);
            // Bring up the progress bar
            const jiraTiickets = await getTickets(i, pageSize);
            for (let j = 0; j < jiraTiickets.length; j++) {                
                const ticketToSave: TicketDto = {
                    assignee: jiraTiickets[j].fields.assignee?.name,
                    description: jiraTiickets[j].fields.summary,
                    state: {
                        label: jiraTiickets[j].fields.status?.name,
                        description: jiraTiickets[j].fields.status?.description
                    },
                    title: jiraTiickets[j].fields.description,
                    ticketType: jiraTiickets[j].fields.issuetype.name,
                    "ticket-additional-field": new Array<AdditionalField>(),
                    "ticket-attachment": new Array<Attachment>(),
                    "ticket-labels": new Array<Labels>(),
                    "ticket-comment": new Array<Comment>()
                };
                for (let k = 0; k < jiraTiickets[j].fields.customfield_11900?.length; k++) {
                    ticketToSave["ticket-additional-field"].push({
                        name: "Schedule",
                        description: "TGA Schedule",
                        value: jiraTiickets[j].fields.customfield_11900[k].value
                    });    
                }
                if (jiraTiickets[j].fields.customfield_10700) {
                    ticketToSave["ticket-additional-field"].push({
                        name: "ARTGID",
                        description: "ARTG ID",
                        value: jiraTiickets[j].fields.customfield_10700
                    });
                }
                for (let k = 0; k < jiraTiickets[j].fields.customfield_12300?.length; k++) {
                    let desc = "External Requester";
                    if (jiraTiickets[j].fields.customfield_12300[k].toLocaleLowerCase() === 'blacktriangle') {
                        desc = "Blacktriangle";
                    }
                    ticketToSave["ticket-labels"].push({
                        name: jiraTiickets[j].fields.customfield_12300[k],
                        description: desc,
                        displayColor: desc === "Blacktriangle" ? "black" : "blue"
                    });    
                }
                for (let k = 0; k < jiraTiickets[j].fields.customfield_12301?.length; k++) {
                    ticketToSave["ticket-labels"] = [{
                        name: jiraTiickets[j].fields.customfield_12301[k].value,
                        description: "External Request",
                        displayColor: "blue"
                    }];    
                }
                if (jiraTiickets[j].fields.customfield_11009) {
                    ticketToSave["ticket-additional-field"].push({
                        name: "DateRequested",
                        description: "Date Requested",
                        value: jiraTiickets[j].fields.customfield_11009
                    });
                }
                if (jiraTiickets[j].fields.customfield_12200) {
                    ticketToSave["ticket-additional-field"].push({
                        name: "EffectiveDate",
                        description: "Effective Date",
                        value: jiraTiickets[j].fields.customfield_12200
                    });
                }
                if (jiraTiickets[j].fields.customfield_12002) {
                    ticketToSave["ticket-additional-field"].push({
                        name: "InactiveDate",
                        description: "Inactive Date",
                        value: jiraTiickets[j].fields.customfield_12002
                    });
                }
                if (jiraTiickets[j].fields.customfield_12000) {
                    ticketToSave["ticket-additional-field"].push({
                        name: "StartDate",
                        description: "ARTG Start Date",
                        value: jiraTiickets[j].fields.customfield_12000
                    });
                }
                for (let k = 0; k < jiraTiickets[j].fields.customfield_11901?.length; k++) {
                    ticketToSave["ticket-additional-field"].push({
                        name: "AMTFlags",
                        description: "AMT Flags",
                        value: jiraTiickets[j].fields.customfield_11901[k].value
                    });
                }
                for (let k = 0; k < jiraTiickets[j].fields.comment?.total; k++) {
                    ticketToSave["ticket-comment"].push({
                        text: jiraTiickets[j].fields.comment.comments[k].body
                    });
                }
                // TODO: Change this to add Subtask Comments too
                for (let k = 0; k < jiraTiickets[j].fields.subtasks?.length; k++) {
                    ticketToSave["ticket-comment"].push({
                        text: jiraTiickets[j].fields.subtasks[k].fields.status.name + " | " 
                        + jiraTiickets[j].fields.subtasks[k].key + " | "
                        + jiraTiickets[j].fields.subtasks[k].fields.summary
                    });
                }
                ticketsToSave.push(ticketToSave);
            }
        }
        writeTickets(directoryName + '/snomio-jira-import.json', JSON.stringify(ticketsToSave));
        setCurrentTicket(0);
        setIsWorking(false);
    }

    return(<>
        { error != '' ? (<Alert variant="filled" severity='error'>{`Jira Error: ${ error }`}</Alert>) : ''}
        <TextField
         variant="filled"
         sx={{width: '100%', backgroundColor: '#fafafa', color: '#ffffff', marginBottom: '10px'}}
         onChange={(event) => {
            setDirectoryName(event.target.value);
         }}
         defaultValue={directoryName}
         label="Export Directory" />

        <Button variant="contained" component="label" onClick={() => doExport()} disabled={isWorking}>
        { isWorking  && 
            <CircularProgress
                size={20}
                sx={{
                    marginRight: '10px',
                    color: 'green',
                    zIndex: 1,
                }}
            />
        }
        Export Jira Tickets
        </Button>
        <Divider sx={{ padding: '20px 0 20px 0', '&::before, &::after': {borderColor: 'secondary.light',} }} />
        { isWorking ?
            <>
            <Box sx={{ margin: '20px 0 20px 0', width: '100%' }}>
                <LinearProgress 
                    variant="determinate"
                    sx={{
                        "& .MuiLinearProgress-dashed": {
                        left: '0px'
                        }
                        }}
                    value={(currentTicket / total) * 100} />
            </Box>
            <Chip sx={{ backgroundColor: '#cacaca', marginLeft: '10px' }} label={`Reading ticket: ${currentTicket} / ${total}`} />
            </>
        :
            <Box/>
        }
    </>)
    }

export default ExportTickets;