#!/usr/bin/env node

import express from 'express';
import cors from 'cors';
import axios from 'axios';
import { config } from 'dotenv';

config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

class StoneBranchHTTPServer {
  constructor() {
    this.apiClient = null;
    this.baseUrl = process.env.STONEBRANCH_BASE_URL || "https://localhost:8080";
    this.username = process.env.STONEBRANCH_USERNAME;
    this.password = process.env.STONEBRANCH_PASSWORD;
    this.token = null;
  }

  async authenticate() {
    if (!this.username || !this.password) {
      throw new Error("Stonebranch credentials not configured");
    }

    try {
      const response = await axios.post(
        `${this.baseUrl}/uc/resources/user/ops-login`,
        {
          username: this.username,
          password: this.password,
        },
        {
          headers: { "Content-Type": "application/json" },
          httpsAgent: new (await import("https")).Agent({
            rejectUnauthorized: false,
          }),
        }
      );

      this.token = response.data.token;
      
      this.apiClient = axios.create({
        baseURL: `${this.baseUrl}/uc/resources`,
        headers: {
          "Authorization": `Bearer ${this.token}`,
          "Content-Type": "application/json",
        },
        httpsAgent: new (await import("https")).Agent({
          rejectUnauthorized: false,
        }),
      });

      return true;
    } catch (error) {
      throw new Error(`Authentication failed: ${error.message}`);
    }
  }

  async ensureAuthenticated() {
    if (!this.apiClient || !this.token) {
      await this.authenticate();
    }
  }

  setupRoutes() {
    // Task Instances
    app.get('/api/task-instances', async (req, res) => {
      try {
        await this.ensureAuthenticated();
        const params = new URLSearchParams();
        Object.entries(req.query).forEach(([key, value]) => {
          if (value) params.append(key, value);
        });
        const response = await this.apiClient.get(`/taskinstance?${params.toString()}`);
        res.json(response.data);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    app.get('/api/task-instances/:id', async (req, res) => {
      try {
        await this.ensureAuthenticated();
        const response = await this.apiClient.get(`/taskinstance/${req.params.id}`);
        res.json(response.data);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    app.get('/api/task-instances/:id/dependencies', async (req, res) => {
      try {
        await this.ensureAuthenticated();
        const response = await this.apiClient.get(`/taskinstance/${req.params.id}/dependencies`);
        res.json(response.data);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Tasks
    app.get('/api/tasks', async (req, res) => {
      try {
        await this.ensureAuthenticated();
        const params = new URLSearchParams();
        Object.entries(req.query).forEach(([key, value]) => {
          if (value) params.append(key, value);
        });
        const response = await this.apiClient.get(`/task?${params.toString()}`);
        res.json(response.data);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    app.get('/api/tasks/:id', async (req, res) => {
      try {
        await this.ensureAuthenticated();
        const response = await this.apiClient.get(`/task/${req.params.id}`);
        res.json(response.data);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Workflow Instances
    app.get('/api/workflow-instances/:id', async (req, res) => {
      try {
        await this.ensureAuthenticated();
        const response = await this.apiClient.get(`/workflowinstance/${req.params.id}`);
        res.json(response.data);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    app.get('/api/workflow-instances/:id/dependencies', async (req, res) => {
      try {
        await this.ensureAuthenticated();
        const response = await this.apiClient.get(`/workflowinstance/${req.params.id}/dependencies`);
        res.json(response.data);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Universal Agents
    app.get('/api/agents', async (req, res) => {
      try {
        await this.ensureAuthenticated();
        const params = new URLSearchParams();
        Object.entries(req.query).forEach(([key, value]) => {
          if (value) params.append(key, value);
        });
        const response = await this.apiClient.get(`/agent?${params.toString()}`);
        res.json(response.data);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    app.get('/api/agents/:id', async (req, res) => {
      try {
        await this.ensureAuthenticated();
        const response = await this.apiClient.get(`/agent/${req.params.id}`);
        res.json(response.data);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Health check
    app.get('/health', (req, res) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    // API documentation
    app.get('/api/docs', (req, res) => {
      res.json({
        endpoints: [
          'GET /api/task-instances - List task instances',
          'GET /api/task-instances/:id - Get task instance details',
          'GET /api/task-instances/:id/dependencies - Get task instance dependencies',
          'GET /api/tasks - List tasks',
          'GET /api/tasks/:id - Get task details',
          'GET /api/workflow-instances/:id - Get workflow instance details',
          'GET /api/workflow-instances/:id/dependencies - Get workflow dependencies',
          'GET /api/agents - List universal agents',
          'GET /api/agents/:id - Get agent details',
          'GET /health - Health check',
          'GET /api/docs - This documentation'
        ]
      });
    });
  }

  start() {
    this.setupRoutes();
    app.listen(port, () => {
      console.log(`Stonebranch HTTP API Server running on port ${port}`);
      console.log(`API documentation available at: http://localhost:${port}/api/docs`);
    });
  }
}

const server = new StoneBranchHTTPServer();
server.start();