import axios, { AxiosError } from "axios";
import {
    AmtJiraTickets,
    Attachment,
    Labels,
    TicketDto,
    Comment,
    AdditionalFieldValue,
    AmtJiraTicket,
    JiraAttachment
} from "../client/ticket-types";
import fs from "fs";
import * as https from 'https';
import crypto from 'crypto';
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

async function downloadAttachment(attachment: JiraAttachment, directory: string,
  jiraTicket: string): Promise<string> {
    const ticketDirectory = directory + '/attachments/' + jiraTicket
    const filePath = ticketDirectory + '/' + attachment.filename;
    // File already downloaded
    if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        if (stats.size === attachment.size) {
          return filePath;
        }
        console.log("File size differs from original download for ticket "
          + jiraTicket + " filename: " + attachment.filename
          + " size: " + stats.size + " original size: " + attachment.size );
    }
    try {
        const response = await axios({
            url: attachment.content,
            method: 'GET',
            responseType: 'stream',
            auth: { username: JIRA_USERNAME, password: JIRA_PASSWORD },
            httpsAgent,
        });
        if (!fs.existsSync(ticketDirectory)) {
            fs.mkdirSync(ticketDirectory);
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
        let j = 0;
        for (const issue of jiraTickets.issues) {
            const prog = ((i + j) / jiraTickets.total) * 100;
            updateProgress({
                progress: prog,
                currentTicket: i + j,
                total: jiraTickets.total,
            });
            const ticketToSave: TicketDto = await createTicketDto(props, issue);
            ticketsToSave.push(ticketToSave);
            j++;
        }
        i += pageSize;
        if (i > jiraTickets.total) {
            noMore = true;
        }
    }
    fs.writeFileSync(props.directory + '/' + props.filename, JSON.stringify(ticketsToSave, null, 4));
    console.log('Finished processing tickets');
}

async function createTicketDto(props: SaveRequest, issue: AmtJiraTicket): Promise<TicketDto> {
    const ticketToSave: TicketDto = {
      assignee: issue.fields.assignee?.name,
      description: issue.renderedFields.description,
      state: {
          label: issue.fields.status?.name,
          description: issue.fields.status?.description
      },
      title: issue.fields.summary,
      ticketType: {
          name: issue.fields.issuetype.name,
          description: issue.fields.issuetype.description
      },
      "ticket-additional-fields": new Array<AdditionalFieldValue>(),
      "ticket-attachment": new Array<Attachment>(),
      labels: new Array<Labels>(),
      "ticket-comment": new Array<Comment>()
  };
  for (let k = 0; k < issue.fields.customfield_11900?.length; k++) {
      ticketToSave["ticket-additional-fields"].push({
          additionalFieldType: {
              name: "Schedule",
              description: "TGA Schedule",
              listType: true,
          },
          valueOf: issue.fields.customfield_11900[k].value,
      });
  }
  if (issue.fields.customfield_10700) {
      ticketToSave["ticket-additional-fields"].push({
          additionalFieldType: {
              name: "ARTGID",
              description: "ARTG ID",
              listType: false,
          },
          valueOf: issue.fields.customfield_10700,
      });
  }
  for (let k = 0; k < issue.fields.customfield_12300?.length; k++) {
      const desc = issue.fields.customfield_12300[k].toLocaleLowerCase();
      ticketToSave.labels.push({
          name: issue.fields.customfield_12300[k],
          description: desc,
          displayColor: desc === "Blacktriangle" ? "primary" : "info"
      });
  }
  for (let k = 0; k < issue.fields.customfield_12301?.length; k++) {
      ticketToSave.labels.push ({
          name: issue.fields.customfield_12301[k].value,
          description: "External Request",
          displayColor: "info"
      });
  }
  ticketToSave.labels.push({
    name: 'JiraExport',
    description: 'The ticket was exported from Blue Jira',
    displayColor: 'info'
  });
  if (issue.fields.customfield_11009) {
      ticketToSave["ticket-additional-fields"].push({
          additionalFieldType: {
              name: "DateRequested",
              description: "Date Requested",
              listType: false,
          },
          valueOf: issue.fields.customfield_11009,
      });
  }
  if (issue.fields.customfield_12200) {
      ticketToSave["ticket-additional-fields"].push({
          additionalFieldType: {
              name: "EffectiveDate",
              description: "Effective Date",
              listType: false,
          },
          valueOf: issue.fields.customfield_12200,
      });
  }
  if (issue.fields.customfield_12002) {
      ticketToSave["ticket-additional-fields"].push({
          additionalFieldType: {
              name: "InactiveDate",
              description: "Inactive Date",
              listType: false,
          },
          valueOf: issue.fields.customfield_12002,
      });
  }
  if (issue.fields.customfield_12000) {
      ticketToSave["ticket-additional-fields"].push({
          additionalFieldType: {
              name: "StartDate",
              description: "ARTG Start Date",
              listType: false,
          },
          valueOf: issue.fields.customfield_12000,
      });
  }
  for (let k = 0; k < issue.fields.customfield_11901?.length; k++) {
      ticketToSave["ticket-additional-fields"].push({
          additionalFieldType: {
              name: "AMTFlags",
              description: "AMT Flags",
              listType: true,
          },
          valueOf: issue.fields.customfield_11901[k].value,
      });
  }
  for (let k = 0; k < issue.fields.comment?.total; k++) {
      ticketToSave["ticket-comment"].push({
          text: issue.renderedFields.comment.comments[k].body
      });
  }
  // TODO: Change this to add Subtask Comments too
  for (let k = 0; k < issue.fields.subtasks?.length; k++) {
      ticketToSave["ticket-comment"].push({
          text: issue.fields.subtasks[k].fields.issuetype.name
              + issue.fields.subtasks[k].fields.status.name + " | "
              + issue.fields.subtasks[k].key + " | "
              + issue.fields.subtasks[k].fields.summary + " | "
      });
  }
  for (let k = 0; k < issue.fields.attachment?.length; k++) {
      const filePath = await downloadAttachment(
          issue.fields.attachment[k],
          props.directory,
          issue.key
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
          description: issue.fields.attachment[k].filename,
          filename: 'attachments/' + issue.key + "/" + issue.fields.attachment[k].filename,
          length: issue.fields.attachment[k].size,
          sha256: jiraAttachmentHash,
          attachmentType: {
              name: issue.fields.attachment[k].mimeType,
              mimeType: issue.fields.attachment[k].mimeType
          }
      });
  }
  return ticketToSave;
}