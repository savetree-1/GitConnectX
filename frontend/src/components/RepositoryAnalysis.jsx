import { useState, useEffect } from 'react';
import DemoDataGenerator from './DemoDataGenerator';

const RepositoryAnalysis = ({ username }) => {
  const [repoData, setRepoData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRepo, setSelectedRepo] = useState(null);

  useEffect(() => {
    const fetchRepositoryData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Try to fetch real data from API
        const response = await fetch(`http://localhost:5000/api/user/${username}/repositories`);
        
        if (!response.ok) console.error(`Failed to fetch repository analysis: ${response.status} ${response.statusText}`);
        
        if (response.ok) {
          const data = await response.json();
          if (data.status === 'success') {
            setRepoData(data.data);
            return;
          }
        }
        // If API fails, continue to use demo data
        
        // Generate demo data if API fails
        const demoData = DemoDataGenerator.generateRepoAnalysisData();
        setRepoData(demoData);
        
      } catch (err) {
        console.error('Error loading repository data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRepositoryData();
  }, [username]);

  // Helper function to determine language color
  const getLanguageColor = (language) => {
    const colors = {
      JavaScript: '#f1e05a',
      TypeScript: '#2b7489',
      Python: '#3572A5',
      Java: '#b07219',
      Go: '#00ADD8',
      HTML: '#e34c26',
      CSS: '#563d7c',
      Ruby: '#701516',
      PHP: '#4F5D95',
      C: '#555555',
      'C++': '#f34b7d',
      'C#': '#178600',
    };
    
    return colors[language] || '#ccc';
  };

  return (
    <div className="font-sans bg-white border-blue-500 border-2 rounded-lg shadow-md p-5 mb-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Repository Analysis</h2>
      
      {/* {!isAuthenticated && (
        <div className="italic text-sm text-gray-500 mb-4">
          Sign in to see your personal repository analysis
        </div>
      )} */}
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <p className="text-gray-500">Loading repository data...</p>
        </div>
      ) : error ? (
        <div className="flex justify-center items-center h-64">
          <p className="text-red-500">{error}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Overview Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Repositories</p>
              <p className="text-2xl font-bold text-blue-700">{repoData.repositoryCount}</p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Total Stars</p>
              <p className="text-2xl font-bold text-blue-700">{repoData.stars.toLocaleString()}</p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Total Forks</p>
              <p className="text-2xl font-bold text-blue-700">{repoData.forks.toLocaleString()}</p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Collaborators</p>
              <p className="text-2xl font-bold text-blue-700">{repoData.collaborators}</p>
            </div>
          </div>
          
          {/* Language Distribution */}
          <div className="bg-white border rounded-lg p-5">
            <h3 className="text-lg font-semibold mb-4">Language Distribution</h3>
            
            <div className="space-y-3">
              {Object.entries(repoData.languages).map(([language, percentage]) => (
                <div key={language} className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="flex items-center">
                      <span 
                        className="inline-block w-3 h-3 rounded-full mr-2" 
                        style={{ backgroundColor: getLanguageColor(language) }}
                      ></span>
                      {language}
                    </span>
                    <span className="text-gray-600">{percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full" 
                      style={{ 
                        width: `${percentage}%`,
                        backgroundColor: getLanguageColor(language)
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Commit Activity */}
          <div className="bg-white border rounded-lg p-5">
            <h3 className="text-lg font-semibold mb-4">Recent Commit Activity</h3>
            
            <div className="h-40 relative">
              <div className="absolute inset-0 flex items-end">
                {repoData.commitActivity.map((day, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center justify-end">
                    <div 
                      className="w-full bg-blue-500 mx-px" 
                      style={{ 
                        height: `${(day.commits / Math.max(...repoData.commitActivity.map(d => d.commits))) * 100}%`,
                        maxHeight: '100%'
                      }}
                    ></div>
                    {i % 5 === 0 && (
                      <span className="text-xs text-gray-500 mt-1">{day.date.split('-')[2]}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Top Repositories Table */}
          <div className="bg-white border rounded-lg overflow-hidden">
            <h3 className="text-lg font-semibold p-5 border-b">Top Repositories</h3>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Repository</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Language</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stars</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Forks</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Updated</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {repoData.topRepositories.map((repo) => (
                    <tr key={repo.name} className="hover:bg-blue-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-blue-600">{repo.name}</div>
                        <div className="text-sm text-gray-500">{repo.description}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {repo.language && (
                          <span className="flex items-center">
                            <span 
                              className="inline-block w-3 h-3 rounded-full mr-2" 
                              style={{ backgroundColor: getLanguageColor(repo.language) }}
                            ></span>
                            {repo.language}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{repo.stars}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{repo.forks}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{repo.updated}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="text-xs text-center text-gray-500 mt-4">
            {/* {isAuthenticated ? 
              'Data from your GitHub repositories' : 
              'Sample repository data for demonstration purposes'} */}
          </div>
        </div>
      )}
    </div>
  );
};

export default RepositoryAnalysis; 