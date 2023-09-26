import axios, { AxiosError } from "axios";
import {
    AmtJiraTickets,
    Attachment,
    Labels,
    TicketDto,
    Comment,
    AdditionalFieldValue
} from "../client/ticket-types";
import fs from "fs";
import * as https from 'https';
import crypto from 'crypto';
import { log } from "console";
import { updateProgress } from "./main";

const httpsAgent = new https.Agent({ rejectUnauthorized: false });

export interface SaveRequest {
    directory: string;
    filename: string;
}

const JIRA_URL = process.env.JIRA_URL ? process.env.JIRA_URL : "https://jira.aws.tooling";
const JIRA_USERNAME = process.env.JIRA_USERNAME ? process.env.JIRA_USERNAME : '';
const JIRA_PASSWORD = process.env.JIRA_PASSWORD ? process.env.JIRA_PASSWORD : '';

async function getTickets(current: number, size: number): Promise<AmtJiraTickets> {
    try {
        const jiraResponse = await axios.get<AmtJiraTickets>(
            JIRA_URL +
            '/rest/api/2/search?jql=project%3D%20AA%20AND%20issuetype%20not%20in%20(subTaskIssueTypes())'
            + '&fields=attachment,summary,issuetype,comment,customfield_11900,description,customfield_10700,status,labels,customfield_11901,customfield_12301,customfield_11009,customfield_12200,customfield_12002,customfield_12000,customfield_12300,subtasks,assignee'
            + '&expand=renderedFields'
            + '&startAt=' + current
            + '&maxResults=' + size,
            { auth: { username: JIRA_USERNAME, password: JIRA_PASSWORD }, httpsAgent });
        return jiraResponse.data;
    } catch (err) {
        const error = err as AxiosError;
        updateProgress({
            error: error.message,
        });
        console.log(error.message);
    }
    return {} as AmtJiraTickets
}

async function downloadAttachment(attachmentUrl: string, directory: string,
    filename: string, jiraTicket: string): Promise<string> {
    const ticketDirectory = directory + '/attachments/' + jiraTicket
    const filePath = ticketDirectory + '/' + filename;
    // File already downloaded
    if (fs.existsSync(filePath)) {
        return filePath;
    }
    try {
        const response = await axios({
            url: attachmentUrl,
            method: 'GET',
            responseType: 'stream',
            auth: { username: JIRA_USERNAME, password: JIRA_PASSWORD },
            httpsAgent,
        });
        if (!fs.existsSync(ticketDirectory)) {
            fs.mkdirSync(ticketDirectory);
            log
        }
        const fileStream = fs.createWriteStream(filePath);
        response.data.pipe(fileStream);
        return new Promise((resolve, reject) => {
            fileStream.on('finish', () => {
                resolve(filePath);
            });
            fileStream.on('error', (err) => {
                updateProgress({
                    error: err.message,
                });
                reject();
            });
        });

    } catch (err) {
        const error = err as Error;
        console.error(error);
        updateProgress({
            error: error.message,
        });

    }
    return filePath;
}

