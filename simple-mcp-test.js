#!/usr/bin/env node

import { spawn } from 'child_process';

function testMCPServer() {
    console.log("🔍 Testing MCP Server directly...");
    
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

    server.stdout.on('data', (data) => {
        console.log('✅ Server stdout:', data.toString());
    });

    server.stderr.on('data', (data) => {
        console.log('📋 Server stderr:', data.toString());
    });

    server.on('error', (error) => {
        console.error('❌ Server error:', error);
    });

    // Send a basic MCP initialize request
    const initRequest = {
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
            protocolVersion: "2024-11-05",
            capabilities: {},
            clientInfo: {
                name: "test-client",
                version: "1.0.0"
            }
        }
    };

    console.log("📤 Sending initialize request...");
    server.stdin.write(JSON.stringify(initRequest) + '\n');

    setTimeout(() => {
        console.log("🔄 Sending tools/list request...");
        const toolsRequest = {
            jsonrpc: "2.0",
            id: 2,
            method: "tools/list",
            params: {}
        };
        server.stdin.write(JSON.stringify(toolsRequest) + '\n');
    }, 1000);

    setTimeout(() => {
        console.log("🛑 Stopping server...");
        server.kill();
    }, 3000);
}

testMCPServer();