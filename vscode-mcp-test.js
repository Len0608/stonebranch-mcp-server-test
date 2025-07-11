#!/usr/bin/env node

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

class VSCodeMCPIntegration {
    constructor() {
        this.server = null;
        this.requestId = 0;
        this.tools = [];
    }

    async startServer() {
        console.log("🚀 Starting Stonebranch MCP Server for VSCode...");
        
        this.server = spawn("node", ["index.js"], {
            stdio: ["pipe", "pipe", "pipe"],
            env: {
                ...process.env,
                STONEBRANCH_BASE_URL: "https://ps1.stonebranchdev.cloud",
                STONEBRANCH_USERNAME: "observability",
                STONEBRANCH_PASSWORD: "deadman26"
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
            console.log('📋 MCP Server ready:', data.toString().trim());
        });

        // Initialize
        await this.sendRequest("initialize", {
            protocolVersion: "2024-11-05",
            capabilities: {},
            clientInfo: { name: "vscode-test", version: "1.0.0" }
        });

        // Get tools
        await this.sendRequest("tools/list", {});
    }

    async sendRequest(method, params) {
        const request = {
            jsonrpc: "2.0",
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
            console.log("✅ Available Stonebranch tools for VSCode:");
            this.tools.forEach(tool => {
                console.log(`  🔧 ${tool.name}: ${tool.description}`);
            });
            this.generateVSCodeSnippets();
        }
        if (this.pendingResolve) {
            this.pendingResolve(response);
            this.pendingResolve = null;
        }
    }

    async callTool(toolName, args) {
        const response = await this.sendRequest("tools/call", {
            name: toolName,
            arguments: args
        });
        return response.result;
    }

    generateVSCodeSnippets() {
        const snippets = {
            "Stonebranch List Tasks": {
                "prefix": "sb-list-tasks",
                "body": [
                    "// List Stonebranch Tasks",
                    "const result = await mcpClient.callTool('list_tasks', {});",
                    "console.log('Tasks:', result.content[0].text);"
                ],
                "description": "List Stonebranch task definitions"
            },
            "Stonebranch List Agents": {
                "prefix": "sb-list-agents",
                "body": [
                    "// List Universal Agents",
                    "const result = await mcpClient.callTool('list_universal_agents', {});",
                    "console.log('Agents:', result.content[0].text);"
                ],
                "description": "List Stonebranch universal agents"
            },
            "Stonebranch Get Task Instance": {
                "prefix": "sb-get-task-instance",
                "body": [
                    "// Get Task Instance",
                    "const result = await mcpClient.callTool('get_task_instance', {",
                    "    taskInstanceId: '${1:task-id}'",
                    "});",
                    "console.log('Task Instance:', result.content[0].text);"
                ],
                "description": "Get specific task instance details"
            }
        };

        // Save snippets file
        fs.writeFileSync('./stonebranch-snippets.json', JSON.stringify(snippets, null, 2));
        console.log("📝 Generated VSCode snippets: stonebranch-snippets.json");
    }

    async demoUseCases() {
        console.log("\n🎯 Demo: VSCode Use Cases with Stonebranch MCP");
        
        // Use Case 1: List Tasks
        console.log("\n1. 📋 Listing Tasks (shows parameter requirements):");
        try {
            const result = await this.callTool('list_tasks', {});
            console.log(result.content[0].text);
        } catch (error) {
            console.log("Error:", error.message);
        }

        // Use Case 2: List Agents
        console.log("\n2. 🤖 Listing Agents (shows parameter requirements):");
        try {
            const result = await this.callTool('list_universal_agents', {});
            console.log(result.content[0].text);
        } catch (error) {
            console.log("Error:", error.message);
        }

        // Use Case 3: Get Task Instance
        console.log("\n3. 📊 Getting Task Instance:");
        try {
            const result = await this.callTool('get_task_instance', { taskInstanceId: 'test-123' });
            console.log(result.content[0].text);
        } catch (error) {
            console.log("Error:", error.message);
        }

        console.log("\n🎉 VSCode integration demo complete!");
        console.log("💡 Next steps:");
        console.log("  1. Install Continue.dev extension");
        console.log("  2. Configure with your MCP server");
        console.log("  3. Use snippets in your development workflow");
    }

    cleanup() {
        if (this.server) {
            this.server.kill();
        }
    }
}

async function main() {
    const integration = new VSCodeMCPIntegration();
    
    try {
        await integration.startServer();
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for tools to load
        await integration.demoUseCases();
    } catch (error) {
        console.error("❌ Error:", error.message);
    } finally {
        integration.cleanup();
    }
}

main().catch(console.error);