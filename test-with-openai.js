#!/usr/bin/env node

import { spawn } from 'child_process';
import readline from 'readline';

class MCPChat {
    constructor() {
        this.server = null;
        this.requestId = 0;
        this.tools = [];
    }

    async startServer() {
        console.log("🚀 Starting Stonebranch MCP Server...");
        
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
            console.log('📋 Server ready:', data.toString().trim());
        });

        // Initialize
        await this.sendRequest("initialize", {
            protocolVersion: "2024-11-05",
            capabilities: {},
            clientInfo: { name: "test-client", version: "1.0.0" }
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
            console.log("✅ Available Stonebranch tools:");
            this.tools.forEach(tool => {
                console.log(`  🔧 ${tool.name}: ${tool.description}`);
            });
            this.startChat();
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

    startChat() {
        console.log("\n💬 MCP Chat Started!");
        console.log("💡 Try: 'list agents', 'list tasks', 'get task instances', 'quit'");
        
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        const askQuestion = () => {
            rl.question("\n👤 You: ", async (input) => {
                if (input.toLowerCase() === 'quit') {
                    console.log("👋 Goodbye!");
                    this.server.kill();
                    process.exit(0);
                }

                try {
                    const response = await this.processInput(input);
                    console.log(`🤖 MCP Response: ${response}`);
                } catch (error) {
                    console.log(`❌ Error: ${error.message}`);
                }

                askQuestion();
            });
        };

        askQuestion();
    }

    async processInput(input) {
        const lower = input.toLowerCase();
        
        if (lower.includes('list agents') || lower.includes('agents')) {
            const result = await this.callTool('list_universal_agents', {});
            return result.content[0].text;
        }
        
        if (lower.includes('list tasks') || lower.includes('tasks')) {
            const result = await this.callTool('list_tasks', {});
            return result.content[0].text;
        }
        
        if (lower.includes('task instances')) {
            const result = await this.callTool('list_task_instances', {});
            return result.content[0].text;
        }
        
        if (lower.includes('tools')) {
            return `Available tools: ${this.tools.map(t => t.name).join(', ')}`;
        }

        return "I can help with: 'list agents', 'list tasks', 'task instances', 'tools'";
    }
}

const chat = new MCPChat();
chat.startServer().catch(console.error);