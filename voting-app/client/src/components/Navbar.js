import React, { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaVoteYea, FaUserAlt, FaSignOutAlt, FaPlus, FaBars, FaTimes } from 'react-icons/fa';
import AuthContext from '../context/AuthContext';

const Navbar = () => {
  const { isAuthenticated, user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="navbar">
      <div className="container">
        <div className="navbar-content">
          <Link to="/" className="navbar-logo">
            <FaVoteYea size={24} />
            <span>VoteHub</span>
          </Link>

          <div className="navbar-toggle" onClick={toggleMenu}>
            {isMenuOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
          </div>

          <div className={`navbar-menu ${isMenuOpen ? 'active' : ''}`}>
            <Link to="/" className="navbar-link" onClick={() => setIsMenuOpen(false)}>
              Home
            </Link>

            {isAuthenticated ? (
              <>
                <Link to="/dashboard" className="navbar-link" onClick={() => setIsMenuOpen(false)}>
                  Dashboard
                </Link>
                <Link to="/create-poll" className="navbar-link" onClick={() => setIsMenuOpen(false)}>
                  <FaPlus size={14} />
                  <span>Create Poll</span>
                </Link>
                <div className="navbar-user">
                  <FaUserAlt size={14} />
                  <span>{user?.name}</span>
                </div>
                <button className="navbar-logout" onClick={handleLogout}>
                  <FaSignOutAlt size={14} />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="navbar-link" onClick={() => setIsMenuOpen(false)}>
                  Login
                </Link>
                <Link to="/register" className="btn btn-primary btn-sm" onClick={() => setIsMenuOpen(false)}>
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 