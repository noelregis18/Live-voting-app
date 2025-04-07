const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();

// CORS configuration
app.use(cors({
  origin: '*',  // Allow all origins
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
  optionsSuccessStatus: 200
}));

// Middleware
app.use(express.json());

// Initialize PostgreSQL connection
let pgPool = null;
let usePgPool = false;

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || 'https://onqdltwevkeeptipypjl.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'your-anon-key';
let supabase = null;
let useSupabase = false;

// Check if we should force mock database
const forceMock = process.env.FORCE_MOCK === 'true';
if (forceMock) {
  console.log('⚠️ FORCE_MOCK is enabled - using mock database');
  usePgPool = false;
  useSupabase = false;
} else {
  // Try to connect to PostgreSQL directly
  try {
    // Replace [YOUR-PASSWORD] with the actual password in the DATABASE_URL
    const databaseUrl = process.env.DATABASE_URL;
    
    console.log('Attempting to connect to PostgreSQL...');
    console.log('Database URL format:', databaseUrl?.replace(/postgres:.+@/, 'postgres://[REDACTED]@'));
    
    if (databaseUrl && !databaseUrl.includes('your-password')) {
      pgPool = new Pool({
        connectionString: databaseUrl,
        ssl: {
          rejectUnauthorized: false
        }
      });
      
      // Test the connection
      pgPool.query('SELECT NOW()', (err, res) => {
        if (err) {
          console.error('PostgreSQL connection error:', err.message);
          console.error('Check that your PostgreSQL password is correct and that your IP is allowed');
          usePgPool = false;
        } else {
          console.log('Connected to PostgreSQL at:', res.rows[0].now);
          usePgPool = true;
        }
      });
    } else {
      console.log('No valid PostgreSQL connection string provided or password placeholder not replaced');
      usePgPool = false;
    }
  } catch (error) {
    console.error('PostgreSQL setup error:', error.message);
    console.error('Stack trace:', error.stack);
    usePgPool = false;
  }

  // Try to connect to Supabase as a fallback
  if (!usePgPool) {
    try {
      supabase = createClient(supabaseUrl, supabaseKey);
      useSupabase = true;
      console.log('Connected to Supabase');
    } catch (error) {
      console.error('Supabase connection error:', error.message);
      console.log('Using mock database instead');
      useSupabase = false;
    }
  }
}

// Mock Database (last resort fallback)
const mockDb = {
  users: [
    {
      _id: 'mock-user-1',
      username: 'TestUser',
      email: 'test@example.com',
      password: '$2a$10$LsRwjxHMQHAf.bAMuIX5jevHZ.0XbCIR9Uy/FPyTMQMrO1VHSc1lC', // hashed 'password123'
      createdAt: new Date().toISOString()
    }
  ],
  polls: [
    {
      _id: 'mock-poll-1',
      title: 'Favorite Programming Language',
      options: [
        { text: 'JavaScript', votes: 5 },
        { text: 'Python', votes: 3 },
        { text: 'Java', votes: 2 },
        { text: 'C#', votes: 1 }
      ],
      createdBy: 'mock-user-1',
      createdAt: new Date().toISOString()
    },
    {
      _id: 'mock-poll-2',
      title: 'Best Web Framework',
      options: [
        { text: 'React', votes: 4 },
        { text: 'Vue', votes: 3 },
        { text: 'Angular', votes: 2 },
        { text: 'Svelte', votes: 1 }
      ],
      createdBy: 'mock-user-1',
      createdAt: new Date(Date.now() - 86400000).toISOString() // Yesterday
    }
  ]
};

// Flag to determine which database to use
let useMockDb = forceMock || (!useSupabase && !usePgPool);

// App info route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Voting App API', 
    developer: 'Developed by Noel Regis',
    dbMode: usePgPool ? 'PostgreSQL' : (useSupabase ? 'Supabase' : 'Mock Database')
  });
});

