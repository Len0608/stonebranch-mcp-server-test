const vscode = require('vscode');
const { spawn } = require('child_process');

class StoneBranchMCPClient {
    constructor() {
        this.server = null;
        this.requestId = 0;
        this.tools = [];
    }

    async startServer() {
        if (this.server) {
            return;
        }

        console.log('Starting Stonebranch MCP Server...');
        
        this.server = spawn('node', ['/home/len/ClaudeCode/index.js'], {
            stdio: ['pipe', 'pipe', 'pipe'],
            env: {
                ...process.env,
                STONEBRANCH_BASE_URL: 'https://ps1.stonebranchdev.cloud',
                STONEBRANCH_USERNAME: 'observability',
                STONEBRANCH_PASSWORD: 'deadman26'
            }
        });

        this.server.stdout.on('data', (data) => {
            const responses = data.toString().split('\n').filter(line => line.trim());
            for (const response of responses) {
                try {
                    const parsed = JSON.parse(response);
                    this.handleResponse(parsed);
                } catch (e) {
                    // Ignore parsing errors
                }
            }
        });

        this.server.stderr.on('data', (data) => {
            console.log('MCP Server ready:', data.toString());
        });

        // Initialize
        await this.sendRequest('initialize', {
            protocolVersion: '2024-11-05',
            capabilities: {},
            clientInfo: { name: 'vscode-client', version: '1.0.0' }
        });

        // Get tools
        await this.sendRequest('tools/list', {});
    }

    async sendRequest(method, params) {
        const request = {
            jsonrpc: '2.0',
            id: ++this.requestId,
            method,
            params
        };
        
        this.server.stdin.write(JSON.stringify(request) + '\n');
        return new Promise(resolve => {
            this.pendingResolve = resolve;
        });
    }

    handleResponse(response) {
        if (response.result && response.result.tools) {
            this.tools = response.result.tools;
            vscode.window.showInformationMessage(`Stonebranch MCP: ${this.tools.length} tools available`);
        }
        if (this.pendingResolve) {
            this.pendingResolve(response);
            this.pendingResolve = null;
        }
    }

    async callTool(toolName, args) {
        const response = await this.sendRequest('tools/call', {
            name: toolName,
            arguments: args
        });
        return response.result;
    }

    dispose() {
        if (this.server) {
            this.server.kill();
            this.server = null;
        }
    }
}

let mcpClient = null;

function activate(context) {
    console.log('Stonebranch MCP Assistant is now active!');

    mcpClient = new StoneBranchMCPClient();

    // Register commands
    const startCommand = vscode.commands.registerCommand('stonebranch.start', async () => {
        try {
            await mcpClient.startServer();
            vscode.window.showInformationMessage('Stonebranch MCP Assistant started successfully!');
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to start MCP server: ${error.message}`);
        }
    });

    const listTasksCommand = vscode.commands.registerCommand('stonebranch.listTasks', async () => {
        try {
            const result = await mcpClient.callTool('list_tasks', {});
            const content = result.content[0].text;
            
            // Show in a new document
            const doc = await vscode.workspace.openTextDocument({
                content: content,
                language: 'json'
            });
            await vscode.window.showTextDocument(doc);
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to list tasks: ${error.message}`);
        }
    });

    const listAgentsCommand = vscode.commands.registerCommand('stonebranch.listAgents', async () => {
        try {
            const result = await mcpClient.callTool('list_universal_agents', {});
            const content = result.content[0].text;
            
            // Show in a new document
            const doc = await vscode.workspace.openTextDocument({
                content: content,
                language: 'json'
            });
            await vscode.window.showTextDocument(doc);
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to list agents: ${error.message}`);
        }
    });

    context.subscriptions.push(startCommand, listTasksCommand, listAgentsCommand);
}

function deactivate() {
    if (mcpClient) {
        mcpClient.dispose();
    }
}

module.exports = {
    activate,
    deactivate
};