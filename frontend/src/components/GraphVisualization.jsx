import { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';

const GraphVisualization = ({ username }) => {
  const d3Container = useRef(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [comparisonMode, setComparisonMode] = useState(false);
  const [networkData, setNetworkData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [graphType, setGraphType] = useState('followers');

  const margin = 50;
  const width = 500;
  const height = 500;

  // Fetch network data from API
  useEffect(() => {
    const fetchNetworkData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Determine API endpoint based on graph type
        let apiEndpoint;
        switch(graphType) {
          case 'following':
            apiEndpoint = `http://localhost:5000/api/network/following/${username}`;
            break;
          case 'stargazers':
            apiEndpoint = `http://localhost:5000/api/network/stargazers/${username}`;
            break;
          case 'repos':
            apiEndpoint = `http://localhost:5000/api/network/repositories/${username}`;
            break;
          case 'followers':
          default:
            apiEndpoint = `http://localhost:5000/api/network/followers/${username}`;
        }
        
        const response = await fetch(apiEndpoint);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch network data: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log("API response:", data); // Log for debugging
        
        if (data.status === 'success') {
          const networkData = {
            nodes: Object.values(data.data.nodes),
            edges: data.data.edges
          };
          
          // Format the network data for D3
          const formattedData = {
            nodes: [],
            links: []
          };
          
          // Process node data
          if (networkData && networkData.nodes) {
            // Map to create unique nodes without duplicates
            const nodesMap = new Map();
            
            // Process and clean node data
            networkData.nodes.forEach(node => {
              // Extract the node ID without (user) or (repo) suffix
              const nodeId = node.id ? node.id.replace(/\(user\)|\(repo\)$/, '') : node.login;
              
              // Determine the node type
              let nodeType = 'user';
              if (node.id && node.id.includes('(repo)')) {
                nodeType = 'repository';
              }
              
              // Store cleaned node data in map
              nodesMap.set(nodeId, {
                id: nodeId,
                originalId: node.id,
                type: nodeType,
                group: nodeType === 'repository' ? 2 : 3,
                details: {
                  name: node.name || nodeId,
                  handle: node.login || nodeId,
                  avatar_url: node.avatar_url,
                  repos: node.public_repos || 0,
                  followers: node.followers_count || 0,
                  following: node.following_count || 0,
                  stars: node.stargazers_count || 0,
                  forks: node.forks_count || 0,
                  language: node.language
                }
              });
            });
            
            // Add user node if not already included
            if (!nodesMap.has(username)) {
              nodesMap.set(username, {
                id: username,
                originalId: `${username}(user)`,
                type: 'user',
                group: 1, // Primary user
                details: {
                  name: username,
                  handle: username,
                  repos: 0,
                  followers: 0,
                  following: 0
                }
              });
            } else {
              // If user exists, ensure it's marked as primary user
              const userNode = nodesMap.get(username);
              userNode.group = 1;
            }
            
            // Convert map to array
            formattedData.nodes = Array.from(nodesMap.values());
          }
          
          // Process link data
          if (networkData && networkData.edges) {
            formattedData.links = networkData.edges.map(edge => {
              // Clean source and target IDs
              const source = edge.source.replace(/\(user\)|\(repo\)$/, '');
              const target = edge.target.replace(/\(user\)|\(repo\)$/, '');
              
              return { 
                source, 
                target,
                type: edge.type || 'connection'
              };
            });
          }
          
          console.log("Formatted data for D3:", formattedData);
          setNetworkData(formattedData);
        } else {
          throw new Error('Invalid response format');
        }
      } catch (err) {
        console.error('Error fetching network data:', err);
        setError(err.message);
        
        // Try to connect to API with alternative path
        try {
          console.log("Trying alternative API endpoint...");
          
          // Get alternative API endpoint based on graph type
          let alternativeEndpoint;
          switch(graphType) {
            case 'following':
              alternativeEndpoint = `http://127.0.0.1:5000/api/network/following/${username}`;
              break;
            case 'stargazers':
              alternativeEndpoint = `http://127.0.0.1:5000/api/network/stargazers/${username}`;
              break;
            case 'repos':
              alternativeEndpoint = `http://127.0.0.1:5000/api/network/repositories/${username}`;
              break;
            case 'followers':
            default:
              alternativeEndpoint = `http://127.0.0.1:5000/api/network/followers/${username}`;
          }
          
          const alternativeResponse = await fetch(alternativeEndpoint);
          
          if (alternativeResponse.ok) {
            const data = await alternativeResponse.json();
            if (data.data) {
              console.log("Alternative API endpoint successful:", data);
              // Process data similar to main endpoint
              const networkData = {
                nodes: Object.values(data.data.nodes),
                edges: data.data.edges
              };
              const processedData = processNetworkData(networkData, username);
              setNetworkData(processedData);
              setError(null);
            } else {
              setError("Could not fetch network data. Please check the API server is running.");
            }
          } else {
            setError("API server not available. Please start the backend server.");
          }
        } catch (alternativeErr) {
          console.error("Alternative API endpoint also failed:", alternativeErr);
          setError("Could not connect to the API server. Please make sure the backend is running.");
        }
      } finally {
        setLoading(false);
      }
    };
    
    // Helper function to process network data
    const processNetworkData = (networkData, username) => {
      const formattedData = {
        nodes: [],
        links: []
      };
      
      // Process node data
      if (networkData && networkData.nodes) {
        // Map to create unique nodes without duplicates
        const nodesMap = new Map();
        
        // Process and clean node data
        networkData.nodes.forEach(node => {
          // Extract the node ID without (user) or (repo) suffix
          const nodeId = node.id ? node.id.replace(/\(user\)|\(repo\)$/, '') : node.login;
          
          // Determine the node type
          let nodeType = 'user';
          if (node.id && node.id.includes('(repo)')) {
            nodeType = 'repository';
          }
          
          // Store cleaned node data in map
          nodesMap.set(nodeId, {
            id: nodeId,
            originalId: node.id,
            type: nodeType,
            group: nodeType === 'repository' ? 2 : 3,
            details: {
              name: node.name || nodeId,
              handle: node.login || nodeId,
              avatar_url: node.avatar_url,
              repos: node.public_repos || 0,
              followers: node.followers_count || 0,
              following: node.following_count || 0,
              stars: node.stargazers_count || 0,
              forks: node.forks_count || 0,
              language: node.language
            }
          });
        });
        
        // Add user node if not already included
        if (!nodesMap.has(username)) {
          nodesMap.set(username, {
            id: username,
            originalId: `${username}(user)`,
            type: 'user',
            group: 1, // Primary user
            details: {
              name: username,
              handle: username,
              repos: 0,
              followers: 0,
              following: 0
            }
          });
        } else {
          // If user exists, ensure it's marked as primary user
          const userNode = nodesMap.get(username);
          userNode.group = 1;
        }
        
        // Convert map to array
        formattedData.nodes = Array.from(nodesMap.values());
      }
      
      // Process link data
      if (networkData && networkData.edges) {
        formattedData.links = networkData.edges.map(edge => {
          // Clean source and target IDs
          const source = edge.source.replace(/\(user\)|\(repo\)$/, '');
          const target = edge.target.replace(/\(user\)|\(repo\)$/, '');
          
          return { 
            source, 
            target,
            type: edge.type || 'connection'
          };
        });
      }
      
      return formattedData;
    };

    if (username) {
      fetchNetworkData();
    }
  }, [username, graphType]);

  // Render visualization when data is available
  useEffect(() => {
    if (d3Container.current && networkData) {
      d3.select(d3Container.current).selectAll('*').remove();

      const containerWidth = comparisonMode ? 2 * (width + margin * 2) : width + margin * 2;

      const svg = d3.select(d3Container.current)
.attr('viewBox', `0 0 ${containerWidth} ${height + margin * 2 + 50}`)
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

      const createGraph = (data, xOffset = 0, isSecondGraph = false) => {
        const localWidth = width + margin * 2;
        const simulation = d3.forceSimulation(data.nodes)
          .force('link', d3.forceLink(data.links).id(d => d.id).distance(150))
          .force('charge', d3.forceManyBody().strength(-200))
          .force('center', d3.forceCenter(localWidth / 2, height / 2));

        const graphGroup = svg.append('g')
.attr('transform', `translate(${xOffset}, ${margin / 2})`);
        const link = graphGroup.append('g')
          .attr('stroke', isSecondGraph ? '#4b7265' : '#6b7280')
          .attr('stroke-opacity', 0.6)
          .selectAll('line')
          .data(data.links)
          .enter().append('line')
          .attr('stroke-width', 2);

        const node = graphGroup.append('g')
          .attr('stroke', '#fff')
          .attr('stroke-width', 1.5)
          .selectAll('circle')
          .data(data.nodes)
          .enter().append('circle')
          .attr('r', d => d.type === 'repository' ? 12 : 8) // Repositories are larger
          .attr('fill', d => {
            if (isSecondGraph) {
              return d.type === 'repository' 
                ? d3.interpolateGreens(0.6) 
                : d3.interpolateGreens(0.3);
            } else {
              return d.type === 'repository' 
                ? '#3182CE' // Blue for repositories
                : '#6B7280'; // Gray for users
            }
          })
          .call(drag(simulation))
          .on("mouseover", function (event, d) {
            d3.select(this).attr("r", d.type === 'repository' ? 16 : 12);
            
            // Format tooltip content based on node type
            let tooltipContent = '';
            if (d.type === 'repository') {
              tooltipContent = `<div class="p-2">
                <strong class="text-blue-600">${d.details?.name || d.id}</strong><br/>
                <span class="text-gray-600">Repository</span>
              </div>`;
            } else {
              tooltipContent = `<div class="p-2">
                <strong>${d.details?.name || d.id}</strong><br/>
                <span class="text-gray-600">GitHub User</span>
              </div>`;
            }
            
            tooltip.html(tooltipContent)
              .style("visibility", "visible")
              .style("left", (event.pageX + 10) + "px")
              .style("top", (event.pageY - 28) + "px");
          })
          .on("mouseout", function () {
            d3.select(this).attr("r", 10);
            tooltip.style("visibility", "hidden");
          })
          .on("click", function (event, d) {
            event.stopPropagation();
            setSelectedNode(d);
          });

        const text = graphGroup.append('g')
          .selectAll('text')
          .data(data.nodes)
          .enter().append('text')
          .text(d => d.id) // Show clean node name without (user) or (repo) suffix
          .attr('font-size', 11)
          .attr('dy', '-1.5em')
          .attr('text-anchor', 'middle')
          .attr('fill', d => d.type === 'repository' ? '#3182CE' : '#2D3748')
          .attr('font-weight', d => d.type === 'repository' ? 'bold' : 'normal');

        simulation.on('tick', () => {
          link
            .attr('x1', d => d.source.x)
            .attr('y1', d => d.source.y)
            .attr('x2', d => d.target.x)
            .attr('y2', d => d.target.y);

          node
            .attr('cx', d => d.x)
            .attr('cy', d => d.y);

          text
            .attr('x', d => d.x)
            .attr('y', d => d.y);
        });
      };

      createGraph(networkData, 0, false);
      if (comparisonMode) {
        // Get a message that comparison mode requires the API
        const emptyComparisonData = {
          nodes: [
            { id: 'API Required', group: 1, type: 'user', details: { name: 'API Required' }}
          ],
          links: []
        };
        createGraph(emptyComparisonData, width + margin * 2, true);
      }

      svg.on("click", () => {
        setSelectedNode(null);
      });

      function drag(simulation) {
        return d3.drag()
          .on('start', (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on('drag', (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on('end', (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          });
      }
    }

    return () => {
      d3.select("body").selectAll(".tooltip").remove();
    };
  }, [networkData, comparisonMode]);

  const getNodeGroupType = (type) => {
    switch (type) {
      case 'user': return 1;
      case 'repository': return 2;
      case 'follower': return 3;
      case 'following': return 5;
      case 'starred_repo': return 2;
      case 'collaborator': return 4;
      default: return 6;
    }
  };

  const NodeDetailPanel = ({ node }) => {
    if (!node) return null;
    const details = node.details || {};
    
    // Format large numbers with commas (e.g., 1,234,567)
    const formatNumber = (num) => {
      return num ? num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") : '0';
    };
    
    // Get language color based on programming language
    const getLanguageColor = (language) => {
      const colors = {
        'JavaScript': '#f1e05a',
        'TypeScript': '#2b7489',
        'Python': '#3572A5',
        'Java': '#b07219',
        'C++': '#f34b7d',
        'HTML': '#e34c26',
        'CSS': '#563d7c',
        'Dart': '#00B4AB',
        'Go': '#00ADD8',
        'Rust': '#dea584',
        'Ruby': '#701516',
        'PHP': '#4F5D95'
      };
      
      return colors[language] || '#ccc';
    };
    
    // Determine content based on node type
    let detailContent;
    let nodeTitle;
    let nodeColor;
    
    if (node.type === 'repository') {
      // Repository node
      nodeTitle = 'Repository';
      nodeColor = '#3182CE';
        detailContent = (
          <>
          <h3 className="text-lg font-bold text-blue-600">{details.name}</h3>
          <div className="mt-3 space-y-1">
            <p className="flex justify-between">
              <span>Stars:</span> 
              <span className="font-semibold">{formatNumber(details.stars)}</span>
            </p>
            <p className="flex justify-between">
              <span>Forks:</span> 
              <span className="font-semibold">{formatNumber(details.forks)}</span>
            </p>
            <p className="flex items-center justify-between">
              <span>Language:</span>
              <span className="font-semibold flex items-center">
                <span className="w-3 h-3 rounded-full mr-1.5" 
                  style={{ backgroundColor: getLanguageColor(details.language) }}
                ></span>
                {details.language || 'Unknown'}
              </span>
            </p>
            <a 
              href={`https://github.com/${details.name}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block mt-2 text-blue-500 hover:underline text-sm"
            >
              View on GitHub
            </a>
            </div>
          </>
        );
    } else {
      // User or other user type node
      nodeTitle = 'GitHub User';
      nodeColor = '#6B7280';
        detailContent = (
          <>
            <h3 className="text-lg font-bold">{details.name}</h3>
          <a 
            href={`https://github.com/${details.handle || details.name}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline"
          >
            @{details.handle || details.name}
          </a>
          <div className="mt-3 space-y-1">
            <p className="flex justify-between">
              <span>Repositories:</span> 
              <span className="font-semibold">{formatNumber(details.repos)}</span>
            </p>
            <p className="flex justify-between">
              <span>Followers:</span> 
              <span className="font-semibold">{formatNumber(details.followers)}</span>
            </p>
            <p className="flex justify-between">
              <span>Following:</span> 
              <span className="font-semibold">{formatNumber(details.following)}</span>
            </p>
            </div>
          </>
        );
    }

    return (
      <div className="bg-white p-4 rounded shadow-md border-l-4" style={{ borderColor: nodeColor }}>
        <div className="flex items-center mb-3">
          <div className="w-4 h-4 mr-2 rounded-full" style={{ backgroundColor: nodeColor }}></div>
          <span className="text-gray-600 font-medium">{nodeTitle}</span>
        </div>
        {detailContent}
      </div>
    );
  };

  // Graph type labels for display
  const graphTypeLabels = {
    followers: "Followers Network",
    following: "Following Network", 
    stargazers: "Stargazers Network",
    repos: "Repository Network"
  };

  return (
    <div className="font-sans bg-white rounded-lg shadow-md p-5 mb-8">
        <h2 className="text-2xl font-bold text-gray-800">GitHub Graph Overview</h2>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <span className="mr-2 text-lg">Comparison Mode:</span>
        <label className="relative inline-flex items-center cursor-pointer">
          <input type="checkbox" checked={comparisonMode} onChange={() => setComparisonMode(!comparisonMode)} className="sr-only peer" />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
        </label>
        </div>
      </div>
      
      {/* Graph Type Toggle Buttons */}
      <div className="flex flex-wrap justify-center gap-2 mb-4">
        <button
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${graphType === 'followers' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
          onClick={() => setGraphType('followers')}
        >
          Followers
        </button>
        <button
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${graphType === 'following' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
          onClick={() => setGraphType('following')}
        >
          Following
        </button>
        <button
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${graphType === 'stargazers' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
          onClick={() => setGraphType('stargazers')}
        >
          Stargazers
        </button>
        <button
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${graphType === 'repos' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
          onClick={() => setGraphType('repos')}
        >
          Repositories
        </button>
      </div>
      
      <div className={`flex mb-2 ${comparisonMode ? 'justify-around' : 'justify-center'}`}>
        <h3 className="text-xl font-semibold text-blue-700 flex items-center">
          {graphTypeLabels[graphType] || "My GitHub Network"}
        </h3>
        {comparisonMode && <h3 className="text-xl font-semibold text-green-700">Friend's GitHub Network</h3>}
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center h-96">
          <p className="text-gray-500">Loading {graphTypeLabels[graphType]} data...</p>
        </div>
      ) : error ? (
        <div className="flex justify-center items-center flex-col h-96">
          <p className="text-red-500 text-xl mb-4">{error}</p>
          <p className="text-gray-600">Please ensure the API server is running.</p>
          <p className="text-gray-600 mt-2">Run <code className="bg-gray-100 px-2 py-1 rounded">start_api.bat</code> to start the server.</p>
        </div>
      ) : (
        <div className="bg-white flex justify-center border-blue-300 border-2 rounded-xl p-4 shadow-md">
        <div className="overflow-x-auto relative">
              <svg ref={d3Container} 
                style={{
              width: comparisonMode ? `${2 * (width + margin * 2)}px` : `${width + margin * 2}px`,
              height: '600px',
              backgroundColor: 'transparent'
                }}>
              </svg>

        {selectedNode && (
                <div className="absolute top-4 right-4 w-64 z-10">
            <NodeDetailPanel node={selectedNode} />
          </div>
        )}
      </div>
        </div>
      )}
    </div>
  );
};

export default GraphVisualization;
