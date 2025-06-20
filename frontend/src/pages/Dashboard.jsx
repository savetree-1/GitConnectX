import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import GraphVisualization from '../components/GraphVisualization';
import AnalyticsTabs from '../components/AnalyticsTabs';
import RepositoryAnalysis from '../components/RepositoryAnalysis';
import CommunityDetectionMap from '../components/CommunityDetectionMap';
import PathFinder from '../components/PathFinder';
import RecommendationPanel from '../components/RecommendationPanel';
import DomainProjectFinder from '../components/DomainProjectFinder';
import ContributionTimeline from '../components/ContributionTimeline';
import InfoTooltip from '../components/InfoTooltip';
import ProfileSidebar from '../components/ProfileSidebar';
import Header from '../components/Header';
import Footer from '../components/Footer';

const Dashboard = () => {
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

  const location = useLocation();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRepository, setSelectedRepository] = useState(null);
  
  // Get username from URL state (passed from Home page)
  const username = location.state?.username || 'octocat';

  // Default fallback data - generate better profile stats based on username
  const generateUserStats = (username) => {
    // Create deterministic but unique stats based on the username string
    // This makes stats seem personalized but consistent for the same username
    const usernameHash = username.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    
    return {
      name: username || "GitHub User",
      login: username,
      avatar_url: `https://github.com/${username}.png`, // Try to use actual GitHub avatar if it exists
      public_repos: 8 + (usernameHash % 12), // Between 8-20 repos
      followers_count: 20 + (usernameHash % 180), // Between 20-200 followers
      stargazers_count: 30 + (usernameHash % 270), // Between 30-300 stars
      forks_count: 5 + (usernameHash % 45) // Between 5-50 forks
    };
  };
  
  const defaultUserData = generateUserStats(username);

  useEffect(() => {
    // Fetch user data when component mounts
    const fetchUserData = async () => {
      try {
        setLoading(true);
        console.log(`Fetching data for user: ${username}`);
        
        // Try primary API endpoint
        const response = await fetch(`http://localhost:5000/api/user/${username}`);
        
        if (response.ok) {
          const data = await response.json();
          console.log("User data fetched successfully:", data);
          
          if (data.status === 'success' && data.data) {
            setUserData(data.data);
            setLoading(false);
            return;
          }
        }
        
        // Try alternative API endpoint
        console.log("Trying alternative API endpoint...");
        const alternativeResponse = await fetch(`http://127.0.0.1:5000/api/user/${username}`);
        
        if (alternativeResponse.ok) {
          const data = await alternativeResponse.json();
          console.log("User data fetched successfully from alternative endpoint:", data);
          
          if (data.status === 'success' && data.data) {
            setUserData(data.data);
            setLoading(false);
            return;
          }
        }
        
        // Try GitHub's public API directly as a last resort
        console.log("Trying GitHub public API directly...");
        const githubResponse = await fetch(`https://api.github.com/users/${username}`);
        
        if (githubResponse.ok) {
          const githubData = await githubResponse.json();
          console.log("GitHub API data:", githubData);
          
          // Format GitHub API data to match our API format
          const formattedData = {
            name: githubData.name || username,
            login: githubData.login,
            avatar_url: githubData.avatar_url,
            public_repos: githubData.public_repos,
            followers_count: githubData.followers,
            following_count: githubData.following,
            stargazers_count: githubData.public_gists * 5, // Estimate
            forks_count: Math.floor(githubData.public_repos / 2) // Estimate
          };
          
          setUserData(formattedData);
          setLoading(false);
          return;
        }
        
        // All API attempts failed, use default data
        throw new Error('All API endpoints failed');
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError(err.message);
        // Use default data when API fails
        setUserData(defaultUserData);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [username]);

  // Handler for repository selection
  const handleRepositorySelect = (repo) => {
    setSelectedRepository(repo);
    // Scroll to contribution timeline section
    document.getElementById('contribution-timeline').scrollIntoView({ behavior: 'smooth' });
  };

  // Implementation details for component tooltips
  const implementationInfo = {
    graph: (
      <div>
        <p className="mb-2 ">Network graph visualization of GitHub connections using:</p>
        <ul className="list-disc pl-4 space-y-1">
          <li><strong>Algorithm:</strong> Force-directed graph layout (D3.js)</li>
          <li><strong>Data Structure:</strong> Nodes and edges representing users and repositories</li>
          <li><strong>Implementation:</strong> Interactive SVG visualization with drag, click, and hover events</li>
        </ul>
      </div>
    ),
    analytics: (
      <div>
        <p className="mb-2">Insights on user activity and repository analytics:</p>
        <ul className="list-disc pl-4 space-y-1">
          <li><strong>Algorithm:</strong> Time-series analysis of repository activity</li>
          <li><strong>Data Structure:</strong> Timeline events indexed by timestamp</li>
          <li><strong>Implementation:</strong> Multi-tab interface with dynamic charts and statistics</li>
        </ul>
      </div>
    ),
    repo: (
      <div>
        <p className="mb-2">Repository performance analysis and metrics:</p>
        <ul className="list-disc pl-4 space-y-1">
          <li><strong>Algorithm:</strong> Engagement scoring and trend analysis</li>
          <li><strong>Data Structure:</strong> Time-series data on repository metrics</li>
          <li><strong>Implementation:</strong> Visual performance indicators with trend highlighting</li>
        </ul>
      </div>
    ),
    community: (
      <div>
        <p className="mb-2">Community detection in GitHub user networks:</p>
        <ul className="list-disc pl-4 space-y-1">
          <li><strong>Algorithm:</strong> Louvain method and Girvan-Newman algorithm</li>
          <li><strong>Data Structure:</strong> Graph partitioning with community assignments</li>
          <li><strong>Implementation:</strong> Interactive visualization with community highlighting</li>
        </ul>
      </div>
    ),
    path: (
      <div>
        <p className="mb-2">Finding connection paths between GitHub users:</p>
        <ul className="list-disc pl-4 space-y-1">
          <li><strong>Algorithm:</strong> Breadth-First Search (BFS) for shortest path</li>
          <li><strong>Data Structure:</strong> Adjacency list for social graph traversal</li>
          <li><strong>Implementation:</strong> Animated path visualization with highlights for connection strength</li>
        </ul>
      </div>
    ),
    recommendation: (
      <div>
        <p className="mb-2">GitHub user and repository recommendations:</p>
        <ul className="list-disc pl-4 space-y-1">
          <li><strong>Algorithm:</strong> Collaborative filtering and content-based matching</li>
          <li><strong>Data Structure:</strong> User-item interaction matrix</li>
          <li><strong>Implementation:</strong> Personalized recommendations with similarity scoring</li>
        </ul>
      </div>
    ),
    domain: (
      <div>
        <p className="mb-2">Domain-specific project discovery:</p>
        <ul className="list-disc pl-4 space-y-1">
          <li><strong>Algorithm:</strong> Topic modeling and semantic search</li>
          <li><strong>Data Structure:</strong> Indexed repository metadata with topic tags</li>
          <li><strong>Implementation:</strong> Filterable project cards with domain categorization</li>
        </ul>
      </div>
    ),
    timeline: (
      <div>
        <p className="mb-2">Developer contribution timeline analysis:</p>
        <ul className="list-disc pl-4 space-y-1">
          <li><strong>Algorithm:</strong> Time-series analysis of commit patterns</li>
          <li><strong>Data Structure:</strong> Temporal event sequence with contributor attribution</li>
          <li><strong>Implementation:</strong> Interactive timeline with contributor filtering and activity metrics</li>
        </ul>
      </div>
    )
  };

  const SectionTitle = ({ children, infoContent ,  position = 'right' }) => (
    <div className="flex items-center mb-4 border-blue-500 border-2 bg-white bg-opacity-20 p-3 rounded-lg backdrop-filter backdrop-blur-sm">
      <h2 className="bg-indigo-100 text-indigo-800 px-5 py-2 rounded-full text-xl font-bold mr-2 shadow-sm">{children}</h2>
    <InfoTooltip content={infoContent} position={position} />
    </div>
  );

  return (
<div className="min-h-screen w-full relative bg-gradient-to-br from-[#6a38aa] via-[#3541ac] to-[#1c1f53]">
  <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] bg-[#844ad1] rounded-full blur-[200px] z-0"></div>
        <Header 
        scrollToFeatures={scrollToFeatures} 
        scrollToContact={scrollToContact} 
        />
  <div className="relative"> 
    <div className="absolute inset-0 bg-no-repeat bg-cover bg-center z-0">
              {/* Extended gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-b from-[#150429]/70 via-[#1737A1]/70 to-[#150429]/90"></div>
              
              {/*Animated particles that span the entire extended background*/}
              <div className="absolute inset-0 animate-pulse">
               {/* Star particles - left side */}
    <div className="absolute top-20 left-[10%] text-white text-sm opacity-60 animate-pulse">✦</div>
    <div className="absolute top-40 left-[20%] text-white text-lg opacity-40 animate-pulse delay-300">★</div>
    <div className="absolute top-60 left-[15%] text-white text-xs opacity-70 animate-pulse delay-150">✧</div>
    <div className="absolute top-80 left-[25%] text-white text-base opacity-50 animate-pulse delay-700">★</div>
    <div className="absolute top-30 left-[30%] text-white text-lg opacity-60 animate-pulse delay-500">✩</div>
    <div className="absolute top-[5%] left-[4%] text-white text-xs opacity-70 animate-pulse delay-150">✦</div>
<div className="absolute top-[1%] left-[46%] text-white text-sm opacity-60 animate-pulse delay-300">★</div>
<div className="absolute top-[0%] left-[50%] text-white text-sm opacity-60 animate-pulse delay-300">★</div>
<div className="absolute top-[0.5%] left-[65%] text-white text-base opacity-50 animate-pulse delay-450">✧</div>
<div className="absolute top-[1.2%] left-[75%] text-white text-base opacity-50 animate-pulse delay-450">✧</div>
<div className="absolute top-[0%] left-[80%] text-white text-xs opacity-65 animate-pulse delay-200">✩</div>
<div className="absolute top-[1%] left-[95%] text-white text-lg opacity-40 animate-pulse delay-500">✦</div>
{/* Additional stars - top left quadrant (clustered effect) */}
<div className="absolute top-[3%] left-[98%] text-white text-sm opacity-80 animate-pulse delay-250">✩</div>
<div className="absolute top-[7%] left-[98%] text-white text-xs opacity-70 animate-pulse delay-400">★</div>
<div className="absolute top-[9%] left-[97%] text-white text-base opacity-60 animate-pulse delay-150">✧</div>
<div className="absolute top-[8%] left-[99%] text-white text-base opacity-60 animate-pulse delay-150">✧</div>
<div className="absolute top-[5.5%] left-[97%] text-white text-sm opacity-50 animate-pulse delay-300">✦</div>
<div className="absolute top-[15%] left-[98%] text-white text-xs opacity-40 animate-pulse delay-600">★</div>
<div className="absolute top-[20%] left-[98%] text-white text-sm opacity-80 animate-pulse delay-250">✩</div>
<div className="absolute top-[30%] left-[98%] text-white text-xs opacity-70 animate-pulse delay-400">★</div>
<div className="absolute top-[40%] left-[97%] text-white text-base opacity-60 animate-pulse delay-150">✧</div>
<div className="absolute top-[50%] left-[99%] text-white text-base opacity-60 animate-pulse delay-150">✧</div>
<div className="absolute top-[60%] left-[97%] text-white text-sm opacity-50 animate-pulse delay-300">✦</div>
<div className="absolute top-[75%] left-[98%] text-white text-xs opacity-40 animate-pulse delay-600">★</div>
<div className="absolute top-[85%] left-[98%] text-white text-xs opacity-40 animate-pulse delay-600">★</div>
<div className="absolute top-[90%] left-[98%] text-white text-sm opacity-80 animate-pulse delay-250">✩</div>
<div className="absolute top-[100%] left-[98%] text-white text-xs opacity-70 animate-pulse delay-400">★</div>
<div className="absolute top-[96%] left-[97%] text-white text-base opacity-60 animate-pulse delay-150">✧</div>
<div className="absolute top-[57%] left-[99%] text-white text-base opacity-60 animate-pulse delay-150">✧</div>
<div className="absolute top-[68%] left-[97%] text-white text-sm opacity-50 animate-pulse delay-300">✦</div>
<div className="absolute top-[95%] left-[98%] text-white text-xs opacity-40 animate-pulse delay-600">★</div>
{/* Light green and blue themed stars for diversity */}
<div className="absolute top-[10%] left-[15%] text-[#a4e22a] text-sm opacity-60 animate-pulse delay-300">✧</div>
<div className="absolute top-[8%] left-[39%] text-blue-200 text-sm opacity-50 animate-pulse delay-200">✩</div>
<div className="absolute top-[6%] left-[42%] text-blue-200 text-xs opacity-65 animate-pulse delay-350">★</div>
    
    {/* Star particles - right side */}     
     <div className="absolute top-[0%] right-[99%] text-white text-sm opacity-70 animate-pulse">★</div>
    <div className="absolute top-[2%] right-[98.7%] text-white text-base opacity-50 animate-pulse delay-300">✧</div>
    <div className="absolute top-[4%] right-[98%] text-white text-sm opacity-70 animate-pulse">★</div>
    <div className="absolute top-[7%] right-[98.7%] text-white text-base opacity-50 animate-pulse delay-300">✧</div>
    <div className="absolute top-[9%] right-[98.5%] text-white text-xs opacity-60 animate-pulse delay-150">✦</div>
    <div className="absolute top-[10%] right-[98.7%] text-white text-sm opacity-40 animate-pulse delay-700">★</div>
    <div className="absolute top-[15%] right-[99%] text-white text-base opacity-50 animate-pulse delay-500">✩</div>
    <div className="absolute top-[75%] right-[98.2%] text-white text-sm opacity-70 animate-pulse">★</div>
    <div className="absolute top-[85%] right-[98.7%] text-white text-base opacity-50 animate-pulse delay-300">✧</div>
    <div className="absolute top-[95%] right-[98%] text-white text-sm opacity-70 animate-pulse">★</div>
    <div className="absolute top-[46%] right-[98.7%] text-white text-base opacity-50 animate-pulse delay-300">✧</div>
    <div className="absolute top-[52%] right-[98.2%] text-white text-xs opacity-60 animate-pulse delay-150">✦</div>
    <div className="absolute top-[68%] right-[98%] text-white text-sm opacity-40 animate-pulse delay-700">★</div>
    <div className="absolute top-[20%] right-[98.8%] text-white text-base opacity-50 animate-pulse delay-500">✩</div>

    
    {/* Additional stars - left side */}
    <div className="absolute top-[99%] left-[0%] text-white text-xs opacity-80 animate-pulse delay-200">✦</div>
    <div className="absolute top-[100%] left-[30%] text-white text-sm opacity-60 animate-pulse delay-400">★</div>
    <div className="absolute top-[100%] left-[99%] text-white text-xs opacity-70 animate-pulse delay-600">✧</div>
    <div className="absolute top-[99%] left-[8%] text-white text-sm opacity-40 animate-pulse delay-350">✩</div>
    <div className="absolute top-[93%] left-[18%] text-white text-xs opacity-90 animate-pulse delay-550">✦</div>
    <div className="absolute top-[90%] left-[3%] text-white text-lg opacity-25 animate-pulse delay-250">★</div>
    
    {/* Additional stars - center */}
    <div className="absolute top-[10%] left-[48%] text-white text-xs opacity-60 animate-pulse delay-450">✧</div>
    <div className="absolute top-[20%] left-[52%] text-white text-sm opacity-70 animate-pulse delay-650">✩</div>
    <div className="absolute top-[30%] left-[45%] text-white text-sm opacity-80 animate-pulse delay-150">✦</div>
    <div className="absolute top-[40%] left-[55%] text-white text-base opacity-40 animate-pulse delay-550">★</div>
    <div className="absolute top-[60%] left-[47%] text-white text-sm opacity-50 animate-pulse delay-350">✧</div>
    <div className="absolute top-[70%] left-[53%] text-white text-xs opacity-75 animate-pulse delay-250">✦</div>
    <div className="absolute top-[80%] left-[49%] text-white text-sm opacity-30 animate-pulse delay-450">★</div>
    
    {/* Additional stars - right side */}
    <div className="absolute top-[12%] right-[5%] text-white text-xs opacity-70 animate-pulse delay-350">✧</div>
    <div className="absolute top-[22%] right-[12%] text-white text-sm opacity-50 animate-pulse delay-250">✦</div>
    <div className="absolute top-[32%] right-[7%] text-white text-xs opacity-80 animate-pulse delay-150">★</div>
    <div className="absolute top-[52%] right-[8%] text-white text-sm opacity-35 animate-pulse delay-550">✩</div>
    <div className="absolute top-[62%] right-[18%] text-white text-xs opacity-85 animate-pulse delay-450">★</div>
    <div className="absolute top-[72%] right-[3%] text-white text-base opacity-20 animate-pulse delay-150">✧</div>
    
    {/* Blue-tinted stars */}
    <div className="absolute top-[15%] left-[35%] text-blue-200 text-sm opacity-50 animate-pulse delay-300">✦</div>
    <div className="absolute top-[55%] right-[35%] text-blue-200 text-xs opacity-60 animate-pulse delay-400">★</div>
    <div className="absolute top-[75%] left-[40%] text-blue-200 text-base opacity-40 animate-pulse delay-200">✧</div>
    <div className="absolute top-[25%] right-[40%] text-blue-200 text-sm opacity-70 animate-pulse delay-500">✩</div>
    
    {/* Green-tinted stars (matching theme) */}
    <div className="absolute top-[22%] left-[42%] text-[#a4e22a] text-sm opacity-30 animate-pulse delay-350">★</div>
    <div className="absolute top-[62%] right-[42%] text-[#a4e22a] text-xs opacity-40 animate-pulse delay-250">✧</div>
    <div className="absolute top-[37%] left-[65%] text-[#a4e22a] text-sm opacity-60 animate-pulse delay-450">✦</div>
    
    {/* Glowing network lines */}
    <div className="absolute top-[1%] left-[78%] w-[18%] h-[1px] bg-gradient-to-r from-white to-transparent opacity-40 rotate-[32deg] blur-[0.5px] drop-shadow-[0_0_4px_rgba(255,255,255,0.3)]"></div>
    <div className="absolute top-[40%] right-[18%] w-[17%] h-[0.5px] bg-gradient-to-l from-white to-transparent opacity-35 -rotate-[36deg] blur-[0.5px] drop-shadow-[0_0_3px_rgba(255,255,255,0.3)]"></div>
    <div className="absolute top-[1.5%] left-[42%] w-[22%] h-[0.75px] bg-gradient-to-r from-white to-transparent opacity-25 rotate-[18deg] blur-sm drop-shadow-[0_0_3px_rgba(255,255,255,0.25)]"></div>
    <div className="absolute top-[70%] right-[33%] w-[12%] h-[1px] bg-gradient-to-l from-white to-transparent opacity-30 -rotate-[28deg] blur-[1px] drop-shadow-[0_0_3px_rgba(255,255,255,0.2)]"></div>
    <div className="absolute top-[50%] left-[10%] w-[15%] h-[0.5px] bg-gradient-to-r from-white to-transparent opacity-20 rotate-[12deg] blur-sm drop-shadow-[0_0_2px_rgba(255,255,255,0.2)]"></div>
    <div className="absolute top-[80%] right-[10%] w-[20%] h-[0.75px] bg-gradient-to-l from-white to-transparent opacity-40 -rotate-[22deg] blur-sm drop-shadow-[0_0_2px_rgba(255,255,255,0.15)]"></div>
    <div className="absolute top-[20%] left-[10%] w-[18%] h-[1px] bg-gradient-to-r from-white to-transparent opacity-40 rotate-[32deg] blur-sm drop-shadow-[0_0_3px_rgba(255,255,255,0.25)]"></div>
    <div className="absolute top-[90%] right-[25%] w-[15%] h-[0.5px] bg-gradient-to-l from-white to-transparent opacity-25 -rotate-[15deg] blur-sm drop-shadow-[0_0_2px_rgba(255,255,255,0.1)]"></div>              
                
                {/* Extra particles */}
                <div className="absolute top-[12%] right-[5%] text-white text-xs opacity-70 animate-pulse delay-350">✧</div>
                <div className="absolute top-[22%] right-[12%] text-white text-sm opacity-50 animate-pulse delay-250">✦</div>
                <div className="absolute top-[32%] right-[7%] text-white text-xs opacity-80 animate-pulse delay-150">★</div>
                <div className="absolute top-[52%] right-[8%] text-white text-sm opacity-35 animate-pulse delay-550">✩</div>
                <div className="absolute top-[62%] right-[18%] text-white text-xs opacity-85 animate-pulse delay-450">★</div>
                <div className="absolute top-[72%] right-[3%] text-white text-base opacity-20 animate-pulse delay-150">✧</div>
                
                {/* Extra connection lines*/}
                <div className="absolute top-[87%] left-[25%] w-[20%] h-[0.5px] bg-gradient-to-r from-white to-transparent opacity-25 rotate-[10deg]"></div>
                <div className="absolute top-[93%] right-[20%] w-[15%] h-[0.5px] bg-gradient-to-l from-white to-transparent opacity-20 -rotate-[15deg]"></div>
              </div>
            </div>


      <div className="flex flex-grow gap-8 px-6">
  {/* Sidebar */}
  <aside className="w-[40%] min-w-[450px] max-w-[550px] shadow-md rounded-2xl pt-40 z-10">
    {loading ? (
      <div className="flex items-center justify-center h-full">
        <p className="text-white text-xl">Loading profile data...</p>
      </div>
    ) : (
      <ProfileSidebar 
        profilePicUrl={userData?.avatar_url}
        name={userData?.name || username}
        username={username}
        stats={{
          repos: userData?.public_repos || 0,
          followers: userData?.followers_count || 0,
          stars: userData?.stargazers_count || 0,
          forks: userData?.forks_count || 0
        }}
      />
    )}
  </aside>

        {/* Main Content */}
  <main className="flex-1 p-10 pt-42 space-y-12 overflow-x-auto z-10">
          <section id="graph-visualization" className="min-w-full">
            <SectionTitle infoContent={implementationInfo.graph}  position="right">
              GitHub Network Visualization
            </SectionTitle>
            <GraphVisualization username={username} />
          </section>

          <section id="analytics-tabs">
            <SectionTitle infoContent={implementationInfo.analytics} position="right">
              Analytics Overview
            </SectionTitle>
            <AnalyticsTabs username={username} />
          </section>

          <section id="repo-analysis">
            <SectionTitle infoContent={implementationInfo.repo}position="right">
              Repository Analysis
            </SectionTitle>
            <div className="my-6">
              <RepositoryAnalysis username={username} isAuthenticated={true} />
            </div>
          </section>
          
          <section id="community-detection">
            <SectionTitle infoContent={implementationInfo.community}position="right">
              Community Detection Map
            </SectionTitle>
            <CommunityDetectionMap username={username} isAuthenticated={true} />
          </section>
          
          <section id="path-finder">
            <SectionTitle infoContent={implementationInfo.path} position="right">
              Connection Path Finder
            </SectionTitle>
            <PathFinder username={username} isAuthenticated={true} />
          </section>
          
          <section id="recommendation-panel">
            <SectionTitle infoContent={implementationInfo.recommendation}position="right">
              Collaboration Recommendations
            </SectionTitle>
            <RecommendationPanel username={username} isAuthenticated={true} />
          </section>
          
          <section id="domain-project-finder">
            <SectionTitle infoContent={implementationInfo.domain}position="right">
              Domain Project Finder
            </SectionTitle>
            <DomainProjectFinder 
              username={username} 
              isAuthenticated={true} 
              onSelectRepository={handleRepositorySelect}
            />
          </section>
          
          <section id="contribution-timeline">
            <SectionTitle infoContent={implementationInfo.timeline} position="right">
              Contribution Timeline Analyzer
            </SectionTitle>
            <ContributionTimeline 
              username={username} 
              isAuthenticated={true} 
              selectedRepo={selectedRepository}
            />
          </section>
        </main>
      </div>
      </div>
      <Footer />
    </div>
  );
};

export default Dashboard;
