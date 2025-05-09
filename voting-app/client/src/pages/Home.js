import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { 
  FaVoteYea, FaChartPie, FaUser, FaClock, 
  FaExclamationTriangle, FaSignInAlt,
  FaPlusCircle, FaCheck, FaThumbsUp
} from 'react-icons/fa';
import AuthContext from '../context/AuthContext';

// API URL
const API_URL = 'http://localhost:5000/api';

// Create an axios instance with timeout
const api = axios.create({
  baseURL: API_URL,
  timeout: 15000
});

// Error handling interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      console.error('Network error:', error.message);
      return Promise.reject({
        message: 'Network error - cannot connect to server'
      });
    }
    return Promise.reject(error);
  }
);

// Mock polls to use when server is unavailable
const mockPolls = [
  {
    _id: 'mock-poll-1',
    title: 'Favorite Programming Language',
    options: [
      { text: 'JavaScript', votes: 5 },
      { text: 'Python', votes: 3 },
      { text: 'Java', votes: 2 },
      { text: 'C#', votes: 1 }
    ],
    createdBy: 'TestUser',
    createdAt: new Date().toISOString(),
    description: 'Which programming language do you prefer to work with?',
    totalVotes: 11
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
    createdBy: 'TestUser',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    description: 'Which web framework do you find most productive?',
    totalVotes: 10
  },
  {
    _id: 'mock-poll-3',
    title: 'Favorite Software Development Methodology',
    options: [
      { text: 'Agile/Scrum', votes: 7 },
      { text: 'Kanban', votes: 4 },
      { text: 'Waterfall', votes: 1 },
      { text: 'Extreme Programming', votes: 2 }
    ],
    createdBy: 'TestUser',
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    description: 'Which methodology do you prefer for managing software projects?',
    totalVotes: 14
  }
];

const pollTemplates = [
  {
    name: 'Favorite Food',
    title: 'What is your favorite type of food?',
    icon: '🍕'
  },
  {
    name: 'Travel Destination',
    title: 'Where would you like to go on vacation?',
    icon: '✈️'
  },
  {
    name: 'Movie Genre',
    title: 'What movie genre do you prefer?',
    icon: '🎬'
  }
];

