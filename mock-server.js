#!/usr/bin/env node

import express from 'express';
import cors from 'cors';

const app = express();
const port = 3002;

app.use(cors());
app.use(express.json());

// Mock data
const mockTaskInstances = [
    {
        id: "12345",
        name: "Daily_ETL_Process",
        status: "Running",
        startTime: "2025-07-11T08:00:00Z",
        agent: "PROD-AGENT-01",
        workflow: "ETL_WORKFLOW_001"
    },
    {
        id: "12346", 
        name: "Data_Validation",
        status: "Success",
        startTime: "2025-07-11T07:30:00Z",
        endTime: "2025-07-11T07:35:00Z",
        agent: "PROD-AGENT-02",
        workflow: "VALIDATION_WORKFLOW"
    },
    {
        id: "12347",
        name: "Backup_Process",
        status: "Failed",
        startTime: "2025-07-11T06:00:00Z",
        endTime: "2025-07-11T06:05:00Z", 
        agent: "BACKUP-AGENT-01",
        errorMessage: "Disk space insufficient"
    }
];

const mockAgents = [
    {
        id: "agent-001",
        name: "PROD-AGENT-01",
        status: "Online",
        platform: "Linux",
        version: "7.8.0",
        lastHeartbeat: "2025-07-11T10:05:00Z"
    },
    {
        id: "agent-002",
        name: "PROD-AGENT-02", 
        status: "Online",
        platform: "Windows",
        version: "7.8.0",
        lastHeartbeat: "2025-07-11T10:04:00Z"
    },
    {
        id: "agent-003",
        name: "BACKUP-AGENT-01",
        status: "Offline",
        platform: "Linux",
        version: "7.7.5",
        lastHeartbeat: "2025-07-11T09:30:00Z"
    }
];

const mockTasks = [
    {
        id: "task-001",
        name: "Daily_ETL_Process",
        type: "Linux/Unix",
        command: "/opt/scripts/etl_process.sh",
        agent: "PROD-AGENT-01",
        schedule: "0 8 * * *"
    },
    {
        id: "task-002",
        name: "Data_Validation",
        type: "Linux/Unix", 
        command: "/opt/scripts/validate_data.py",
        agent: "PROD-AGENT-02",
        schedule: "30 7 * * *"
    },
    {
        id: "task-003",
        name: "Backup_Process",
        type: "Linux/Unix",
        command: "/opt/scripts/backup.sh",
        agent: "BACKUP-AGENT-01",
        schedule: "0 6 * * *"
    }
];

// Mock authentication
app.post('/uc/resources/user/ops-login', (req, res) => {
    const { username, password } = req.body;
    if (username === 'observability' && password === 'deadman26') {
        res.json({ token: 'mock-token-12345' });
    } else {
        res.status(401).json({ error: 'Invalid credentials' });
    }
});

// Task instances
app.get('/uc/resources/taskinstance', (req, res) => {
    let results = [...mockTaskInstances];
    
    if (req.query.status) {
        results = results.filter(task => 
            task.status.toLowerCase() === req.query.status.toLowerCase()
        );
    }
    
    if (req.query.limit) {
        results = results.slice(0, parseInt(req.query.limit));
    }
    
    res.json(results);
});

app.get('/uc/resources/taskinstance/:id', (req, res) => {
    const task = mockTaskInstances.find(t => t.id === req.params.id);
    if (task) {
        res.json(task);
    } else {
        res.status(404).json({ error: 'Task instance not found' });
    }
});

app.get('/uc/resources/taskinstance/:id/dependencies', (req, res) => {
    res.json([
        { id: "dep-001", name: "Data_Source_Check", status: "Success" },
        { id: "dep-002", name: "File_Available", status: "Success" }
    ]);
});

// Agents
app.get('/uc/resources/agent', (req, res) => {
    let results = [...mockAgents];
    
    if (req.query.status) {
        results = results.filter(agent => 
            agent.status.toLowerCase() === req.query.status.toLowerCase()
        );
    }
    
    if (req.query.limit) {
        results = results.slice(0, parseInt(req.query.limit));
    }
    
    res.json(results);
});

app.get('/uc/resources/agent/:id', (req, res) => {
    const agent = mockAgents.find(a => a.id === req.params.id);
    if (agent) {
        res.json(agent);
    } else {
        res.status(404).json({ error: 'Agent not found' });
    }
});

// Tasks
app.get('/uc/resources/task', (req, res) => {
    let results = [...mockTasks];
    
    if (req.query.type) {
        results = results.filter(task => 
            task.type.toLowerCase().includes(req.query.type.toLowerCase())
        );
    }
    
    if (req.query.limit) {
        results = results.slice(0, parseInt(req.query.limit));
    }
    
    res.json(results);
});

app.get('/uc/resources/task/:id', (req, res) => {
    const task = mockTasks.find(t => t.id === req.params.id);
    if (task) {
        res.json(task);
    } else {
        res.status(404).json({ error: 'Task not found' });
    }
});

app.listen(port, () => {
    console.log(`🎭 Mock Stonebranch Universal Controller running on port ${port}`);
    console.log(`   Base URL: http://localhost:${port}`);
    console.log(`   Authentication: POST /uc/resources/user/ops-login`);
    console.log(`   Task Instances: GET /uc/resources/taskinstance`);
    console.log(`   Agents: GET /uc/resources/agent`);
    console.log(`   Tasks: GET /uc/resources/task`);
});