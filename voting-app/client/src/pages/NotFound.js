import React from 'react';
import { Link } from 'react-router-dom';
import { FaExclamationTriangle } from 'react-icons/fa';

const NotFound = () => {
  return (
    <div className="not-found-page">
      <div className="not-found-content text-center">
        <div className="not-found-icon">
          <FaExclamationTriangle size={60} />
        </div>
        <h1>404</h1>
        <h2>Page Not Found</h2>
        <p>The page you are looking for doesn't exist or has been moved.</p>
        <Link to="/" className="btn btn-primary mt-3">
          Go Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound; 