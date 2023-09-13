import express from "express";
import ViteExpress from "vite-express";
//import compression from "compression";
import { SaveRequest, doExport } from "./export";

const app = express();

app.use(express.json({limit: '1000mb' })); 
//app.use(compression());

let progress = '{"progress": 0, "currentTicket": 0, "isWorking": false}';
let exportIsRunning = false;

const updateProgress = (prog: number, currentTicket: number,
                            inProgress: boolean, total: number, error?: string) => {
    const progressUpdate = {
      progress: prog,
      currentTicket: currentTicket,
      isWorking: inProgress,
      total: total,
      error: error,
    };
    progress = JSON.stringify(progressUpdate);
};

app.post("/api/savejson", async (req, res) => {
    if (exportIsRunning) {
        res.status(400).json({ message: 'Export is already running', code: 400 });
        return;
    }
    exportIsRunning = true;
    updateProgress(0, 0, true, 0);
    const props: SaveRequest = req.body;
    console.log(`Export was called with ${JSON.stringify(props)}`);
    if (!props || !props.filepath) {
        res.status(400).json({ message: 'Bad request, provide filepath and jsontosave in the request', code: 400 });
        return;
    }
    res.setHeader('Content-Type', 'application/json');
    try {
        await doExport(props, updateProgress);   
    
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Internal Server Error', code: 500 });
        exportIsRunning = false;
    }
    res.send(`{"message": "Export process started file will be written to ${props.filepath}", "status": "ok"}`);
    exportIsRunning = false;
});
  
app.get("/api/progress", (_, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    setInterval(() => {
      res.write(`data: ${progress}\n\n`);
    }, 2000);
});

ViteExpress.listen(app, 3000, () =>
  console.log("Server is listening on port 3000...")
);
