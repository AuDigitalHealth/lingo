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
import moment, { Moment } from 'moment';

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

type DownloadFile = {
  filePath: string;
  thumbnailPath: string | null;
}

async function downloadAttachment(attachment: JiraAttachment, directory: string,
  jiraTicket: string): Promise<DownloadFile | null> {
  // Use original Jira attachment directory - Need to grab the attachments from the server
  const ticketDirectory = directory + '/attachments'
  const ticketNumber = Math.ceil(parseInt(jiraTicket.split('-')[1]) / 10000) * 10000;
  // Jira >= 8.0 attachment layout
  const fileName = `${ticketNumber}/${jiraTicket}/${attachment.id}`;
  const thumbNail = `${ticketNumber}/${jiraTicket}/thumbs/_thumb_${attachment.id}.png`;
  // Jira < 8.0 attachment layout
  const fileNameAlternative = `${jiraTicket}/${attachment.id}`;
  const thumbNailAlternative = `${jiraTicket}//thumbs/_thumb_${attachment.id}.png`;
  const filePath = ticketDirectory + '/' + fileName;
  const thumbNailPath = ticketDirectory + '/' + thumbNail;
  const filePathAlternative = ticketDirectory + '/' + fileNameAlternative;
  const thumbNailAlternativePath = ticketDirectory + '/' + thumbNailAlternative;
  if (fs.existsSync(filePath)) {
    return {
      filePath: filePath,
      thumbnailPath: fs.existsSync(thumbNailPath) ? thumbNailPath : null
    }
  } else if (fs.existsSync(filePathAlternative)) {
    return {
      filePath: filePathAlternative,
      thumbnailPath: fs.existsSync(thumbNailAlternativePath) ? thumbNailAlternativePath : null
    }
  }
  return null;
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

function convertDate(jiraDate: string): Moment {
  return  moment(jiraDate, [
    'YYYY-MM-DDTHH:mm:ss.SSSZ',
    'DD/MMM/YY h:mm A',
    'MMM-DD-YYYY',
  ]);
}

function parseRelativeDate(dateStr: string): moment.Moment {
  // Split the input string into parts
  const parts = dateStr.split(' ');

  // Create a moment object for the current date
  let date = moment();
  let amPM = '';
  let timeParts = ['0', '0']

  // Subtract the necessary number of days or hours
  if (parts[1] === 'days' || parts[1] === 'day') {
      const daysAgo = parseInt(parts[0]);
      timeParts = parts[3].split(':');
      amPM = parts[4];
      date = date.subtract(daysAgo, 'days');
  } else if (parts[1] === 'hours' || parts[1] === 'hour') {
      timeParts = [parts[0], '0'];
      const hoursAgo = parseInt(parts[0]);
      date = date.subtract(hoursAgo, 'hours');
  } else if (parts[0] === 'Yesterday') {
      timeParts = parts[1].split(':');
      amPM = parts[2];
      date = date.subtract(1, 'days');
  }
  let hours = parseInt(timeParts[0]);
  const minutes = parseInt(timeParts[1]);
  if (amPM === 'PM' && hours < 12) {
      hours += 12;
  }
  if (amPM === 'AM' && hours === 12) {
      hours = 0;
  }
  date = moment(date.format('YYYY-MM-DD')).set({ hour: hours, minute: minutes, second: 0, millisecond: 0 });

  return date;
}

async function createTicketDto(props: SaveRequest, issue: AmtJiraTicket): Promise<TicketDto> {
    const ticketToSave: TicketDto = {
      id: parseInt(issue.id),
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
      const createdDateToConvert = issue.renderedFields.comment.comments[k].updated || issue.renderedFields.comment.comments[k].created || new Date().toDateString().split(' ').slice(1).join('-');
      let isoDate = convertDate(createdDateToConvert).format('YYYY-MM-DDTHH:mm:ss.SSSZ');
      if (isoDate == null || isoDate.toLocaleLowerCase() === 'invalid date') {
        isoDate = parseRelativeDate(createdDateToConvert).format('YYYY-MM-DDTHH:mm:ss.SSSZ');
      }
      ticketToSave["ticket-comment"].push({
          created: isoDate,
          text: issue.renderedFields.comment.comments[k].body
      });
  }
  // TODO: Change this to add Subtask Comments too
  for (let k = 0; k < issue.fields.subtasks?.length; k++) {
      ticketToSave["ticket-comment"].push({
          created: convertDate(new Date().toDateString().split(' ').slice(1).join('-')).toISOString(),
          text: issue.fields.subtasks[k].fields.issuetype.name
              + issue.fields.subtasks[k].fields.status.name + " | "
              + issue.fields.subtasks[k].key + " | "
              + issue.fields.subtasks[k].fields.summary + " | "
      });
  }
  for (let k = 0; k < issue.fields.attachment?.length; k++) {
      const paths  = await downloadAttachment(
          issue.fields.attachment[k],
          props.directory,
          issue.key
      );
      if (!paths) {
        throw new Error("Couldn't find attachment " + issue.fields.attachment[k]);
      }
      const hash = crypto.createHash('sha256');
      const input = fs.createReadStream(paths.filePath);
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
                  error: 'Could not calculate Hash for file ' + paths.filePath,
              });
              reject(error);
          });

      });
      const jiraAttachmentHash = await jiraAttachmentHashPromise;
      ticketToSave["ticket-attachment"].push({
          created: convertDate(issue.fields.attachment[k].created).toISOString(),
          description: issue.fields.attachment[k].filename,
          location: paths.filePath,
          thumbnailLocation: paths.thumbnailPath,
          filename: issue.fields.attachment[k].filename,
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