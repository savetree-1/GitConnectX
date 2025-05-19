import React, { useEffect, useRef } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Features from '../components/Features';
import Contact from '../components/Contact';

// Import team member images
import ankushImage from '../assets/ankush.jpg';
import ayushImage from '../assets/ayush.jpg';
import anikaImage from '../assets/anika.jpg';
import akhilImage from '../assets/akhil.jpg';

const AboutUs = () => {
  const featuresRef = useRef(null);
  const contactRef = useRef(null);

  const scrollToFeatures = () => {
    if (featuresRef.current) {
      featuresRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollToContact = () => {
    if (contactRef.current) {
      contactRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Load Font Awesome script and particles.js
  useEffect(() => {
    // Load Font Awesome
    const faLink = document.createElement('link');
    faLink.rel = 'stylesheet';
    faLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css';
    faLink.integrity = 'sha512-DTOQO9RWCH3ppGqcWaEA1BIZOC6xxalwEsw9c2QQeAIftl+Vegovlnee1c9QX4TctnWMn13TZye+giMm8e2LwA==';
    faLink.crossOrigin = 'anonymous';
    faLink.referrerPolicy = 'no-referrer';
    document.head.appendChild(faLink);

    // Load particles.js
    const particlesScript = document.createElement('script');
    particlesScript.src = 'https://cdn.jsdelivr.net/npm/particles.js@2.0.0/particles.min.js';
    particlesScript.onload = () => {
      // Configure particles.js after it's loaded
      if (window.particlesJS) {
        window.particlesJS('particles-js', {
          particles: {
            number: {
              value: 85, // Increased number of particles
              density: {
                enable: true,
                value_area: 800
              }
            },
            color: {
              value: '#ffffff' // Pure white for more visibility
            },
            shape: {
              type: 'circle'
            },
            opacity: {
              value: 0.6, // Increased brightness
              random: true,
              anim: {
                enable: true,
                speed: 0.6, // Slightly faster animation
                opacity_min: 0.2, // Higher minimum opacity
                sync: false
              }
            },
            size: {
              value: 3,
              random: true
            },
            line_linked: {
              enable: true,
              distance: 150,
              color: '#ffffff', // Pure white connections
              opacity: 0.4, // More visible connections
              width: 1.2 // Slightly thicker lines
            },
            move: {
              enable: true,
              speed: 1.5, // Slightly faster movement
              direction: 'none',
              random: false,
              straight: false,
              out_mode: 'out',
              bounce: false
            }
          },
          interactivity: {
            detect_on: 'canvas',
            events: {
              onhover: {
                enable: true,
                mode: 'grab'
              },
              onclick: {
                enable: true,
                mode: 'push'
              },
              resize: true
            },
            modes: {
              grab: {
                distance: 140,
                line_linked: {
                  opacity: 0.5
                }
              },
              push: {
                particles_nb: 3
              }
            }
          },
          retina_detect: true
        });
      }
    };
    document.body.appendChild(particlesScript);

    return () => {
      document.head.removeChild(faLink);
      // Only remove if it exists
      if (document.body.contains(particlesScript)) {
        document.body.removeChild(particlesScript);
      }
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Particles.js container */}
      <div 
        id="particles-js" 
        style={{ 
          position: 'fixed',
          width: '100%',
          height: '100%',
          top: 0,
          left: 0,
          zIndex: 0,
          backgroundColor: '#150429' // Much darker violet background
        }}
      ></div>
      
      <Header 
        scrollToFeatures={scrollToFeatures} 
        scrollToContact={scrollToContact} 
      />
      
      <div className="flex-grow pt-20 relative z-10">
        <div className="container mx-auto px-4 py-12">
          <h1 className="text-4xl font-bold text-center text-[#ffffff] mb-3">Meet Our Fantastic Team</h1>
          <p className="text-gray-100 text-center max-w-3xl mx-auto mb-12">
            Our talented professionals are passionate about creating innovative solutions for the GitHub community.
            Each team member brings unique expertise to make GitConnectX truly exceptional.
          </p>
          
          {/* Team section with bright green background */}
          <div className="backdrop-blur-md bg-white/10 border border-white/30 py-20 rounded-3xl relative mb-30">
            <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
                
                {/* Ankush Rawat */}
                <div className="flex flex-col items-center bg-white p-8 rounded-xl shadow-md transition-all duration-300 hover:shadow-2xl group hover:scale-105 hover:shadow-indigo-800/50">
                  <div className="overflow-hidden rounded-xl mb-6 w-full">
                    <img 
                      src={ankushImage} 
                      alt="Ankush Rawat" 
                      className="w-full h-64 object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  </div>
                  <h3 className="font-bold text-xl uppercase text-center mb-1">Ankush Rawat</h3>
                  <p className="text-indigo-800 mb-4 text-center font-semibold">AI Lead & Backend</p>
                  <p className="text-gray-600 text-center mb-6">
                    Expert in machine learning algorithms and backend architecture, specializing in network analysis and data processing systems.
                  </p>
                  <div className="flex justify-center space-x-4">
                    <a href="#" className="text-gray-800 hover:text-[#1737A1] transition-colors">
                      <i className="fab fa-facebook-f"></i>
                    </a>
                    <a href="#" className="text-gray-800 hover:text-[#1737A1] transition-colors">
                      <i className="fab fa-twitter"></i>
                    </a>
                    <a href="#" className="text-gray-800 hover:text-[#1737A1] transition-colors">
                      <i className="fab fa-instagram"></i>
                    </a>
                    <a href="#" className="text-gray-800 hover:text-[#1737A1] transition-colors">
                      <i className="fab fa-linkedin-in"></i>
                    </a>
                  </div>
                </div>
                
                {/* Ayush Negi */}
                <div className="flex flex-col items-center bg-white p-8 rounded-xl shadow-md transition-all duration-300 hover:shadow-2xl group hover:scale-105 hover:shadow-indigo-800/50">
                  <div className="overflow-hidden rounded-xl mb-6 w-full">
                    <img 
                      src={ayushImage} 
                      alt="Ayush Negi" 
                      className="w-full h-64 object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  </div>
                  <h3 className="font-bold text-xl uppercase text-center mb-1">Ayush Negi</h3>
                  <p className="text-indigo-800 mb-4 text-center font-semibold">Backend Developer</p>
                  <p className="text-gray-600 text-center mb-6">
                    Focuses on API development and integration, creating robust backend systems that power our data-intensive applications.
                  </p>
                  <div className="flex justify-center space-x-4">
                    <a href="#" className="text-gray-800 hover:text-[#1737A1] transition-colors">
                      <i className="fab fa-facebook-f"></i>
                    </a>
                    <a href="#" className="text-gray-800 hover:text-[#1737A1] transition-colors">
                      <i className="fab fa-twitter"></i>
                    </a>
                    <a href="#" className="text-gray-800 hover:text-[#1737A1] transition-colors">
                      <i className="fab fa-instagram"></i>
                    </a>
                    <a href="#" className="text-gray-800 hover:text-[#1737A1] transition-colors">
                      <i className="fab fa-linkedin-in"></i>
                    </a>
                  </div>
                </div>
                
                {/* Anika Dewari */}
                <div className="flex flex-col items-center bg-white p-8 rounded-xl shadow-md transition-all duration-300 hover:shadow-2xl group hover:scale-105 hover:shadow-indigo-800/50">
                  <div className="overflow-hidden rounded-xl mb-6 w-full">
                    <img 
                      src={anikaImage} 
                      alt="Anika Dewari" 
                      className="w-full h-64 object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  </div>
                  <h3 className="font-bold text-xl uppercase text-center mb-1">Anika Dewari</h3>
                  <p className="text-indigo-800 mb-4 text-center font-semibold">Frontend Developer</p>
                  <p className="text-gray-600 text-center mb-6">
                    Creates beautiful and intuitive user interfaces, specializing in React components and data visualization.
                  </p>
                  <div className="flex justify-center space-x-4">
                    <a href="#" className="text-gray-800 hover:text-[#1737A1] transition-colors">
                      <i className="fab fa-facebook-f"></i>
                    </a>
                    <a href="#" className="text-gray-800 hover:text-[#1737A1] transition-colors">
                      <i className="fab fa-twitter"></i>
                    </a>
                    <a href="#" className="text-gray-800 hover:text-[#1737A1] transition-colors">
                      <i className="fab fa-instagram"></i>
                    </a>
                    <a href="#" className="text-gray-800 hover:text-[#1737A1] transition-colors">
                      <i className="fab fa-linkedin-in"></i>
                    </a>
                  </div>
                </div>

                {/* Akhil */}
                <div className="flex flex-col items-center bg-white p-8 rounded-xl shadow-md transition-all duration-300 hover:shadow-2xl group hover:scale-105 hover:shadow-indigo-800/50">
                  <div className="overflow-hidden rounded-xl mb-6 w-full">
                    <img 
                      src={akhilImage} 
                      alt="Akhil" 
                      className="w-full h-64 object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  </div>
                  <h3 className="font-bold text-xl uppercase text-center mb-1">Akhil</h3>
                  <p className="text-indigo-800 mb-4 text-center font-semibold">Algorithms & Database</p>
                  <p className="text-gray-600 text-center mb-6">
                    Specializes in algorithm optimization and database architecture, ensuring efficient data storage and retrieval.
                  </p>
                  <div className="flex justify-center space-x-4">
                    <a href="#" className="text-gray-800 hover:text-[#1737A1] transition-colors">
                      <i className="fab fa-facebook-f"></i>
                    </a>
                    <a href="#" className="text-gray-800 hover:text-[#1737A1] transition-colors">
                      <i className="fab fa-twitter"></i>
                    </a>
                    <a href="#" className="text-gray-800 hover:text-[#1737A1] transition-colors">
                      <i className="fab fa-instagram"></i>
                    </a>
                    <a href="#" className="text-gray-800 hover:text-[#1737A1] transition-colors">
                      <i className="fab fa-linkedin-in"></i>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Our Values Section - New Creative Section */}
          <div className="max-w-6xl mx-auto my-20 px-4 mb-30">
            <h2 className="text-3xl font-bold text-center text-white mb-12">Our Core Values</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-[#1737A1]/30 p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow backdrop-blur-sm">
                <div className="w-14 h-14 bg-[#1737A1] rounded-full flex items-center justify-center mb-6 mx-auto">
                  <i className="fas fa-lightbulb text-white text-2xl"></i>
                </div>
                <h3 className="text-xl font-bold text-center text-white mb-4">Innovation</h3>
                <p className="text-gray-100 text-center">
                  We continuously seek new and creative solutions to complex problems, pushing the boundaries of what's possible in network visualization.
                </p>
              </div>
              
              <div className="bg-[#1737A1]/30 p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow backdrop-blur-sm">
                <div className="w-14 h-14 bg-[#1737A1] rounded-full flex items-center justify-center mb-6 mx-auto">
                  <i className="fas fa-users text-white text-2xl"></i>
                </div>
                <h3 className="text-xl font-bold text-center text-white mb-4">Collaboration</h3>
                <p className="text-gray-100 text-center">
                  We believe in the power of working together, just like the open-source community we serve. Together, we achieve more.
                </p>
              </div>
              
              <div className="bg-[#1737A1]/30 p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow backdrop-blur-sm">
                <div className="w-14 h-14 bg-[#1737A1] rounded-full flex items-center justify-center mb-6 mx-auto">
                  <i className="fas fa-shield-alt text-white text-2xl"></i>
                </div>
                <h3 className="text-xl font-bold text-center text-white mb-4">Integrity</h3>
                <p className="text-gray-100 text-center">
                  We're committed to transparency, honesty, and ethical practices in everything we do, from code to communication.
                </p>
              </div>
            </div>
          </div>
          
          {/* Mission and company info section */}
          <div className="max-w-4xl mx-auto my-16 px-4 mb-15">
            <h2 className="text-3xl font-bold text-center text-white mb-8">About GitConnectX</h2>
            
            <div className="bg-white rounded-2xl shadow-md p-8 mb-30 backdrop-blur-sm">
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Our Mission</h3>
              <p className="text-gray-600 mb-6">
                GitConnectX was created with a simple mission: to help developers visualize, analyze and leverage their GitHub networks 
                for better collaboration and community building. We believe that understanding the connections between developers and 
                projects can lead to more meaningful open source contributions and professional growth.
              </p>
              
              <h3 className="text-2xl font-bold text-gray-800 mb-4">What We Do</h3>
              <p className="text-gray-600 mb-6">
                Our platform provides powerful visualization tools that transform complex GitHub data into intuitive, 
                interactive network graphs. Through these visualizations, developers can identify key collaborators, 
                discover trending repositories, and find new opportunities for contribution within their network.
              </p>
            </div>
            
            {/* Core Features */}
            <div className="rounded-2xl mb-30 relative z-10">
              <h3 className="text-3xl font-bold text-center text-white mb-8">Our Core Features</h3>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-[#1737A1]/30  backdrop-blur-sm p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
                  <h4 className="text-xl font-semibold text-white mb-3">Network Analysis</h4>
                  <p className="text-gray-300">
                    Visualize your GitHub connections and understand complex relationship patterns using our advanced network algorithms.
                  </p>
                </div>
                
                <div className="bg-[#1737A1]/30  backdrop-blur-sm p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
                  <h4 className="text-xl font-semibold text-white mb-3">Contribution Insights</h4>
                  <p className="text-gray-300">
                    Gain valuable insights into your contribution patterns, identify your strengths, and discover areas for potential growth.
                  </p>
                </div>
                
                <div className="bg-[#1737A1]/30  backdrop-blur-sm p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
                  <h4 className="text-xl font-semibold text-white mb-3">Community Detection</h4>
                  <p className="text-gray-300">
                    Find like-minded developers and active communities that align with your interests and skill set.
                  </p>
                </div>
              </div>
            </div>
            
            {/* Testimonials Section - New Creative Section */}
            <div className="mb-30">
              <h3 className="text-3xl font-bold text-center text-white mb-10">What Our Users Say</h3>
              
              <div className="grid md:grid-cols-2 gap-8">
                <div className="bg-[#ffffff]/10 p-10 rounded-xl shadow-md relative backdrop-blur-sm">
                  <div className="text-5xl text-[#a4e22a]/50 absolute top-6 left-6">
                    <i className="fas fa-quote-left"></i>
                  </div>
                  <p className="text-gray-100 relative z-10 italic mb-8 pl-8 pt-6">
                    "GitConnectX completely transformed how I understand my GitHub network. The visualizations helped me find collaborators
                    I never knew existed in my extended network."
                  </p>
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-gray-300 rounded-full mr-4"></div>
                    <div>
                      <h4 className="font-bold text-white">Sarah Johnson</h4>
                      <p className="text-sm text-gray-300">Full Stack Developer</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-[#ffffff]/10 p-10 rounded-xl shadow-md relative backdrop-blur-sm">
                  <div className="text-5xl text-[#a4e22a]/50 absolute top-6 left-6">
                    <i className="fas fa-quote-left"></i>
                  </div>
                  <p className="text-gray-100 relative z-10 italic mb-8 pl-8 pt-6">
                    "The network analysis tools helped our team identify key contributors in the open source projects we depend on.
                    This allowed us to connect with them and improve our contribution strategy."
                  </p>
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-gray-300 rounded-full mr-4"></div>
                    <div>
                      <h4 className="font-bold text-white">Mark Thomas</h4>
                      <p className="text-sm text-gray-300">Open Source Advocate</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Get Involved Section */}
            <div className="text-center mb-16">
              <h3 className="text-3xl font-bold text-white mb-4">Get Involved</h3>
              <p className="text-gray-100 mb-8 max-w-2xl mx-auto">
                We're always looking for contributors who are passionate about data visualization, network analysis, 
                and building tools for developers. Join our community and help us build the future of GitHub networking.
              </p>
              
              <a 
                href="https://github.com/savetree-1/GitConnectX" 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-[#1737A1] text-white px-8 py-3 rounded-xl font-medium hover:bg-indigo-700 transition-colors inline-block hover:shadow-lg"
              >
                <i className="fab fa-github mr-2"></i> View on GitHub
              </a>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div ref={featuresRef}>
          <Features />
        </div>

        {/* Contact Section */}
        <div ref={contactRef}>
          <Contact />
        </div>
      <Footer />
      </div>
      
    </div>
  );
};

export default AboutUs; 