// PostgreSQL direct access routes
if (usePgPool) {
  // Auth Routes for PostgreSQL
  app.post('/api/auth/register', async (req, res) => {
    try {
      const { username, email, password } = req.body;
      
      // Validate input
      if (!username || !email || !password) {
        return res.status(400).json({ 
          success: false, 
          message: 'Please provide all required fields' 
        });
      }
      
      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      
      // Check if user exists
      const userExistsResult = await pgPool.query(
        'SELECT * FROM users WHERE email = $1',
        [email]
      );
      
      if (userExistsResult.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'User with this email already exists'
        });
      }
      
      // Create user in PostgreSQL
      const newUserResult = await pgPool.query(
        'INSERT INTO users (username, email, password, created_at) VALUES ($1, $2, $3, $4) RETURNING id, username, email, created_at',
        [username, email, hashedPassword, new Date().toISOString()]
      );
      
      const newUser = newUserResult.rows[0];
      
      // Create token
      const token = jwt.sign(
        { id: newUser.id, username: newUser.username },
        process.env.JWT_SECRET || 'votehub-secret',
        { expiresIn: '30d' }
      );
      
      res.status(201).json({
        success: true,
        user: {
          _id: newUser.id,
          username: newUser.username,
          email: newUser.email
        },
        token
      });
      
    } catch (error) {
      console.error('PostgreSQL registration error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error during registration'
      });
    }
  });
  
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      
      // Validate input
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Please provide email and password'
        });
      }
      
      // Get user from PostgreSQL
      const userResult = await pgPool.query(
        'SELECT * FROM users WHERE email = $1',
        [email]
      );
      
      if (userResult.rows.length === 0) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }
      
      const user = userResult.rows[0];
      
      // Verify password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }
      
      // Create token
      const token = jwt.sign(
        { id: user.id, username: user.username },
        process.env.JWT_SECRET || 'votehub-secret',
        { expiresIn: '30d' }
      );
      
      res.json({
        success: true,
        user: {
          _id: user.id,
          username: user.username,
          email: user.email
        },
        token
      });
      
    } catch (error) {
      console.error('PostgreSQL login error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error during login'
      });
    }
  });
  
  app.get('/api/auth/me', async (req, res) => {
    try {
      // Get token from header
      const token = req.headers.authorization?.split(' ')[1];
      
      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'Not authorized'
        });
      }
      
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'votehub-secret');
      
      // Get user from PostgreSQL
      const userResult = await pgPool.query(
        'SELECT id, username, email, created_at FROM users WHERE id = $1',
        [decoded.id]
      );
      
      if (userResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      
      const user = userResult.rows[0];
      
      res.json({
        success: true,
        user: {
          _id: user.id,
          username: user.username,
          email: user.email
        }
      });
      
    } catch (error) {
      console.error('PostgreSQL profile error:', error);
      res.status(401).json({
        success: false,
        message: 'Token is not valid'
      });
    }
  });
  
  // Poll routes for PostgreSQL
  app.get('/api/polls', async (req, res) => {
    try {
      // Get polls with their options
      const pollsResult = await pgPool.query(`
        SELECT 
          p.id, p.title, p.created_by, p.created_at,
          json_agg(
            json_build_object(
              'id', po.id,
              'text', po.text,
              'votes', po.votes
            )
          ) as options
        FROM polls p
        LEFT JOIN poll_options po ON p.id = po.poll_id
        GROUP BY p.id
        ORDER BY p.created_at DESC
      `);
      
      // Format poll data
      const formattedPolls = pollsResult.rows.map(poll => ({
        _id: poll.id,
        title: poll.title,
        createdBy: poll.created_by,
        createdAt: poll.created_at,
        options: poll.options.map(option => ({
          text: option.text,
          votes: option.votes
        })),
        totalVotes: poll.options.reduce((sum, option) => sum + option.votes, 0)
      }));
      
      res.json({
        success: true,
        polls: formattedPolls
      });
      
    } catch (error) {
      console.error('PostgreSQL error fetching polls:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching polls'
      });
    }
  });

  // ... keep other PostgreSQL routes for polls
}

