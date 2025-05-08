import React, { useRef } from 'react';

const Features = () => {
  const featuresRef = useRef(null);

  const handleScrollToFeatures = () => {
    if (featuresRef.current) {
      featuresRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div ref={featuresRef} className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 py-20">
      <div className="container mx-auto text-center px-6">
        <h1 className="text-5xl font-extrabold text-white mb-6 drop-shadow-lg">
          Features
        </h1>
        <p className="text-lg font-bold text-gray-100 mb-10 max-w-2xl mx-auto">
          Discover the powerful features driving your GitHub social graph insights.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          <div className="bg-white bg-opacity-90 rounded-xl p-6 shadow-lg flex flex-col justify-center">
            <h3 className="text-xl font-semibold text-gray-900 mb-2 text-center">Visualize Your Network</h3>
            <p className="text-gray-700 text-center">
              Clear view of your GitHub graph, showing connections and interactions.
            </p>
          </div>
          <div className="bg-white bg-opacity-90 rounded-xl p-6 shadow-lg flex flex-col justify-center">
            <h3 className="text-xl font-semibold text-gray-900 mb-2 text-center">Parallel Processing</h3>
            <p className="text-gray-700 text-center">
              Multi-threaded computation accelerates PageRank and clustering on big graphs.
            </p>
          </div>
          <div className="bg-white bg-opacity-90 rounded-xl p-6 shadow-lg flex flex-col justify-center">
            <h3 className="text-xl font-semibold text-gray-900 mb-2 text-center">Influence Ranking</h3>
            <p className="text-gray-700 text-center">
              PageRank ranks developers by influence across the GitHub network.
            </p>
          </div>
          <div className="bg-white bg-opacity-90 rounded-xl p-6 shadow-lg flex flex-col justify-center">
            <h3 className="text-xl font-semibold text-gray-900 mb-2 text-center">Community Detection</h3>
            <p className="text-gray-700 text-center">
              Louvain clustering uncovers tight-knit developer groups.
            </p>
          </div>
          <div className="bg-white bg-opacity-90 rounded-xl p-6 shadow-lg flex flex-col justify-center">
            <h3 className="text-xl font-semibold text-gray-900 mb-2 text-center">Fast Query Processing</h3>
            <p className="text-gray-700 text-center">
              Optimized algorithms handle large datasets efficiently.
            </p>
          </div>
          <div className="bg-white bg-opacity-90 rounded-xl p-6 shadow-lg flex flex-col justify-center">
            <h3 className="text-xl font-semibold text-gray-900 mb-2 text-center">Algorithm Trade-offs</h3>
            <p className="text-gray-700 text-center">
              Compare Dijkstra vs. Floyd-Warshall, Louvain vs. Girvan-Newman for performance.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Features;
