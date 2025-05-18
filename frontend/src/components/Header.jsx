import React, { useState, useEffect, useRef } from "react";
import logo from "../assets/logo.png";
import { useAuth0 } from "@auth0/auth0-react";

const Header = ({ scrollToFeatures, scrollToContact }) => {
  const { loginWithRedirect, isAuthenticated, logout, user } = useAuth0();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showVerificationAlert, setShowVerificationAlert] = useState(false);
  const dropdownRef = useRef(null);

  // Check email verification status when user data is available
  useEffect(() => {
    if (user && !user.email_verified) {
      setShowVerificationAlert(true);
      // Hide the alert after 5 seconds
      const timer = setTimeout(() => {
        setShowVerificationAlert(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [user]);

  // Get display name from full name or email
  const getDisplayName = () => {
    if (user?.nickname) return user.nickname;
    if (user?.name) {
      // Split name and get first part (usually the given name)
      return user.name.split(' ')[0];
    }
    if (user?.email) {
      // Get part before @ in email
      return user.email.split('@')[0];
    }
    return 'User';
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    setIsLoggingOut(true);
    setTimeout(() => {
      logout({ logoutParams: { returnTo: window.location.origin } });
    }, 500);
  };

  return (
    <>
      {showVerificationAlert && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-100 text-yellow-800 px-4 py-3 shadow-md transition-all duration-300 ease-in-out">
          <div className="container mx-auto flex items-center justify-between">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
              </svg>
              <p>Please verify your email address. Check your inbox for the verification link.</p>
            </div>
            <button 
              onClick={() => setShowVerificationAlert(false)}
              className="text-yellow-800 hover:text-yellow-900 focus:outline-none"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
              </svg>
            </button>
          </div>
        </div>
      )}
      <header className={`bg-white shadow-md fixed ${showVerificationAlert ? 'top-12' : 'top-0'} left-0 w-full z-40 transition-all duration-300`}>
        <div className="container mx-auto flex justify-between items-center p-4">
          <div className="flex items-center space-x-2">
            <img className="w-10 md:w-10" src={logo} alt="logo" />
            <div className="text-xl font-bold text-[#1737A1]">GitConnectX</div>
          </div>
          <nav className="space-x-6 flex items-center">
            <a href="/" className="text-black hover:text-[#1737A1]">
              Home
            </a>
            <button
              onClick={scrollToFeatures}
              className="text-black hover:text-[#1737A1] focus:outline-none"
            >
              Features
            </button>
            <button
              onClick={scrollToContact}
              className="text-black hover:text-[#1737A1] focus:outline-none"
            >
              Contact Us
            </button>
            {isAuthenticated ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className={`flex items-center space-x-2 text-gray-700 hover:text-[#1737A1] focus:outline-none transition-opacity duration-500 ${
                    isLoggingOut ? 'opacity-0' : 'opacity-100'
                  }`}
                >
                  {user?.picture ? (
                    <img 
                      src={user.picture} 
                      alt={getDisplayName()} 
                      className="w-8 h-8 rounded-full object-cover border-2 border-[#1737A1]"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-[#1737A1] text-white flex items-center justify-center">
                      {getDisplayName()[0].toUpperCase()}
                    </div>
                  )}
                  <span className="max-w-[120px] truncate font-medium">{getDisplayName()}</span>
                  <svg
                    className={`w-4 h-4 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg py-1 z-50 transform transition-all duration-300 ease-in-out">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                      <p className="text-sm text-gray-500 truncate">{user?.email}</p>
                      {!user?.email_verified && (
                        <p className="text-xs text-yellow-600 mt-1 flex items-center">
                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                          </svg>
                          Email not verified
                        </p>
                      )}
                    </div>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-[#b91313] transition-colors duration-200"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => loginWithRedirect()}
                className="text-white bg-[#1737A1] px-4 py-2 rounded hover:bg-indigo-700 transition transform hover:-translate-y-1 hover:shadow-md focus:outline-none font-semibold"
              >
                Login / Signup
              </button>
            )}
          </nav>
        </div>
      </header>
    </>
  );
};

export default Header;
