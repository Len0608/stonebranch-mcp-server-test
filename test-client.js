#!/usr/bin/env node

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { spawn } from "child_process";

async function testMCPServer() {
    console.log("🚀 Starting MCP Server test...");
    
    // Start the MCP server process
    const serverProcess = spawn("node", ["index.js"], {
        stdio: ["pipe", "pipe", "inherit"],
        env: {
            ...process.env,
            STONEBRANCH_BASE_URL: "https://your-uc-server:8080",
            STONEBRANCH_USERNAME: "your-username",
            STONEBRANCH_PASSWORD: "your-password"
        }
    });

    // Create transport
    const transport = new StdioClientTransport({
        reader: serverProcess.stdout,
        writer: serverProcess.stdin
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
        await client.connect(transport);
        console.log("✅ Connected to MCP server");

        // List available tools
        const tools = await client.listTools();
        console.log("📋 Available tools:", tools.tools.map(t => t.name));

        // Test getting task instances
        console.log("\n🔍 Testing list_task_instances...");
        const taskInstances = await client.callTool({
            name: "list_task_instances",
            arguments: { limit: "5" }
        });
        console.log("📊 Result:", taskInstances.content[0].text);

        // Test getting agents
        console.log("\n🔍 Testing list_universal_agents...");
        const agents = await client.callTool({
            name: "list_universal_agents",
            arguments: {}
        });
        console.log("🤖 Result:", agents.content[0].text);

    } catch (error) {
        console.error("❌ Error:", error.message);
    } finally {
        serverProcess.kill();
        process.exit(0);
    }
}

testMCPServer().catch(console.error);