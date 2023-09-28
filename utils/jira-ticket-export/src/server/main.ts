import express from "express";
import ViteExpress from "vite-express";
//import compression from "compression";
import { SaveRequest, doExport } from "./export";

const app = express();

app.use(express.json({ limit: '1000mb' }));
//app.use(compression());

const export_filename = 'snomio-jira-export.json';
export interface ProgressUpdates {
    [key: string]: number | string | boolean;
}

let progress: ProgressUpdates = {
    progress: 0,
    currentTicket: 0,
    total: 0,
    isWorking: false,
    error: '',
};
let exportIsRunning = false;

export const updateProgress = (updates: ProgressUpdates) => {
    const progressUpdate = progress;

    for (const key in updates) {
        if (Object.prototype.hasOwnProperty.call(updates, key)) {
            progressUpdate[key] = updates[key];
        }
    }
    progress = progressUpdate;
};

app.post("/api/exporttickets", async (req, res) => {
    if (exportIsRunning) {
        res.status(400).json({ message: 'Export is already running', code: 400 });
        return;
    }
    exportIsRunning = true;
    updateProgress({
        progress: 0,
        currentTicket: 0,
        total: 0,
        isWorking: true,
        isFinished: false,
        error: '',
    });
    const props: SaveRequest = req.body;
    console.log(`Export was called with ${JSON.stringify(props)}`);
    if (!props || !props.directory) {
        res.status(400).json({ message: 'Bad request, provide filepath and jsontosave in the request', code: 400 });
        return;
    }
    res.setHeader('Content-Type', 'application/json');
    try {
        props.filename = export_filename;

        await doExport(props);
    } catch (error) {
        console.error('Error:', error);
        updateProgress({
            error: error as string
        });
        res.status(500).json({ message: 'Internal Server Error', code: 500 });
        exportIsRunning = false;
    }
    res.send(`{"message": "Export process started file will be written to ${props.directory}/${export_filename}", "status": "ok"}`);
    exportIsRunning = false;
    updateProgress({
        progress: 0,
        currentTicket: 0,
        total: 0,
        isWorking: false,
        isFinished: true,
        error: '',
    });
});

app.get("/api/progress", (_, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    setInterval(() => {
        res.write(`data: ${JSON.stringify(progress)}\n\n`);
    }, 2000);
});

ViteExpress.listen(app, 3000, () =>
    console.log("Server is listening on port 3000...")
);
