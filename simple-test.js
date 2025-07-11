#!/usr/bin/env node

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { spawn } from "child_process";

async function testMCP() {
    console.log("🚀 Testing MCP Server...");
    
    // Start MCP server
    const server = spawn("node", ["index.js"], {
        stdio: ["pipe", "pipe", "pipe"]
    });

    // Create client
    const client = new Client({
        name: "test-client",
        version: "1.0.0"
    }, {
        capabilities: {}
    });

    try {
        // Connect
        const transport = new StdioClientTransport({
            reader: server.stdout,
            writer: server.stdin
        });

        await client.connect(transport);
        console.log("✅ Connected to MCP server");

        // List tools
        const { tools } = await client.listTools();
        console.log("📋 Available tools:", tools.map(t => t.name).join(", "));

        // Test a tool
        console.log("\n🔍 Testing list_task_instances (should show helpful message)...");
        const result = await client.callTool({
            name: "list_task_instances",
            arguments: {}
        });
        console.log("📄 Result:", result.content[0].text);

        // Test with specific task
        console.log("\n🔍 Testing get_task...");
        const taskResult = await client.callTool({
            name: "get_task",
            arguments: { taskId: "test-task-123" }
        });
        console.log("📄 Task Result:", taskResult.content[0].text);

    } catch (error) {
        console.error("❌ Error:", error.message);
    } finally {
        server.kill();
        process.exit(0);
    }
}

testMCP().catch(console.error);