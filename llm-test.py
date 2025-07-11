#!/usr/bin/env python3

import requests
import json

# Your Stonebranch HTTP API
STONEBRANCH_API = "http://localhost:3001"

def call_stonebranch_api(endpoint, params=None):
    """Call your Stonebranch HTTP API"""
    try:
        response = requests.get(f"{STONEBRANCH_API}/api/{endpoint}", params=params)
        return response.json()
    except Exception as e:
        return {"error": str(e)}

def simulate_llm_chat():
    """Simulate an LLM chat session with Stonebranch data"""
    
    print("🤖 Stonebranch AI Assistant")
    print("=" * 50)
    print("Available commands:")
    print("- 'agents' - List universal agents (requires agentname)")
    print("- 'tasks' - List tasks (requires taskname)")
    print("- 'task-instances' - List task instances (requires taskname)")
    print("- 'health' - Check API health")
    print("- 'docs' - Show API documentation")
    print("- 'quit' - Exit")
    print()
    
    while True:
        user_input = input("👤 Ask about Stonebranch: ").strip().lower()
        
        if user_input == 'quit':
            break
            
        elif user_input == 'health':
            result = requests.get(f"{STONEBRANCH_API}/health").json()
            print(f"🟢 API Status: {result['status']} at {result['timestamp']}")
            
        elif user_input == 'docs':
            result = call_stonebranch_api("docs")
            print("📋 Available API endpoints:")
            for endpoint in result.get('endpoints', []):
                print(f"  • {endpoint}")
                
        elif user_input == 'agents':
            agentname = input("  📝 Enter agent name (or 'PROD-AGENT-01' for test): ")
            if agentname:
                result = call_stonebranch_api("agents", {"agentname": agentname})
                print(f"🤖 Agent Result: {json.dumps(result, indent=2)}")
            else:
                result = call_stonebranch_api("agents")
                print(f"ℹ️  {result.get('message', 'No message')}")
                
        elif user_input == 'tasks':
            taskname = input("  📝 Enter task name: ")
            if taskname:
                result = call_stonebranch_api("tasks", {"taskname": taskname})
                print(f"⚙️  Task Result: {json.dumps(result, indent=2)}")
            else:
                result = call_stonebranch_api("tasks")
                print(f"ℹ️  {result.get('message', 'No message')}")
                
        elif user_input == 'task-instances':
            taskname = input("  📝 Enter task name: ")
            if taskname:
                result = call_stonebranch_api("task-instances", {"taskname": taskname})
                print(f"📊 Task Instance Result: {json.dumps(result, indent=2)}")
            else:
                result = call_stonebranch_api("task-instances")
                print(f"ℹ️  {result.get('message', 'No message')}")
                
        else:
            print("🤔 I understand you want to know about Stonebranch.")
            print("   Try specific commands like 'health', 'agents', 'tasks', or 'task-instances'")
            print("   Your Stonebranch Universal Controller API is working!")

if __name__ == "__main__":
    simulate_llm_chat()