import { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import DemoDataGenerator from './DemoDataGenerator';

const PathFinder = ({ username }) => {
  const [sourceUser, setSourceUser] = useState(username || 'octocat');
  const [targetUser, setTargetUser] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [pathData, setPathData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showDemo, setShowDemo] = useState(false);
  
  const d3Container = useRef(null);
  const sourceInputRef = useRef(null);
  const targetInputRef = useRef(null);
  
  // Load sample data for demo mode or when not authenticated
  useEffect(() => {
    if (showDemo || !username) {
      const demoPath = DemoDataGenerator.generatePathFinderData('octocat', 'torvalds');
      setPathData(demoPath);
    }
  }, [showDemo, username]);
  
  // Handle user search
  const handleUserSearch = async (query, isSource) => {
    if (!query || query.length < 2) {
      setSuggestions([]);
      return;
    }
    
    try {
      // In a real application, this would fetch user suggestions from the API
      // Here we'll simulate it with dummy data
      const dummySuggestions = [
        { username: `${query}dev`, displayName: `${query} Developer` },
        { username: `${query}_coder`, displayName: `Coder ${query}` },
        { username: `github_${query}`, displayName: `GitHub ${query}` },
      ];
      
      setSuggestions(dummySuggestions);
    } catch (err) {
      console.error('Error fetching user suggestions:', err);
      setSuggestions([]);
    }
  };
  
  // Handle suggestion selection
  const handleSelectSuggestion = (username, isSource) => {
    if (isSource) {
      setSourceUser(username);
    } else {
      setTargetUser(username);
    }
    setSuggestions([]);
  };
  
  // Find path between users
  const findPath = async () => {
    if (!sourceUser || !targetUser) {
      setError('Please enter both source and target usernames');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Try to fetch real path data from API
      try {
        const response = await fetch(`http://localhost:5000/api/network/path?source=${sourceUser}&target=${targetUser}`);
        if (!response.ok) console.error(`Failed to fetch path: ${response.status} ${response.statusText}`);
        
        if (response.ok) {
          const data = await response.json();
          if (data.status === 'success') {
            setPathData(data.data);
            setLoading(false);
            return;
          }
        }
        // If API fails, continue to use demo data
      } catch (e) {
        console.log('API not available, using demo data');
      }
      
      // Generate demo path data
      const demoPath = DemoDataGenerator.generatePathFinderData(sourceUser, targetUser);
      setPathData(demoPath);
    } catch (err) {
      console.error('Error finding path:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  // Visualize path when data is available
  useEffect(() => {
    if (d3Container.current && pathData) {
      // Clear previous visualization
      d3.select(d3Container.current).selectAll('*').remove();
      
      const width = 600;
      const height = 250;
      
      // Create SVG container
      const svg = d3.select(d3Container.current)
        .attr('viewBox', `0 0 ${width} ${height}`)
        .attr('preserveAspectRatio', 'xMidYMid meet');
      
      // Create tooltip
      const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("visibility", "hidden")
        .style("background-color", "white")
        .style("border", "1px solid #ddd")
        .style("border-radius", "5px")
        .style("padding", "10px")
        .style("box-shadow", "0 2px 5px rgba(0,0,0,0.1)")
        .style("pointer-events", "none")
        .style("z-index", "10");
      
      // Compute node positions
      const nodes = [];
      const nodeWidth = 80;
      const totalWidth = width - 100;
      const stepWidth = totalWidth / (pathData.path.length - 1);
      
      pathData.path.forEach((username, index) => {
        nodes.push({
          id: username,
          x: 50 + (index * stepWidth),
          y: height / 2,
          isEndpoint: index === 0 || index === pathData.path.length - 1
        });
      });
      
      // Create links
      const links = pathData.connections.map((conn, index) => ({
        source: nodes.find(n => n.id === conn.source),
        target: nodes.find(n => n.id === conn.target),
        type: conn.type,
        strength: parseFloat(conn.strength),
        sharedRepos: conn.sharedRepos
      }));
      
      // Draw links with arrow markers
      svg.append("defs").selectAll("marker")
        .data(["connection"])
        .enter().append("marker")
        .attr("id", d => `arrow-${d}`)
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 20)
        .attr("refY", 0)
        .attr("markerWidth", 6)
        .attr("markerHeight", 6)
        .attr("orient", "auto")
        .append("path")
        .attr("fill", "#888")
        .attr("d", "M0,-5L10,0L0,5");
      
      const link = svg.append('g')
        .selectAll('path')
        .data(links)
        .enter().append('path')
        .attr("d", d => {
          // Curved path
          const dx = d.target.x - d.source.x;
          const dy = d.target.y - d.source.y;
          const dr = Math.sqrt(dx * dx + dy * dy) * 1.5;
          return `M${d.source.x + 20},${d.source.y} A${dr},${dr} 0 0,1 ${d.target.x - 20},${d.target.y}`;
        })
        .attr("fill", "none")
        .attr("stroke", d => {
          // Color based on connection type
          return d.type === 'follows' ? '#3182ce' : '#38a169';
        })
        .attr("stroke-width", d => 2 + (d.strength * 3))
        .attr("marker-end", "url(#arrow-connection)")
        .on("mouseover", function(event, d) {
          d3.select(this).attr("stroke-width", 5 + (d.strength * 3));
          
          tooltip.html(`<div class="p-2">
              <strong>${d.type === 'follows' ? 'Follows' : 'Collaborates'}</strong><br/>
              <span>Strength: ${d.strength}</span><br/>
              <span>Shared Repos: ${d.sharedRepos}</span>
            </div>`)
            .style("visibility", "visible")
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function(d) {
          d3.select(this).attr("stroke-width", d => 2 + (d.strength * 3));
          tooltip.style("visibility", "hidden");
        });
      
      // Draw connection type labels
      svg.append('g')
        .selectAll('text')
        .data(links)
        .enter().append('text')
        .attr('x', d => (d.source.x + d.target.x) / 2)
        .attr('y', d => (d.source.y + d.target.y) / 2 - 15)
        .attr('text-anchor', 'middle')
        .attr('font-size', '16px')
        .attr('fill', d => d.type === 'follows' ? '#3182ce' : '#38a169')
        .text(d => d.type === 'follows' ? 'Follows' : 'Collaborates');
      
      // Draw nodes
      const node = svg.append('g')
        .selectAll('circle')
        .data(nodes)
        .enter().append('circle')
        .attr('cx', d => d.x)
        .attr('cy', d => d.y)
        .attr('r', d => d.isEndpoint ? 18 : 12)
        .attr('fill', (d, i) => {
          if (i === 0) return '#3182ce'; // Source color
          if (i === nodes.length - 1) return '#38a169'; // Target color
          return '#6b7280'; // Intermediate nodes
        })
        .attr('stroke', 'white')
        .attr('stroke-width', 2)
        .on("mouseover", function(event, d) {
          d3.select(this).attr("r", d.isEndpoint ? 22 : 16);
          
          tooltip.html(`<div class="p-2">
              <strong>${d.id}</strong>
            </div>`)
            .style("visibility", "visible")
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function(d) {
          d3.select(this).attr("r", d.isEndpoint ? 18 : 12);
          tooltip.style("visibility", "hidden");
        });
      
      // Draw user labels
      svg.append('g')
        .selectAll('text')
        .data(nodes)
        .enter().append('text')
        .attr('x', d => d.x)
        .attr('y', d => d.y + 30)
        .attr('text-anchor', 'middle')
        .attr('font-size', '18px')
        .attr('font-weight', d => d.isEndpoint ? 'bold' : 'normal')
        .text(d => d.id);
      
      return () => {
        d3.select("body").selectAll(".tooltip").remove();
      };
    }
  }, [pathData]);
  
  return (
    <div className="font-sans bg-white border-blue-500 border-2 rounded-lg shadow-md p-5 mb-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">GitHub Connection PathFinder</h2>
      
      {/* Search controls */}
      <div className="flex flex-wrap gap-4 mb-5">
        <div className="relative">
          <label htmlFor="source-user" className="block text-sm font-medium text-gray-700 mb-1">Source User</label>
          <input
            id="source-user"
            type="text"
            value={sourceUser}
            onChange={(e) => { setSourceUser(e.target.value); handleUserSearch(e.target.value, true); }}
            className="px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 block w-full"
            placeholder="GitHub username"
            ref={sourceInputRef}
          />
          {suggestions.length > 0 && sourceInputRef.current === document.activeElement && (
            <ul className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
              {suggestions.map(suggestion => (
                <li 
                  key={suggestion.username}
                  className="relative cursor-pointer select-none py-2 pl-3 pr-9 hover:bg-blue-100"
                  onClick={() => handleSelectSuggestion(suggestion.username, true)}
                >
                  {suggestion.displayName} (@{suggestion.username})
                </li>
              ))}
            </ul>
          )}
        </div>
        
        <div className="relative">
          <label htmlFor="target-user" className="block text-sm font-medium text-gray-700 mb-1">Target User</label>
          <input
            id="target-user"
            type="text"
            value={targetUser}
            onChange={(e) => { setTargetUser(e.target.value); handleUserSearch(e.target.value, false); }}
            className="px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 block w-full"
            placeholder="GitHub username"
            ref={targetInputRef}
          />
          {suggestions.length > 0 && targetInputRef.current === document.activeElement && (
            <ul className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
              {suggestions.map(suggestion => (
                <li 
                  key={suggestion.username}
                  className="relative cursor-pointer select-none py-2 pl-3 pr-9 hover:bg-blue-100"
                  onClick={() => handleSelectSuggestion(suggestion.username, false)}
                >
                  {suggestion.displayName} (@{suggestion.username})
                </li>
              ))}
            </ul>
          )}
        </div>
        
        <div className="flex items-end">
          <button
            onClick={findPath}
            disabled={loading || !sourceUser || !targetUser}
            className={`px-4 py-2 text-base rounded-md text-white font-bold ${
              loading || !sourceUser || !targetUser 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {loading ? 'Finding...' : 'Find Path'}
          </button>
        </div>
      </div>
      
      {error && (
        <div className="my-4 bg-red-50 border-l-4 border-red-500 p-4 text-red-700">
          <p>{error}</p>
        </div>
      )}
      
      {/* Path visualization */}
      {pathData && pathData.path && pathData.path.length === 0 && (
        <div className="my-8 text-center text-gray-500 text-lg">
          No connection found between these users in the current network.
        </div>
      )}
      {pathData && pathData.path && pathData.path.length > 0 && (
        <div className="space-y-6">
          <div className="border border-blue-200 rounded-lg p-4 bg-white shadow-sm">
            <svg 
              ref={d3Container}
              style={{ width: '100%', height: '250px', backgroundColor: 'white' }}
            />
            <div className="mt-3 text-base text-center text-gray-600">
              {username ? 
                'Interactive visualization of connection path' :
                'Sample connection path visualization (octocat → torvalds)'}
            </div>
          </div>
          {/* Path metrics */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h3 className="text-xl font-semibold mb-4 border-b pb-2">Connection Metrics</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-blue-700 mb-2">Path Details</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Path Length:</span>
                    <span className="font-medium">{pathData.metrics.pathLength} connections</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Average Strength:</span>
                    <span className="font-medium">{pathData.metrics.averageStrength}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shared Repositories:</span>
                    <span className="font-medium">{pathData.metrics.sharedRepositories}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Direct Connection:</span>
                    <span className="font-medium">{pathData.metrics.directConnection ? 'Yes' : 'No'}</span>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-medium text-blue-700 mb-2">Users</h4>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <div className="w-4 h-4 rounded-full bg-blue-600 mr-2"></div>
                    <div>
                      <p className="font-medium">{pathData.source.displayName || pathData.source.username}</p>
                      <p className="text-xs text-gray-500">@{pathData.source.username}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 rounded-full bg-green-600 mr-2"></div>
                    <div>
                      <p className="font-medium">{pathData.target.displayName || pathData.target.username}</p>
                      <p className="text-xs text-gray-500">@{pathData.target.username}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PathFinder; 