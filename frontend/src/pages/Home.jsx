import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom'; 
import Header from '../components/Header';
import Footer from '../components/Footer';
import Features from '../components/Features';
import Contact from '../components/Contact';

const Home = () => {
  const [username, setUsername] = useState('');
  const [friendUsername, setFriendUsername] = useState('');
  const [compare, setCompare] = useState(false);
  const navigate = useNavigate();   
  const featuresRef = useRef(null);
  const contactRef = useRef(null);
  
  const handleAnalyze = () => {
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

      <div className="flex-grow  bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 py-20">
        <div className="container mx-auto text-center px-4 mt-15">
          <h1 className="text-5xl font-extrabold text-white mb-4 drop-shadow-lg">
            Explore Your GitHub Social Graph
          </h1>

          <p className="text-lg font-bold text-gray-100 mb-8 max-w-xl mx-auto">
            Visualize your network, compare with friends, and understand your GitHub presence like never before.
          </p>

          <div className="bg-white shadow-lg rounded-lg p-8 max-w-md mx-auto">
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
              className="bg-indigo-600 text-white px-6 py-2 rounded w-full hover:bg-indigo-700 transition transform hover:-translate-y-1 hover:shadow-md"
              onClick={handleAnalyze}
            >
              Analyze
            </button>
          </div>
        </div>

        <section ref={featuresRef} >
          <Features />
        </section>
      </div>
        <section ref={contactRef}>
          <Contact />
        </section>
      <Footer />
    </div>
  );
};

export default Home;
