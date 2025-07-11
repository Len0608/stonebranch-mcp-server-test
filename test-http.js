#!/usr/bin/env node

import axios from 'axios';

const BASE_URL = 'http://localhost:3001';

async function testHTTPServer() {
    console.log("🚀 Testing HTTP API Server...");
    
    const tests = [
        {
            name: "Health Check",
            url: `${BASE_URL}/health`,
            method: "GET"
        },
        {
            name: "API Documentation",
            url: `${BASE_URL}/api/docs`,
            method: "GET"
        },
        {
            name: "List Task Instances",
            url: `${BASE_URL}/api/task-instances`,
            method: "GET"
        },
        {
            name: "List Universal Agents",
            url: `${BASE_URL}/api/agents`,
            method: "GET"
        },
        {
            name: "List Tasks",
            url: `${BASE_URL}/api/tasks`,
            method: "GET"
        },
        {
            name: "List Task Instances (Running)",
            url: `${BASE_URL}/api/task-instances?status=Running`,
            method: "GET"
        },
        {
            name: "List Agents (Online)",
            url: `${BASE_URL}/api/agents?status=Online`,
            method: "GET"
        }
    ];

    for (const test of tests) {
        try {
            console.log(`\n🔍 Testing: ${test.name}`);
            console.log(`   URL: ${test.url}`);
            
            const response = await axios({
                method: test.method,
                url: test.url,
                timeout: 10000
            });
            
            console.log(`   ✅ Status: ${response.status}`);
            
            if (test.name === "API Documentation") {
                console.log(`   📋 Endpoints: ${response.data.endpoints?.length || 0}`);
            } else if (response.data && Array.isArray(response.data)) {
                console.log(`   📊 Items: ${response.data.length}`);
            } else if (response.data) {
                console.log(`   📄 Response: ${JSON.stringify(response.data).substring(0, 100)}...`);
            }
            
        } catch (error) {
            console.log(`   ❌ Error: ${error.message}`);
            if (error.response) {
                console.log(`   📄 Response: ${JSON.stringify(error.response.data).substring(0, 200)}...`);
            }
        }
    }
}

testHTTPServer().catch(console.error);