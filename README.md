VoteHub - Voting Application
A full-stack application for creating and participating in polls, built with Node.js, Express, React, and PostgreSQL via Supabase.

Features
User authentication with JWT
Create and manage polls
Vote on polls
View poll results
Multi-database support (PostgreSQL, Supabase, or mock database)
Tech Stack
Frontend: React, React Router, Axios
Backend: Node.js, Express
Database: PostgreSQL (direct connection or via Supabase)
Authentication: JWT
Database Options
VoteHub supports three database options:

Direct PostgreSQL (Recommended): Direct connection to your PostgreSQL database
Supabase: Using the Supabase JavaScript client
Mock Database: In-memory storage for development/testing (automatically used if other options fail)
Setup Instructions
Option 1: Setup with Direct PostgreSQL Connection (Recommended)
Configure Environment:

node setup-postgres-env.js your-password
This will create the .env file with your PostgreSQL connection string.

Set up Database Tables:

Copy the SQL statements from server/setup-supabase.js
Run the SQL in your PostgreSQL database
Install Dependencies and Start:

cd server && npm install && npm start
In a separate terminal:

cd client && npm install && npm start
Option 2: Setup with Supabase
Create a Supabase Project:

Sign up at supabase.com
Create a new project and get your URL and API key
Configure Environment:

node setup-supabase-env.js your-project-url.supabase.co your-anon-key
Set up Database Tables:

Go to the SQL Editor in your Supabase dashboard
Copy and execute the SQL statements from server/setup-supabase.js
Start the Application:

cd server && npm install && npm start
In a separate terminal:

cd client && npm install && npm start
Option 3: Setup without Database (Uses Mock Database)
Install Dependencies and Start:

cd server && npm install && npm start
In a separate terminal:

cd client && npm install && npm start
Test Credentials:

Email: test@example.com
Password: password123
For Windows Users
Windows-specific instructions are available in README-WINDOWS.md.

Development
Backend server runs on port 5000
Frontend client runs on port 3000
API endpoints are available at /api/auth/* and /api/polls/*
Database Priority
The application tries to connect to databases in this order:

Direct PostgreSQL connection using DATABASE_URL
Supabase using SUPABASE_URL and SUPABASE_KEY
In-memory mock database (fallback)
License
ISC

Author
Developed by Noel Regis
