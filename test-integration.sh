#!/bin/bash
# Integration test for the Claude Computer Use MCP Server

echo "Testing Claude Computer Use MCP Server..."

# Test 1: Check if the server starts without errors
echo "Test 1: Starting server..."
timeout 5s node dist/index.js 2>&1 | head -n 1 | grep -q "Claude Computer Use MCP Server started" && echo "✓ Server starts successfully" || echo "✗ Server failed to start"

# Test 2: Send a tools/list request to the server
echo -e "\nTest 2: Testing tools/list request..."
echo '{"jsonrpc":"2.0","method":"tools/list","params":{},"id":1}' | timeout 2s node dist/index.js 2>/dev/null | jq -r '.result.tools[0].name' | grep -q "browser_launch" && echo "✓ Tools list works" || echo "✗ Tools list failed"

# Test 3: Check if all expected tools are present
echo -e "\nTest 3: Checking all tools are registered..."
EXPECTED_TOOLS=("browser_launch" "browser_navigate" "browser_screenshot" "browser_click" "browser_type" "browser_select" "browser_wait" "browser_execute" "browser_get_text" "browser_get_attribute" "browser_get_url" "browser_get_title" "browser_list_sessions" "browser_close")
TOOLS_JSON=$(echo '{"jsonrpc":"2.0","method":"tools/list","params":{},"id":1}' | timeout 2s node dist/index.js 2>/dev/null)

for tool in "${EXPECTED_TOOLS[@]}"; do
    echo "$TOOLS_JSON" | jq -r '.result.tools[].name' | grep -q "^${tool}$" && echo "  ✓ $tool" || echo "  ✗ $tool missing"
done

echo -e "\nIntegration test complete!"