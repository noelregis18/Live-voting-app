import React, { useState, useContext, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import { FaUserAlt } from 'react-icons/fa';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  
  const { email, password } = formData;
  const { login, isAuthenticated, error, clearError } = useContext(AuthContext);
  const [formError, setFormError] = useState(null);
  const navigate = useNavigate();
  
  useEffect(() => {
    // If already authenticated, redirect to home
    if (isAuthenticated) {
      navigate('/');
    }
    
    // Set error from context
    if (error) {
      setFormError(error);
      clearError();
    }
  }, [isAuthenticated, navigate, error, clearError]);
  
  const onChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  
  const onSubmit = async e => {
    e.preventDefault();
    const success = await login(formData);
    if (success) {
      navigate('/');
    }
  };

  const useTestAccount = async () => {
    const testCredentials = {
      email: 'test@example.com',
      password: 'password123'
    };
    setFormData(testCredentials);
    const success = await login(testCredentials);
    if (success) {
      navigate('/');
    }
  };
  
  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <h2>Login to Your Account</h2>
          <p>Enter your credentials to access your account</p>
        </div>

        {formError && (
          <div className="alert alert-error">{formError}</div>
        )}

        <form className="auth-form" onSubmit={onSubmit}>
          <div className="form-group">
            <label htmlFor="email" className="form-label">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={onChange}
              className="form-control"
              placeholder="Enter your email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={password}
              onChange={onChange}
              className="form-control"
              placeholder="Enter your password"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
          >
            Login
          </button>

          <div className="my-3 text-center">
            <p>- OR -</p>
            <button 
              type="button"
              onClick={useTestAccount} 
              className="btn btn-success btn-block"
              style={{marginTop: '10px'}}
            >
              <FaUserAlt className="mr-2" /> Use Test Account
            </button>
            <p className="mt-2 text-sm">
              <small>(test@example.com / password123)</small>
            </p>
          </div>
        </form>

        <div className="auth-footer">
          <p>
            Don't have an account?{' '}
            <Link to="/register">Register</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login; 