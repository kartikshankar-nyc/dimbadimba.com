#!/bin/bash

echo "=== Installing dependencies ==="
npm install --save-dev serve @playwright/test

echo "=== Installing Playwright browser ==="
npx playwright install chromium

echo "=== Starting server ==="
# Start server in background
npx serve . -l 3000 &
SERVER_PID=$!

# Wait for server to start
echo "=== Waiting for server to start ==="
sleep 5

echo "=== Running tests ==="
# Run with retry and increased timeout
npx playwright test --retries=2 --timeout=60000

# Store exit code
TEST_EXIT_CODE=$?

echo "=== Stopping server ==="
# Kill the server
kill $SERVER_PID

# Return the test exit code
echo "=== Tests completed with exit code: $TEST_EXIT_CODE ==="
exit $TEST_EXIT_CODE 