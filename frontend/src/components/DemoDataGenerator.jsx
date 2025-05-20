import { useState } from 'react';

/**
 * Utility class to generate demo data for GitConnectX components
 * when the API is unavailable or not connected
 */
export default class DemoDataGenerator {
  /**
   * Generate demo community detection data with sample clusters
   * @param {string} algorithm - 'louvain' or 'girvan_newman'
   * @returns {Object} Community detection data
   */
  static generateCommunityData(algorithm = 'louvain') {
    // Create nodes for the visualization
    const nodes = [];
    const communities = {};
    const communityCount = algorithm === 'louvain' ? 5 : 3; // Louvain finds more communities
    const usersPerCommunity = 12;
    
    // Generate sample community data
    for (let i = 0; i < communityCount; i++) {
      for (let j = 0; j < usersPerCommunity; j++) {
        const username = `user${i}_${j}`;
        nodes.push({
          id: username,
          name: `User ${i}.${j}`,
          communityId: i,
          group: i
        });
        communities[username] = i;
      }
    }
    
    // Generate connections (higher probability within same community)
    const links = [];
    nodes.forEach(source => {
      nodes.forEach(target => {
        if (source.id === target.id) return;
        
        // Higher chance to connect within same community
        const sameCommunity = source.communityId === target.communityId;
        const connectionProbability = sameCommunity ? 0.3 : 0.02;
        
        if (Math.random() < connectionProbability) {
          links.push({
            source: source.id,
            target: target.id,
            value: sameCommunity ? Math.random() * 5 + 5 : Math.random() * 3 + 1
          });
        }
      });
    });
    
    // Generate metrics for each community
    const communityMetrics = [];
    for (let i = 0; i < communityCount; i++) {
      communityMetrics.push({
        id: i,
        name: `Community ${i + 1}`,
        size: usersPerCommunity,
        density: (0.4 + Math.random() * 0.5).toFixed(2),
        cohesion: (0.3 + Math.random() * 0.6).toFixed(2),
        dominantLanguages: [
          { name: 'JavaScript', percentage: Math.floor(Math.random() * 60 + 20) },
          { name: 'Python', percentage: Math.floor(Math.random() * 40 + 10) },
          { name: 'TypeScript', percentage: Math.floor(Math.random() * 30) }
        ]
      });
    }
    
    return {
      algorithm,
      communities,
      visualizationData: { nodes, links },
      metrics: communityMetrics,
      stats: {
        modularity: (0.4 + Math.random() * 0.4).toFixed(3),
        communities: communityCount,
        coverage: (0.65 + Math.random() * 0.3).toFixed(3)
      }
    };
  }
  
  /**
   * Generate demo path finding data between GitHub users
   * @returns {Object} Path finding data between two GitHub users
   */
  static generatePathFinderData(sourceUser = 'johnsmith', targetUser = 'sarahjones') {
    // Generate intermediate users in the path
    const intermediatePath = [];
    const pathLength = Math.floor(Math.random() * 2) + 2; // 2-3 intermediate steps
    
    for (let i = 0; i < pathLength; i++) {
      intermediatePath.push(`developer${i}`);
    }
    
    // Generate the full path from source to target
    const fullPath = [sourceUser, ...intermediatePath, targetUser];
    
    // Generate connection data for each step in the path
    const connections = [];
    for (let i = 0; i < fullPath.length - 1; i++) {
      connections.push({
        source: fullPath[i],
        target: fullPath[i + 1],
        type: Math.random() > 0.5 ? 'follows' : 'collaborates',
        strength: (Math.random() * 0.6 + 0.3).toFixed(2), // Connection strength between 0.3 and 0.9
        sharedRepos: Math.floor(Math.random() * 5) + 1,
        since: `${2018 + Math.floor(Math.random() * 5)}-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}`
      });
    }
    
    return {
      source: {
        username: sourceUser,
        displayName: 'John Smith',
        avatar: 'https://avatars.githubusercontent.com/u/1234567',
        followers: 543,
        following: 128
      },
      target: {
        username: targetUser,
        displayName: 'Sarah Jones',
        avatar: 'https://avatars.githubusercontent.com/u/7654321',
        followers: 892,
        following: 214
      },
      path: fullPath,
      connections,
      metrics: {
        pathLength: fullPath.length - 1,
        averageStrength: (connections.reduce((sum, conn) => sum + parseFloat(conn.strength), 0) / connections.length).toFixed(2),
        directConnection: false,
        sharedRepositories: connections.reduce((sum, conn) => sum + conn.sharedRepos, 0)
      }
    };
  }
  
