import axios, { AxiosError } from "axios";
import {  AdditionalField,
          AmtJiraTickets,
          Attachment,
          Labels,
          TicketDto,
          Comment } from "../client/ticket-types";
import fs from "fs";
import * as https from 'https';

const httpsAgent = new https.Agent({ rejectUnauthorized: false });

export interface SaveRequest {
    filepath: string;
    pageSize: number;
}

const JIRA_URL= process.env.JIRA_URL ? process.env.JIRA_URL : "https://jira.aws.tooling";
const JIRA_USERNAME = process.env.JIRA_USERNAME ? process.env.JIRA_USERNAME : '';
const JIRA_PASSWORD = process.env.JIRA_PASSWORD ? process.env.JIRA_PASSWORD : '';

async function getTickets(current: number, size: number): Promise<AmtJiraTickets> {
    try {
        const jiraResponse = await axios.get<AmtJiraTickets>(
            JIRA_URL +
            '/rest/api/2/search?jql=project%3D%20AA%20AND%20issuetype%20not%20in%20(subTaskIssueTypes())'
            + '&fields=attachment,summary,issuetype,comment,customfield_11900,description,customfield_10700,status,labels,customfield_11901,customfield_12301,customfield_11009,customfield_12200,customfield_12002,customfield_12000,customfield_12300,subtasks,assignee'
            + '&startAt=' + current
            + '&maxResults=' + size,
            { auth: {username: JIRA_USERNAME, password: JIRA_PASSWORD}, httpsAgent});
        return jiraResponse.data;
    } catch (err) {
        const error = err as AxiosError;
        console.log(error.message);
    }
    return {} as AmtJiraTickets
}

export async function doExport(props: SaveRequest, updateProgress: (rog: number, currentTicket: number,
                                inProgress: boolean, total: number, error?: string) => void) {
    const ticketsToSave: TicketDto[] = [];
    const pageSize = 1000;
    let noMore = false;
    let i = 0;
    while (!noMore) {
        const jiraTickets = await getTickets(i, pageSize);
        if (!jiraTickets.issues) {
            break;
        }
        for (let j = 0; j < jiraTickets.issues.length; j++) {
            const prog = ((i + j) / jiraTickets.total) * 100;       
            updateProgress(prog, i + j, true, jiraTickets.total);
            const ticketToSave: TicketDto = {
                assignee: jiraTickets.issues[j].fields.assignee?.name,
                description: jiraTickets.issues[j].fields.description,
                state: {
                    label: jiraTickets.issues[j].fields.status?.name,
                    description: jiraTickets.issues[j].fields.status?.description
                },
                title: jiraTickets.issues[j].fields.summary,
                ticketType: jiraTickets.issues[j].fields.issuetype.name,
                "ticket-additional-field": new Array<AdditionalField>(),
                "ticket-attachment": new Array<Attachment>(),
                "ticket-labels": new Array<Labels>(),
                "ticket-comment": new Array<Comment>()
            };
            for (let k = 0; k < jiraTickets.issues[j].fields.customfield_11900?.length; k++) {
                ticketToSave["ticket-additional-field"].push({
                    name: "Schedule",
                    description: "TGA Schedule",
                    value: jiraTickets.issues[j].fields.customfield_11900[k].value
                });
            }
            if (jiraTickets.issues[j].fields.customfield_10700) {
                ticketToSave["ticket-additional-field"].push({
                    name: "ARTGID",
                    description: "ARTG ID",
                    value: jiraTickets.issues[j].fields.customfield_10700
                });
            }
            for (let k = 0; k < jiraTickets.issues[j].fields.customfield_12300?.length; k++) {
                let desc = "External Requester";
                if (jiraTickets.issues[j].fields.customfield_12300[k].toLocaleLowerCase() === 'blacktriangle') {
                    desc = "Blacktriangle";
                }
                ticketToSave["ticket-labels"].push({
                    name: jiraTickets.issues[j].fields.customfield_12300[k],
                    description: desc,
                    displayColor: desc === "Blacktriangle" ? "black" : "blue"
                });
            }
            for (let k = 0; k < jiraTickets.issues[j].fields.customfield_12301?.length; k++) {
                ticketToSave["ticket-labels"] = [{
                    name: jiraTickets.issues[j].fields.customfield_12301[k].value,
                    description: "External Request",
                    displayColor: "blue"
                }];
            }
            if (jiraTickets.issues[j].fields.customfield_11009) {
                ticketToSave["ticket-additional-field"].push({
                    name: "DateRequested",
                    description: "Date Requested",
                    value: jiraTickets.issues[j].fields.customfield_11009
                });
            }
            if (jiraTickets.issues[j].fields.customfield_12200) {
                ticketToSave["ticket-additional-field"].push({
                    name: "EffectiveDate",
                    description: "Effective Date",
                    value: jiraTickets.issues[j].fields.customfield_12200
                });
            }
            if (jiraTickets.issues[j].fields.customfield_12002) {
                ticketToSave["ticket-additional-field"].push({
                    name: "InactiveDate",
                    description: "Inactive Date",
                    value: jiraTickets.issues[j].fields.customfield_12002
                });
            }
            if (jiraTickets.issues[j].fields.customfield_12000) {
                ticketToSave["ticket-additional-field"].push({
                    name: "StartDate",
                    description: "ARTG Start Date",
                    value: jiraTickets.issues[j].fields.customfield_12000
                });
            }
            for (let k = 0; k < jiraTickets.issues[j].fields.customfield_11901?.length; k++) {
                ticketToSave["ticket-additional-field"].push({
                    name: "AMTFlags",
                    description: "AMT Flags",
                    value: jiraTickets.issues[j].fields.customfield_11901[k].value
                });
            }
            for (let k = 0; k < jiraTickets.issues[j].fields.comment?.total; k++) {
                ticketToSave["ticket-comment"].push({
                    text: jiraTickets.issues[j].fields.comment.comments[k].body
                });
            }
            // TODO: Change this to add Subtask Comments too
            for (let k = 0; k < jiraTickets.issues[j].fields.subtasks?.length; k++) {
                ticketToSave["ticket-comment"].push({
                    text: jiraTickets.issues[j].fields.subtasks[k].fields.status.name + " | "
                        + jiraTickets.issues[j].fields.subtasks[k].key + " | "
                        + jiraTickets.issues[j].fields.subtasks[k].fields.summary
                });
            }
            ticketsToSave.push(ticketToSave);
        }
        i += pageSize;
        if (i > jiraTickets.total) {
            noMore = true;
        }
    }
    fs.writeFileSync(props.filepath, JSON.stringify(ticketsToSave, null, 4));
    console.log('Finished processing tickets');
    updateProgress(0, 0, false, 0);
}

