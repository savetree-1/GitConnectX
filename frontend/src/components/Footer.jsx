import React from 'react';
import logo from '../assets/logoWithoutBg.png';
const Footer = () => {
  return (
    <footer className="bg-white text-grey-700 py-3">
      <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center">
        <div className="flex items-center space-x-2">
                <div className="rounded-full overflow-hidden w-18 h-18 flex-shrink-0">
                  <img className="w-full h-full object-cover filter" style={{ filter: 'brightness(0) saturate(100%)' }} src={logo} alt="logo" />
                </div>
                <div className="text-2xl font-bold text-[#1737A1]">
                    GitConnectX  © {new Date().getFullYear()}
                    
                </div>
        </div>
        <div className="flex space-x-6 text-lg font-semibold text-[#1737A1]">
          <a
            href="https://github.com/savetree-1/GitConnectX"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[#1737A1] transition-colors"
          >
            GitHub Repository
          </a>
          <a
            href="/privacy"
            className="hover:text-[#1737A1] transition-colors"
          >
            Privacy Policy
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