export async function doExport(props: SaveRequest) {
    const ticketsToSave: TicketDto[] = [];
    const pageSize = 1000;
    let noMore = false;
    let i = 0;
    const attachnemts_directory = props.directory + '/attachments';
    if (!fs.existsSync(props.directory)) {
        fs.mkdirSync(props.directory);
    }
    if (!fs.existsSync(attachnemts_directory)) {
        fs.mkdirSync(attachnemts_directory);
    }
    while (!noMore) {
        const jiraTickets = await getTickets(i, pageSize);
        if (!jiraTickets.issues) {
            break;
        }
        for (let j = 0; j < jiraTickets.issues.length; j++) {
            const prog = ((i + j) / jiraTickets.total) * 100;
            updateProgress({
                progress: prog,
                currentTicket: i + j,
                total: jiraTickets.total,
            });
            const ticketToSave: TicketDto = {
                assignee: jiraTickets.issues[j].fields.assignee?.name,
                description: jiraTickets.issues[j].renderedFields.description,
                state: {
                    label: jiraTickets.issues[j].fields.status?.name,
                    description: jiraTickets.issues[j].fields.status?.description
                },
                title: jiraTickets.issues[j].fields.summary,
                ticketType: {
                    name: jiraTickets.issues[j].fields.issuetype.name,
                    description: jiraTickets.issues[j].fields.issuetype.description
                },
                "ticket-additional-fields": new Array<AdditionalFieldValue>(),
                "ticket-attachment": new Array<Attachment>(),
                "ticket-labels": new Array<Labels>(),
                "ticket-comment": new Array<Comment>()
            };
            for (let k = 0; k < jiraTickets.issues[j].fields.customfield_11900?.length; k++) {
                ticketToSave["ticket-additional-fields"].push({
                    additionalFieldType: {
                        name: "Schedule",
                        description: "TGA Schedule",
                        listType: true,
                    },
                    valueOf: jiraTickets.issues[j].fields.customfield_11900[k].value,
                });
            }
            if (jiraTickets.issues[j].fields.customfield_10700) {
                ticketToSave["ticket-additional-fields"].push({
                    additionalFieldType: {
                        name: "ARTGID",
                        description: "ARTG ID",  
                        listType: false,
                    },
                    valueOf: jiraTickets.issues[j].fields.customfield_10700,
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
                    displayColor: desc === "Blacktriangle" ? "#000000" : "info"
                });
            }
            for (let k = 0; k < jiraTickets.issues[j].fields.customfield_12301?.length; k++) {
                ticketToSave["ticket-labels"] = [{
                    name: jiraTickets.issues[j].fields.customfield_12301[k].value,
                    description: "External Request",
                    displayColor: "info"
                }];
            }
            if (jiraTickets.issues[j].fields.customfield_11009) {
                ticketToSave["ticket-additional-fields"].push({
                    additionalFieldType: {
                        name: "DateRequested",
                        description: "Date Requested",
                        listType: false,
                    },
                    valueOf: jiraTickets.issues[j].fields.customfield_11009,
                });
            }
            if (jiraTickets.issues[j].fields.customfield_12200) {
                ticketToSave["ticket-additional-fields"].push({
                    additionalFieldType: {
                        name: "EffectiveDate",
                        description: "Effective Date",
                        listType: false,
                    },
                    valueOf: jiraTickets.issues[j].fields.customfield_12200,
                });
            }
            if (jiraTickets.issues[j].fields.customfield_12002) {
                ticketToSave["ticket-additional-fields"].push({
                    additionalFieldType: {
                        name: "InactiveDate",
                        description: "Inactive Date",
                        listType: false,
                    },
                    valueOf: jiraTickets.issues[j].fields.customfield_12002,
                });
            }
            if (jiraTickets.issues[j].fields.customfield_12000) {
                ticketToSave["ticket-additional-fields"].push({
                    additionalFieldType: {
                        name: "StartDate",
                        description: "ARTG Start Date",
                        listType: false,
                    },
                    valueOf: jiraTickets.issues[j].fields.customfield_12000,
                });
            }
            for (let k = 0; k < jiraTickets.issues[j].fields.customfield_11901?.length; k++) {
                ticketToSave["ticket-additional-fields"].push({
                    additionalFieldType: {
                        name: "AMTFlags",
                        description: "AMT Flags",
                        listType: true,
                    },
                    valueOf: jiraTickets.issues[j].fields.customfield_11901[k].value,
                });
            }
            for (let k = 0; k < jiraTickets.issues[j].fields.comment?.total; k++) {
                ticketToSave["ticket-comment"].push({
                    text: jiraTickets.issues[j].renderedFields.comment.comments[k].body
                });
            }
            // TODO: Change this to add Subtask Comments too
            for (let k = 0; k < jiraTickets.issues[j].fields.subtasks?.length; k++) {
                ticketToSave["ticket-comment"].push({
                    text: jiraTickets.issues[j].fields.subtasks[k].fields.issuetype.name
                        + jiraTickets.issues[j].fields.subtasks[k].fields.status.name + " | "
                        + jiraTickets.issues[j].fields.subtasks[k].key + " | "
                        + jiraTickets.issues[j].fields.subtasks[k].fields.summary + " | "
                });
            }
            for (let k = 0; k < jiraTickets.issues[j].fields.attachment?.length; k++) {
                const filePath = await downloadAttachment(
                    jiraTickets.issues[j].fields.attachment[k].content,
                    props.directory,
                    jiraTickets.issues[j].fields.attachment[k].filename,
                    jiraTickets.issues[j].key
                );
                const hash = crypto.createHash('sha256');
                const input = fs.createReadStream(filePath);
                const jiraAttachmentHashPromise = new Promise<string>((resolve, reject) => {
                    input.on('readable', () => {
                        const data = input.read();
                        if (data) {
                            hash.update(data);
                        } else {
                            const fileHash = hash.digest('hex');
                            resolve(fileHash);
                        }
                    });
                    input.on('error', (error) => {
                        console.log(error);
                        updateProgress({
                            error: 'Could not calculate Hash for file ' + filePath,
                        });
                        reject(error);
                    });

                });
                const jiraAttachmentHash = await jiraAttachmentHashPromise;
                ticketToSave["ticket-attachment"].push({
                    description: jiraTickets.issues[j].fields.attachment[k].filename,
                    filename: 'attachments/' + jiraTickets.issues[j].key + "/" + jiraTickets.issues[j].fields.attachment[k].filename,
                    length: jiraTickets.issues[j].fields.attachment[k].size,
                    sha256: jiraAttachmentHash,
                    attachmentType: {
                        name: jiraTickets.issues[j].fields.attachment[k].mimeType,
                        mimeType: jiraTickets.issues[j].fields.attachment[k].mimeType
                    }
                });
            }

            ticketsToSave.push(ticketToSave);
        }
        i += pageSize;
        if (i > jiraTickets.total) {
        //if (i > 0) {
            noMore = true;
        }
    }
    fs.writeFileSync(props.directory + '/' + props.filename, JSON.stringify(ticketsToSave, null, 4));
    console.log('Finished processing tickets');
}

