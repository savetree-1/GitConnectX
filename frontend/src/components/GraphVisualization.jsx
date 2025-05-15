import { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';

const GraphVisualization = () => {
  const d3Container = useRef(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [comparisonMode, setComparisonMode] = useState(false);

  const margin = 50;
  const width = 500;
  const height = 500;

  const userData1 = {
    nodes: [
      { id: 'User', group: 1, details: { name: 'Primary User', repos: 12, followers: 45, following: 32 } },
      { id: 'StarredRepo1', group: 2, details: { name: 'React', stars: 178000, forks: 36400, language: 'JavaScript' } },
      { id: 'StarredRepo2', group: 2, details: { name: 'TensorFlow', stars: 156000, forks: 86900, language: 'Python' } },
      { id: 'Follower1', group: 3, details: { name: 'Sarah Chen', repos: 8, followers: 23, following: 17 } },
      { id: 'Follower2', group: 3, details: { name: 'Mike Johnson', repos: 15, followers: 48, following: 12 } },
      { id: 'Repository1', group: 4, details: { name: 'Personal Website', stars: 5, forks: 2, language: 'HTML/CSS' } },
      { id: 'Repository2', group: 4, details: { name: 'Data Visualizer', stars: 127, forks: 34, language: 'JavaScript' } },
      { id: 'Following1', group: 5, details: { name: 'Emma Wilson', repos: 6, followers: 12, following: 8 } },
      { id: 'Following2', group: 5, details: { name: 'Alex Brown', repos: 20, followers: 150, following: 45 } },
    ],
    links: [
      { source: 'User', target: 'StarredRepo1' },
      { source: 'User', target: 'StarredRepo2' },
      { source: 'User', target: 'Follower1' },
      { source: 'User', target: 'Follower2' },
      { source: 'User', target: 'Repository1' },
      { source: 'User', target: 'Repository2' },
      { source: 'User', target: 'Following1' },
      { source: 'User', target: 'Following2' },
    ]
  };

  const userData2 = {
    nodes: [
      { id: 'comp_User', group: 1, details: { name: 'Comparison User', repos: 8, followers: 32, following: 21 } },
      { id: 'comp_StarredRepo1', group: 2, details: { name: 'Vue.js', stars: 197000, forks: 31700, language: 'JavaScript' } },
      { id: 'comp_StarredRepo2', group: 2, details: { name: 'Django', stars: 62000, forks: 26400, language: 'Python' } },
      { id: 'comp_Follower1', group: 3, details: { name: 'James Liu', repos: 11, followers: 19, following: 23 } },
      { id: 'comp_Repository1', group: 4, details: { name: 'Recipe App', stars: 12, forks: 3, language: 'JavaScript' } },
      { id: 'comp_Following1', group: 5, details: { name: 'Sophia Garcia', repos: 7, followers: 31, following: 14 } },
      { id: 'comp_Following2', group: 5, details: { name: 'David Kim', repos: 9, followers: 28, following: 15 } },
    ],
    links: [
      { source: 'comp_User', target: 'comp_StarredRepo1' },
      { source: 'comp_User', target: 'comp_StarredRepo2' },
      { source: 'comp_User', target: 'comp_Follower1' },
      { source: 'comp_User', target: 'comp_Repository1' },
      { source: 'comp_User', target: 'comp_Following1' },
      { source: 'comp_User', target: 'comp_Following2' },
    ]
  };

  useEffect(() => {
    if (d3Container.current) {
      d3.select(d3Container.current).selectAll('*').remove();

      const containerWidth = comparisonMode ? 2 * (width + margin * 2) : width + margin * 2;

      const svg = d3.select(d3Container.current)
.attr('viewBox', `0 0 ${containerWidth} ${height + margin * 2 + 50}`)
        .attr('preserveAspectRatio', 'xMidYMid meet')
        .style('background', 'transparent');

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

        graphGroup.append('rect')
          .attr('x', margin / 2)
          .attr('y', margin / 2)
          .attr('width', width + margin)
          .attr('height', height + margin)
          .attr('rx', 10)
          .attr('ry', 10)
          .attr('fill', isSecondGraph ? 'rgba(74, 222, 128, 0.05)' : 'rgba(59, 130, 246, 0.05)')
          .attr('stroke', isSecondGraph ? 'rgba(74, 222, 128, 0.3)' : 'rgba(59, 130, 246, 0.3)')
          .attr('stroke-width', 1);

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
          .attr('r', 10)
          .attr('fill', d => isSecondGraph ?
            d3.interpolateGreens(0.3 + (d.group * 0.1)) :
            d3.schemeCategory10[d.group % 10])
          .call(drag(simulation))
          .on("mouseover", function (event, d) {
            d3.select(this).attr("r", 15);
            tooltip.html(`<div>
              <strong>${d.id}</strong><br/>
              ${d.details ? `Type: ${getNodeType(d.group)}` : ''}
            </div>`)
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
          .text(d => d.id)
          .attr('font-size', 12)
          .attr('dy', '-1.5em')
          .attr('text-anchor', 'middle');

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

      createGraph(userData1, 0, false);
      if (comparisonMode) {
        createGraph(userData2, width + margin * 2, true);
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
  }, [comparisonMode]);

  const getNodeType = (group) => {
    switch (group) {
      case 1: return 'User';
      case 2: return 'Starred Repository';
      case 3: return 'Follower';
      case 4: return 'Repository';
      case 5: return 'Following';
      default: return 'Unknown';
    }
  };

  const NodeDetailPanel = ({ node }) => {
    if (!node) return null;
    const details = node.details || {};
    let detailContent;
    switch (node.group) {
      case 1:
      case 3:
      case 5:
        detailContent = (
          <>
            <h3 className="text-lg font-bold">{details.name}</h3>
            <div className="mt-2">
              <p>Repositories: {details.repos}</p>
              <p>Followers: {details.followers}</p>
              <p>Following: {details.following}</p>
            </div>
          </>
        );
        break;
      case 2:
      case 4:
        detailContent = (
          <>
            <h3 className="text-lg font-bold">{details.name}</h3>
            <div className="mt-2">
              <p>Stars: {details.stars}</p>
              <p>Forks: {details.forks}</p>
              <p>Language: {details.language}</p>
            </div>
          </>
        );
        break;
      default:
        detailContent = <p>No details available</p>;
    }

    return (
      <div className="bg-white p-4 rounded shadow-md border-l-4 border-blue-500">
        <div className="flex items-center mb-3">
          <div className="w-4 h-4 mr-2 rounded-full" style={{ backgroundColor: d3.schemeCategory10[node.group % 10] }}></div>
          <span className="text-gray-600">{getNodeType(node.group)}</span>
        </div>
        {detailContent}
      </div>
    );
  };

  return (
    <div className="font-sans">
      <h1 className="text-3xl font-bold mb-4">GitHub Graph Overview</h1>
      <div className="flex items-center mb-4">
        <span className="mr-2 text-2xl">Comparison Mode:</span>
        <label className="relative inline-flex items-center cursor-pointer">
          <input type="checkbox" checked={comparisonMode} onChange={() => setComparisonMode(!comparisonMode)} className="sr-only peer" />
          <div className="w-11 h-6 bg-grey-100 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
        </label>
      </div>
      <div className={`flex mb-2 ${comparisonMode ? 'justify-around' : 'justify-center'}`}>
        <h2 className="text-2xl font-semibold text-blue-700">My GitHub Network</h2>
        {comparisonMode && <h2 className="text-2xl font-semibold text-green-700">Friend's GitHub Network</h2>}
      </div>
      <div className="flex justify-center border-blue-100 border-2 rounded-xl p-4">
        <div className="overflow-x-auto">
          <svg ref={d3Container} style={{
              width: comparisonMode ? `${2 * (width + margin * 2)}px` : `${width + margin * 2}px`,
              height: '600px',
              backgroundColor: 'transparent'
            }}></svg>
          </div>

        {selectedNode && (
          <div className="w-64 ml-4">
            <NodeDetailPanel node={selectedNode} />
          </div>
        )}
      </div>
    </div>
  );
};

export default GraphVisualization;