  /**
   * Generate demo PageRank data for GitHub users
   * @returns {Object} PageRank data for GitHub users
   */
  static generatePageRankData() {
    const users = [];
    const scoreRange = [
      { min: 0.8, max: 1.0, count: 3 },   // Top influencers
      { min: 0.5, max: 0.8, count: 7 },   // Major influencers
      { min: 0.2, max: 0.5, count: 15 },  // Moderate influencers
      { min: 0.05, max: 0.2, count: 25 }  // Minor influencers
    ];
    
    // Generate sample users with PageRank scores
    let userCount = 0;
    scoreRange.forEach(range => {
      for (let i = 0; i < range.count; i++) {
        const username = `github_user${userCount++}`;
        const score = (Math.random() * (range.max - range.min) + range.min).toFixed(4);
        
        users.push({
          username,
          displayName: `User ${userCount}`,
          score: parseFloat(score),
          rank: userCount,
          followers: Math.floor(score * 10000),
          repositories: Math.floor(score * 200)
        });
      }
    });
    
    // Sort by score
    users.sort((a, b) => b.score - a.score);
    
    return {
      algorithm: 'PageRank',
      timestamp: new Date().toISOString(),
      users,
      stats: {
        maxScore: Math.max(...users.map(u => u.score)),
        avgScore: (users.reduce((sum, user) => sum + user.score, 0) / users.length).toFixed(4)
      }
    };
  }
  
  /**
   * Generate demo contribution timeline data
   * @returns {Object} Contribution timeline data
   */
  static generateContributionTimeline() {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentYear = new Date().getFullYear();
    const timelineData = [];
    
    // Generate monthly contribution data for the past year
    for (let i = 11; i >= 0; i--) {
      const monthIndex = (new Date().getMonth() - i + 12) % 12;
      const yearOffset = monthIndex > new Date().getMonth() ? 1 : 0;
      
      // Create a more interesting pattern with seasonal variations
      let seasonMultiplier = 1;
      
      // Summer months have higher activity (May-Aug)
      if (monthIndex >= 4 && monthIndex <= 7) {
        seasonMultiplier = 1.8;
      }
      
      // Winter holidays have lower activity (Dec-Jan)
      if (monthIndex === 11 || monthIndex === 0) {
        seasonMultiplier = 0.9;
      }
      
      // Create a wave pattern with increasing trend
      const baseCommits = 60 + Math.sin(i * 0.8) * 25;
      const trendFactor = 1 + ((11 - i) * 0.05); // Steeper upward trend
      
      timelineData.push({
        month: months[monthIndex],
        year: currentYear - yearOffset,
        commits: Math.floor((baseCommits * seasonMultiplier * trendFactor) + Math.random() * 20),
        pullRequests: Math.floor((baseCommits * 0.25 * seasonMultiplier * trendFactor) + Math.random() * 8),
        issues: Math.floor((baseCommits * 0.15 * seasonMultiplier * trendFactor) + Math.random() * 5),
        repositories: Math.floor(Math.random() * 3) + 1
      });
    }
    
    // Generate project-specific contribution data
    const projectContributions = [];
    const projectCount = Math.floor(Math.random() * 4) + 3;
    
    const projectNames = [
      { name: 'awesome-frontend', fullName: 'org/awesome-frontend', language: 'JavaScript' },
      { name: 'data-analyzer', fullName: 'org/data-analyzer', language: 'Python' },
      { name: 'mobile-app', fullName: 'org/mobile-app', language: 'TypeScript' },
      { name: 'api-service', fullName: 'org/api-service', language: 'Go' },
      { name: 'ml-toolkit', fullName: 'org/ml-toolkit', language: 'Python' },
      { name: 'web-framework', fullName: 'org/web-framework', language: 'JavaScript' },
      { name: 'design-system', fullName: 'org/design-system', language: 'TypeScript' }
    ];
    
    // Sort projects to ensure consistent order
    projectNames.sort(() => 0.5 - Math.random());
    
    for (let i = 0; i < projectCount; i++) {
      const project = projectNames[i];
      projectContributions.push({
        name: project.name,
        fullName: project.fullName,
        contributions: Math.floor(Math.random() * 120) + 30,
        role: i === 0 ? 'Owner' : (i < 2 ? 'Maintainer' : 'Contributor'),
        lastContribution: `${Math.floor(Math.random() * 30) + 1} days ago`,
        language: project.language
      });
    }
    
    // Sort projects by contributions (highest first)
    projectContributions.sort((a, b) => b.contributions - a.contributions);
    
    return {
      userId: 'demo_user',
      timeline: timelineData,
      projects: projectContributions,
      summary: {
        totalCommits: timelineData.reduce((sum, month) => sum + month.commits, 0),
        totalPullRequests: timelineData.reduce((sum, month) => sum + month.pullRequests, 0),
        avgMonthlyActivity: (timelineData.reduce((sum, month) => sum + month.commits + month.pullRequests, 0) / timelineData.length).toFixed(1),
        topLanguages: ['JavaScript', 'TypeScript', 'Python']
      }
    };
  }
  
