import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  LinearProgress,
  TextField,
} from "@mui/material";
import { useEffect, useState } from "react";
import "./ExportTickets.css";

type Props = {
  total: number;
};

function ExportTickets(props: Props) {
  const [directoryName, setDirectoryName] = useState("/opt/jira-export");
  const [total, setTotal] = useState(props.total);
  const [currentTicket, setCurrentTicket] = useState(0);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [isWorking, setIsWorking] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    const eventSource = new EventSource("api/progress");
    eventSource.onmessage = function (event) {
      const receivedData = JSON.parse(event.data);
      setCurrentTicket(receivedData.currentTicket);
      setProgress(receivedData.progress);
      setIsWorking(receivedData.isWorking);
      setTotal(receivedData.total);
      setIsFinished(receivedData.isFinished);
      if (receivedData.error) {
        setError(receivedData.error);
      }
    };
    eventSource.onerror = function (error) {
      console.error(`EventSource failed: ${error}`);
    };
  }, []);

  async function writeTickets() {
    const dataToSend = {
      directory: directoryName,
    };
    setIsWorking(true);
    fetch("api/exporttickets", {
      method: "post",
      headers: {
        "Content-Type": "application/json",
        Accept: "texxt/event-stream",
      },
      body: JSON.stringify(dataToSend),
    });
  }

  return (
    <>
      {error != "" ? (
        <Alert
          variant="filled"
          severity="error"
        >{`Jira Error: ${error}`}</Alert>
      ) : (
        ""
      )}
      <TextField
        variant="filled"
        sx={{
          width: "100%",
          backgroundColor: "#fafafa",
          color: "#ffffff",
          marginBottom: "10px",
        }}
        onChange={(event) => {
          setDirectoryName(event.target.value);
        }}
        defaultValue={directoryName}
        label="Export Directory"
      />

      <Button
        variant="contained"
        component="label"
        onClick={() => writeTickets()}
        disabled={isWorking}
      >
        {isWorking && (
          <CircularProgress
            size={20}
            sx={{
              marginRight: "10px",
              color: "green",
              zIndex: 1,
            }}
          />
        )}
        Export Jira Tickets
      </Button>
      <Divider
        sx={{
          padding: "20px 0 20px 0",
          "&::before, &::after": { borderColor: "secondary.light" },
        }}
      />
      {isWorking ? (
        <>
          <Box sx={{ margin: "20px 0 20px 0", width: "100%" }}>
            <LinearProgress
              variant="determinate"
              sx={{
                "& .MuiLinearProgress-dashed": {
                  left: "0px",
                },
              }}
              value={progress}
            />
          </Box>
          <Chip
            sx={{ backgroundColor: "#cacaca", marginLeft: "10px" }}
            label={`Reading ticket: ${currentTicket} / ${total}`}
          />
          <Box />
        </>
      ) : (
        <>
          {isFinished ? (
            <Alert
              variant="filled"
              severity="success"
            >{`Export Finished!`}</Alert>
          ) : (
            <Box />
          )}
        </>
      )}
    </>
  );
}

export default ExportTickets;
