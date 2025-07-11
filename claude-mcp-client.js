#!/usr/bin/env node

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { spawn } from "child_process";
import readline from "readline";

class ClaudeMCPClient {
    constructor() {
        this.client = null;
        this.server = null;
        this.tools = [];
    }

    async initialize() {
        console.log("🚀 Starting Stonebranch MCP Client...");
        
        // Start MCP server
        this.server = spawn("node", ["index.js"], {
            stdio: ["pipe", "pipe", "pipe"]
        });

        // Create MCP client
        this.client = new Client({
            name: "claude-mcp-client",
            version: "1.0.0"
        }, {
            capabilities: {}
        });

        // Connect to MCP server
        const transport = new StdioClientTransport({
            reader: this.server.stdout,
            writer: this.server.stdin
        });

        await this.client.connect(transport);
        
        // Get available tools
        const { tools } = await this.client.listTools();
        this.tools = tools;
        
        console.log("✅ Connected to Stonebranch MCP Server");
        console.log("📋 Available tools:", tools.map(t => t.name).join(", "));
    }

    async processUserQuery(query) {
        console.log(`\n🤖 Processing: "${query}"`);
        
        // Simple query processing (you'd use Claude API here)
        let response = await this.handleQuery(query);
        
        return response;
    }

    async handleQuery(query) {
        const lowerQuery = query.toLowerCase();
        
        if (lowerQuery.includes("task instance") || lowerQuery.includes("running task")) {
            return await this.callTool("list_task_instances", {});
        } else if (lowerQuery.includes("agent") || lowerQuery.includes("universal agent")) {
            return await this.callTool("list_universal_agents", {});
        } else if (lowerQuery.includes("task") && !lowerQuery.includes("instance")) {
            return await this.callTool("list_tasks", {});
        } else if (lowerQuery.includes("health") || lowerQuery.includes("status")) {
            return "✅ MCP Server is running and connected to Stonebranch Universal Controller";
        } else {
            return `🤔 I can help you with:
- Task instances (try: "show me task instances")
- Universal agents (try: "list agents")
- Tasks (try: "show tasks")
- Health status (try: "check health")

Available tools: ${this.tools.map(t => t.name).join(", ")}`;
        }
    }

    async callTool(toolName, args) {
        try {
            const result = await this.client.callTool({
                name: toolName,
                arguments: args
            });
            return result.content[0].text;
        } catch (error) {
            return `❌ Error calling ${toolName}: ${error.message}`;
        }
    }

    async startChat() {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        console.log("\n💬 Chat started! Type 'quit' to exit.");
        console.log("💡 Try: 'show me task instances', 'list agents', 'check health'");

        const askQuestion = () => {
            rl.question("\n👤 You: ", async (input) => {
                if (input.toLowerCase() === 'quit') {
                    console.log("👋 Goodbye!");
                    rl.close();
                    this.server.kill();
                    process.exit(0);
                }

                const response = await this.processUserQuery(input);
                console.log(`🤖 Assistant: ${response}`);
                
                askQuestion();
            });
        };

        askQuestion();
    }
}

async function main() {
    const client = new ClaudeMCPClient();
    
    try {
        await client.initialize();
        await client.startChat();
    } catch (error) {
        console.error("❌ Error:", error.message);
        process.exit(1);
    }
}

main().catch(console.error);