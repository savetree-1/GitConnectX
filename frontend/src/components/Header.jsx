import React, { useState, useEffect } from 'react';
import logo from '../assets/smallerLogoWithoutBg.png';
import { Link } from 'react-router-dom';
import { useLocation, useNavigate } from 'react-router-dom';


const Header = ({ scrollToFeatures, scrollToContact }) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleHomeClick = (e) => {
    if (location.pathname === '/') {
      e.preventDefault(); // Prevent <Link> navigation
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    // else, let <Link to="/"> handle navigation naturally
  };
  // Handle scroll effect for navbar
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <header 
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
        scrolled 
          ? 'bg-white/90 backdrop-blur-md shadow-lg py-6' 
          : 'bg-transparent py-6'
      }`}
    >
      <div className="container mx-auto max-w-6xl">
        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center justify-between px-4">
          {/* Logo and Brand */}
          <Link to="/" className="flex items-center space-x-2 group">
            <div className="w-15 h-15 flex items-center justify-center">
              <img 
                className="w-15 h-15 object-contain"
                src={logo} 
                alt="logo"
                style={{ filter: scrolled ? 'brightness(0) saturate(100%)' : 'brightness(0) saturate(100%) invert(1)' }}
              />
            </div>
            <div className={`text-2xl font-bold transition-colors duration-300 ${
              scrolled ? 'text-[#1737A1]' : 'text-white'
            }`}>
              GitConnectX
            </div>
          </Link>

          {/* Center Navigation */}
          <nav className="flex space-x-1">
            <Link 
              to="/" 
              onClick={(e) => {
                handleHomeClick(e);
                setMobileMenuOpen(false);
              }}
              className={`font-medium px-4 py-2 rounded-lg transition-all duration-300 
                ${scrolled 
                  ? 'text-gray-700 hover:bg-blue-100 hover:text-[#1737A1] hover:shadow-sm' 
                  : 'text-white hover:bg-white/10 hover:text-white hover:shadow-lg shadow-white/10'
                } relative overflow-hidden group`}
            >
              <span className="text-lg relative z-10">Home</span>
              <span className={`absolute bottom-0 left-0 w-full h-0.5 transform scale-x-0 transition-transform duration-300 group-hover:scale-x-100 ${
                scrolled ? 'bg-[#1737A1]' : 'bg-white'
              }`}></span>
            </Link>
            
            <button
              onClick={scrollToFeatures}
              className={`font-medium px-4 py-2 rounded-lg transition-all duration-300 
                ${scrolled 
                  ? 'text-gray-700 hover:bg-blue-100 hover:text-[#1737A1] hover:shadow-sm' 
                  : 'text-white hover:bg-white/10 hover:text-white hover:shadow-lg shadow-white/10'
                } relative overflow-hidden group focus:outline-none`}
            >
              <span className="text-lg relative z-10">Features</span>
              <span className={`absolute bottom-0 left-0 w-full h-0.5 transform scale-x-0 transition-transform duration-300 group-hover:scale-x-100 ${
                scrolled ? 'bg-[#1737A1]' : 'bg-white'
              }`}></span>
            </button>
            
            <button
              onClick={scrollToContact}
              className={`font-medium px-4 py-2 rounded-lg transition-all duration-300 
                ${scrolled 
                  ? 'text-gray-700 hover:bg-blue-100 hover:text-[#1737A1] hover:shadow-sm' 
                  : 'text-white hover:bg-white/10 hover:text-white hover:shadow-lg shadow-white/10'
                } relative overflow-hidden group focus:outline-none`}
            >
              <span className="text-lg relative z-10">Contact Us</span>
              <span className={`absolute bottom-0 left-0 w-full h-0.5 transform scale-x-0 transition-transform duration-300 group-hover:scale-x-100 ${
                scrolled ? 'bg-[#1737A1]' : 'bg-white'
              }`}></span>
            </button>
          </nav>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden flex items-center justify-between px-4">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8">
              <img className="w-full h-full object-cover" src={logo} alt="logo" />
            </div>
            <div className={`text-lg font-bold ${scrolled ? 'text-[#1737A1]' : 'text-white'}`}>
              GitConnectX
            </div>
          </Link>

          {/* Mobile Menu Button */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={`p-2 rounded-md ${scrolled ? 'text-gray-700' : 'text-white'} focus:outline-none`}
          >
            {mobileMenuOpen ? (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <nav className="md:hidden bg-white shadow-lg rounded-b-xl mt-1 overflow-hidden animate-fadeIn mx-4">
            <Link 
              to="/" 
              className="block text-gray-700 font-medium px-4 py-3 border-b border-gray-100 hover:bg-blue-50"
              onClick={() => setMobileMenuOpen(false)}
            >
              Home
            </Link>
            <button
              onClick={() => {
                scrollToFeatures();
                setMobileMenuOpen(false);
              }}
              className="w-full text-left text-gray-700 font-medium px-4 py-3 border-b border-gray-100 hover:bg-blue-50 focus:outline-none"
            >
              Features
            </button>
            <button
              onClick={() => {
                scrollToContact();
                setMobileMenuOpen(false);
              }}
              className="w-full text-left text-gray-700 font-medium px-4 py-3 border-b border-gray-100 hover:bg-blue-50 focus:outline-none"
            >
              Contact Us
            </button>
            <Link 
              to="/login"
              className="block bg-[#1737A1] text-white font-medium px-4 py-3 hover:bg-[#122b82]"
              onClick={() => setMobileMenuOpen(false)}
            >
              Login / Signup
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header;
