import { Alert, Box, Button, Chip, Divider, LinearProgress, TextField} from "@mui/material";
import { useState } from "react";
import './ExportTickets.css'
import { AmtJiraTicket, AmtJiraTickets, TicketDto } from "../ticket-types";
import axios from "axios";

type Props = {
    total: number;
}

function ExportTickets(props: Props) {
    const [directoryName, setDirectoryName] = useState('/tmp');
    const [total, setTotal] = useState(props.total);
    const [currentTicketNumber, setCurrentTicketNumber] = useState(0);
    const [currentTickets, setCurrentTickets] =  useState<AmtJiraTicket[]>([]);
    const [currentPage, setCurrentPage] = useState(0);
    const [error, setError] = useState('');
    const pageSize = 1000;

    async function getTickets(current: number, size: number) {
        await axios.get<AmtJiraTickets>(
            '/rest/api/2/search?jql=project%3D%20AA%20AND%20issuetype%20not%20in%20(subTaskIssueTypes())'
            + '&fields=attachment,summary,issuetype,comment,customfield_11900,description,customfield_10700,status,labels,customfield_11901,customfield_12301,customfield_11009,customfield_12200,customfield_12002,customfield_12000,customfield_12300,subtasks,assignee'
            + '&startAt='+current
            + '&maxResults='+size
        ).then(response => {
            setError('');
            if (response.data.total != total) {
                setError("Aborting Export! New ticket(s) have been added to Jira since the export started.");
                setCurrentTicketNumber(0);
                setTotal(total);
                setCurrentTickets(response.data.issues);
            }
        }).catch(error => {
            setCurrentTicketNumber(0);
            setError(error.message);
        })  
    }

    async function doImport() {
        for (let i = 0; i < total; i += pageSize) {
            setCurrentPage(i + pageSize);
            //await getTickets(i, pageSize);
            for (let j = 0; j < pageSize; j++) {                
                setCurrentTicketNumber( i + j );
                const ticketToSave = {} as TicketDto;
                ticketToSave.assignee = currentTickets[j].fields.assignee.name;
                ticketToSave.description = currentTickets[j].fields.summary;
                ticketToSave.state.label = currentTickets[j].fields.status.name;
                ticketToSave.state.description = currentTickets[j].fields.status.description;
                ticketToSave.title = currentTickets[j].fields.description;
                ticketToSave.ticketType = currentTickets[j].fields.issuetype.name;
                for (let k = 0; k < currentTickets[j].fields.customfield_11900.length; k++) {
                    ticketToSave["ticket-additional-field"].push({
                        name: "Schedule",
                        description: "TGA Schedule",
                        value: currentTickets[j].fields.customfield_11900[k].value
                    });
                }
                ticketToSave["ticket-additional-field"].push({
                    name: "ARTGID",
                    description: "ARTG ID",
                    value: currentTickets[j].fields.customfield_10700
                });
                for (let k = 0; k < currentTickets[j].fields.customfield_12300.length; k++) {
                    let desc = "External Requester";
                    if (currentTickets[j].fields.customfield_12300[k].toLocaleLowerCase() === 'blacktriangle') {
                        desc = "Blacktriangle";
                    }
                    ticketToSave["ticket-labels"].push({
                        name: currentTickets[j].fields.customfield_12300[k],
                        description: desc,
                        displayColor: desc === "Blacktriangle" ? "black" : "blue"
                    });
                }
                for (let k = 0; k < currentTickets[j].fields.customfield_12301.length; k++) {
                    ticketToSave["ticket-labels"].push({
                        name: currentTickets[j].fields.customfield_12301[k].value,
                        description: "External Request",
                        displayColor: "blue"
                    });
                }
                await new Promise(resolve => setTimeout(resolve, 1));
            }
        }
        setCurrentTicketNumber(0);
        setCurrentPage(0);
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

        <Button variant="contained" component="label" onClick={() => doImport()}>
        Export Jira Tickets
        </Button>
        <Divider sx={{ padding: '20px 0 20px 0', '&::before, &::after': {borderColor: 'secondary.light',} }} />
        { currentTicketNumber > 0 ?
            <>
            <Box sx={{ margin: '20px 0 20px 0', width: '100%' }}>
                <LinearProgress 
                    variant="buffer"
                    sx={{
                        "& .MuiLinearProgress-dashed": {
                        left: '0px'
                        }
                        }}
                    value={(currentTicketNumber / total) * 100}
                    valueBuffer={(currentPage / total) * 100} />
            </Box>
            <Chip sx={{ backgroundColor: '#cacaca', marginLeft: '10px' }} label={`${currentTicketNumber} / ${total}`} />
            </>
        :
            <Box/>
        }
    </>)
    }

export default ExportTickets;