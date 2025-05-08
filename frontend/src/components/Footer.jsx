import React from 'react';
import logo from '../assets/logo.png';
const Footer = () => {
  return (
    <footer className="bg-white text-grey-700 py-6">
      <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center">
        <div className="flex items-center space-x-2">
                <img className="w-16 md:w-10" src={logo} alt="logo" />
                <div className="text-xl font-bold text-blue-600">
                    GitConnectX  © {new Date().getFullYear()}
                    
                </div>
        </div>
        <div className="flex space-x-6">
          <a
            href="https://github.com/your-repo"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-blue-600 transition-colors"
          >
            GitHub Repo
          </a>
          <a
            href="/docs"
            className="hover:text-blue-600 transition-colors"
          >
            Documentation
          </a>
          <a
            href="/contributors"
            className="hover:text-blue-600 transition-colors"
          >
            Contributors
          </a>
          <a
            href="/privacy"
            className="hover:text-blue-600 transition-colors"
          >
            Privacy Policy
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
