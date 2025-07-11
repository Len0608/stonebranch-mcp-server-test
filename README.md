# Stonebranch Universal Controller MCP Server

A Model Context Protocol (MCP) server that provides integration with Stonebranch Universal Controller, enabling you to interact with task instances and their dependencies through a standardized interface.

## Features

- **Task Instance Management**: Retrieve detailed information about specific task instances
- **Dependency Tracking**: Get dependency information for task instances and workflows
- **Task Instance Listing**: List task instances with flexible filtering options
- **Workflow Instance Support**: Access workflow instances and their dependencies
- **Task Definition Management**: List and retrieve task definitions
- **Universal Agent Management**: List and retrieve universal agent information
- **Secure Authentication**: Token-based authentication with the Universal Controller API

## Available Tools

### Task Instance Management

#### `get_task_instance`
Retrieves detailed information about a specific task instance by ID.

**Parameters:**
- `taskInstanceId` (string, required): The ID of the task instance to retrieve

#### `get_task_instance_dependencies`
Gets the dependencies of a specific task instance.

**Parameters:**
- `taskInstanceId` (string, required): The ID of the task instance to get dependencies for

#### `list_task_instances`
Lists task instances with optional filtering criteria.

**Parameters:**
- `status` (string, optional): Filter by task instance status (e.g., 'Running', 'Success', 'Failure')
- `taskname` (string, optional): Filter by task name
- `workflowInstanceId` (string, optional): Filter by workflow instance ID
- `limit` (string, optional): Maximum number of results to return
- `offset` (string, optional): Number of results to skip

### Workflow Instance Management

#### `get_workflow_instance`
Retrieves detailed information about a specific workflow instance by ID.

**Parameters:**
- `workflowInstanceId` (string, required): The ID of the workflow instance to retrieve

#### `get_workflow_instance_dependencies`
Gets the dependencies of a specific workflow instance.

**Parameters:**
- `workflowInstanceId` (string, required): The ID of the workflow instance to get dependencies for

### Task Definition Management

#### `list_tasks`
Lists task definitions with optional filtering criteria.

**Parameters:**
- `name` (string, optional): Filter by task name
- `type` (string, optional): Filter by task type (e.g., 'Linux/Unix', 'Windows', 'z/OS')
- `status` (string, optional): Filter by task status
- `agent` (string, optional): Filter by agent name
- `limit` (string, optional): Maximum number of results to return
- `offset` (string, optional): Number of results to skip

#### `get_task`
Gets detailed information about a specific task definition by ID.

**Parameters:**
- `taskId` (string, required): The ID of the task to retrieve

### Universal Agent Management

#### `list_universal_agents`
Lists universal agents with optional filtering criteria.

**Parameters:**
- `name` (string, optional): Filter by agent name
- `status` (string, optional): Filter by agent status (e.g., 'Online', 'Offline')
- `type` (string, optional): Filter by agent type
- `limit` (string, optional): Maximum number of results to return
- `offset` (string, optional): Number of results to skip

#### `get_universal_agent`
Gets detailed information about a specific universal agent by ID.

**Parameters:**
- `agentId` (string, required): The ID of the universal agent to retrieve

## Installation

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```

## Configuration

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and configure your Stonebranch Universal Controller connection:
   ```
   STONEBRANCH_BASE_URL=https://your-uc-server:8080
   STONEBRANCH_USERNAME=your-username
   STONEBRANCH_PASSWORD=your-password
   ```

## Usage

### Running the Server

```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

### Using with Claude Desktop

Add the following to your Claude Desktop MCP settings:

```json
{
  "mcpServers": {
    "stonebranch": {
      "command": "node",
      "args": ["/path/to/stonebranch-mcp-server/index.js"],
      "env": {
        "STONEBRANCH_BASE_URL": "https://your-uc-server:8080",
        "STONEBRANCH_USERNAME": "your-username",
        "STONEBRANCH_PASSWORD": "your-password"
      }
    }
  }
}
```

## API Endpoints

The server interacts with the following Universal Controller REST API endpoints:

- `GET /uc/resources/taskinstance/{id}` - Get task instance details
- `GET /uc/resources/taskinstance/{id}/dependencies` - Get task instance dependencies
- `GET /uc/resources/taskinstance` - List task instances
- `GET /uc/resources/workflowinstance/{id}` - Get workflow instance details
- `GET /uc/resources/workflowinstance/{id}/dependencies` - Get workflow instance dependencies
- `GET /uc/resources/task/{id}` - Get task definition details
- `GET /uc/resources/task` - List task definitions
- `GET /uc/resources/agent/{id}` - Get universal agent details
- `GET /uc/resources/agent` - List universal agents
- `POST /uc/resources/user/ops-login` - Authentication

## Error Handling

The server includes comprehensive error handling for:
- Authentication failures
- Network connectivity issues
- API endpoint errors
- Missing or invalid parameters

## Security

- Uses token-based authentication with the Universal Controller
- Supports HTTPS connections (with option to disable certificate validation for development)
- Environment variable configuration for credentials

## Development

The server is built using:
- Node.js with ES modules
- Model Context Protocol SDK
- Axios for HTTP requests
- dotenv for environment configuration

## License

MIT