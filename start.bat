@echo off
echo Starting VoteHub Application...

echo Starting MongoDB (if it's not already running)...
start mongod

echo Starting Backend...
cd server
start cmd /k npm run dev

echo Starting Frontend...
cd ../client
start cmd /k npm start

echo VoteHub servers started successfully!
echo Backend running on http://localhost:5000
echo Frontend running on http://localhost:3000 