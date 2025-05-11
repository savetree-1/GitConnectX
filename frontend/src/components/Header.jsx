import React from 'react';
import logo from '../assets/logo.png';

const Header = ({ scrollToFeatures, scrollToContact }) => {
  return (
    <header className="bg-white shadow-md fixed top-0 left-0 w-full z-50">
      <div className="container mx-auto flex justify-between items-center p-4">
        <div className="flex items-center space-x-2">
          <img className="w-10 md:w-10" src={logo} alt="logo" />
          <div className="text-xl font-bold text-blue-600">
            GitConnectX
          </div>
        </div>
        <nav className="space-x-6">
          <a href="/" className="text-gray-700 hover:text-blue-600">
            Home
          </a>
          <button
            onClick={scrollToFeatures}
            className="text-gray-700 hover:text-blue-600 focus:outline-none"
          >
            Features
          </button>
          <button
            onClick={scrollToContact}
            className="text-gray-700 hover:text-blue-600 focus:outline-none"
          >
            Contact Us
          </button>
          <a
            href="/login"
            className="text-white bg-indigo-600 px-4 py-2 rounded w-full hover:bg-indigo-700 transition transform hover:-translate-y-1 hover:shadow-md"
          >
            Login / Signup
          </a>
        </nav>
      </div>
    </header>
  );
};

export default Header;
