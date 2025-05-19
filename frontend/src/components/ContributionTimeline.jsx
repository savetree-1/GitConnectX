import { useState, useEffect } from 'react';

const ContributionTimeline = ({ username, isLoggedIn = false, selectedRepo = null }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [contributionData, setContributionData] = useState([]);
  const [timeRange, setTimeRange] = useState('1y'); // 1m, 3m, 6m, 1y options
  const [selectedContributor, setSelectedContributor] = useState(null);
  const [contributors, setContributors] = useState([]);
  const [selectedView, setSelectedView] = useState('activity'); // activity, frequency, impact
  const [showRepositoryInfo, setShowRepositoryInfo] = useState(false);

  // Generate sample data for demo purposes
  const generateDemoData = (repo = null) => {
    // Create timeline data for the past year by month
    const now = new Date();
    const months = [];
    for (let i = 11; i >= 0; i--) {
      const month = new Date(now);
      month.setMonth(now.getMonth() - i);
      months.push(month);
    }

    // Create 3-5 sample contributors
    const demoContributors = [
      { id: 1, name: 'Alex Chen', avatar: 'https://i.pravatar.cc/150?u=alex', color: '#4F46E5' },
      { id: 2, name: 'Taylor Smith', avatar: 'https://i.pravatar.cc/150?u=taylor', color: '#10B981' },
      { id: 3, name: 'Jamie Wong', avatar: 'https://i.pravatar.cc/150?u=jamie', color: '#F59E0B' },
      { id: 4, name: 'Morgan Lee', avatar: 'https://i.pravatar.cc/150?u=morgan', color: '#EC4899' },
    ];
    
    // Generate realistic commit patterns for each contributor
    const generateContributorTimeline = (contributorId) => {
      return months.map((month) => {
        // Use deterministic but varied values based on contributor and month
        const seed = contributorId + month.getMonth();
        
        // Simulate more activity on certain months based on contributor patterns
        let activityMultiplier = 1;
        
        // Contributor 1: Steady contributor with higher activity mid-year
        if (contributorId === 1) {
          activityMultiplier = month.getMonth() >= 4 && month.getMonth() <= 8 ? 1.5 : 1;
        }
        // Contributor 2: Sporadic but intense contribution
        else if (contributorId === 2) {
          activityMultiplier = month.getMonth() % 3 === 0 ? 2.5 : 0.7;
        }
        // Contributor 3: Consistent contributor
        else if (contributorId === 3) {
          activityMultiplier = 1.2; 
        }
        // Contributor 4: Recent addition to the team
        else if (contributorId === 4) {
          activityMultiplier = month.getMonth() >= 9 ? 2 : 0.3;
        }
        
        // Generate activity data with some randomness but following the pattern
        const baseCommits = Math.floor((seed % 10) * activityMultiplier) + 5;
        const commits = Math.max(1, baseCommits + Math.floor(Math.random() * 10 * activityMultiplier));
        const additions = commits * (20 + Math.floor(Math.random() * 100));
        const deletions = Math.floor(additions * (0.2 + Math.random() * 0.5));
        const prs = Math.max(1, Math.floor(commits / (3 + Math.random() * 5)));
        const reviews = Math.max(0, Math.floor(prs * (1 + Math.random())));
        
        return {
          month: month.toLocaleString('default', { month: 'short', year: 'numeric' }),
          timestamp: month.toISOString(),
          commits,
          additions,
          deletions,
          pull_requests: prs,
          reviews,
          issues: Math.max(0, Math.floor(commits / 5)),
          impact_score: Math.floor((additions - deletions) * 0.01 + commits * 2 + prs * 5 + reviews * 2),
        };
      });
    };

    // Generate timeline data for each contributor
    const contributorData = demoContributors.map((contributor) => {
      return {
        ...contributor,
        timeline: generateContributorTimeline(contributor.id)
      };
    });

    setContributors(demoContributors);
    setContributionData(contributorData);
  };

  // Fetch contributor data for the repo
  const fetchContributionData = async (repo) => {
    setLoading(true);
    setError(null);

    try {
      if (isLoggedIn && repo) {
        try {
          const response = await fetch(`http://localhost:5000/api/repositories/${repo}/contributors`);
          
          if (!response.ok) {
            throw new Error(`Failed to fetch contribution data: ${response.statusText}`);
          }
          
          const data = await response.json();
          
          if (data.status === 'success') {
            setContributionData(data.data);
            setContributors(data.data.map(c => ({
              id: c.id,
              name: c.name,
              avatar: c.avatar,
              color: c.color
            })));
          } else {
            throw new Error(data.message || 'Failed to load contribution data');
          }
        } catch (err) {
          console.error('Error fetching contribution data:', err);
          // Fall back to demo data
          generateDemoData(repo);
        }
      } else {
        // For guests or no specific repo, generate demo data
        generateDemoData(repo);
      }
    } catch (err) {
      console.error('Error loading contribution data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Update data when repo changes or on initial load
  useEffect(() => {
    if (selectedRepo) {
      setShowRepositoryInfo(true);
      fetchContributionData(selectedRepo);
    } else {
      generateDemoData();
    }
  }, [selectedRepo, isLoggedIn]);

  // Filter data based on selected time range
  const getFilteredData = () => {
    if (!contributionData || !contributionData.length) return [];
    
    const now = new Date();
    const rangeThreshold = new Date();
    
    switch(timeRange) {
      case '1m':
        rangeThreshold.setMonth(now.getMonth() - 1);
        break;
      case '3m':
        rangeThreshold.setMonth(now.getMonth() - 3);
        break;
      case '6m':
        rangeThreshold.setMonth(now.getMonth() - 6);
        break;
      case '1y':
      default:
        rangeThreshold.setFullYear(now.getFullYear() - 1);
    }

    // Filter timeline data for each contributor
    return contributionData.map(contributor => {
      return {
        ...contributor,
        timeline: contributor.timeline.filter(item => {
          const itemDate = new Date(item.timestamp);
          return itemDate >= rangeThreshold;
        })
      };
    });
  };

  // Handle changing time range
  const handleTimeRangeChange = (range) => {
    setTimeRange(range);
  };

  // Handle selecting a contributor
  const handleContributorSelect = (contributorId) => {
    if (selectedContributor === contributorId) {
      setSelectedContributor(null); // Deselect if already selected
    } else {
      setSelectedContributor(contributorId);
    }
  };

  // Generate chart data based on selected view
  const getChartData = () => {
    const filteredData = getFilteredData();
    if (!filteredData.length) return { labels: [], datasets: [] };

    // Get all unique months across all contributors
    const allMonths = new Set();
    filteredData.forEach(contributor => {
      contributor.timeline.forEach(item => {
        allMonths.add(item.month);
      });
    });
    
    // Sort months chronologically
    const sortedLabels = Array.from(allMonths).sort((a, b) => {
      return new Date(a) - new Date(b);
    });

    // Create datasets for the chart based on selected view and contributor filter
    const datasets = [];
    
    filteredData.forEach(contributor => {
      if (selectedContributor && contributor.id !== selectedContributor) return;
      
      const dataMap = new Map();
      contributor.timeline.forEach(item => {
        dataMap.set(item.month, item);
      });
      
      let dataPoints = [];
      
      sortedLabels.forEach(month => {
        const item = dataMap.get(month);
        
        // Default to 0 if no data for this month
        if (!item) {
          dataPoints.push(0);
          return;
        }
        
        // Which data to use depends on the selected view
        switch(selectedView) {
          case 'frequency':
            dataPoints.push(item.commits);
            break;
          case 'impact':
            dataPoints.push(item.impact_score);
            break;
          case 'activity':
          default:
            // Activity is a weighted sum of all contributions
            dataPoints.push(item.commits + item.pull_requests * 3 + item.reviews * 2);
        }
      });
      
      datasets.push({
        label: contributor.name,
        data: dataPoints,
        backgroundColor: contributor.color,
        borderColor: contributor.color,
      });
    });

    return { labels: sortedLabels, datasets };
  };

  // Format large numbers with k suffix for readability
  const formatNumber = (num) => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`;
    }
    return num;
  };

  // Calculate total stats across the selected time period
  const getTotalStats = () => {
    const filteredData = getFilteredData();
    
    let totalCommits = 0;
    let totalPRs = 0;
    let totalAdditions = 0;
    let totalDeletions = 0;
    
    filteredData.forEach(contributor => {
      if (selectedContributor && contributor.id !== selectedContributor) return;
      
      contributor.timeline.forEach(item => {
        totalCommits += item.commits;
        totalPRs += item.pull_requests;
        totalAdditions += item.additions;
        totalDeletions += item.deletions;
      });
    });
    
    return { totalCommits, totalPRs, totalAdditions, totalDeletions };
  };

  // Render contribution graph
  const renderContributionGraph = () => {
    const chartData = getChartData();
    
    // For demo, we'll just show a simplified chart representation
    return (
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="mb-4 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-700">
            {selectedView === 'activity' && 'Activity Timeline'}
            {selectedView === 'frequency' && 'Commit Frequency'}
            {selectedView === 'impact' && 'Impact Score'}
          </h3>
          <div className="flex gap-2">
            <button 
              className={`px-3 py-1 text-sm rounded ${selectedView === 'activity' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}
              onClick={() => setSelectedView('activity')}
            >
              Activity
            </button>
            <button 
              className={`px-3 py-1 text-sm rounded ${selectedView === 'frequency' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}
              onClick={() => setSelectedView('frequency')}
            >
              Commits
            </button>
            <button 
              className={`px-3 py-1 text-sm rounded ${selectedView === 'impact' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}
              onClick={() => setSelectedView('impact')}
            >
              Impact
            </button>
          </div>
        </div>
        
        {/* Chart visualization area */}
        <div className="h-64 relative">
          {isLoggedIn ? (
            <div className="h-full">
              {/* Simulate chart with colored bars */}
              <div className="flex h-full items-end">
                {chartData.labels.map((month, idx) => {
                  // Render stacked bars for each contributor
                  const maxValue = Math.max(...chartData.datasets.map(ds => ds.data[idx] || 0));
                  const totalHeight = 100; // percentage
                  
                  return (
                    <div key={month} className="flex-grow flex flex-col-reverse justify-start items-center mx-0.5">
                      {/* Bars for each contributor */}
                      {chartData.datasets.map(dataset => {
                        const height = dataset.data[idx] ? (dataset.data[idx] / maxValue) * totalHeight : 0;
                        return (
                          <div 
                            key={dataset.label}
                            className="w-full transition-all duration-300"
                            style={{
                              backgroundColor: dataset.backgroundColor,
                              height: `${height}%`,
                              minHeight: height > 0 ? '4px' : 0
                            }}
                          />
                        );
                      })}
                      <span className="text-xs text-gray-500 mt-1 transform -rotate-45 origin-top-left">
                        {month.split(' ')[0]}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col justify-center items-center bg-gray-50 rounded-lg border border-gray-100">
              <div className="space-y-2 p-6 text-center">
                <div className="w-12 h-12 mx-auto bg-blue-100 text-blue-500 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h4 className="font-semibold text-gray-700">Full Timeline Analytics</h4>
                <p className="text-sm text-gray-500">
                  Sign in to view detailed contribution patterns and developer activity over time.
                </p>
                <button 
                  className="mt-2 bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded inline-block transition-colors"
                >
                  Unlock Full Analytics
                </button>
              </div>
              {/* Show faint background of demo data for guests */}
              <div className="absolute inset-0 opacity-10 pointer-events-none overflow-hidden">
                <div className="flex h-full items-end">
                  {chartData.labels.map((month, idx) => (
                    <div key={month} className="flex-grow mx-0.5">
                      <div 
                        className="w-full bg-blue-500"
                        style={{
                          height: `${Math.random() * 80 + 10}%`
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Legend */}
        {isLoggedIn && (
          <div className="flex flex-wrap gap-4 mt-4 justify-center">
            {contributors.map(contributor => (
              <div 
                key={contributor.id}
                className={`flex items-center px-3 py-1.5 rounded-full text-sm cursor-pointer transition-all
                  ${selectedContributor === contributor.id ? 'ring-2 ring-offset-1' : 'opacity-80 hover:opacity-100'}`}
                style={{ backgroundColor: `${contributor.color}20`, color: contributor.color }}
                onClick={() => handleContributorSelect(contributor.id)}
              >
                <img 
                  src={contributor.avatar} 
                  alt={contributor.name}
                  className="w-5 h-5 rounded-full mr-2 border border-current"
                />
                {contributor.name}
              </div>
            ))}
            {selectedContributor && (
              <button 
                onClick={() => setSelectedContributor(null)}
                className="text-xs text-gray-500 underline"
              >
                Show all
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  // Render contribution stats
  const renderContributionStats = () => {
    const { totalCommits, totalPRs, totalAdditions, totalDeletions } = getTotalStats();
    
    return (
      <div className="bg-white p-4 rounded-lg shadow mt-4">
        <h3 className="text-lg font-semibold text-gray-700 mb-3">Contribution Summary</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-3 bg-blue-50 rounded-lg">
            <div className="text-xs uppercase text-blue-700 font-semibold tracking-wider">Commits</div>
            <div className="text-2xl font-bold text-blue-800 mt-1">{formatNumber(totalCommits)}</div>
          </div>
          
          <div className="p-3 bg-green-50 rounded-lg">
            <div className="text-xs uppercase text-green-700 font-semibold tracking-wider">Pull Requests</div>
            <div className="text-2xl font-bold text-green-800 mt-1">{formatNumber(totalPRs)}</div>
          </div>
          
          <div className="p-3 bg-emerald-50 rounded-lg">
            <div className="text-xs uppercase text-emerald-700 font-semibold tracking-wider">Additions</div>
            <div className="text-2xl font-bold text-emerald-800 mt-1">{formatNumber(totalAdditions)}</div>
          </div>
          
          <div className="p-3 bg-red-50 rounded-lg">
            <div className="text-xs uppercase text-red-700 font-semibold tracking-wider">Deletions</div>
            <div className="text-2xl font-bold text-red-800 mt-1">{formatNumber(totalDeletions)}</div>
          </div>
        </div>
      </div>
    );
  };

  // Render repository info if selected
  const renderRepositoryInfo = () => {
    if (!selectedRepo) return null;
    
    return (
      <div className="bg-blue-50 p-4 rounded-lg mb-6 border border-blue-100">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-6 w-6 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 1.944A11.954 11.954 0 012.166 5C2.056 5.649 2 6.319 2 7c0 5.225 3.34 9.67 8 11.317C14.66 16.67 18 12.225 18 7c0-.682-.057-1.35-.166-2.001A11.954 11.954 0 0110 1.944zM11 14a1 1 0 11-2 0 1 1 0 012 0zm0-7a1 1 0 10-2 0v3a1 1 0 102 0V7z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3 flex-1">
            <div className="flex justify-between items-start">
              <h3 className="text-lg font-semibold text-gray-900">{selectedRepo.name}</h3>
              
              <button 
                onClick={() => setShowRepositoryInfo(false)} 
                className="ml-3 bg-blue-50 rounded-md text-blue-500 hover:bg-blue-100"
              >
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              {selectedRepo.description || "No description available"}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-4">
              <div className="flex items-center text-sm text-gray-600">
                <span className={`inline-block w-3 h-3 rounded-full mr-1.5 ${selectedRepo.language ? getLanguageColor(selectedRepo.language) : 'bg-gray-400'}`}></span>
                <span>{selectedRepo.language || "Unknown"}</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <svg className="w-4 h-4 mr-1 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                {selectedRepo.stars?.toLocaleString() || "0"} stars
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <svg className="w-4 h-4 mr-1 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                {selectedRepo.forks?.toLocaleString() || "0"} forks
              </div>
              <div className="text-sm text-gray-600">
                Updated {formatDate(selectedRepo.updated_at || new Date().toISOString())}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Helper function for language color
  const getLanguageColor = (language) => {
    const colors = {
      JavaScript: 'bg-yellow-400',
      TypeScript: 'bg-blue-400',
      Python: 'bg-green-500',
      Java: 'bg-red-600',
      Go: 'bg-blue-500',
      Rust: 'bg-orange-600',
      'C++': 'bg-pink-600',
      PHP: 'bg-indigo-400',
      Ruby: 'bg-red-500',
      CSS: 'bg-purple-500',
      HTML: 'bg-orange-500',
      Swift: 'bg-orange-400',
      Kotlin: 'bg-purple-600',
      Dart: 'bg-cyan-500',
      Shell: 'bg-gray-500',
    };
    
    return colors[language] || 'bg-gray-400';
  };

  return (
    <div className="font-sans bg-white  border-blue-500 border-2 rounded-lg shadow-md p-5 mb-8">
      <div className="flex justify-between items-center mb-4">
        {/* Time range selector */}
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button 
            onClick={() => handleTimeRangeChange('1m')}
            className={`px-3 py-1 text-sm rounded ${timeRange === '1m' ? 'bg-white shadow' : ''}`}
          >
            1M
          </button>
          <button 
            onClick={() => handleTimeRangeChange('3m')}
            className={`px-3 py-1 text-sm rounded ${timeRange === '3m' ? 'bg-white shadow' : ''}`}
          >
            3M
          </button>
          <button 
            onClick={() => handleTimeRangeChange('6m')}
            className={`px-3 py-1 text-sm rounded ${timeRange === '6m' ? 'bg-white shadow' : ''}`}
          >
            6M
          </button>
          <button 
            onClick={() => handleTimeRangeChange('1y')}
            className={`px-3 py-1 text-sm rounded ${timeRange === '1y' ? 'bg-white shadow' : ''}`}
          >
            1Y
          </button>
        </div>
      </div>
      
      <p className="text-gray-600 mb-4">
        Analyze developer contribution patterns over time to identify active maintainers, 
        contribution trends, and project momentum.
        {!isLoggedIn && " Sign in to see real-time analysis for any repository."}
      </p>

      {/* Show repository info when selected */}
      {selectedRepo && showRepositoryInfo && renderRepositoryInfo()}
      
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <p className="text-gray-500">Loading contribution data...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 p-4 rounded-md">
          <p className="text-red-600">{error}</p>
        </div>
      ) : (
        <div>
          {renderContributionGraph()}
          {renderContributionStats()}
          
          {!selectedRepo && !isLoggedIn && (
            <div className="mt-6 bg-blue-50 border border-blue-100 p-4 rounded-lg">
              <div className="flex items-start">
                <div className="flex-shrink-0 mt-0.5">
                  <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">
                    Demo Mode
                  </h3>
                  <div className="mt-2 text-sm text-blue-600">
                    <p>
                      Currently viewing simulated contribution data. Select a repository above or sign in to analyze real GitHub repositories.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {selectedRepo && !isLoggedIn && (
            <div className="mt-6 text-center">
              <button className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md">
                Sign In to See Full Analytics
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ContributionTimeline; 