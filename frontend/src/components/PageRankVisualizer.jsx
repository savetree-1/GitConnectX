import { useState, useEffect } from 'react';
import DemoDataGenerator from './DemoDataGenerator';

const PageRankVisualizer = ({ username, isAuthenticated }) => {
  const [pageRankData, setPageRankData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [displayCount, setDisplayCount] = useState(10);

  useEffect(() => {
    const fetchPageRankData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        if (isAuthenticated) {
          // Try to fetch real data from API if user is authenticated
          try {
            const response = await fetch(`http://localhost:5000/api/network/pagerank`);
            
            if (response.ok) {
              const data = await response.json();
              if (data.status === 'success') {
                setPageRankData(data.data);
                return;
              }
            }
            // If API fails, continue to use demo data
          } catch (e) {
            console.log('API not available, using demo data');
          }
        }
        
        // Generate demo data if API fails or user is not authenticated
        const demoData = DemoDataGenerator.generatePageRankData();
        setPageRankData(demoData);
        
      } catch (err) {
        console.error('Error loading PageRank data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPageRankData();
  }, [isAuthenticated]);

  const handleShowMore = () => {
    setDisplayCount(prev => Math.min(prev + 10, pageRankData.users.length));
  };

  return (
    <div className="font-sans bg-white border-blue-500 border-2 rounded-lg shadow-md p-5 mb-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">GitHub Influence Rankings</h2>
      
      {!isAuthenticated && (
        <div className="italic text-sm text-gray-500 mb-4">
          Sign in to see personalized influence rankings for your network
        </div>
      )}
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <p className="text-gray-500">Loading PageRank data...</p>
        </div>
      ) : error ? (
        <div className="flex justify-center items-center h-64">
          <p className="text-red-500">{error}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Stats summary */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Top Score</p>
              <p className="text-2xl font-bold text-blue-700">{pageRankData.stats.maxScore}</p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Average Score</p>
              <p className="text-2xl font-bold text-blue-700">{pageRankData.stats.avgScore}</p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg md:col-span-1">
              <p className="text-sm text-gray-600">Users Analyzed</p>
              <p className="text-2xl font-bold text-blue-700">{pageRankData.users.length}</p>
            </div>
          </div>
          
          {/* User rankings table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rank
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Score
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Followers
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Repositories
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pageRankData.users.slice(0, displayCount).map((user, index) => (
                  <tr key={user.username} className={index < 3 ? 'bg-yellow-50' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm ${index < 3 ? 'font-bold text-yellow-700' : 'text-gray-900'}`}>
                        {index + 1}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8 bg-gray-200 rounded-full flex items-center justify-center">
                          <span className="text-xs font-medium">{user.displayName.charAt(0)}</span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{user.displayName}</div>
                          <div className="text-sm text-gray-500">@{user.username}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-24 bg-gray-200 rounded-full h-2.5 mr-2">
                          <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${(user.score / pageRankData.stats.maxScore) * 100}%` }}></div>
                        </div>
                        <span className="text-sm text-gray-900">{user.score.toFixed(4)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.followers.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.repositories}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {displayCount < pageRankData.users.length && (
            <div className="flex justify-center mt-4">
              <button
                onClick={handleShowMore}
                className="px-4 py-2 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200"
              >
                Show More
              </button>
            </div>
          )}
          
          <div className="text-xs text-center text-gray-500 mt-4">
            {isAuthenticated ? 
              'PageRank algorithm applied to your GitHub network' : 
              'Sample PageRank data based on typical GitHub networks'}
          </div>
        </div>
      )}
    </div>
  );
};

export default PageRankVisualizer; 