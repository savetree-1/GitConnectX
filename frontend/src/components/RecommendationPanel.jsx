import { useState, useEffect } from 'react';

const RecommendationPanel = ({ username, isLoggedIn = false }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recommendations, setRecommendations] = useState([]);

  // Fetch recommendation data
  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        setLoading(true);
        setError(null);
        
        if (isLoggedIn) {
          // For logged-in users, fetch real recommendations
          try {
            const response = await fetch(`http://localhost:5000/api/recommendations/${username}`);
            
            if (!response.ok) {
              throw new Error(`Failed to fetch recommendations: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            if (data.status === 'success') {
              setRecommendations(data.data);
            } else {
              throw new Error(data.message || 'Failed to load recommendations');
            }
          } catch (err) {
            console.error('Error fetching recommendations from API:', err);
            // Fall back to demo data if API fails
            setDemoRecommendations();
          }
        } else {
          // For guests, set blurred preview recommendations
          setGuestRecommendations();
        }
      } catch (err) {
        console.error('Error in recommendation system:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    // Generate sample recommendations for logged-in users when API fails
    const setDemoRecommendations = () => {
      // Sample real-world developer names with GitHub-like metrics
      const sampleRecommendations = [
        {
          id: 1,
          username: 'devguru92',
          name: 'Alex Chen',
          avatar_url: 'https://i.pravatar.cc/150?img=1',
          compatibilityScore: 87,
          sharedInterests: ['React', 'GraphQL', 'TypeScript'],
          mutualConnections: 5,
          sharedRepos: 2
        },
        {
          id: 2,
          username: 'codemaster',
          name: 'Taylor Smith',
          avatar_url: 'https://i.pravatar.cc/150?img=2',
          compatibilityScore: 82,
          sharedInterests: ['Data Science', 'Python', 'Machine Learning'],
          mutualConnections: 3,
          sharedRepos: 1
        },
        {
          id: 3,
          username: 'webwizard',
          name: 'Jordan Lee',
          avatar_url: 'https://i.pravatar.cc/150?img=3',
          compatibilityScore: 79,
          sharedInterests: ['JavaScript', 'Node.js', 'Express'],
          mutualConnections: 4,
          sharedRepos: 0
        },
        {
          id: 4,
          username: 'designdev',
          name: 'Casey Morgan',
          avatar_url: 'https://i.pravatar.cc/150?img=4',
          compatibilityScore: 75,
          sharedInterests: ['UI/UX', 'Frontend', 'CSS'],
          mutualConnections: 2,
          sharedRepos: 3
        },
        {
          id: 5,
          username: 'cloudninja',
          name: 'Riley Parker',
          avatar_url: 'https://i.pravatar.cc/150?img=5',
          compatibilityScore: 70,
          sharedInterests: ['AWS', 'DevOps', 'Kubernetes'],
          mutualConnections: 1,
          sharedRepos: 1
        }
      ];
      
      setRecommendations(sampleRecommendations);
    };
    
    // Generate blurred preview recommendations for guests
    const setGuestRecommendations = () => {
      // Generic placeholder recommendations for guests
      const guestPreviewRecommendations = [
        {
          id: 1,
          username: 'potential_collaborator_1',
          name: 'Potential Collaborator',
          avatar_url: 'https://i.pravatar.cc/150?img=11',
          compatibilityScore: 85
        },
        {
          id: 2,
          username: 'potential_collaborator_2',
          name: 'Potential Collaborator',
          avatar_url: 'https://i.pravatar.cc/150?img=12',
          compatibilityScore: 80
        },
        {
          id: 3,
          username: 'potential_collaborator_3',
          name: 'Potential Collaborator',
          avatar_url: 'https://i.pravatar.cc/150?img=13',
          compatibilityScore: 78
        }
      ];
      
      setRecommendations(guestPreviewRecommendations);
    };
    
    fetchRecommendations();
  }, [username, isLoggedIn]);

  // Compatibility score meter component
  const ScoreMeter = ({ score }) => {
    // Determine color based on score
    const getScoreColor = (value) => {
      if (value >= 85) return 'bg-green-500';
      if (value >= 70) return 'bg-blue-500';
      if (value >= 50) return 'bg-yellow-500';
      return 'bg-orange-500';
    };
    
    return (
      <div className="mt-2">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-gray-700">Compatibility</span>
          <span className="text-xs font-bold text-gray-800">{score}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div 
            className={`h-2.5 rounded-full ${getScoreColor(score)}`} 
            style={{ width: `${score}%` }}
          ></div>
        </div>
      </div>
    );
  };

  // Recommendation card for logged-in users
  const RecommendationCard = ({ recommendation }) => {
    return (
      <div className="bg-white rounded-lg shadow p-4 flex border border-gray-100 hover:shadow-md transition-shadow">
        <div className="flex-shrink-0 mr-4">
          <img 
            src={recommendation.avatar_url} 
            alt={recommendation.name} 
            className="w-16 h-16 rounded-full object-cover"
          />
        </div>
        <div className="flex-grow">
          <h4 className="font-bold text-gray-800">{recommendation.name}</h4>
          <p className="text-sm text-gray-600">@{recommendation.username}</p>
          
          <ScoreMeter score={recommendation.compatibilityScore} />
          
          {recommendation.sharedInterests && (
            <div className="mt-2">
              <div className="flex flex-wrap gap-1">
                {recommendation.sharedInterests.map((interest, index) => (
                  <span 
                    key={index}
                    className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {recommendation.mutualConnections !== undefined && (
            <div className="mt-2 flex items-center text-xs text-gray-600">
              <svg className="w-4 h-4 mr-1 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
              <span>
                {recommendation.mutualConnections} mutual connection{recommendation.mutualConnections !== 1 ? 's' : ''}
                {recommendation.sharedRepos > 0 && ` • ${recommendation.sharedRepos} shared repo${recommendation.sharedRepos !== 1 ? 's' : ''}`}
              </span>
            </div>
          )}
        </div>
        <div className="flex-shrink-0 ml-4 flex items-center">
          <button className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md whitespace-nowrap">
            Connect
          </button>
        </div>
      </div>
    );
  };

  // Blurred card for guests
  const BlurredCard = ({ recommendation }) => {
    return (
      <div className="bg-white rounded-lg shadow p-4 flex border border-gray-100 relative overflow-hidden">
        <div className="flex-shrink-0 mr-4 filter blur-sm">
          <div className="w-16 h-16 rounded-full bg-gray-200"></div>
        </div>
        <div className="flex-grow filter blur-sm">
          <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
          
          <div className="mt-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-gray-700">Compatibility</span>
              <span className="text-xs font-bold text-gray-800">{recommendation.compatibilityScore}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="h-2.5 rounded-full bg-blue-500" 
                style={{ width: `${recommendation.compatibilityScore}%` }}
              ></div>
            </div>
          </div>
          
          <div className="mt-3 flex gap-1">
            <div className="h-4 bg-gray-200 rounded-full w-16"></div>
            <div className="h-4 bg-gray-200 rounded-full w-20"></div>
            <div className="h-4 bg-gray-200 rounded-full w-14"></div>
          </div>
        </div>
        
        {/* Overlay with login message */}
        <div className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center">
          <div className="text-center">
            <p className="font-medium text-gray-800">Potential Collaborator</p>
            <p className="text-sm text-gray-600 mt-1">Log in to see details</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="font-sans bg-white rounded-lg shadow-md p-5 mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-800">Recommended Collaborators</h2>
        
        {!isLoggedIn && (
          <button className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md">
            Log In To See
          </button>
        )}
      </div>
      
      {!isLoggedIn && (
        <div className="bg-blue-50 p-3 rounded-md mb-4">
          <p className="text-blue-700 text-sm">
            <span className="font-bold">Connect with collaborators</span> based on shared interests, repositories, and network connections.
            <span className="block mt-1">Log in to see personalized recommendations.</span>
          </p>
        </div>
      )}
      
      {error && (
        <div className="bg-red-50 p-3 rounded-md mb-4">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}
      
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <p className="text-gray-500">Loading recommendations...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {recommendations.map(recommendation => (
            isLoggedIn ? (
              <RecommendationCard 
                key={recommendation.id} 
                recommendation={recommendation} 
              />
            ) : (
              <BlurredCard 
                key={recommendation.id}
                recommendation={recommendation}
              />
            )
          ))}
          
          {recommendations.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No recommendations available at this time.</p>
            </div>
          )}
        </div>
      )}
      
      {isLoggedIn && (
        <div className="mt-4 text-center">
          <button className="px-4 py-2 text-blue-600 hover:text-blue-800 text-sm font-medium">
            View More Recommendations
          </button>
        </div>
      )}
      
      <div className="mt-4 border-t border-gray-100 pt-3">
        <h3 className="font-bold text-gray-700 mb-1 text-sm">How Recommendations Work</h3>
        <p className="text-gray-600 text-sm">
          {isLoggedIn 
            ? "Recommendations are based on your GitHub activity, shared interests, mutual connections, and repository contributions. Our algorithm uses HITS (Hyperlink-Induced Topic Search) to find the best potential collaborators for you."
            : "Our recommendation system analyzes your activity patterns, repository interests, and network connections to suggest developers you might want to collaborate with."}
        </p>
      </div>
    </div>
  );
};

export default RecommendationPanel; 