  /**
   * Generate demo repository analysis data
   * @returns {Object} Repository analysis data
   */
  static generateRepoAnalysisData() {
    const today = new Date();
    
    // Generate 30 days of commit activity
    const commitActivity = [];
    for (let i = 30; i >= 1; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      // Format date as YYYY-MM-DD
      const dateStr = date.toISOString().split('T')[0];
      
      // Random number of commits, with weekends having fewer commits
      const dayOfWeek = date.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const commits = isWeekend ? 
        Math.floor(Math.random() * 5) : 
        Math.floor(Math.random() * 15) + 2;
      
      commitActivity.push({
        date: dateStr,
        commits: commits
      });
    }
    
    // Common programming languages with realistic percentages
    const languages = {
      JavaScript: 32,
      Python: 24,
      TypeScript: 18,
      HTML: 8,
      CSS: 7,
      Java: 5,
      Go: 3,
      Ruby: 2,
      PHP: 1
    };
    
    // Demo repositories data
    const topRepositories = [
      {
        name: 'awesome-project',
        description: 'A full-stack web application with modern architecture',
        language: 'JavaScript',
        stars: 437,
        forks: 78,
        updated: '2 days ago'
      },
      {
        name: 'data-analytics-tool',
        description: 'Big data processing and visualization toolkit',
        language: 'Python',
        stars: 312,
        forks: 45,
        updated: '5 days ago'
      },
      {
        name: 'react-component-library',
        description: 'Collection of reusable React components',
        language: 'TypeScript',
        stars: 289,
        forks: 34,
        updated: 'a week ago'
      },
      {
        name: 'ml-experiments',
        description: 'Machine learning models and experiments',
        language: 'Python',
        stars: 201,
        forks: 27,
        updated: '2 weeks ago'
      },
      {
        name: 'api-gateway',
        description: 'API gateway service with authentication and rate limiting',
        language: 'Go',
        stars: 186,
        forks: 22,
        updated: 'a month ago'
      },
      {
        name: 'personal-blog',
        description: 'Personal tech blog built with modern JavaScript',
        language: 'JavaScript',
        stars: 124,
        forks: 12,
        updated: '2 months ago'
      },
      {
        name: 'dotfiles',
        description: 'Personal development environment configurations',
        language: 'Shell',
        stars: 87,
        forks: 9,
        updated: '3 months ago'
      }
    ];
    
    // Return structured repository analysis data
    return {
      repositoryCount: 24,
      stars: 1823,
      forks: 246,
      collaborators: 15,
      languages: languages,
      commitActivity: commitActivity,
      topRepositories: topRepositories
    };
  }
} 