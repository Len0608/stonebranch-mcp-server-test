#!/usr/bin/env node

import { spawn } from 'child_process';
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

async function debugMCP() {
    console.log("🔍 Debugging MCP Server...");
    
    // Start MCP server
    const server = spawn("node", ["index.js"], {
        stdio: ["pipe", "pipe", "pipe"],
        env: {
            ...process.env,
            STONEBRANCH_BASE_URL: "https://ps1.stonebranchdev.cloud",
            STONEBRANCH_USERNAME: "observability",
            STONEBRANCH_PASSWORD: "deadman26"
        }
    });

    server.stderr.on('data', (data) => {
        console.log('Server stderr:', data.toString());
    });

    // Create client
    const client = new Client({
        name: "debug-client",
        version: "1.0.0"
    }, {
        capabilities: {}
    });

    try {
        console.log("🔌 Connecting to MCP server...");
        
        const transport = new StdioClientTransport({
            reader: server.stdout,
            writer: server.stdin
        });

        await client.connect(transport);
        console.log("✅ Connected successfully!");

        // Test listing tools
        console.log("📋 Listing available tools...");
        const { tools } = await client.listTools();
        console.log("🔧 Tools found:", tools.map(t => `${t.name}: ${t.description}`));

        // Test calling a tool
        console.log("\n🧪 Testing list_task_instances tool...");
        const result = await client.callTool({
            name: "list_task_instances",
            arguments: {}
        });
        console.log("📄 Tool response:", result.content[0].text);

        // Test with parameters
        console.log("\n🧪 Testing get_task tool...");
        const taskResult = await client.callTool({
            name: "get_task",
            arguments: { taskId: "test-123" }
        });
        console.log("📄 Task response:", taskResult.content[0].text);

        console.log("\n✅ MCP Server is working correctly!");
        console.log("🎯 Your MCP server can be used with any MCP-compatible LLM");

    } catch (error) {
        console.error("❌ MCP Debug Error:", error.message);
        console.error("📋 Full error:", error);
    } finally {
        server.kill();
    }
}

debugMCP().catch(console.error);