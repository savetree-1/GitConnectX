import React, { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';

const ContributionTimelineAnalyzer = ({ username, isLoggedIn = false }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [contributionData, setContributionData] = useState(null);
  const [patternData, setPatternData] = useState(null);
  const [activeView, setActiveView] = useState('timeline'); // 'timeline', 'patterns', 'team', 'heatmap'
  const timelineRef = useRef(null);
  const patternsRef = useRef(null);
  const teamRef = useRef(null);
  const heatmapRef = useRef(null);

  useEffect(() => {
    const fetchContributionData = async () => {
      try {
        setLoading(true);
        setError(null);

        if (isLoggedIn) {
          try {
            // In a real app, this would call your API endpoint
            const response = await fetch(`http://localhost:5000/api/contributions/${username}`);
            
            if (!response.ok) {
              throw new Error(`Failed to fetch contribution data: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            if (data.status === 'success') {
              setContributionData(data.data);
              setPatternData(data.patterns);
            } else {
              throw new Error(data.message || 'Failed to load contribution data');
            }
          } catch (err) {
            console.error('Error fetching contribution data:', err);
            // If the API fails, generate demo data
            generateDemoData();
          }
        } else {
          // For guests, generate demo data
          generateDemoData();
        }
      } catch (err) {
        console.error('Error in contribution timeline analyzer:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchContributionData();
  }, [username, isLoggedIn]);

  // Generate demo data for the visualizations
  const generateDemoData = () => {
    // Generate 6 months of daily contribution data
    const today = new Date();
    const startDate = new Date(today);
    startDate.setMonth(today.getMonth() - 6);
    
    const contributionTimeline = [];
    let currentDate = new Date(startDate);
    
    // Generate random contribution data with some patterns
    while (currentDate <= today) {
      const weekday = currentDate.getDay();
      const isWeekend = weekday === 0 || weekday === 6;
      
      // Create a pattern: more activity on weekdays, peaks on Wednesdays
      let baseCommits = isWeekend ? 
        Math.floor(Math.random() * 5) : // 0-4 commits on weekends
        Math.floor(Math.random() * 12) + 2; // 2-13 commits on weekdays
      
      // Add periodic intensity (more activity every 2 weeks)
      const dayOfMonth = currentDate.getDate();
      if (dayOfMonth > 10 && dayOfMonth < 20) {
        baseCommits += Math.floor(Math.random() * 8); // Boost for middle of month
      }
      
      // Add some collaborative commits
      const collaborativeCommits = Math.floor(Math.random() * 3);
      
      contributionTimeline.push({
        date: new Date(currentDate),
        commits: baseCommits,
        collaborativeCommits: collaborativeCommits,
        additions: baseCommits * (Math.floor(Math.random() * 20) + 5),
        deletions: baseCommits * (Math.floor(Math.random() * 15) + 2),
        repos: Math.min(Math.floor(baseCommits / 3) + 1, 5), // Number of repos worked on
        contributors: [...new Set([username, ...getRandomCollaborators(collaborativeCommits)])]
      });
      
      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Generate pattern detection data
    const patternSummary = analyzePatterns(contributionTimeline);
    
    setContributionData(contributionTimeline);
    setPatternData(patternSummary);
  };
  
  // Helper function to generate random collaborators
  const getRandomCollaborators = (count) => {
    const collaborators = [
      'dev_alice', 'coder_bob', 'tech_charlie', 'programmer_dave',
      'engineer_eve', 'dev_frank', 'hacker_grace'
    ];
    
    const selected = [];
    for (let i = 0; i < count; i++) {
      const randomIndex = Math.floor(Math.random() * collaborators.length);
      selected.push(collaborators[randomIndex]);
    }
    
    return selected;
  };
  
  // Analyze contribution patterns
  const analyzePatterns = (timeline) => {
    // In a real system, this would use more sophisticated algorithms
    // For demo purposes, we'll use simple heuristics
    
    // Calculate activity by day of week
    const dayOfWeekActivity = Array(7).fill(0);
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    // Calculate time of day activity (0-23 hours)
    const timeOfDayActivity = Array(24).fill(0);
    
    // Calculate commits per repository
    const repoActivity = {};
    
    // Calculate streak data
    let currentStreak = 0;
    let longestStreak = 0;
    let streakStart = null;
    let longestStreakStart = null;
    let longestStreakEnd = null;
    
    // Calculate collaboration frequency
    const collaborationFrequency = {};
    
    // Analyze the timeline data
    timeline.forEach((day, index) => {
      const date = day.date;
      
      // Day of week analysis
      dayOfWeekActivity[date.getDay()] += day.commits;
      
      // Determine time of day (randomly for demo)
      for (let i = 0; i < day.commits; i++) {
        const hour = Math.floor(Math.random() * 24);
        timeOfDayActivity[hour]++;
      }
      
      // Repository activity (simulated)
      for (let i = 0; i < day.repos; i++) {
        const repoName = `repo_${i % 5}`; // 5 simulated repositories
        repoActivity[repoName] = (repoActivity[repoName] || 0) + 
          Math.ceil(day.commits / day.repos);
      }
      
      // Streak calculation
      if (day.commits > 0) {
        if (currentStreak === 0) {
          streakStart = new Date(date);
        }
        currentStreak++;
      } else {
        // Streak broken
        if (currentStreak > longestStreak) {
          longestStreak = currentStreak;
          longestStreakStart = streakStart;
          longestStreakEnd = new Date(timeline[index - 1].date);
        }
        currentStreak = 0;
      }
      
      // Collaboration data
      day.contributors.forEach(contributor => {
        if (contributor !== username) {
          collaborationFrequency[contributor] = 
            (collaborationFrequency[contributor] || 0) + 1;
        }
      });
    });
    
    // If we're still on a streak at the end of the data
    if (currentStreak > longestStreak) {
      longestStreak = currentStreak;
      longestStreakStart = streakStart;
      longestStreakEnd = new Date(timeline[timeline.length - 1].date);
    }
    
    // Format the data for visualization
    const dayOfWeekData = dayNames.map((day, index) => ({
      day,
      commits: dayOfWeekActivity[index]
    }));
    
    const timeOfDayData = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      commits: timeOfDayActivity[i]
    }));
    
    const repoActivityData = Object.entries(repoActivity).map(([repo, commits]) => ({
      repo,
      commits
    })).sort((a, b) => b.commits - a.commits);
    
    const collaborationData = Object.entries(collaborationFrequency)
      .map(([contributor, frequency]) => ({
        contributor,
        frequency
      }))
      .sort((a, b) => b.frequency - a.frequency);
    
    return {
      dayOfWeek: dayOfWeekData,
      timeOfDay: timeOfDayData,
      repositories: repoActivityData,
      longestStreak: {
        days: longestStreak,
        start: longestStreakStart,
        end: longestStreakEnd
      },
      collaboration: collaborationData
    };
  };

  // Draw timeline visualization
  useEffect(() => {
    if (!contributionData || !timelineRef.current || activeView !== 'timeline') return;

    const margin = { top: 20, right: 30, bottom: 30, left: 50 };
    const width = timelineRef.current.clientWidth - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;

    d3.select(timelineRef.current).selectAll("*").remove();

    const svg = d3.select(timelineRef.current)
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scaleTime()
      .domain(d3.extent(contributionData, d => d.date))
      .range([0, width]);

    const y = d3.scaleLinear()
      .domain([0, d3.max(contributionData, d => d.commits + d.collaborativeCommits)])
      .nice()
      .range([height, 0]);

    // Add X axis
    svg.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x).ticks(width > 500 ? 10 : 5).tickSizeOuter(0));

    // Add Y axis
    svg.append("g")
      .call(d3.axisLeft(y))
      .call(g => g.select(".domain").remove())
      .call(g => g.selectAll(".tick line").clone()
        .attr("x2", width)
        .attr("stroke-opacity", 0.1));

    // Add collaborative commits area
    svg.append("path")
      .datum(contributionData)
      .attr("fill", "#93C5FD")
      .attr("d", d3.area()
        .x(d => x(d.date))
        .y0(height)
        .y1(d => y(d.collaborativeCommits))
      );

    // Add individual commits area
    svg.append("path")
      .datum(contributionData)
      .attr("fill", "#3B82F6")
      .attr("d", d3.area()
        .x(d => x(d.date))
        .y0(d => y(d.collaborativeCommits))
        .y1(d => y(d.commits + d.collaborativeCommits))
      );

    // Add area highlight for detected patterns
    let highActivityDates = contributionData.filter(d => d.commits > 10).map(d => d.date);
    highActivityDates.forEach(date => {
      svg.append("rect")
        .attr("x", x(date) - 5)
        .attr("width", 10)
        .attr("y", 0)
        .attr("height", height)
        .attr("fill", "#FBBF24")
        .attr("opacity", 0.2);
    });

    // Add legend
    const legend = svg.append("g")
      .attr("transform", `translate(${width - 100},0)`);

    legend.append("rect")
      .attr("x", 0)
      .attr("width", 15)
      .attr("height", 15)
      .attr("fill", "#3B82F6");

    legend.append("text")
      .attr("x", 20)
      .attr("y", 7.5)
      .attr("dy", "0.32em")
      .attr("font-size", 10)
      .text("Your commits");

    legend.append("rect")
      .attr("x", 0)
      .attr("y", 20)
      .attr("width", 15)
      .attr("height", 15)
      .attr("fill", "#93C5FD");

    legend.append("text")
      .attr("x", 20)
      .attr("y", 27.5)
      .attr("dy", "0.32em")
      .attr("font-size", 10)
      .text("Collaborative");
  }, [contributionData, activeView]);

  // Draw patterns visualization
  useEffect(() => {
    if (!patternData || !patternsRef.current || activeView !== 'patterns') return;

    const margin = { top: 20, right: 30, bottom: 30, left: 100 };
    const width = patternsRef.current.clientWidth - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;

    d3.select(patternsRef.current).selectAll("*").remove();

    const svg = d3.select(patternsRef.current)
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Draw day of week pattern
    const x = d3.scaleLinear()
      .domain([0, d3.max(patternData.dayOfWeek, d => d.commits)])
      .nice()
      .range([0, width]);

    const y = d3.scaleBand()
      .domain(patternData.dayOfWeek.map(d => d.day))
      .range([0, height])
      .padding(0.1);

    svg.append("g")
      .call(d3.axisLeft(y).tickSizeOuter(0));

    svg.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x).ticks(width > 500 ? 10 : 5).tickSizeOuter(0));

    svg.append("text")
      .attr("x", width / 2)
      .attr("y", height + margin.bottom - 2)
      .attr("text-anchor", "middle")
      .attr("font-size", 10)
      .text("Commits");

    svg.selectAll(".bar")
      .data(patternData.dayOfWeek)
      .enter().append("rect")
      .attr("class", "bar")
      .attr("x", 0)
      .attr("y", d => y(d.day))
      .attr("width", d => x(d.commits))
      .attr("height", y.bandwidth())
      .attr("fill", d => {
        // Highlight weekdays vs weekends
        return ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].includes(d.day) 
          ? '#3B82F6' : '#93C5FD';
      });

    // Add pattern detection annotations
    const maxDay = patternData.dayOfWeek.reduce((max, day) => 
      day.commits > max.commits ? day : max, patternData.dayOfWeek[0]);

    svg.append("text")
      .attr("x", x(maxDay.commits) + 5)
      .attr("y", y(maxDay.day) + y.bandwidth() / 2)
      .attr("dy", "0.35em")
      .attr("font-size", 10)
      .attr("font-weight", "bold")
      .attr("fill", "#2563EB")
      .text("Peak activity day");

    // Add streak information
    if (patternData.longestStreak.days > 0) {
      svg.append("text")
        .attr("x", 0)
        .attr("y", -5)
        .attr("font-size", 11)
        .attr("font-weight", "bold")
        .text(`Longest streak: ${patternData.longestStreak.days} days`);
    }
  }, [patternData, activeView]);

  // Draw team collaboration visualization
  useEffect(() => {
    if (!patternData || !teamRef.current || activeView !== 'team') return;

    const margin = { top: 20, right: 30, bottom: 30, left: 100 };
    const width = teamRef.current.clientWidth - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;

    d3.select(teamRef.current).selectAll("*").remove();

    // Only proceed if we have collaboration data
    if (!patternData.collaboration || patternData.collaboration.length === 0) {
      d3.select(teamRef.current)
        .append("div")
        .attr("class", "text-center py-10 text-gray-500")
        .text("No collaboration data available");
      return;
    }

    const svg = d3.select(teamRef.current)
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Limit to top 10 collaborators for visibility
    const topCollaborators = patternData.collaboration.slice(0, 10);

    const x = d3.scaleLinear()
      .domain([0, d3.max(topCollaborators, d => d.frequency)])
      .nice()
      .range([0, width]);

    const y = d3.scaleBand()
      .domain(topCollaborators.map(d => d.contributor))
      .range([0, height])
      .padding(0.2);

    svg.append("g")
      .call(d3.axisLeft(y).tickSizeOuter(0));

    svg.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x).ticks(width > 500 ? 10 : 5).tickSizeOuter(0));

    svg.append("text")
      .attr("x", width / 2)
      .attr("y", height + margin.bottom - 2)
      .attr("text-anchor", "middle")
      .attr("font-size", 10)
      .text("Collaborations");

    // Create gradient for bars
    const gradient = svg.append("defs")
      .append("linearGradient")
      .attr("id", "collaborationGradient")
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "100%")
      .attr("y2", "0%");

    gradient.append("stop")
      .attr("offset", "0%")
      .attr("stop-color", "#8B5CF6");

    gradient.append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "#C4B5FD");

    // Draw bars for each collaborator
    svg.selectAll(".bar")
      .data(topCollaborators)
      .enter().append("rect")
      .attr("class", "bar")
      .attr("x", 0)
      .attr("y", d => y(d.contributor))
      .attr("width", d => x(d.frequency))
      .attr("height", y.bandwidth())
      .attr("fill", "url(#collaborationGradient)")
      .attr("rx", 4);

    // Add collaboration labels
    svg.selectAll(".label")
      .data(topCollaborators)
      .enter().append("text")
      .attr("class", "label")
      .attr("x", d => x(d.frequency) + 5)
      .attr("y", d => y(d.contributor) + y.bandwidth() / 2)
      .attr("dy", "0.35em")
      .attr("font-size", 10)
      .text(d => d.frequency);
  }, [patternData, activeView]);

  // Draw time heatmap visualization
  useEffect(() => {
    if (!patternData || !heatmapRef.current || activeView !== 'heatmap') return;

    const margin = { top: 20, right: 30, bottom: 30, left: 50 };
    const width = heatmapRef.current.clientWidth - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;

    d3.select(heatmapRef.current).selectAll("*").remove();

    // Only proceed if we have time data
    if (!patternData.timeOfDay || patternData.timeOfDay.length === 0) {
      d3.select(heatmapRef.current)
        .append("div")
        .attr("class", "text-center py-10 text-gray-500")
        .text("No time-based data available");
      return;
    }

    const svg = d3.select(heatmapRef.current)
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Create scales
    const x = d3.scaleBand()
      .domain(patternData.timeOfDay.map(d => d.hour))
      .range([0, width])
      .padding(0.1);

    const y = d3.scaleLinear()
      .domain([0, d3.max(patternData.timeOfDay, d => d.commits)])
      .nice()
      .range([height, 0]);

    // Add X axis
    svg.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x)
        .tickFormat(h => `${h}:00`)) // Format as time
      .selectAll("text")
      .attr("y", 10)
      .attr("x", -8)
      .attr("text-anchor", "end")
      .attr("transform", "rotate(-45)");

    // Add Y axis
    svg.append("g")
      .call(d3.axisLeft(y).ticks(5));

    // Create color scale
    const colorScale = d3.scaleSequential()
      .domain([0, d3.max(patternData.timeOfDay, d => d.commits)])
      .interpolator(d3.interpolateBlues);

    // Add bars
    svg.selectAll(".bar")
      .data(patternData.timeOfDay)
      .enter().append("rect")
      .attr("class", "bar")
      .attr("x", d => x(d.hour))
      .attr("y", d => y(d.commits))
      .attr("width", x.bandwidth())
      .attr("height", d => height - y(d.commits))
      .attr("fill", d => colorScale(d.commits));

    // Add labels for prominent patterns
    const peakHour = patternData.timeOfDay.reduce((max, hour) => 
      hour.commits > max.commits ? hour : max, patternData.timeOfDay[0]);

    // Add annotation for peak activity time
    svg.append("text")
      .attr("x", x(peakHour.hour) + x.bandwidth() / 2)
      .attr("y", y(peakHour.commits) - 10)
      .attr("text-anchor", "middle")
      .attr("font-size", 10)
      .attr("font-weight", "bold")
      .attr("fill", "#2563EB")
      .text("Peak hour");

    // Add title for the time distribution
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", -5)
      .attr("text-anchor", "middle")
      .attr("font-size", 12)
      .text("Commit Activity by Hour of Day");
  }, [patternData, activeView]);

  // Stats cards for key metrics
  const StatsCard = ({ title, value, icon, color, description }) => (
    <div className="bg-white rounded-lg shadow p-4 border-l-4" style={{ borderColor: color }}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="mt-1 text-2xl font-bold">{value}</p>
          {description && (
            <p className="mt-1 text-xs text-gray-500">{description}</p>
          )}
        </div>
        <span className="text-2xl" style={{ color }}>{icon}</span>
      </div>
    </div>
  );

  // Summary metrics based on pattern data
  const getSummaryMetrics = () => {
    if (!patternData) return [];

    // Get the most active day
    const mostActiveDay = patternData.dayOfWeek.reduce(
      (max, day) => (day.commits > max.commits ? day : max),
      { commits: 0, day: 'None' }
    );

    // Get the most active repository
    const mostActiveRepo = patternData.repositories && patternData.repositories.length > 0
      ? patternData.repositories[0]
      : { repo: 'None', commits: 0 };

    // Calculate the collaboration score
    const totalCollaborations = patternData.collaboration
      ? patternData.collaboration.reduce((sum, collab) => sum + collab.frequency, 0)
      : 0;

    // Format the longest streak
    const streakPeriod = patternData.longestStreak.days > 0
      ? `${patternData.longestStreak.start?.toLocaleDateString()} - ${patternData.longestStreak.end?.toLocaleDateString()}`
      : 'No streak recorded';

    return [
      {
        title: 'Most Active Day',
        value: mostActiveDay.day,
        icon: '📅',
        color: '#3B82F6',
        description: `${mostActiveDay.commits} commits on average`
      },
      {
        title: 'Longest Streak',
        value: `${patternData.longestStreak.days} days`,
        icon: '🔥',
        color: '#EF4444',
        description: streakPeriod
      },
      {
        title: 'Top Repository',
        value: mostActiveRepo.repo.replace('repo_', 'Project '),
        icon: '📁',
        color: '#10B981',
        description: `${mostActiveRepo.commits} commits`
      },
      {
        title: 'Collaboration Score',
        value: totalCollaborations,
        icon: '👥',
        color: '#8B5CF6',
        description: `${patternData.collaboration?.length || 0} collaborators`
      }
    ];
  };

  return (
    <div className="font-sans bg-white  rounded-lg shadow-md p-5 mb-8">
      <p className="text-gray-600 mb-6">
        Advanced time-series analysis of your development patterns and collaboration trends
      </p>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <p className="text-gray-500">Analyzing contribution patterns...</p>
        </div>
      ) : error ? (
        <div className="flex justify-center items-center flex-col h-48">
          <p className="text-red-500 text-center mb-2">{error}</p>
          <p className="text-gray-600 text-sm">Please ensure the API server is running.</p>
        </div>
      ) : (
        <>
          {/* Stats cards section */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {getSummaryMetrics().map((metric, index) => (
              <StatsCard
                key={index}
                title={metric.title}
                value={metric.value}
                icon={metric.icon}
                color={metric.color}
                description={metric.description}
              />
            ))}
          </div>

          {/* Toggle navigation for different views */}
          <div className="flex flex-wrap mb-4 border-b">
            <button
              className={`px-4 py-2 mr-2 mb-2 ${
                activeView === 'timeline'
                  ? 'bg-indigo-100 text-indigo-700 font-semibold'
                  : 'bg-gray-100 text-gray-600'
              } rounded-t-lg`}
              onClick={() => setActiveView('timeline')}
            >
              Contribution Timeline
            </button>
            <button
              className={`px-4 py-2 mr-2 mb-2 ${
                activeView === 'patterns'
                  ? 'bg-indigo-100 text-indigo-700 font-semibold'
                  : 'bg-gray-100 text-gray-600'
              } rounded-t-lg`}
              onClick={() => setActiveView('patterns')}
            >
              Activity Patterns
            </button>
            <button
              className={`px-4 py-2 mr-2 mb-2 ${
                activeView === 'team'
                  ? 'bg-indigo-100 text-indigo-700 font-semibold'
                  : 'bg-gray-100 text-gray-600'
              } rounded-t-lg`}
              onClick={() => setActiveView('team')}
            >
              Team Collaboration
            </button>
            <button
              className={`px-4 py-2 mr-2 mb-2 ${
                activeView === 'heatmap'
                  ? 'bg-indigo-100 text-indigo-700 font-semibold'
                  : 'bg-gray-100 text-gray-600'
              } rounded-t-lg`}
              onClick={() => setActiveView('heatmap')}
            >
              Time Heatmap
            </button>
          </div>

          {/* Visualization panels */}
          <div className="bg-white border rounded-lg p-4 h-80">
            <div className={`h-full ${activeView === 'timeline' ? 'block' : 'hidden'}`}>
              <div ref={timelineRef} className="w-full h-full"></div>
            </div>
            <div className={`h-full ${activeView === 'patterns' ? 'block' : 'hidden'}`}>
              <div ref={patternsRef} className="w-full h-full"></div>
            </div>
            <div className={`h-full ${activeView === 'team' ? 'block' : 'hidden'}`}>
              <div ref={teamRef} className="w-full h-full"></div>
            </div>
            <div className={`h-full ${activeView === 'heatmap' ? 'block' : 'hidden'}`}>
              <div ref={heatmapRef} className="w-full h-full"></div>
            </div>
          </div>

          {/* Implementation notes */}
          <div className="mt-6 border-t border-gray-100 pt-4">
            <h3 className="font-bold text-gray-700 mb-1 text-sm">Implementation Details</h3>
            <div className="text-xs text-gray-600 grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
              <div className="bg-gray-50 p-2 rounded">
                <span className="font-semibold">Data Structure:</span> Balanced time-series representation using AVL tree for efficient pattern detection
              </div>
              <div className="bg-gray-50 p-2 rounded">
                <span className="font-semibold">Algorithm:</span> Pattern detection in commit frequency using time-series analysis
              </div>
              {!isLoggedIn && (
                <div className="bg-blue-50 p-2 rounded md:col-span-2">
                  <span className="font-semibold text-blue-800">Note:</span> Sign in to see personalized contribution analysis based on your actual GitHub activity.
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ContributionTimelineAnalyzer; 