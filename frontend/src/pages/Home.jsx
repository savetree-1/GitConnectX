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
      <div className="w-full h-[525px] bg-no-repeat bg-cover bg-center p-10" style={{ backgroundImage: `url(${ogbg})` }}>
        <div className="container flex  flex-col items-end justify-center px-4 mt-15">
          <h1 className="text-5xl font-extrabold text-white mb-2 drop-shadow-lg">
            Welcome to GitConnectX
          </h1>
          <h1 className="text-5xl font-extrabold text-white mb-4 drop-shadow-lg">
            Explore Your GitHub Social Graph
          </h1>
           <h1 className="text-lg font-bold text-gray-100 mb-4 drop-shadow-lg">
            Visualize your network, compare with friends, and understand your GitHub presence like never before.
          </h1>

          <div className="bg-white shadow-lg rounded-lg p-8 w-[30rem]">
            <div className="mb-4">
              <input
                type="text"
                placeholder="Enter your GitHub username"
                className="border border-gray-300 px-4 py-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-indigo-400"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            <div className="mb-4 flex items-center justify-center">
              <input
                type="checkbox"
                className="form-checkbox h-5 w-5 text-indigo-600"
                checked={compare}
                onChange={() => setCompare(!compare)}
              />
              <span className="ml-2 text-gray-700">Compare with a friend?</span>
            </div>

            {compare && (
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Enter your friend's GitHub username"
                  className="border border-gray-300 px-4 py-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  value={friendUsername}
                  onChange={(e) => setFriendUsername(e.target.value)}
                />
              </div>
            )}

            <button
              className="bg-[#1737A1] text-white px-6 py-2 rounded w-full hover:bg-indigo-700 transition transform hover:-translate-y-1 hover:shadow-md"
              onClick={handleAnalyze}
            >
              Analyze
            </button>
          </div>
        </div>
      </div>
        <section ref={featuresRef} >
          <Features />
        </section>
        <section ref={contactRef}>
          <Contact/>
        </section>
      <Footer />
    </div>
  );
};

export default Home;
