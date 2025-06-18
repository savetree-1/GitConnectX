import React, { useRef } from 'react';

const Features = () => {
  const featuresRef = useRef(null);

  const handleScrollToFeatures = () => {
    if (featuresRef.current) {
      featuresRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div ref={featuresRef} className="bg-transparent py-25 relative z-10">
      <div className="container mx-auto text-center px-6">
        <h2 className="text-4xl sm:text-5xl font-bold text-white mb-15">Next-level
          <span className="text-blue-400"> features</span><br />
          <span className="italic text-white">powering your GitHub social graph exploration.</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
<div className="bg-white/90 backdrop-blur-sm border-blue-500 border-l-8 rounded-xl p-6 shadow-lg flex flex-col justify-center hover:transform hover:scale-105 hover:shadow-cyan-800 transition-all duration-300">
          <h3 className="text-xl font-semibold text-gray-900 mb-2 text-left">Visualize Your Network</h3>
          <p className="text-gray-700 text-left">
            Clear view of your GitHub graph, showing connections and interactions.
          </p>
        </div>
          <div className="bg-white/90 backdrop-blur-sm border-blue-500 border-l-8 rounded-xl p-6 shadow-lg flex flex-col justify-center hover:transform hover:scale-105 hover:shadow-cyan-800 transition-all duration-300">
            <h3 className="text-xl font-semibold text-gray-900 mb-2 text-left">Parallel Processing</h3>
            <p className="text-gray-700 text-left">
              Multi-threaded computation accelerates PageRank and clustering on big graphs.
            </p>
          </div>
          <div className="bg-white/90 backdrop-blur-sm border-blue-500 border-l-8 rounded-xl p-6 shadow-lg flex flex-col justify-center hover:transform hover:scale-105 hover:shadow-cyan-800 transition-all duration-300">
            <h3 className="text-xl font-semibold text-gray-900 mb-2 text-left">Influence Ranking</h3>
            <p className="text-gray-700 text-left">
              PageRank ranks developers by influence across the GitHub network.
            </p>
          </div>
          <div className="bg-white/90 backdrop-blur-sm border-blue-500 border-l-8 rounded-xl p-6 shadow-lg flex flex-col justify-center hover:transform hover:scale-105 hover:shadow-cyan-800 transition-all duration-300">
            <h3 className="text-xl font-semibold text-gray-900 mb-2 text-left">Community Detection</h3>
            <p className="text-gray-700 text-left">
              Louvain clustering uncovers tight-knit developer groups.
            </p>
          </div>
          <div className="bg-white/90 backdrop-blur-sm border-blue-500 border-l-8 rounded-xl p-6 shadow-lg flex flex-col justify-center hover:transform hover:scale-105 hover:shadow-cyan-800 transition-all duration-300">
            <h3 className="text-xl font-semibold text-gray-900 mb-2 text-left">Fast Query Processing</h3>
            <p className="text-gray-700 text-left">
              Optimized algorithms handle large datasets efficiently.
            </p>
          </div>
          <div className="bg-white/90 backdrop-blur-sm border-blue-500 border-l-8 rounded-xl p-6 shadow-lg flex flex-col justify-center hover:transform hover:scale-105 hover:shadow-cyan-800 transition-all duration-300">
            <h3 className="text-xl font-semibold text-gray-900 mb-2 text-left">Algorithm Trade-offs</h3>
            <p className="text-gray-700 text-left">
              Compare Dijkstra vs. Floyd-Warshall, Louvain vs. Girvan-Newman for performance.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Features;
