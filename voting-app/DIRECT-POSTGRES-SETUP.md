# Setting Up Direct PostgreSQL Connection for VoteHub

This guide walks you through connecting VoteHub directly to the Supabase PostgreSQL database.

## Step 1: Set Up Environment Variables

Replace `[YOUR-PASSWORD]` in your connection string with your actual PostgreSQL password.

You can do this in one of two ways:

### Option A: Using the Setup Script (Recommended)

Run the following command from the `voting-app` directory:

```
node setup-postgres-env.js your-actual-password
```

This will automatically create the `.env` file with the correct connection string.

### Option B: Manual Configuration

1. Open `voting-app/server/.env`
2. Find the line that starts with `DATABASE_URL=`
3. Replace `[YOUR-PASSWORD]` with your actual PostgreSQL password
4. Save the file

## Step 2: Install PostgreSQL Driver

Install the PostgreSQL driver for Node.js:

```
cd voting-app/server
npm install pg
```

## Step 3: Set Up Database Tables

You need to create the necessary database tables in your PostgreSQL database:

1. Find the SQL setup script at `voting-app/server/setup-supabase.js`
2. Copy all the SQL commands from this file
3. Execute these commands in your PostgreSQL database:
   - You can use the Supabase SQL Editor at https://app.supabase.com/project/_/sql
   - Or connect with any PostgreSQL client using your connection string

## Step 4: Start the Application

1. Start the backend:
   ```
   cd voting-app/server
   npm start
   ```

2. Start the frontend in a new terminal:
   ```
   cd voting-app/client
   npm start
   ```

## Verifying the Connection

If the connection is successful, you'll see the following message in your terminal:

```
Connected to PostgreSQL at: [timestamp]
Server running on port 5000 using PostgreSQL
```

You can also check the connection by visiting:
http://localhost:5000/health

This should show the database mode as "PostgreSQL".

## Troubleshooting

### Connection Errors

If you see the error "PostgreSQL connection error", check that:

1. You replaced `[YOUR-PASSWORD]` with the correct password
2. Your IP address is allowed in the Supabase dashboard (Project Settings > Database > Network)
3. The PostgreSQL port 5432 is not blocked by your firewall

### "pg" Module Not Found

If you see an error about the 'pg' module not being found, run:

```
cd voting-app/server
npm install pg
```

### Database Tables Don't Exist

If you're getting SQL errors about missing tables, you need to run the SQL setup script:

1. Copy the SQL from `voting-app/server/setup-supabase.js`
2. Run it in your PostgreSQL database 