// Auth Routes when using Supabase
if (!useMockDb) {
  app.post('/api/auth/register', async (req, res) => {
    try {
      const { username, email, password } = req.body;
      
      // Validate input
      if (!username || !email || !password) {
        return res.status(400).json({ 
          success: false, 
          message: 'Please provide all required fields' 
        });
      }
      
      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      
      // Check if user exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();
        
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'User with this email already exists'
        });
      }
      
      // Create user in Supabase
      const { data: newUser, error } = await supabase
        .from('users')
        .insert([
          { 
            username, 
            email, 
            password: hashedPassword,
            created_at: new Date().toISOString()
          }
        ])
        .select()
        .single();
      
      if (error) {
        console.error('Supabase error:', error);
        return res.status(500).json({
          success: false,
          message: 'Error creating user'
        });
      }
      
      // Create token
      const token = jwt.sign(
        { id: newUser.id, username: newUser.username },
        process.env.JWT_SECRET || 'votehub-secret',
        { expiresIn: '30d' }
      );
      
      res.status(201).json({
        success: true,
        user: {
          _id: newUser.id,
          username: newUser.username,
          email: newUser.email
        },
        token
      });
      
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error during registration'
      });
    }
  });
  
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      
      // Validate input
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Please provide email and password'
        });
      }
      
      // Get user from Supabase
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();
      
      if (error || !user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }
      
      // Verify password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }
      
      // Create token
      const token = jwt.sign(
        { id: user.id, username: user.username },
        process.env.JWT_SECRET || 'votehub-secret',
        { expiresIn: '30d' }
      );
      
      res.json({
        success: true,
        user: {
          _id: user.id,
          username: user.username,
          email: user.email
        },
        token
      });
      
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error during login'
      });
    }
  });
  
  app.get('/api/auth/me', async (req, res) => {
    try {
      // Get token from header
      const token = req.headers.authorization?.split(' ')[1];
      
      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'Not authorized'
        });
      }
      
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'votehub-secret');
      
      // Get user from Supabase
      const { data: user, error } = await supabase
        .from('users')
        .select('id, username, email, created_at')
        .eq('id', decoded.id)
        .single();
      
      if (error || !user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      
      res.json({
        success: true,
        user: {
          _id: user.id,
          username: user.username,
          email: user.email
        }
      });
      
    } catch (error) {
      console.error('Profile error:', error);
      res.status(401).json({
        success: false,
        message: 'Token is not valid'
      });
    }
  });
  
  // Poll routes for Supabase
  app.get('/api/polls', async (req, res) => {
    try {
      const { data: polls, error } = await supabase
        .from('polls')
        .select(`
          *,
          options:poll_options(*)
        `)
        .order('created_at', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      // Format poll data
      const formattedPolls = polls.map(poll => ({
        _id: poll.id,
        title: poll.title,
        createdBy: poll.created_by,
        createdAt: poll.created_at,
        options: poll.options.map(option => ({
          text: option.text,
          votes: option.votes
        })),
        totalVotes: poll.options.reduce((sum, option) => sum + option.votes, 0)
      }));
      
      res.json({
        success: true,
        polls: formattedPolls
      });
      
    } catch (error) {
      console.error('Error fetching polls:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching polls'
      });
    }
  });
}