const Home = () => {
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retry, setRetry] = useState(false);
  const { isAuthenticated, user } = useContext(AuthContext);
  const [serverStatus, setServerStatus] = useState(null);
  const [voteMessage, setVoteMessage] = useState(localStorage.getItem('voteSuccess'));

  // Clear vote message after 5 seconds
  useEffect(() => {
    if (voteMessage) {
      // Make the message more noticeable by showing it prominently
      console.log('Vote success message:', voteMessage);
      
      const timer = setTimeout(() => {
        setVoteMessage(null);
        localStorage.removeItem('voteSuccess');
      }, 10000); // Increased to 10 seconds for better visibility
      
      return () => clearTimeout(timer);
    }
  }, [voteMessage]);
  
  // Check for vote message on component mount and when location changes
  useEffect(() => {
    const checkForVoteMessage = () => {
      const message = localStorage.getItem('voteSuccess');
      if (message) {
        setVoteMessage(message);
      }
    };
    
    checkForVoteMessage();
    
    // Set up an interval to check for vote messages
    const messageCheckInterval = setInterval(checkForVoteMessage, 1000);
    
    return () => clearInterval(messageCheckInterval);
  }, []);

  useEffect(() => {
    const checkServerHealth = async () => {
      try {
        const healthCheck = await axios.get('http://localhost:5000/health', { timeout: 5000 });
        console.log('Server health check:', healthCheck.data);
        setServerStatus(healthCheck.data);
        return true;
      } catch (healthErr) {
        console.error('Server health check failed:', healthErr.message);
        setServerStatus({ status: 'error', mode: 'unknown' });
        return false;
      }
    };

    const fetchPolls = async () => {
      try {
        console.log('Fetching polls from API');
        setError(null);
        setLoading(true);
        
        // Check if we have any mock polls in localStorage
        const storedMockPolls = localStorage.getItem('mockPolls');
        if (storedMockPolls) {
          try {
            const parsedMockPolls = JSON.parse(storedMockPolls);
            if (Array.isArray(parsedMockPolls) && parsedMockPolls.length > 0) {
              console.log('Using stored mock polls from localStorage:', parsedMockPolls.length);
              // Combine with default mock polls
              const combinedMockPolls = [...parsedMockPolls, ...mockPolls];
              setPolls(combinedMockPolls);
              setLoading(false);
              return;
            }
          } catch (parseError) {
            console.error('Error parsing mock polls from localStorage:', parseError);
          }
        }
        
        // Special case for test user with mock token
        if (isAuthenticated && user && user.email === 'test@example.com') {
          console.log('Using mock polls for test account');
          setPolls(mockPolls);
          setLoading(false);
          return;
        }
        
        // Check if server is healthy first
        const isHealthy = await checkServerHealth();
        if (!isHealthy) {
          throw new Error('Server is not responding. Please make sure the server is running.');
        }
        
        const response = await api.get('/polls');
        
        if (response.data && response.data.success) {
          console.log('Polls fetched successfully:', response.data.polls?.length || 0);
          setPolls(response.data.polls || []);
        } else {
          console.error('Invalid response format:', response.data);
          setError('Error fetching polls: Invalid response format');
        }
      } catch (err) {
        console.error('Error fetching polls:', err);
        if (err.message && err.message.includes('Server is not responding')) {
          setError(err.message);
        } else if (err.message && err.message.includes('Network error')) {
          setError('Cannot connect to server. Please check your connection.');
        } else {
          setError('Error fetching polls. Please try again later.');
        }
        // If authenticated and server error, show mock polls
        if (isAuthenticated && user) {
          console.log('Using mock polls due to server error');
          setPolls(mockPolls);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPolls();
    
    // Set up auto-retry every 10 seconds if there's an error and not authenticated
    let retryInterval;
    if (error && !isAuthenticated) {
      retryInterval = setInterval(() => {
        console.log('Auto-retrying poll fetch...');
        setRetry(prev => !prev);
      }, 10000);
    }
    
    return () => {
      if (retryInterval) clearInterval(retryInterval);
    };
  }, [retry, error, isAuthenticated, user]);

  const handleRetry = () => {
    setRetry(!retry);
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const navigateToCreatePollWithTemplate = (template) => {
    localStorage.setItem('pollTemplate', JSON.stringify(template));
  };

  return (
    <div className="home-page">
      {voteMessage && (
        <div className="vote-success-banner animated fadeIn">
          <div className="alert alert-success">
            <FaThumbsUp size={18} className="mr-2 pulse-icon" />
            <span className="vote-message">{voteMessage}</span>
            <button 
              className="close-btn" 
              onClick={() => {
                setVoteMessage(null);
                localStorage.removeItem('voteSuccess');
              }}
            >
              &times;
            </button>
          </div>
        </div>
      )}

      <div className="hero">
        <div className="hero-content">
          <h1>Make Your Voice Heard</h1>
          <p className="hero-subtitle">
            Create and participate in polls on topics that matter to you.
          </p>
          <div className="hero-actions">
            <Link to="/create-poll" className="btn btn-primary btn-lg">
              <FaPlusCircle className="mr-2" />
              Create Poll
            </Link>
            {!isAuthenticated && (
              <Link to="/login" className="btn btn-outline btn-lg">
                <FaSignInAlt className="mr-2" />
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>

      {isAuthenticated && (
        <div className="quick-create-section mt-4">
          <div className="card">
            <div className="card-header">
              <h3>Quick Create Poll</h3>
            </div>
            <div className="card-body">
              <p>Get started quickly with a template:</p>
              <div className="template-grid">
                {pollTemplates.map((template, index) => (
                  <Link 
                    to="/create-poll" 
                    key={index}
                    className="template-card"
                    onClick={() => navigateToCreatePollWithTemplate(template)}
                  >
                    <div className="template-icon">{template.icon}</div>
                    <div className="template-content">
                      <h4>{template.name}</h4>
                      <p>{template.title}</p>
                    </div>
                    <div className="template-action">
                      <FaPlusCircle />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="features mt-5">
        <div className="grid grid-3">
          <div className="feature-card">
            <div className="feature-icon">
              <FaVoteYea size={30} />
            </div>
            <h3>Easy Voting</h3>
            <p>Cast your vote with a single click and see results instantly.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">
              <FaChartPie size={30} />
            </div>
            <h3>Visualized Results</h3>
            <p>View poll results with beautiful, interactive charts.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">
              <FaUser size={30} />
            </div>
            <h3>User Authentication</h3>
            <p>Secure login ensures one vote per user for accurate results.</p>
          </div>
        </div>
      </div>

      <div className="polls-section mt-5">
        <h2>Recent Polls</h2>
        {loading ? (
          <div className="loading">Loading polls...</div>
        ) : error && (!isAuthenticated || polls.length === 0) ? (
          <div className="alert alert-error">
            <FaExclamationTriangle />
            <span className="ml-2">{error}</span>
            <button onClick={handleRetry} className="btn btn-primary btn-sm ml-3">
              Retry
            </button>
            {!isAuthenticated && (
              <div className="mt-3">
                <p>You need to log in to see polls.</p>
                <Link to="/login" className="btn btn-primary btn-sm mt-2">
                  <FaSignInAlt className="mr-2" /> Log in with test@example.com / password123
                </Link>
              </div>
            )}
          </div>
        ) : polls.length === 0 ? (
          <div className="no-polls">
            {!isAuthenticated ? (
              <>
                <p>You need to log in to see polls.</p>
                <Link to="/login" className="btn btn-primary mt-3">
                  <FaSignInAlt className="mr-2" /> Log in with test@example.com / password123
                </Link>
              </>
            ) : (
              <>
                <p>No polls available yet. Be the first to create one!</p>
                <Link to="/create-poll" className="btn btn-primary mt-3">
                  Create Poll
                </Link>
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-3">
            {polls.map((poll) => (
              <div key={poll._id} className="card poll-card">
                <div className="card-body">
                  <h3>{poll.title}</h3>
                  <p>{poll.description ? poll.description.substring(0, 100) + (poll.description.length > 100 ? '...' : '') : 'No description provided'}</p>
                  <div className="poll-meta">
                    <div className="poll-creator">
                      <FaUser size={12} />
                      <span>{poll.createdBy ? poll.createdBy : 'Anonymous'}</span>
                    </div>
                    <div className="poll-date">
                      <FaClock size={12} />
                      <span>{formatDate(poll.createdAt)}</span>
                    </div>
                  </div>
                </div>
                <div className="card-footer">
                  <Link to={`/polls/${poll._id}`} className="btn btn-primary btn-sm">
                    <FaVoteYea className="mr-1" />
                    Vote Now
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="cta-section mt-5">
        <div className="card">
          <div className="card-body text-center">
            <h2>Ready to create your own poll?</h2>
            <p>Join thousands of users making their voices heard!</p>
            {isAuthenticated ? (
              <Link to="/create-poll" className="btn btn-primary mt-3">
                <FaPlusCircle className="mr-2" />
                Create Your Poll Now
              </Link>
            ) : (
              <Link to="/register" className="btn btn-primary mt-3">
                <FaSignInAlt className="mr-2" />
                Sign Up & Get Started
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home; 