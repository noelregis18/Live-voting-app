# VoteHub - Windows Installation Guide

This guide provides specific instructions for running the VoteHub application on Windows.

## Prerequisites

1. **Node.js**: Ensure you have Node.js installed (v14.0.0 or higher)
   - Download from [nodejs.org](https://nodejs.org/)

2. **MongoDB** (Optional):
   - The application will now work without MongoDB installed
   - When MongoDB is not available, the app will run with a mock database containing sample data
   - For full functionality with persistent data, install MongoDB from [mongodb.com](https://www.mongodb.com/try/download/community)

## Installation

### Method 1: Using PowerShell Scripts (Recommended)

1. Open PowerShell in the `voting-app` directory
2. Run the server:
   ```
   .\start-server.ps1
   ```
3. Open another PowerShell window in the `voting-app` directory
4. Run the client:
   ```
   .\start-client.ps1
   ```

### Method 2: Manual Installation

1. Start the backend server:
   ```
   cd voting-app\server
   npm install
   npm run dev
   ```

2. Start the frontend client (in a new terminal):
   ```
   cd voting-app\client
   npm install
   npm start
   ```

## Mock Database Mode

When the server cannot connect to MongoDB, it automatically switches to mock database mode:

- Contains pre-defined sample users and polls
- All actions (creating polls, voting, etc.) work but are not persistent
- Data will reset when the server restarts
- Use these test credentials to log in:
  - Email: test@example.com
  - Password: password123

## Troubleshooting

### "Error fetching polls" or "Registration failed"

These issues are usually caused by one of the following:

1. **Server not running**: Make sure the server is running in a separate terminal
2. **Network connectivity**: Verify the server is running by visiting [http://localhost:5000/health](http://localhost:5000/health)
3. **Server crash**: Check the server terminal for any error messages

### PowerShell Command Errors

If you encounter PowerShell execution policy errors, try running:
```
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

## Accessing the Application

- Frontend: [http://localhost:3000](http://localhost:3000)
- Backend API: [http://localhost:5000](http://localhost:5000)
- Health Check: [http://localhost:5000/health](http://localhost:5000/health)

## Developer

Developed by Noel Regis 