// Mock routes (only used if Supabase connection fails)
if (useMockDb) {
  // Auth Routes
  app.post('/api/auth/register', async (req, res) => {
    try {
      const { username, email, password } = req.body;
      
      // Validate input
      if (!username || !email || !password) {
        return res.status(400).json({ 
          success: false, 
          message: 'Please provide all required fields' 
        });
      }
      
      // Check if user already exists
      const userExists = mockDb.users.find(user => user.email === email);
      if (userExists) {
        return res.status(400).json({ 
          success: false, 
          message: 'User with this email already exists' 
        });
      }
      
      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      
      // Create new user
      const newUser = {
        _id: `mock-user-${mockDb.users.length + 1}`,
        username,
        email,
        password: hashedPassword,
        createdAt: new Date().toISOString()
      };
      
      mockDb.users.push(newUser);
      
      // Create token
      const token = jwt.sign(
        { id: newUser._id, username: newUser.username },
        process.env.JWT_SECRET || 'votehub-mock-secret',
        { expiresIn: '30d' }
      );
      
      res.status(201).json({
        success: true,
        user: {
          _id: newUser._id,
          username: newUser.username,
          email: newUser.email
        },
        token
      });
    } catch (error) {
      console.error('Mock register error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Server error during registration' 
      });
    }
  });
  
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      
      // Validate input
      if (!email || !password) {
        return res.status(400).json({ 
          success: false, 
          message: 'Please provide email and password' 
        });
      }
      
      // Find user
      const user = mockDb.users.find(user => user.email === email);
      if (!user) {
        return res.status(401).json({ 
          success: false, 
          message: 'Invalid credentials' 
        });
      }
      
      // Check password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ 
          success: false, 
          message: 'Invalid credentials' 
        });
      }
      
      // Create token
      const token = jwt.sign(
        { id: user._id, username: user.username },
        process.env.JWT_SECRET || 'votehub-mock-secret',
        { expiresIn: '30d' }
      );
      
      res.json({
        success: true,
        user: {
          _id: user._id,
          username: user.username,
          email: user.email
        },
        token
      });
    } catch (error) {
      console.error('Mock login error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Server error during login' 
      });
    }
  });

  app.get('/api/auth/me', (req, res) => {
    try {
      // Get token from header
      const token = req.headers.authorization?.split(' ')[1];
      
      if (!token) {
        return res.status(401).json({ 
          success: false, 
          message: 'Not authorized' 
        });
      }
      
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'votehub-mock-secret');
      const userId = decoded.id;
      
      // Find user
      const user = mockDb.users.find(u => u._id === userId);
      
      if (!user) {
        return res.status(404).json({ 
          success: false, 
          message: 'User not found' 
        });
      }
      
      res.json({
        success: true,
        user: {
          _id: user._id,
          username: user.username,
          email: user.email
        }
      });
    } catch (error) {
      console.error('Mock user profile error:', error);
      res.status(401).json({ 
        success: false, 
        message: 'Token is not valid' 
      });
    }
  });

  // Poll Routes
  app.get('/api/polls', (req, res) => {
    try {
      // For mock database, we'll show polls even without authentication
      console.log('Serving mock polls to client');
      res.json({
        success: true,
        polls: mockDb.polls.map(poll => ({
          ...poll,
          totalVotes: poll.options.reduce((sum, option) => sum + option.votes, 0)
        }))
      });
    } catch (error) {
      console.error('Mock fetch polls error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error fetching polls' 
      });
    }
  });
  
  app.get('/api/polls/:id', (req, res) => {
    try {
      const poll = mockDb.polls.find(p => p._id === req.params.id);
      
      if (!poll) {
        return res.status(404).json({ 
          success: false, 
          message: 'Poll not found' 
        });
      }
      
      res.json({
        success: true,
        poll: {
          ...poll,
          totalVotes: poll.options.reduce((sum, option) => sum + option.votes, 0)
        }
      });
    } catch (error) {
      console.error('Mock fetch poll error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error fetching poll' 
      });
    }
  });
  
  app.post('/api/polls', (req, res) => {
    try {
      // Get token from header
      const token = req.headers.authorization?.split(' ')[1];
      
      if (!token) {
        return res.status(401).json({ 
          success: false, 
          message: 'Not authorized' 
        });
      }
      
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'votehub-mock-secret');
      const userId = decoded.id;
      
      const { title, options } = req.body;
      
      if (!title || !options || !Array.isArray(options) || options.length < 2) {
        return res.status(400).json({ 
          success: false, 
          message: 'Please provide title and at least 2 options' 
        });
      }
      
      const newPoll = {
        _id: `mock-poll-${mockDb.polls.length + 1}`,
        title,
        options: options.map(option => ({ 
          text: option, 
          votes: 0 
        })),
        createdBy: userId,
        createdAt: new Date().toISOString()
      };
      
      mockDb.polls.push(newPoll);
      
      res.status(201).json({
        success: true,
        poll: newPoll
      });
    } catch (error) {
      console.error('Mock create poll error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error creating poll' 
      });
    }
  });
  
  app.delete('/api/polls/:id', (req, res) => {
    try {
      // Get token from header
      const token = req.headers.authorization?.split(' ')[1];
      
      if (!token) {
        return res.status(401).json({ 
          success: false, 
          message: 'Not authorized' 
        });
      }
      
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'votehub-mock-secret');
      const userId = decoded.id;
      
      const pollIndex = mockDb.polls.findIndex(p => p._id === req.params.id);
      
      if (pollIndex === -1) {
        return res.status(404).json({ 
          success: false, 
          message: 'Poll not found' 
        });
      }
      
      const poll = mockDb.polls[pollIndex];
      
      // Check if user owns the poll
      if (poll.createdBy !== userId) {
        return res.status(403).json({ 
          success: false, 
          message: 'Not authorized to delete this poll' 
        });
      }
      
      // Remove the poll
      mockDb.polls.splice(pollIndex, 1);
      
      res.json({
        success: true,
        message: 'Poll deleted successfully'
      });
    } catch (error) {
      console.error('Mock delete poll error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error deleting poll' 
      });
    }
  });
  
  app.post('/api/polls/:id/vote', (req, res) => {
    try {
      const { optionIndex } = req.body;
      
      if (optionIndex === undefined) {
        return res.status(400).json({ 
          success: false, 
          message: 'Please provide an option to vote for' 
        });
      }
      
      const poll = mockDb.polls.find(p => p._id === req.params.id);
      
      if (!poll) {
        return res.status(404).json({ 
          success: false, 
          message: 'Poll not found' 
        });
      }
      
      if (optionIndex < 0 || optionIndex >= poll.options.length) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid option index' 
        });
      }
      
      // Increment vote count
      poll.options[optionIndex].votes++;
      
      res.json({
        success: true,
        poll: {
          ...poll,
          totalVotes: poll.options.reduce((sum, option) => sum + option.votes, 0)
        }
      });
    } catch (error) {
      console.error('Mock vote error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error voting on poll' 
      });
    }
  });
}

// Health check route
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    server: 'VoteHub API',
    version: '1.0.0',
    mode: useMockDb ? 'mock database' : (usePgPool ? 'PostgreSQL' : (useSupabase ? 'Supabase' : 'Mock Database')),
    timestamp: new Date().toISOString()
  });
});

// Routes - use real routes when Supabase is available, otherwise mock routes handle everything
app.use((req, res, next) => {
  if (!useMockDb) {
    // Regular route handlers will handle API routes
    next();
  } else {
    // If not handled by a mock route, proceed to next middleware
    if (!res.headersSent) {
      next();
    }
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: 'Server Error'
  });
});

function startServer() {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} using ${useMockDb ? 'mock database' : (usePgPool ? 'PostgreSQL' : (useSupabase ? 'Supabase' : 'Mock Database'))}`);
  });
}

startServer(); 