import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom'; 
import Header from '../components/Header';
import Footer from '../components/Footer';
import Features from '../components/Features';
import Contact from '../components/Contact';
import ogbg from '../assets/ogbg.png';

const Home = () => {
  const [username, setUsername] = useState('');
  const [friendUsername, setFriendUsername] = useState('');
  const [compare, setCompare] = useState(false);
  const navigate = useNavigate();   
  const featuresRef = useRef(null);
  const contactRef = useRef(null);
  
  const handleAnalyze = () => {
    if (!username) {
      alert('Please enter a GitHub username');
      return;
    }
    
    console.log('Analyzing:', username, compare ? friendUsername : null);
    navigate('/dashboard', {
      state: {
        username,
        friendUsername: compare ? friendUsername : null,
      },
    });
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header
        scrollToFeatures={() => featuresRef.current.scrollIntoView({ behavior: 'smooth' })}
        scrollToContact={() => contactRef.current.scrollIntoView({ behavior: 'smooth' })}
      />      
      <div className="relative">
        {/* Extended background across hero and features sections */}
        <div 
          className="absolute inset-0 bg-no-repeat bg-cover bg-center z-0"
          style={{ 
            backgroundImage: `url(${ogbg})`,
            backgroundPosition: 'center',
            backgroundSize: 'cover',
            height: '100%'
          }}
        >
          {/* Extended gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#150429]/70 via-[#1737A1]/70 to-[#150429]/90"></div>
          
          {/* Animated particles that span the entire extended background */}
          <div className="absolute inset-0">
            {/* Original particles */}
            <div className="absolute w-2 h-2 bg-white rounded-full opacity-60 top-20 left-[10%] animate-pulse"></div>
            <div className="absolute w-3 h-3 bg-white rounded-full opacity-40 top-40 left-[20%] animate-pulse delay-300"></div>
            <div className="absolute w-2 h-2 bg-white rounded-full opacity-70 top-60 left-[15%] animate-pulse delay-150"></div>
            <div className="absolute w-2 h-2 bg-white rounded-full opacity-50 top-80 left-[25%] animate-pulse delay-700"></div>
            <div className="absolute w-3 h-3 bg-white rounded-full opacity-60 top-30 left-[30%] animate-pulse delay-500"></div>
            <div className="absolute w-2 h-2 bg-white rounded-full opacity-70 top-[30%] right-[20%] animate-pulse"></div>
            <div className="absolute w-3 h-3 bg-white rounded-full opacity-50 top-[40%] right-[15%] animate-pulse delay-300"></div>
            <div className="absolute w-2 h-2 bg-white rounded-full opacity-60 top-[50%] right-[25%] animate-pulse delay-150"></div>
            <div className="absolute w-2 h-2 bg-white rounded-full opacity-40 top-[60%] right-[10%] animate-pulse delay-700"></div>
            <div className="absolute w-3 h-3 bg-white rounded-full opacity-50 top-[70%] right-[30%] animate-pulse delay-500"></div>
            
            {/* Additional particles - left side */}
            <div className="absolute w-1 h-1 bg-white rounded-full opacity-80 top-[15%] left-[5%] animate-pulse delay-200"></div>
            <div className="absolute w-1.5 h-1.5 bg-white rounded-full opacity-60 top-[25%] left-[12%] animate-pulse delay-400"></div>
            <div className="absolute w-1 h-1 bg-white rounded-full opacity-70 top-[35%] left-[7%] animate-pulse delay-600"></div>
            <div className="absolute w-4 h-4 bg-white rounded-full opacity-20 top-[45%] left-[22%] animate-pulse delay-100"></div>
            <div className="absolute w-2 h-2 bg-white rounded-full opacity-40 top-[55%] left-[8%] animate-pulse delay-350"></div>
            <div className="absolute w-1 h-1 bg-white rounded-full opacity-90 top-[65%] left-[18%] animate-pulse delay-550"></div>
            <div className="absolute w-3 h-3 bg-white rounded-full opacity-25 top-[75%] left-[3%] animate-pulse delay-250"></div>
            
            {/* Additional particles - center */}
            <div className="absolute w-1 h-1 bg-white rounded-full opacity-60 top-[10%] left-[48%] animate-pulse delay-450"></div>
            <div className="absolute w-1.5 h-1.5 bg-white rounded-full opacity-70 top-[20%] left-[52%] animate-pulse delay-650"></div>
            <div className="absolute w-1 h-1 bg-white rounded-full opacity-80 top-[30%] left-[45%] animate-pulse delay-150"></div>
            <div className="absolute w-2 h-2 bg-white rounded-full opacity-40 top-[40%] left-[55%] animate-pulse delay-550"></div>
            <div className="absolute w-1.5 h-1.5 bg-white rounded-full opacity-50 top-[60%] left-[47%] animate-pulse delay-350"></div>
            <div className="absolute w-1 h-1 bg-white rounded-full opacity-75 top-[70%] left-[53%] animate-pulse delay-250"></div>
            <div className="absolute w-2 h-2 bg-white rounded-full opacity-30 top-[80%] left-[49%] animate-pulse delay-450"></div>
            
            {/* Additional particles - right side */}
            <div className="absolute w-1 h-1 bg-white rounded-full opacity-70 top-[12%] right-[5%] animate-pulse delay-350"></div>
            <div className="absolute w-1.5 h-1.5 bg-white rounded-full opacity-50 top-[22%] right-[12%] animate-pulse delay-250"></div>
            <div className="absolute w-1 h-1 bg-white rounded-full opacity-80 top-[32%] right-[7%] animate-pulse delay-150"></div>
            <div className="absolute w-4 h-4 bg-white rounded-full opacity-15 top-[42%] right-[22%] animate-pulse delay-650"></div>
            <div className="absolute w-2 h-2 bg-white rounded-full opacity-35 top-[52%] right-[8%] animate-pulse delay-550"></div>
            <div className="absolute w-1 h-1 bg-white rounded-full opacity-85 top-[62%] right-[18%] animate-pulse delay-450"></div>
            <div className="absolute w-3 h-3 bg-white rounded-full opacity-20 top-[72%] right-[3%] animate-pulse delay-150"></div>
            
            {/* Blue tinted particles */}
            <div className="absolute w-2 h-2 bg-blue-200 rounded-full opacity-50 top-[15%] left-[35%] animate-pulse delay-300"></div>
            <div className="absolute w-1.5 h-1.5 bg-blue-200 rounded-full opacity-60 top-[55%] right-[35%] animate-pulse delay-400"></div>
            <div className="absolute w-2.5 h-2.5 bg-blue-200 rounded-full opacity-40 top-[75%] left-[40%] animate-pulse delay-200"></div>
            <div className="absolute w-1.5 h-1.5 bg-blue-200 rounded-full opacity-70 top-[25%] right-[40%] animate-pulse delay-500"></div>
            
            {/* Green tinted particles - matching the site theme */}
            <div className="absolute w-2 h-2 bg-[#a4e22a]/70 rounded-full opacity-30 top-[22%] left-[42%] animate-pulse delay-350"></div>
            <div className="absolute w-1.5 h-1.5 bg-[#a4e22a]/70 rounded-full opacity-40 top-[62%] right-[42%] animate-pulse delay-250"></div>
            <div className="absolute w-1 h-1 bg-[#a4e22a]/70 rounded-full opacity-60 top-[37%] left-[65%] animate-pulse delay-450"></div>
            <div className="absolute w-2.5 h-2.5 bg-[#a4e22a]/70 rounded-full opacity-20 top-[82%] right-[28%] animate-pulse delay-550"></div>

            {/* Connection lines */}
            <div className="absolute top-[30%] left-[20%] w-[15%] h-[0.5px] bg-gradient-to-r from-white to-transparent opacity-30 rotate-[35deg]"></div>
            <div className="absolute top-[40%] right-[20%] w-[15%] h-[0.5px] bg-gradient-to-l from-white to-transparent opacity-30 -rotate-[35deg]"></div>
            <div className="absolute top-[60%] left-[40%] w-[20%] h-[0.5px] bg-gradient-to-r from-white to-transparent opacity-20 rotate-[15deg]"></div>
            <div className="absolute top-[70%] right-[35%] w-[10%] h-[0.5px] bg-gradient-to-l from-white to-transparent opacity-20 -rotate-[25deg]"></div>
            
            {/* Extra particles for the features section */}
            <div className="absolute w-2 h-2 bg-white rounded-full opacity-60 top-[90%] left-[15%] animate-pulse delay-200"></div>
            <div className="absolute w-3 h-3 bg-white rounded-full opacity-50 top-[85%] right-[10%] animate-pulse delay-400"></div>
            <div className="absolute w-1.5 h-1.5 bg-white rounded-full opacity-70 top-[95%] left-[30%] animate-pulse delay-150"></div>
            <div className="absolute w-2 h-2 bg-[#a4e22a]/70 rounded-full opacity-40 top-[92%] right-[25%] animate-pulse delay-350"></div>
            <div className="absolute w-1 h-1 bg-blue-200 rounded-full opacity-60 top-[88%] left-[60%] animate-pulse delay-550"></div>
            
            {/* Extra connection lines for the features section */}
            <div className="absolute top-[87%] left-[25%] w-[20%] h-[0.5px] bg-gradient-to-r from-white to-transparent opacity-25 rotate-[10deg]"></div>
            <div className="absolute top-[93%] right-[20%] w-[15%] h-[0.5px] bg-gradient-to-l from-white to-transparent opacity-20 -rotate-[15deg]"></div>
          </div>
        </div>
        
        {/* Hero content */}
        <div 
          className="w-full min-h-[600px] relative overflow-hidden flex items-center" 
        >
          <div className="container mx-auto px-4 relative z-10">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-10">
              {/* Hero Text */}
              <div className="lg:w-1/2 text-center lg:text-left">
                <h1 className="text-4xl lg:text-5xl font-extrabold text-white mb-2 drop-shadow-lg">
                  Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-[#a4e22a]">GitConnectX</span>
          </h1>
                <h1 className="text-4xl lg:text-5xl font-extrabold text-white mb-4 drop-shadow-lg">
            Explore Your GitHub Social Graph
          </h1>
                <p className="text-lg font-bold text-gray-100 mb-8 drop-shadow-lg max-w-lg mx-auto lg:mx-0">
            Visualize your network, compare with friends, and understand your GitHub presence like never before.
                </p>
              </div>
              
              {/* Form Card */}
              <div className="lg:w-1/2 max-w-md mx-auto lg:mx-0">
                <div className="bg-white/90 backdrop-blur-sm shadow-lg rounded-2xl p-6 lg:p-8 transition-all duration-300 hover:shadow-xl relative overflow-hidden">
                  {/* Decorative element */}
                  <div className="absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br from-[#1737A1]/10 to-[#a4e22a]/10 rounded-full"></div>
                  <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-gradient-to-tr from-[#a4e22a]/10 to-[#1737A1]/10 rounded-full"></div>
                  
                  <h3 className="text-gray-800 font-semibold mb-4 relative z-10">Start Exploring Now</h3>
                  
                  <div className="mb-4 relative z-10">
              <input
                type="text"
                placeholder="Enter your GitHub username"
                      className="border border-gray-300 px-5 py-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-[#1737A1]/50 focus:border-[#1737A1] transition-all duration-300"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                    </div>
            </div>

                  <div className="mb-4 flex items-center justify-center relative z-10">
                    <label className="inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                        className="sr-only peer"
                checked={compare}
                onChange={() => setCompare(!compare)}
              />
                      <div className={`relative w-11 h-6 rounded-full transition peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 
                        ${compare ? 'bg-[#1737A1]' : 'bg-gray-200'}`}>
                        <div className={`absolute top-[2px] left-[2px] bg-white w-5 h-5 rounded-full transition-all duration-300 
                          ${compare ? 'translate-x-5' : 'translate-x-0'}`}>
                        </div>
                      </div>
                      <span className="ml-3 text-gray-700 font-medium">Compare with a friend?</span>
                    </label>
            </div>

            {compare && (
                    <div className="mb-4 relative z-10 animate-fadeIn">
                <input
                  type="text"
                  placeholder="Enter your friend's GitHub username"
                        className="border border-gray-300 px-5 py-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-[#1737A1]/50 focus:border-[#1737A1] transition-all duration-300"
                  value={friendUsername}
                  onChange={(e) => setFriendUsername(e.target.value)}
                />
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                        </svg>
                      </div>
              </div>
            )}

            <button
                    className="bg-gradient-to-r from-[#1737A1] to-[#122b82] text-white px-6 py-3 rounded-lg w-full hover:opacity-95 transition-all transform hover:-translate-y-1 hover:shadow-md flex items-center justify-center space-x-2 group relative z-10"
              onClick={handleAnalyze}
            >
                    <span>Analyze Now</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transform transition-transform group-hover:translate-x-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
            </button>
          </div>
        </div>
      </div>
          </div>
        </div>
        
        {/* Features section with the same background */}
        <div ref={featuresRef}>
          <Features />
        </div>
      </div>
      
        <section ref={contactRef}>
          <Contact/>
        </section>
      <Footer />
    </div>
  );
};

export default Home;
