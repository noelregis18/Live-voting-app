import React from 'react';
import { FaVoteYea, FaTwitter, FaGithub, FaLinkedin } from 'react-icons/fa';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-logo">
            <FaVoteYea size={24} />
            <span>VoteHub</span>
          </div>
          
          <div className="footer-info">
            <p>Developed by Noel Regis</p>
            <p>&copy; {new Date().getFullYear()} All rights reserved</p>
          </div>
          
          <div className="footer-social">
            <a href="https://twitter.com/" target="_blank" rel="noopener noreferrer" className="social-link">
              <FaTwitter size={18} />
            </a>
            <a href="https://github.com/" target="_blank" rel="noopener noreferrer" className="social-link">
              <FaGithub size={18} />
            </a>
            <a href="https://linkedin.com/in/" target="_blank" rel="noopener noreferrer" className="social-link">
              <FaLinkedin size={18} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 