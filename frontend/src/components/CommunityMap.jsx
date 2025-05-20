import { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import DemoDataGenerator from './DemoDataGenerator';

const CommunityMap = ({ username, isAuthenticated }) => {
  const d3Container = useRef(null);
  const [algorithm, setAlgorithm] = useState('louvain');
  const [communityData, setCommunityData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCommunity, setSelectedCommunity] = useState(null);

  useEffect(() => {
    const fetchCommunityData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        if (isAuthenticated) {
          // Try to fetch real data from API if user is authenticated
          try {
            const response = await fetch(`http://localhost:5000/api/network/communities?algorithm=${algorithm}`);
            
            if (response.ok) {
              const data = await response.json();
              if (data.status === 'success') {
                setCommunityData(data.data);
                return;
              }
            }
            // If API fails, continue to use demo data
          } catch (e) {
            console.log('API not available, using demo data');
          }
        }
        
        // Generate demo data if API fails or user is not authenticated
        const demoData = DemoDataGenerator.generateCommunityData(algorithm);
        setCommunityData(demoData);
        
      } catch (err) {
        console.error('Error loading community data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCommunityData();
  }, [algorithm, isAuthenticated]);

  useEffect(() => {
    if (d3Container.current && communityData) {
      // Clear previous visualization
      d3.select(d3Container.current).selectAll('*').remove();
      
      const width = 600;
      const height = 500;
      
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
      
      // Color scale for communities
      const colorScale = d3.scaleOrdinal(d3.schemeCategory10);
      
      // Create force simulation
      const simulation = d3.forceSimulation(communityData.visualizationData.nodes)
        .force('charge', d3.forceManyBody().strength(-120))
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force('link', d3.forceLink(communityData.visualizationData.links)
          .id(d => d.id)
          .distance(d => 100 / (d.value || 1))
        )
        .force('collision', d3.forceCollide().radius(10));
      
      // Draw links
      const link = svg.append('g')
        .attr('class', 'links')
        .selectAll('line')
        .data(communityData.visualizationData.links)
        .enter().append('line')
        .attr('stroke-width', d => Math.sqrt(d.value))
        .attr('stroke', '#999')
        .attr('stroke-opacity', 0.6);
      
      // Draw nodes
      const node = svg.append('g')
        .attr('class', 'nodes')
        .selectAll('circle')
        .data(communityData.visualizationData.nodes)
        .enter().append('circle')
        .attr('r', 6)
        .attr('fill', d => colorScale(d.communityId))
        .call(drag(simulation))
        .on("mouseover", function(event, d) {
          d3.select(this).attr("r", 10);
          tooltip.html(`<div class="p-2">
              <strong>${d.name}</strong><br/>
              <span class="text-gray-600">Community: ${d.communityId}</span>
            </div>`)
            .style("visibility", "visible")
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function() {
          d3.select(this).attr("r", 6);
          tooltip.style("visibility", "hidden");
        })
        .on("click", (event, d) => {
          event.stopPropagation();
          setSelectedCommunity(d.communityId);
        });
      
      // Update positions on each simulation tick
      simulation.on('tick', () => {
        link
          .attr('x1', d => d.source.x)
          .attr('y1', d => d.source.y)
          .attr('x2', d => d.target.x)
          .attr('y2', d => d.target.y);
        
        node
          .attr('cx', d => Math.max(10, Math.min(width - 10, d.x)))
          .attr('cy', d => Math.max(10, Math.min(height - 10, d.y)));
      });
      
      // Drag functionality
      function drag(simulation) {
        function dragstarted(event) {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          event.subject.fx = event.subject.x;
          event.subject.fy = event.subject.y;
        }
        
        function dragged(event) {
          event.subject.fx = event.x;
          event.subject.fy = event.y;
        }
        
        function dragended(event) {
          if (!event.active) simulation.alphaTarget(0);
          event.subject.fx = null;
          event.subject.fy = null;
        }
        
        return d3.drag()
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended);
      }
      
      return () => {
        d3.select("body").selectAll(".tooltip").remove();
      };
    }
  }, [communityData]);

  // Get metrics for selected community
  const getSelectedCommunityMetrics = () => {
    if (!communityData || selectedCommunity === null) return null;
    return communityData.metrics.find(m => m.id === selectedCommunity);
  };
  
  const selectedMetrics = getSelectedCommunityMetrics();

  return (
    <div className="font-sans bg-white border-blue-500 border-2 rounded-lg shadow-md p-5 mb-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">GitHub Community Detection</h2>
      
      <div className="flex justify-between mb-5">
        <div className="flex items-center space-x-2">
          <span className="text-gray-700">Algorithm:</span>
          <div className="flex rounded-md shadow-sm">
            <button 
              className={`px-4 py-2 text-sm font-medium rounded-l-md ${algorithm === 'louvain' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
              onClick={() => setAlgorithm('louvain')}
            >
              Louvain
            </button>
            <button 
              className={`px-4 py-2 text-sm font-medium rounded-r-md ${algorithm === 'girvan_newman' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
              onClick={() => setAlgorithm('girvan_newman')}
            >
              Girvan-Newman
            </button>
          </div>
        </div>
        
        {!isAuthenticated && (
          <div className="italic text-sm text-gray-500">
            Sign in for personalized community analysis
          </div>
        )}
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center h-96">
          <p className="text-gray-500">Loading community data...</p>
        </div>
      ) : error ? (
        <div className="flex justify-center items-center h-96">
          <p className="text-red-500">{error}</p>
        </div>
      ) : (
        <div className="flex flex-col md:flex-row gap-6">
          {/* Visualization */}
          <div className="md:w-2/3 border border-blue-200 rounded-lg p-4 bg-white shadow-sm">
            <svg 
              ref={d3Container}
              style={{ width: '100%', height: '500px', backgroundColor: 'white' }}
            />
            
            <div className="mt-3 text-xs text-center text-gray-600">
              {isAuthenticated ? 
                'Click on a node to view community details' : 
                'Sample community visualization based on typical GitHub networks'}
            </div>
          </div>
          
          {/* Community metrics panel */}
          <div className="md:w-1/3 bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h3 className="text-xl font-semibold mb-4 border-b pb-2">Community Metrics</h3>
            
            {selectedCommunity !== null && selectedMetrics ? (
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-blue-700">{selectedMetrics.name}</h4>
                  <p className="text-sm text-gray-600">Community ID: {selectedCommunity}</p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Size:</span>
                    <span className="font-medium">{selectedMetrics.size} members</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Density:</span>
                    <span className="font-medium">{selectedMetrics.density}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cohesion:</span>
                    <span className="font-medium">{selectedMetrics.cohesion}</span>
                  </div>
                </div>
                
                <div>
                  <h5 className="font-medium mb-1">Dominant Languages:</h5>
                  <div className="space-y-1">
                    {selectedMetrics.dominantLanguages.map(lang => (
                      <div key={lang.name} className="flex items-center">
                        <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2">
                          <div 
                            className="bg-blue-600 h-2.5 rounded-full" 
                            style={{ width: `${lang.percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-xs min-w-[100px]">
                          {lang.name} ({lang.percentage}%)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>Select a community node to view metrics</p>
              </div>
            )}
            
            <div className="mt-6 pt-4 border-t">
              <h4 className="font-medium mb-2">Overall Network Stats:</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="bg-blue-50 p-2 rounded">
                  <p className="text-blue-800 font-medium">{communityData.stats.communities}</p>
                  <p className="text-xs text-gray-600">Communities</p>
                </div>
                <div className="bg-blue-50 p-2 rounded">
                  <p className="text-blue-800 font-medium">{communityData.stats.modularity}</p>
                  <p className="text-xs text-gray-600">Modularity</p>
                </div>
                <div className="bg-blue-50 p-2 rounded">
                  <p className="text-blue-800 font-medium">{communityData.stats.coverage}</p>
                  <p className="text-xs text-gray-600">Coverage</p>
                </div>
                <div className="bg-blue-50 p-2 rounded">
                  <p className="text-blue-800 font-medium">{communityData.visualizationData.nodes.length}</p>
                  <p className="text-xs text-gray-600">Users</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommunityMap; 