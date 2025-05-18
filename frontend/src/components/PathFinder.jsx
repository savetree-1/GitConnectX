import { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';

const PathFinder = ({ username, isLoggedIn = false }) => {
  const d3Container = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pathData, setPathData] = useState(null);
  const [sourceUser, setSourceUser] = useState(username);
  const [targetUser, setTargetUser] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestionsList, setSuggestionsList] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [pathFinding, setPathFinding] = useState(false);

  const margin = 50;
  const width = 600;
  const height = 400;

  // Load demo or actual path data
  useEffect(() => {
    const loadPathData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        if (isLoggedIn) {
          // For logged-in users, we'll initialize with a sample path
          // but not search yet until they submit a query
          setDemoData(true);
        } else {
          // For guests, load demo data
          setDemoData(false);
        }
      } catch (err) {
        console.error('Error initializing path finder:', err);
        setError(err.message);
        setDemoData(false);
      } finally {
        setLoading(false);
      }
    };
    
    loadPathData();
  }, [username, isLoggedIn]);

  // Function to set demo data
  const setDemoData = (interactive = false) => {
    // Sample path data for visualization
    const samplePathData = {
      nodes: [
        { id: 'alice', name: 'Alice', group: 1 },
        { id: 'bob', name: 'Bob', group: 2 },
        { id: 'charlie', name: 'Charlie', group: 2 },
        { id: 'david', name: 'David', group: 2 },
        { id: 'eve', name: 'Eve', group: 2 }
      ],
      links: [
        { source: 'alice', target: 'bob', weight: 3, type: 'collaboration' },
        { source: 'bob', target: 'charlie', weight: 5, type: 'collaboration' },
        { source: 'charlie', target: 'david', weight: 2, type: 'collaboration' },
        { source: 'david', target: 'eve', weight: 4, type: 'collaboration' }
      ],
      path: ['alice', 'bob', 'charlie', 'david', 'eve'],
      pathDetails: {
        distance: 14,
        strength: 72,
        shared_repos: 3,
        mutual_connections: 5
      }
    };
    
    setPathData(samplePathData);
    setSourceUser(interactive ? username : 'alice');
    setTargetUser(interactive ? '' : 'eve');
  };

  // Function to find the path between two users
  const findPath = async () => {
    if (!targetUser || targetUser === sourceUser) {
      setError("Please enter a valid target GitHub username");
      return;
    }
    
    try {
      setPathFinding(true);
      setError(null);
      
      if (isLoggedIn) {
        // In a real app, we would call the API here
        const response = await fetch(`http://localhost:5000/api/path/${sourceUser}/${targetUser}`);
        
        if (!response.ok) {
          throw new Error(`Failed to find path: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log("Path data:", data);
        
        if (data.status === 'success') {
          setPathData(data.data);
        } else {
          // If no path is found, show a custom response
          if (data.message === 'No path found') {
            setError(`No connection path found between ${sourceUser} and ${targetUser}`);
            
            // Set empty path data to clear visualization
            setPathData({
              nodes: [
                { id: sourceUser, name: sourceUser, group: 1 },
                { id: targetUser, name: targetUser, group: 2 }
              ],
              links: [],
              path: [],
              pathDetails: { distance: 0, strength: 0, shared_repos: 0, mutual_connections: 0 }
            });
          } else {
            throw new Error(data.message || 'Failed to find path');
          }
        }
      } else {
        // For demo purposes, when a user tries to search while not logged in
        setError("Please log in to use this feature with real GitHub data");
        setDemoData(false);
      }
    } catch (err) {
      console.error('Error finding path:', err);
      setError(err.message);
      
      // For demo purposes or if API fails, generate a random path
      simulatePathFinding();
    } finally {
      setPathFinding(false);
    }
  };

  // Simulate path finding for demo or when API fails
  const simulatePathFinding = () => {
    // Create a simple path from source to target with 2-3 random nodes in between
    const targetUsername = targetUser || 'octocat';
    
    // Generate some random intermediary usernames
    const randomUsers = [
      'webdev', 'dataengineer', 'securityguru', 'fullstack', 'devops',
      'uiexpert', 'cloudarchitect', 'appdev', 'mlspecialist', 'systemadmin'
    ];
    
    // Randomly select 1-3 intermediary nodes
    const pathLength = Math.floor(Math.random() * 3) + 2; // 2-4 total nodes (including source and target)
    const selectedUsers = [];
    
    for (let i = 0; i < pathLength - 2; i++) {
      const randomIndex = Math.floor(Math.random() * randomUsers.length);
      selectedUsers.push(randomUsers[randomIndex]);
      // Remove the selected user to avoid duplicates
      randomUsers.splice(randomIndex, 1);
    }
    
    // Construct the path
    const path = [sourceUser, ...selectedUsers, targetUsername];
    
    // Create nodes and links based on the path
    const nodes = path.map((user, index) => ({
      id: user,
      name: user.charAt(0).toUpperCase() + user.slice(1), // Capitalize first letter
      group: index === 0 ? 1 : (index === path.length - 1 ? 2 : 3)
    }));
    
    const links = [];
    for (let i = 0; i < path.length - 1; i++) {
      links.push({
        source: path[i],
        target: path[i + 1],
        weight: Math.floor(Math.random() * 5) + 1, // Random weight between 1-5
        type: Math.random() > 0.5 ? 'collaboration' : 'following'
      });
    }
    
    // Calculate total path weight
    const totalWeight = links.reduce((sum, link) => sum + link.weight, 0);
    
    const simulatedPathData = {
      nodes,
      links,
      path,
      pathDetails: {
        distance: totalWeight,
        strength: Math.floor(Math.random() * 30) + 50, // Random strength between 50-80
        shared_repos: Math.floor(Math.random() * 5) + 1, // Random shared repos between 1-5
        mutual_connections: Math.floor(Math.random() * 10) + 2 // Random mutual connections between 2-12
      }
    };
    
    setPathData(simulatedPathData);
  };

  // Handle user search input
  const handleSearchInput = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (query.length > 2) {
      // Simulated suggestions for demo purposes
      // In a real app, this would call an API endpoint
      const demoSuggestions = [
        'octocat', 'torvalds', 'gaearon', 'bradtraversy', 'kentcdodds',
        'wesbos', 'sindresorhus', 'yyx990803', 'fabpot', 'defunkt'
      ].filter(name => name.toLowerCase().includes(query.toLowerCase()));
      
      setSuggestionsList(demoSuggestions.slice(0, 5));
      setShowSuggestions(true);
    } else {
      setSuggestionsList([]);
      setShowSuggestions(false);
    }
  };

  // Handle suggestion selection
  const handleSelectSuggestion = (suggestion) => {
    setTargetUser(suggestion);
    setSearchQuery(suggestion);
    setShowSuggestions(false);
  };

  // Handle search form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    setTargetUser(searchQuery);
    findPath();
    setShowSuggestions(false);
  };

  // Render path visualization
  useEffect(() => {
    if (d3Container.current && pathData) {
      d3.select(d3Container.current).selectAll('*').remove();

      const svg = d3.select(d3Container.current)
        .attr('viewBox', `0 0 ${width + margin * 2} ${height + margin * 2}`)
        .attr('preserveAspectRatio', 'xMidYMid meet')
        .style('background', 'white');

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

      // Create the graph layout
      const simulation = d3.forceSimulation(pathData.nodes)
        .force('link', d3.forceLink(pathData.links).id(d => d.id).distance(100))
        .force('charge', d3.forceManyBody().strength(-300))
        .force('center', d3.forceCenter(width / 2 + margin, height / 2 + margin));

      // Position nodes sequentially for path visualization
      if (pathData.path && pathData.path.length > 0) {
        // Override force layout for path nodes to place them in a line
        const pathNodeIds = new Set(pathData.path);
        const pathNodesCount = pathData.path.length;
        
        pathData.nodes.forEach(node => {
          if (pathNodeIds.has(node.id)) {
            const index = pathData.path.indexOf(node.id);
            const x = margin + (width * (index + 1)) / (pathNodesCount + 1);
            const y = height / 2 + margin;
            
            // Set initial positions for path nodes
            node.fx = x;
            node.fy = y;
          }
        });
      }

      // Draw links with varied strengths
      const link = svg.append('g')
        .selectAll('line')
        .data(pathData.links)
        .enter().append('line')
        .attr('stroke-width', d => Math.max(1, d.weight))
        .attr('stroke', d => {
          // Highlight path links
          if (pathData.path && pathData.path.includes(d.source.id) && 
              pathData.path.includes(d.target.id) &&
              Math.abs(pathData.path.indexOf(d.source.id) - pathData.path.indexOf(d.target.id)) === 1) {
            return '#3182CE'; // Blue for path links
          }
          return '#999'; // Gray for other links
        })
        .attr('stroke-opacity', d => {
          // Highlight path links
          if (pathData.path && pathData.path.includes(d.source.id) && 
              pathData.path.includes(d.target.id) &&
              Math.abs(pathData.path.indexOf(d.source.id) - pathData.path.indexOf(d.target.id)) === 1) {
            return 1; // Full opacity for path links
          }
          return 0.6; // Lower opacity for other links
        });

      // Add link labels for weights (connection strength)
      const linkLabels = svg.append('g')
        .selectAll('text')
        .data(pathData.links)
        .enter().append('text')
        .attr('font-size', 10)
        .attr('text-anchor', 'middle')
        .attr('dy', -5)
        .text(d => d.weight)
        .attr('fill', '#555')
        .style('pointer-events', 'none')
        .style('opacity', d => {
          // Only show weights for path links
          if (pathData.path && pathData.path.includes(d.source.id) && 
              pathData.path.includes(d.target.id) &&
              Math.abs(pathData.path.indexOf(d.source.id) - pathData.path.indexOf(d.target.id)) === 1) {
            return 1;
          }
          return 0;
        });

      // Draw nodes with different styles based on role in path
      const node = svg.append('g')
        .selectAll('circle')
        .data(pathData.nodes)
        .enter().append('circle')
        .attr('r', d => {
          // Source and target are larger
          if (d.id === sourceUser || d.id === targetUser) {
            return 10;
          }
          // Path nodes are medium sized
          if (pathData.path && pathData.path.includes(d.id)) {
            return 8;
          }
          // Other nodes are smaller
          return 6;
        })
        .attr('fill', d => {
          // Source node
          if (d.id === sourceUser) {
            return '#4C51BF'; // Indigo
          }
          // Target node
          if (d.id === targetUser) {
            return '#38A169'; // Green
          }
          // Nodes in the path
          if (pathData.path && pathData.path.includes(d.id)) {
            return '#3182CE'; // Blue
          }
          // Other nodes
          return '#A0AEC0'; // Gray
        })
        .attr('stroke', '#fff')
        .attr('stroke-width', 1.5)
        .on('mouseover', function(event, d) {
          // Enlarge node on hover
          d3.select(this).attr('r', d.id === sourceUser || d.id === targetUser ? 12 : 10);
          
          // Show tooltip with node details
          let tooltipContent = `<div class="p-2">
            <strong>${d.name}</strong><br/>
            <span class="text-gray-600">GitHub User</span>`;
          
          // Add role in path if applicable
          if (d.id === sourceUser) {
            tooltipContent += `<br/><span class="text-indigo-600">Source User</span>`;
          } else if (d.id === targetUser) {
            tooltipContent += `<br/><span class="text-green-600">Target User</span>`;
          } else if (pathData.path && pathData.path.includes(d.id)) {
            tooltipContent += `<br/><span class="text-blue-600">Connection Path</span>`;
          }
          
          tooltipContent += `</div>`;
          
          tooltip.html(tooltipContent)
            .style('visibility', 'visible')
            .style('left', (event.pageX + 10) + 'px')
            .style('top', (event.pageY - 28) + 'px');
        })
        .on('mouseout', function(d) {
          // Restore original size on mouseout
          d3.select(this).attr('r', d => {
            if (d.id === sourceUser || d.id === targetUser) {
              return 10;
            }
            if (pathData.path && pathData.path.includes(d.id)) {
              return 8;
            }
            return 6;
          });
          
          tooltip.style('visibility', 'hidden');
        });

      // Add node labels
      const nodeLabels = svg.append('g')
        .selectAll('text')
        .data(pathData.nodes)
        .enter().append('text')
        .text(d => d.name)
        .attr('font-size', 11)
        .attr('dy', -12)
        .attr('text-anchor', 'middle')
        .attr('fill', d => {
          if (d.id === sourceUser) {
            return '#4C51BF'; // Indigo
          }
          if (d.id === targetUser) {
            return '#38A169'; // Green
          }
          if (pathData.path && pathData.path.includes(d.id)) {
            return '#3182CE'; // Blue
          }
          return '#4A5568'; // Dark gray
        })
        .attr('font-weight', d => 
          (d.id === sourceUser || d.id === targetUser) ? 'bold' : 'normal'
        );

      // Add directional arrows for links
      svg.append('defs').selectAll('marker')
        .data(['path-arrow'])
        .enter().append('marker')
        .attr('id', d => d)
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 15)
        .attr('refY', 0)
        .attr('markerWidth', 6)
        .attr('markerHeight', 6)
        .attr('orient', 'auto')
        .append('path')
        .attr('d', 'M0,-5L10,0L0,5')
        .attr('fill', '#3182CE');

      // Apply the arrow marker to path links
      link.filter(d => 
        pathData.path && 
        pathData.path.includes(d.source.id) && 
        pathData.path.includes(d.target.id) &&
        Math.abs(pathData.path.indexOf(d.source.id) - pathData.path.indexOf(d.target.id)) === 1
      )
      .attr('marker-end', 'url(#path-arrow)');

      // Update positions on simulation tick
      simulation.on('tick', () => {
        link
          .attr('x1', d => d.source.x)
          .attr('y1', d => d.source.y)
          .attr('x2', d => d.target.x)
          .attr('y2', d => d.target.y);

        linkLabels
          .attr('x', d => (d.source.x + d.target.x) / 2)
          .attr('y', d => (d.source.y + d.target.y) / 2);

        node
          .attr('cx', d => d.x)
          .attr('cy', d => d.y);

        nodeLabels
          .attr('x', d => d.x)
          .attr('y', d => d.y);
      });

      // If there's a valid path, add path details panel
      if (pathData.pathDetails && pathData.path && pathData.path.length > 0) {
        const infoPanel = svg.append('g')
          .attr('transform', `translate(${width - 180 + margin}, ${margin})`)
          .attr('class', 'path-info-panel');
        
        // Background rectangle
        infoPanel.append('rect')
          .attr('width', 180)
          .attr('height', 140)
          .attr('fill', 'white')
          .attr('stroke', '#ddd')
          .attr('rx', 5);
        
        // Panel title
        infoPanel.append('text')
          .attr('x', 90)
          .attr('y', 25)
          .attr('text-anchor', 'middle')
          .attr('font-weight', 'bold')
          .attr('font-size', 14)
          .text('Connection Details');
        
        // Connection info
        const details = [
          { label: 'Path Length', value: `${pathData.path.length - 1} steps` },
          { label: 'Strength Score', value: `${pathData.pathDetails.strength}%` },
          { label: 'Shared Repos', value: pathData.pathDetails.shared_repos },
          { label: 'Mutual Connections', value: pathData.pathDetails.mutual_connections }
        ];
        
        details.forEach((detail, i) => {
          // Label
          infoPanel.append('text')
            .attr('x', 15)
            .attr('y', 50 + i * 22)
            .attr('font-size', 12)
            .attr('fill', '#4A5568')
            .text(detail.label);
          
          // Value
          infoPanel.append('text')
            .attr('x', 165)
            .attr('y', 50 + i * 22)
            .attr('text-anchor', 'end')
            .attr('font-size', 12)
            .attr('font-weight', 'bold')
            .attr('fill', '#3182CE')
            .text(detail.value);
        });
      }

      // Add a "login to see real connections" banner for guests
      if (!isLoggedIn) {
        const banner = svg.append('g')
          .attr('transform', `translate(${(width / 2) + margin}, ${height + margin - 30})`);
        
        // Banner background
        banner.append('rect')
          .attr('width', 250)
          .attr('height', 40)
          .attr('x', -125)
          .attr('y', -20)
          .attr('fill', '#EBF8FF')
          .attr('stroke', '#3182CE')
          .attr('stroke-width', 1)
          .attr('rx', 5);
        
        // Banner text
        banner.append('text')
          .attr('text-anchor', 'middle')
          .attr('font-size', 14)
          .attr('fill', '#3182CE')
          .attr('font-weight', 'bold')
          .text('Log in to explore real GitHub connections');
      }
    }

    return () => {
      d3.select("body").selectAll(".tooltip").remove();
    };
  }, [pathData, sourceUser, targetUser, width, height, margin, isLoggedIn]);

  return (
    <div className="font-sans bg-white rounded-lg shadow-md p-5 mb-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Path Finder</h2>
      
      <div className="mb-6">
        <form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-3">
          <div className="flex-1">
            <label htmlFor="source-user" className="block text-sm font-medium text-gray-700 mb-1">
              Source User
            </label>
            <input
              type="text"
              id="source-user"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              value={sourceUser}
              disabled
            />
          </div>
          
          <div className="flex-1 relative">
            <label htmlFor="target-user" className="block text-sm font-medium text-gray-700 mb-1">
              Target User
            </label>
            <input
              type="text"
              id="target-user"
              className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${!isLoggedIn ? 'opacity-50' : ''}`}
              placeholder="Enter GitHub username"
              value={searchQuery}
              onChange={handleSearchInput}
              disabled={!isLoggedIn || pathFinding}
            />
            
            {/* Suggestions dropdown */}
            {showSuggestions && suggestionsList.length > 0 && (
              <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-200 max-h-60 overflow-auto">
                <ul className="py-1">
                  {suggestionsList.map(suggestion => (
                    <li 
                      key={suggestion}
                      className="px-3 py-2 hover:bg-blue-50 cursor-pointer"
                      onClick={() => handleSelectSuggestion(suggestion)}
                    >
                      {suggestion}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          
          <div className="flex items-end">
            <button
              type="submit"
              className={`px-4 py-2 ${isLoggedIn ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-400'} text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
              disabled={!isLoggedIn || pathFinding || !searchQuery}
            >
              {pathFinding ? 'Finding Path...' : 'Find Path'}
            </button>
          </div>
        </form>
      </div>
      
      {!isLoggedIn && (
        <div className="bg-blue-50 p-3 rounded-md mb-4 text-sm">
          <p className="text-blue-700">
            <span className="font-bold">Demo Mode:</span> This is a demonstration of the Path Finder feature.
            <span className="block mt-1">Sign in to find real connection paths between GitHub users.</span>
          </p>
        </div>
      )}
      
      {error && (
        <div className="bg-red-50 p-3 rounded-md mb-4">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}
      
      {loading ? (
        <div className="flex justify-center items-center h-96">
          <p className="text-gray-500">Initializing path finder...</p>
        </div>
      ) : (
        <div className="bg-white flex justify-center border-blue-200 border-2 rounded-xl p-4">
          <div className="overflow-x-auto relative">
            <svg 
              ref={d3Container} 
              style={{
                width: `${width + margin * 2}px`,
                height: `${height + margin * 2}px`,
                backgroundColor: 'transparent'
              }}
            ></svg>
          </div>
        </div>
      )}
      
      <div className="mt-4 bg-gray-50 p-3 rounded-md text-sm">
        <h3 className="font-bold text-gray-700 mb-1">
          {isLoggedIn ? "How Connection Paths Work" : "About Path Finding"}
        </h3>
        <p className="text-gray-600">
          {isLoggedIn 
            ? "The Path Finder uses Dijkstra's algorithm to find the shortest connection path between GitHub users based on collaborations, following relationships, and shared repositories. Stronger connections have higher weights."
            : "Path Finding helps you discover how you're connected to other GitHub users through your network. Connections are formed through repositories, followers, and collaborations."}
        </p>
        
        {isLoggedIn && (
          <div className="mt-2 flex items-center space-x-4">
            <div className="flex items-center">
              <span className="h-3 w-3 rounded-full bg-blue-500 inline-block mr-1"></span>
              <span className="text-xs">Path Node</span>
            </div>
            <div className="flex items-center">
              <span className="h-3 w-3 rounded-full bg-indigo-600 inline-block mr-1"></span>
              <span className="text-xs">Source</span>
            </div>
            <div className="flex items-center">
              <span className="h-3 w-3 rounded-full bg-green-500 inline-block mr-1"></span>
              <span className="text-xs">Target</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PathFinder; 