import { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import DemoDataGenerator from './DemoDataGenerator';

const CommunityDetectionMap = ({ username }) => {
  const d3Container = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [communityData, setCommunityData] = useState(null);
  const [algorithm, setAlgorithm] = useState('louvain'); // 'louvain' or 'girvan-newman'
  const [selectedCommunity, setSelectedCommunity] = useState(null);
  const [timelineData, setTimelineData] = useState(null);

  const margin = 50;
  const width = 1000;   // Smaller width
  const height = 800;  // Smaller height

  // Fetch community data from API
  useEffect(() => {
    const fetchCommunityData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Always use demo data for now
        console.log('Using demo community data');
        
        // Generate demo data using DemoDataGenerator
        const demoData = DemoDataGenerator.generateCommunityData(algorithm);
        console.log("Using demo community data:", demoData);
        
        // Format demo data for the visualization
        const formattedData = {
          nodes: demoData.visualizationData.nodes.map(node => ({
            id: node.id,
            community: node.communityId,
            size: 8 + (Math.random() * 5)  // Random size between 8-13
          })),
          links: demoData.visualizationData.links.map(link => ({
            source: link.source,
            target: link.target,
            weight: link.value
          })),
          communities: demoData.metrics.map(metric => ({
            id: metric.id,
            name: metric.name,
            color: ['#3182CE', '#38A169', '#E53E3E', '#D69E2E', '#805AD5'][metric.id % 5]
          })),
          userCommunityAffinity: demoData.metrics.map(metric => ({
            communityId: metric.id,
            percentage: Math.floor(100 / demoData.metrics.length * (1 + (Math.random() * 0.5)))
          }))
        };
        
        setCommunityData(formattedData);
        
        // Generate sample timeline data
        const timelineDates = [];
        const now = new Date();
        for (let i = 5; i > 0; i--) {
          const month = now.getMonth() - i + 1;
          const year = now.getFullYear() + (month <= 0 ? -1 : 0);
          const adjustedMonth = month <= 0 ? month + 12 : month;
          timelineDates.push(`${year}-${String(adjustedMonth).padStart(2, '0')}`);
        }
        
        const sampleTimeline = {
          timeline: timelineDates.map(date => {
            const data = { date };
            formattedData.communities.forEach(community => {
              data[`community${community.id}`] = 20 + Math.floor(Math.random() * 60);
            });
            return data;
          })
        };
        
        setTimelineData(sampleTimeline);
        
      } catch (err) {
        console.error('Error with community data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCommunityData();
  }, [username, algorithm]);

  // Render community visualization when data is available
  useEffect(() => {
    if (d3Container.current && communityData) {
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

      // Create force simulation
      const simulation = d3.forceSimulation(communityData.nodes)
        .force('link', d3.forceLink(communityData.links).id(d => d.id).distance(105))
        .force('charge', d3.forceManyBody().strength(-200))
        .force('center', d3.forceCenter(width / 2 + margin, height / 2 + margin))
        .force('collision', d3.forceCollide().radius(d => d.size * 1.2));

      // Draw links
      const link = svg.append('g')
        .attr('stroke', '#999')
        .attr('stroke-opacity', 0.6)
        .selectAll('line')
        .data(communityData.links)
        .enter().append('line')
        .attr('stroke-width', d => Math.sqrt(d.weight) * 1.5);

      // Draw nodes
      const node = svg.append('g')
        .attr('stroke', '#fff')
        .attr('stroke-width', 1.5)
        .selectAll('circle')
        .data(communityData.nodes)
        .enter().append('circle')
        .attr('r', d => d.size)
        .attr('fill', d => {
          const community = communityData.communities.find(c => c.id === d.community);
          return community ? community.color : '#999';
        })
        .call(drag(simulation))
        .on("mouseover", function (event, d) {
          d3.select(this).attr("r", d.size * 1.2);
          
          // Find community details
          const community = communityData.communities.find(c => c.id === d.community);
          
          let tooltipContent = `<div class="p-2">
            <strong>${d.id}</strong><br/>
            <span class="text-gray-600">Community: ${community?.name || 'Unknown'}</span>
          </div>`;
          
          tooltip.html(tooltipContent)
            .style("visibility", "visible")
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function (d) {
          d3.select(this).attr("r", d => d.size);
          tooltip.style("visibility", "hidden");
        })
        .on("click", function (event, d) {
          event.stopPropagation();
          setSelectedCommunity(d.community);
        });

      // Add text labels
      const text = svg.append('g')
        .selectAll('text')
        .data(communityData.nodes)
        .enter().append('text')
        .text(d => d.id)
        .attr('font-size', 14)
        .attr('dy', '-1.2em')
        .attr('text-anchor', 'middle')
        .attr('fill', '#333');

      // Add community legend
      const legend = svg.append('g')
        .attr('transform', `translate(${margin}, ${margin})`);
      
      communityData.communities.forEach((community, i) => {
        const legendItem = legend.append('g')
          .attr('transform', `translate(0, ${i * 25})`);
        
        legendItem.append('circle')
          .attr('r', 6)
          .attr('fill', community.color);
        
        legendItem.append('text')
          .attr('x', 9)
          .attr('y', 3)
          .text(community.name)
          .attr('font-size', 18);
      });

      // Update positions on simulation tick
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

      // If user is logged in, draw the community affinity gauge
      if (communityData.userCommunityAffinity) {
        drawCommunityAffinity(svg);
      }

      // Draw timeline if available and user is logged in
      if (timelineData) {
        drawTimeline(svg);
      }

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
  }, [communityData, width, height, margin]);

  // Draw community affinity gauge/chart
  const drawCommunityAffinity = (svg) => {
    const gaugeWidth = 250;
    const gaugeHeight = 200;
    const gaugeX = width - gaugeWidth - 20;
    const gaugeY = height - gaugeHeight - 50;

    const gaugeGroup = svg.append('g')
      .attr('transform', `translate(${gaugeX + margin}, ${gaugeY + margin})`);
    
    gaugeGroup.append('rect')
      .attr('width', gaugeWidth)
      .attr('height', gaugeHeight)
      .attr('fill', 'white')
      .attr('stroke', '#ddd')
      .attr('rx', 15);
    
    gaugeGroup.append('text')
      .attr('x', gaugeWidth / 2)
      .attr('y', 20)
      .attr('text-anchor', 'middle')
      .attr('font-weight', 'bold')
      .text('Community Affinity');
    
    // Draw bar chart for community affinity
    const barHeight = 20;
    const barSpacing = 30;
    const barWidth = gaugeWidth - 40;
    
    communityData.userCommunityAffinity.forEach((affinity, i) => {
      const community = communityData.communities.find(c => c.id === affinity.communityId);
      
      // Bar background
      gaugeGroup.append('rect')
        .attr('x', 20)
        .attr('y', 40 + i * barSpacing)
        .attr('width', barWidth)
        .attr('height', barHeight)
        .attr('fill', '#f0f0f0')
        .attr('rx', 3);
      
      // Bar value
      gaugeGroup.append('rect')
        .attr('x', 20)
        .attr('y', 40 + i * barSpacing)
        .attr('width', (affinity.percentage / 100) * barWidth)
        .attr('height', barHeight)
        .attr('fill', community?.color || '#999')
        .attr('rx', 3);
      
      // Percentage text
      gaugeGroup.append('text')
        .attr('x', barWidth - 5)
        .attr('y', 40 + i * barSpacing + barHeight / 2 + 5)
        .attr('text-anchor', 'end')
        .attr('fill', 'white')
        .attr('font-weight', 'bold')
        .text(`${affinity.percentage}%`);
      
      // Community name
      gaugeGroup.append('text')
        .attr('x', 25)
        .attr('y', 40 + i * barSpacing + barHeight / 2 + 5)
        .attr('fill', 'white')
        .attr('font-weight', 'bold')
        .text(community?.name || 'Unknown');
    });
  };

  // Draw timeline chart
  const drawTimeline = (svg) => {
    if (!timelineData || !timelineData.timeline || timelineData.timeline.length === 0) return;
    
    const chartWidth = width - 100;
    const chartHeight = 100;
    const chartX = margin + 50;
    const chartY = height + margin;

    const chartGroup = svg.append('g')
      .attr('transform', `translate(${chartX}, ${chartY})`);
    
    chartGroup.append('text')
      .attr('x', chartWidth / 2)
      .attr('y', -20)
      .attr('text-anchor', 'middle')
      .attr('font-weight', 'bold')
      .attr('font-size', 18)
      .text('Community Membership Timeline');
    
    // Set up scales
    const xScale = d3.scaleBand()
      .domain(timelineData.timeline.map(d => d.date))
      .range([0, chartWidth])
      .padding(0.1);
    
    const yScale = d3.scaleLinear()
      .domain([0, 100])
      .range([chartHeight, 0]);
    
    // Draw axes
    chartGroup.append('g')
      .attr('transform', `translate(0, ${chartHeight})`)
      .call(d3.axisBottom(xScale));
    
    chartGroup.append('g')
      .call(d3.axisLeft(yScale).ticks(5).tickFormat(d => `${d}%`));

    // Create line generator
    const line = d3.line()
      .x(d => xScale(d.date) + xScale.bandwidth() / 2)
      .y(d => yScale(d.value))
      .curve(d3.curveMonotoneX);

    // Draw lines for each community
    communityData.communities.forEach(community => {
      const communityData = timelineData.timeline.map(d => ({
        date: d.date,
        value: d[`community${community.id}`] || 0
      }));
      
      chartGroup.append('path')
        .datum(communityData)
        .attr('fill', 'none')
        .attr('stroke', community.color)
        .attr('stroke-width', 2)
        .attr('d', line);
      
      // Add dots for each data point
      chartGroup.selectAll(`.dot-community-${community.id}`)
        .data(communityData)
        .enter().append('circle')
        .attr('class', `dot-community-${community.id}`)
        .attr('cx', d => xScale(d.date) + xScale.bandwidth() / 2)
        .attr('cy', d => yScale(d.value))
        .attr('r', 4)
        .attr('fill', community.color);
    });
  };

  return (
    <div className="font-sans bg-white border-blue-500 border-2 rounded-lg shadow-md p-5 mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-800">Community Detection Map</h2>
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
          Demo Data
        </div>
      </div>
      
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          <span className="mr-2 text-lg">Algorithm:</span>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setAlgorithm('louvain')}
              className={`px-3 py-1 rounded ${algorithm === 'louvain' ? 
                'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              Louvain
            </button>
            <button
              onClick={() => setAlgorithm('girvan-newman')}
              className={`px-3 py-1 rounded ${algorithm === 'girvan-newman' ? 
                'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              Girvan-Newman
            </button>
          </div>
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center h-96">
          <p className="text-gray-500">Loading community data...</p>
        </div>
      ) : error ? (
        <div className="flex justify-center items-center flex-col h-96">
          <p className="text-red-500 text-xl mb-4">{error}</p>
          <p className="text-gray-600">Please ensure the API server is running.</p>
        </div>
      ) : (
        <div className="bg-white flex justify-center border-blue-200 border-2 rounded-xl p-4">
          <div className="overflow-hidden relative">
            <svg ref={d3Container} 
              style={{
                width: `${width + margin * 2}px`,
                height: `${height + margin * 2 + 200}px`,
                backgroundColor: 'transparent'
              }}>
            </svg>
          </div>
        </div>
      )}
      
      {/* Educational tooltip for non-logged in users */}
      <div className="mt-4 bg-gray-50 p-3 rounded-md text-sm">
        <h3 className="font-bold text-gray-700 mb-1">Understanding Community Clusters</h3>
        <p className="text-gray-600">
          Communities in GitHub networks represent groups of users who collaborate more frequently with each other.
          These clusters can reveal specialization areas, common interests, or collaborative project groups.
        </p>
      </div>
    </div>
  );
};

export default CommunityDetectionMap; 