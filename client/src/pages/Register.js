import React, { useState, useContext, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import AuthContext from '../context/AuthContext';
import { FaUserAlt } from 'react-icons/fa';

const Register = () => {
  const { register, isAuthenticated, error, clearError, login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [formError, setFormError] = useState(null);

  useEffect(() => {
    // If already authenticated, redirect to dashboard
    if (isAuthenticated) {
      navigate('/');
    }

    // Set error from context
    if (error) {
      setFormError(error);
      clearError();
    }
  }, [isAuthenticated, navigate, error, clearError]);

  const initialValues = {
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  };

  const validationSchema = Yup.object({
    username: Yup.string()
      .required('Username is required')
      .max(50, 'Username cannot be more than 50 characters'),
    email: Yup.string()
      .email('Invalid email address')
      .required('Email is required'),
    password: Yup.string()
      .required('Password is required')
      .min(6, 'Password must be at least 6 characters'),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref('password'), null], 'Passwords must match')
      .required('Confirm password is required')
  });

  const handleSubmit = async (values, { setSubmitting }) => {
    setFormError(null);
    
    // Remove confirmPassword before sending to API
    const { confirmPassword, ...userData } = values;
    
    const success = await register(userData);
    if (success) {
      navigate('/');
    }
    
    setSubmitting(false);
  };

  const useTestAccount = async () => {
    const testCredentials = {
      email: 'test@example.com',
      password: 'password123'
    };
    const success = await login(testCredentials);
    if (success) {
      navigate('/');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <h2>Create an Account</h2>
          <p>Register to create and participate in polls</p>
        </div>

        {formError && (
          <div className="alert alert-error">{formError}</div>
        )}

        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({ isSubmitting }) => (
            <Form className="auth-form">
              <div className="form-group">
                <label htmlFor="username" className="form-label">Username</label>
                <Field
                  type="text"
                  id="username"
                  name="username"
                  className="form-control"
                  placeholder="Choose a username"
                />
                <ErrorMessage name="username" component="div" className="form-error" />
              </div>

              <div className="form-group">
                <label htmlFor="email" className="form-label">Email</label>
                <Field
                  type="email"
                  id="email"
                  name="email"
                  className="form-control"
                  placeholder="Enter your email"
                />
                <ErrorMessage name="email" component="div" className="form-error" />
              </div>

              <div className="form-group">
                <label htmlFor="password" className="form-label">Password</label>
                <Field
                  type="password"
                  id="password"
                  name="password"
                  className="form-control"
                  placeholder="Enter your password"
                />
                <ErrorMessage name="password" component="div" className="form-error" />
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
                <Field
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  className="form-control"
                  placeholder="Confirm your password"
                />
                <ErrorMessage name="confirmPassword" component="div" className="form-error" />
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-block"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Registering...' : 'Register'}
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
            </Form>
          )}
        </Formik>

        <div className="auth-footer">
          <p>
            Already have an account?{' '}
            <Link to="/login">Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register; 