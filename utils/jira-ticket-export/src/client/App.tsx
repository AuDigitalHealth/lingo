import { useEffect, useRef, useState } from "react";
import "./App.css";
import axios from "axios";
import {
  Alert,
  Avatar,
  Box,
  Divider,
  LinearProgress,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Typography,
} from "@mui/material";
import React from "react";
import { AmtJiraTicket, AmtJiraTickets } from "./ticket-types";
import ExportTickets from "./components/ExportTickets";

function App() {
  const [count, setCount] = useState(0);
  const [error, setError] = useState("");
  const [tickets, setTickets] = useState<AmtJiraTicket[]>([]);
  const initialised = useRef(false);

  useEffect(() => {
    if (!initialised.current) {
      setTicketCount();
    }
  }, []);

  const setTicketCount = async () => {
    axios
      .get<AmtJiraTickets>(
        "/rest/api/2/search?jql=project%3D%20AA%20AND%20issuetype%20not%20in%20(subTaskIssueTypes())" +
          "&fields=attachment,summary,issuetype,comment,customfield_11900,description,customfield_10700,status,labels,customfield_11901,customfield_12301,customfield_11009,customfield_12200,customfield_12002,customfield_12000,customfield_12300,subtasks,assignee" +
          "&expand=renderedFields" +
          "&maxResults=5",
      )
      .then((response) => {
        setCount(response.data.total);
        setTickets(response.data.issues);
        setError("");
      })
      .catch((error) => {
        setCount(0);
        setError(error.message);
      });
  };

  return (
    <>
      <div>
        {count > 0 ? (
          <>
            <Alert variant="filled" severity="info" sx={{ color: "black" }}>
              Connected to Jira. Make sure you have the Jira attachments
              directory synced to the export directory under
              /path/to/exportdirectory/attachments E.g:
              /opt/jira-export/attachments
            </Alert>
            <Divider
              sx={{
                padding: "20px 0 20px 0",
                "&::before, &::after": { borderColor: "secondary.light" },
              }}
            />
            <ExportTickets total={count} />
            <Divider
              sx={{
                padding: "20px 0 20px 0",
                "&::before, &::after": { borderColor: "secondary.light" },
              }}
            >
              o = 0 = o
            </Divider>
            <List sx={{ bgcolor: "#0288d1" }}>
              {tickets.map((ticket) => (
                <React.Fragment key={ticket.id}>
                  <ListItem alignItems="flex-start">
                    <ListItemAvatar>
                      <Avatar
                        alt={ticket.fields.issuetype.name}
                        src={ticket.fields.issuetype.iconUrl}
                      />
                    </ListItemAvatar>
                    <ListItemText
                      primary={ticket.key}
                      secondary={
                        <React.Fragment>
                          <Typography
                            sx={{ display: "inline" }}
                            component="span"
                            variant="body2"
                            color="text.primary"
                          >
                            {ticket.fields.summary}
                          </Typography>
                          {ticket.fields.description}
                          <br />
                          {ticket.fields.assignee != null
                            ? ticket.fields.assignee.name
                            : ""}
                        </React.Fragment>
                      }
                    />
                  </ListItem>
                  <Divider
                    sx={{
                      paddingBottom: 0,
                      "&::before, &::after": { borderColor: "primary.light" },
                    }}
                  >
                    -
                  </Divider>
                </React.Fragment>
              ))}
            </List>
          </>
        ) : (
          <>
            <button
              type="submit"
              onClick={() => {
                setTicketCount();
              }}
            >
              Log in to Jira
            </button>
            <Box sx={{ width: "100%" }}>
              <LinearProgress />
            </Box>
          </>
        )}
      </div>
      {error != "" ? (
        <Alert
          variant="filled"
          severity="error"
        >{`Jira Error: ${error}`}</Alert>
      ) : (
        ""
      )}
    </>
  );
}

export default App;
