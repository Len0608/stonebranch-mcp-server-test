#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import axios from "axios";
import { config } from "dotenv";

config();

class StoneBranchMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: "stonebranch-mcp-server",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.apiClient = null;
    this.baseUrl = process.env.STONEBRANCH_BASE_URL || "https://localhost:8080";
    this.username = process.env.STONEBRANCH_USERNAME;
    this.password = process.env.STONEBRANCH_PASSWORD;
    this.token = null;

    this.setupToolHandlers();
  }

  async authenticate() {
    if (!this.username || !this.password) {
      throw new McpError(
        ErrorCode.InvalidParams,
        "Stonebranch credentials not configured. Set STONEBRANCH_USERNAME and STONEBRANCH_PASSWORD environment variables."
      );
    }

    // Try token-based authentication first
    if (await this.tryTokenAuthentication()) {
      return true;
    }

    // Fall back to Basic Authentication
    return await this.tryBasicAuthentication();
  }

  async tryTokenAuthentication() {

    try {
      // Try different authentication endpoints for UC 7.8
      const authEndpoints = [
        '/uc/resources/user/ops-login',
        '/uc/resources/user/login',
        '/uc/api/login',
        '/uc/login'
      ];
      
      let authResponse = null;
      let authError = null;
      
      for (const endpoint of authEndpoints) {
        try {
          console.log(`Trying auth endpoint: ${this.baseUrl}${endpoint}`);
          authResponse = await axios.post(
            `${this.baseUrl}${endpoint}`,
            {
              username: this.username,
              password: this.password,
            },
            {
              headers: {
                "Content-Type": "application/json",
              },
              httpsAgent: new (await import("https")).Agent({
                rejectUnauthorized: false,
              }),
            }
          );
          
          if (authResponse && authResponse.data && authResponse.data.token) {
            this.token = authResponse.data.token;
            console.log(`Authentication successful with endpoint: ${endpoint}`);
            break;
          }
        } catch (error) {
          authError = error;
          console.log(`Auth failed for ${endpoint}: ${error.message}`);
          continue;
        }
      }
      
      if (!this.token) {
        throw new Error(`All authentication endpoints failed. Last error: ${authError?.message}`);
      }
      
      // Try different API base paths for UC 7.8
      const apiBasePaths = [
        '/uc/resources',
        '/uc/api',
        '/api'
      ];
      
      // Use the first available API base path
      let apiBasePath = apiBasePaths[0];
      
      this.apiClient = axios.create({
        baseURL: `${this.baseUrl}${apiBasePath}`,
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
      console.log(`Token authentication failed: ${error.message}`);
      return false;
    }
  }

  async tryBasicAuthentication() {
    try {
      console.log("Trying Basic Authentication...");
      
      const authString = Buffer.from(`${this.username}:${this.password}`).toString('base64');
      
      this.apiClient = axios.create({
        baseURL: `${this.baseUrl}/uc/resources`,
        headers: {
          "Authorization": `Basic ${authString}`,
          "Content-Type": "application/json",
        },
        httpsAgent: new (await import("https")).Agent({
          rejectUnauthorized: false,
        }),
      });

      // Test the authentication with a simple request
      const testResponse = await this.apiClient.get('/task?limit=1');
      console.log("Basic authentication successful");
      return true;
      
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `All authentication methods failed: ${error.message}`
      );
    }
  }

  async ensureAuthenticated() {
    if (!this.apiClient || !this.token) {
      await this.authenticate();
    }
  }

  async getTaskInstance(taskInstanceId) {
    await this.ensureAuthenticated();
    
    try {
      const response = await this.apiClient.get(`/taskinstance/${taskInstanceId}`);
      return response.data;
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to get task instance: ${error.message}`
      );
    }
  }

  async getTaskInstanceDependencies(taskInstanceId) {
    await this.ensureAuthenticated();
    
    try {
      const response = await this.apiClient.get(`/taskinstance/${taskInstanceId}/dependencies`);
      return response.data;
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to get task instance dependencies: ${error.message}`
      );
    }
  }

  async listTaskInstances(criteria = {}) {
    await this.ensureAuthenticated();
    
    try {
      const params = new URLSearchParams();
      
      if (criteria.status) params.append('status', criteria.status);
      if (criteria.taskname) params.append('taskname', criteria.taskname);
      if (criteria.workflowInstanceId) params.append('workflowInstanceId', criteria.workflowInstanceId);
      if (criteria.limit) params.append('limit', criteria.limit);
      if (criteria.offset) params.append('offset', criteria.offset);

      const response = await this.apiClient.get(`/taskinstance?${params.toString()}`);
      return response.data;
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to list task instances: ${error.message}`
      );
    }
  }

  async getWorkflowInstance(workflowInstanceId) {
    await this.ensureAuthenticated();
    
    try {
      const response = await this.apiClient.get(`/workflowinstance/${workflowInstanceId}`);
      return response.data;
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to get workflow instance: ${error.message}`
      );
    }
  }

  async getWorkflowInstanceDependencies(workflowInstanceId) {
    await this.ensureAuthenticated();
    
    try {
      const response = await this.apiClient.get(`/workflowinstance/${workflowInstanceId}/dependencies`);
      return response.data;
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to get workflow instance dependencies: ${error.message}`
      );
    }
  }

  async listTasks(criteria = {}) {
    await this.ensureAuthenticated();
    
    try {
      const params = new URLSearchParams();
      
      if (criteria.name) params.append('name', criteria.name);
      if (criteria.type) params.append('type', criteria.type);
      if (criteria.status) params.append('status', criteria.status);
      if (criteria.agent) params.append('agent', criteria.agent);
      if (criteria.limit) params.append('limit', criteria.limit);
      if (criteria.offset) params.append('offset', criteria.offset);

      const response = await this.apiClient.get(`/task?${params.toString()}`);
      return response.data;
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to list tasks: ${error.message}`
      );
    }
  }

  async getTask(taskId) {
    await this.ensureAuthenticated();
    
    try {
      const response = await this.apiClient.get(`/task/${taskId}`);
      return response.data;
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to get task: ${error.message}`
      );
    }
  }

  async listUniversalAgents(criteria = {}) {
    await this.ensureAuthenticated();
    
    try {
      const params = new URLSearchParams();
      
      if (criteria.name) params.append('name', criteria.name);
      if (criteria.status) params.append('status', criteria.status);
      if (criteria.type) params.append('type', criteria.type);
      if (criteria.limit) params.append('limit', criteria.limit);
      if (criteria.offset) params.append('offset', criteria.offset);

      const response = await this.apiClient.get(`/agent?${params.toString()}`);
      return response.data;
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to list universal agents: ${error.message}`
      );
    }
  }

  async getUniversalAgent(agentId) {
    await this.ensureAuthenticated();
    
    try {
      const response = await this.apiClient.get(`/agent/${agentId}`);
      return response.data;
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to get universal agent: ${error.message}`
      );
    }
  }

  setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: "get_task_instance",
          description: "Get details of a specific task instance by ID",
          inputSchema: {
            type: "object",
            properties: {
              taskInstanceId: {
                type: "string",
                description: "The ID of the task instance to retrieve",
              },
            },
            required: ["taskInstanceId"],
          },
        },
        {
          name: "get_task_instance_dependencies",
          description: "Get dependencies of a specific task instance",
          inputSchema: {
            type: "object",
            properties: {
              taskInstanceId: {
                type: "string",
                description: "The ID of the task instance to get dependencies for",
              },
            },
            required: ["taskInstanceId"],
          },
        },
        {
          name: "list_task_instances",
          description: "List task instances with optional filtering criteria",
          inputSchema: {
            type: "object",
            properties: {
              status: {
                type: "string",
                description: "Filter by task instance status (e.g., 'Running', 'Success', 'Failure')",
              },
              taskname: {
                type: "string",
                description: "Filter by task name",
              },
              workflowInstanceId: {
                type: "string",
                description: "Filter by workflow instance ID",
              },
              limit: {
                type: "string",
                description: "Maximum number of results to return",
              },
              offset: {
                type: "string",
                description: "Number of results to skip",
              },
            },
            required: [],
          },
        },
        {
          name: "get_workflow_instance",
          description: "Get details of a specific workflow instance by ID",
          inputSchema: {
            type: "object",
            properties: {
              workflowInstanceId: {
                type: "string",
                description: "The ID of the workflow instance to retrieve",
              },
            },
            required: ["workflowInstanceId"],
          },
        },
        {
          name: "get_workflow_instance_dependencies",
          description: "Get dependencies of a specific workflow instance",
          inputSchema: {
            type: "object",
            properties: {
              workflowInstanceId: {
                type: "string",
                description: "The ID of the workflow instance to get dependencies for",
              },
            },
            required: ["workflowInstanceId"],
          },
        },
        {
          name: "list_tasks",
          description: "List task definitions with optional filtering criteria",
          inputSchema: {
            type: "object",
            properties: {
              name: {
                type: "string",
                description: "Filter by task name",
              },
              type: {
                type: "string",
                description: "Filter by task type (e.g., 'Linux/Unix', 'Windows', 'z/OS')",
              },
              status: {
                type: "string",
                description: "Filter by task status",
              },
              agent: {
                type: "string",
                description: "Filter by agent name",
              },
              limit: {
                type: "string",
                description: "Maximum number of results to return",
              },
              offset: {
                type: "string",
                description: "Number of results to skip",
              },
            },
            required: [],
          },
        },
        {
          name: "get_task",
          description: "Get details of a specific task definition by ID",
          inputSchema: {
            type: "object",
            properties: {
              taskId: {
                type: "string",
                description: "The ID of the task to retrieve",
              },
            },
            required: ["taskId"],
          },
        },
        {
          name: "list_universal_agents",
          description: "List universal agents with optional filtering criteria",
          inputSchema: {
            type: "object",
            properties: {
              name: {
                type: "string",
                description: "Filter by agent name",
              },
              status: {
                type: "string",
                description: "Filter by agent status (e.g., 'Online', 'Offline')",
              },
              type: {
                type: "string",
                description: "Filter by agent type",
              },
              limit: {
                type: "string",
                description: "Maximum number of results to return",
              },
              offset: {
                type: "string",
                description: "Number of results to skip",
              },
            },
            required: [],
          },
        },
        {
          name: "get_universal_agent",
          description: "Get details of a specific universal agent by ID",
          inputSchema: {
            type: "object",
            properties: {
              agentId: {
                type: "string",
                description: "The ID of the universal agent to retrieve",
              },
            },
            required: ["agentId"],
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case "get_task_instance":
            const taskInstance = await this.getTaskInstance(args.taskInstanceId);
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(taskInstance, null, 2),
                },
              ],
            };

          case "get_task_instance_dependencies":
            const taskDependencies = await this.getTaskInstanceDependencies(args.taskInstanceId);
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(taskDependencies, null, 2),
                },
              ],
            };

          case "list_task_instances":
            const taskInstances = await this.listTaskInstances(args);
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(taskInstances, null, 2),
                },
              ],
            };

          case "get_workflow_instance":
            const workflowInstance = await this.getWorkflowInstance(args.workflowInstanceId);
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(workflowInstance, null, 2),
                },
              ],
            };

          case "get_workflow_instance_dependencies":
            const workflowDependencies = await this.getWorkflowInstanceDependencies(args.workflowInstanceId);
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(workflowDependencies, null, 2),
                },
              ],
            };

          case "list_tasks":
            const tasks = await this.listTasks(args);
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(tasks, null, 2),
                },
              ],
            };

          case "get_task":
            const task = await this.getTask(args.taskId);
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(task, null, 2),
                },
              ],
            };

          case "list_universal_agents":
            const agents = await this.listUniversalAgents(args);
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(agents, null, 2),
                },
              ],
            };

          case "get_universal_agent":
            const agent = await this.getUniversalAgent(args.agentId);
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(agent, null, 2),
                },
              ],
            };

          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${name}`
            );
        }
      } catch (error) {
        if (error instanceof McpError) {
          throw error;
        }
        throw new McpError(
          ErrorCode.InternalError,
          `Tool execution failed: ${error.message}`
        );
      }
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("Stonebranch MCP Server running on stdio");
  }
}

const server = new StoneBranchMCPServer();
server.run().catch(console.error);