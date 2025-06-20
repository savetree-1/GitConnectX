import { useState, useEffect } from 'react';

const DomainProjectFinder = ({ username, onSelectRepository }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('');
  const [repositories, setRepositories] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [visibleRepoCount, setVisibleRepoCount] = useState(3);
  const [totalReposToShow, setTotalReposToShow] = useState(3);
  const [popularDomains, setPopularDomains] = useState([
    { id: 'web-development', name: 'Web Development', color: 'bg-blue-500', icon: '🌐' },
    { id: 'machine-learning', name: 'Machine Learning', color: 'bg-green-500', icon: '🤖' },
    { id: 'cybersecurity', name: 'Cybersecurity', color: 'bg-red-500', icon: '🔒' },
    { id: 'mobile-apps', name: 'Mobile Development', color: 'bg-purple-500', icon: '📱' },
    { id: 'data-science', name: 'Data Science', color: 'bg-yellow-500', icon: '📊' },
    { id: 'devops', name: 'DevOps', color: 'bg-indigo-500', icon: '⚙️' },
    { id: 'blockchain', name: 'Blockchain', color: 'bg-pink-500', icon: '⛓️' },
    { id: 'game-development', name: 'Game Development', color: 'bg-orange-500', icon: '🎮' },
    { id: 'iot', name: 'IoT', color: 'bg-teal-500', icon: '🔌' },
    { id: 'cloud-computing', name: 'Cloud Computing', color: 'bg-cyan-500', icon: '☁️' }
  ]);

  // Search for repositories by domain
  const searchRepositories = async (domain) => {
    setLoading(true);
    setError(null);
    setShowResults(true);
    
    try {
      // Always try to fetch from the API first
      try {
        // Use our new API endpoint with a higher limit to enable "Show More"
        const response = await fetch(`http://localhost:5000/api/network/repositories/domain/${domain}?limit=20`);
        
        if (!response.ok) {
          console.error(`Failed to fetch repositories: ${response.status} ${response.statusText}`);
          throw new Error(`Failed to fetch repositories: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data.status === 'success') {
          setRepositories(data.data.repositories || []);
        } else {
          throw new Error(data.message || 'Failed to load repositories');
        }
      } catch (err) {
        console.error('Error fetching repositories from API:', err);
        // Fall back to demo data
        generateDemoRepositories(domain);
      }
    } catch (err) {
      console.error('Error searching repositories:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Generate sample repositories for demo purposes
  const generateDemoRepositories = (domain) => {
    // Map domain to specific sample repos
    const domainRepos = {
      'cybersecurity': [
        {
          id: 'cs-1',
          name: 'SecureAuth',
          full_name: 'security-org/SecureAuth',
          description: 'Advanced authentication library with MFA, biometrics and threat detection',
          html_url: 'https://github.com/security-org/SecureAuth',
          stars: 2431,
          forks: 432,
          language: 'Python',
          topics: ['security', 'auth', 'mfa', 'zero-trust'],
          updated_at: '2023-09-15T10:23:18Z'
        },
        {
          id: 'cs-2',
          name: 'NetDefender',
          full_name: 'cybershield/NetDefender',
          description: 'Network intrusion detection system with ML-powered threat analysis',
          html_url: 'https://github.com/cybershield/NetDefender',
          stars: 1822,
          forks: 329,
          language: 'Go',
          topics: ['cybersecurity', 'network-security', 'ids', 'threat-detection'],
          updated_at: '2023-10-02T15:45:22Z'
        },
        {
          id: 'cs-3',
          name: 'VulnScanner',
          full_name: 'sectools/VulnScanner',
          description: 'Comprehensive vulnerability scanner for web applications and APIs',
          html_url: 'https://github.com/sectools/VulnScanner',
          stars: 3156,
          forks: 578,
          language: 'JavaScript',
          topics: ['security', 'vulnerability-scanner', 'pentest', 'web-security'],
          updated_at: '2023-11-12T08:17:36Z'
        },
        {
          id: 'cs-4',
          name: 'CryptoToolkit',
          full_name: 'cryptodev/CryptoToolkit',
          description: 'Modern cryptographic library for secure communications and data protection',
          html_url: 'https://github.com/cryptodev/CryptoToolkit',
          stars: 1965,
          forks: 315,
          language: 'Rust',
          topics: ['cryptography', 'encryption', 'security', 'zero-knowledge-proofs'],
          updated_at: '2023-10-28T12:51:09Z'
        },
        {
          id: 'cs-5',
          name: 'ForensicSuite',
          full_name: 'digitalforensics/ForensicSuite',
          description: 'Digital forensics toolkit for incident response and malware analysis',
          html_url: 'https://github.com/digitalforensics/ForensicSuite',
          stars: 2214,
          forks: 421,
          language: 'Python',
          topics: ['forensics', 'incident-response', 'malware-analysis', 'threat-hunting'],
          updated_at: '2023-11-05T19:33:47Z'
        }
      ],
      'web-development': [
        {
          id: 'web-1',
          name: 'ModernUI',
          full_name: 'webdev/ModernUI',
          description: 'Component library for building modern, responsive web interfaces',
          html_url: 'https://github.com/webdev/ModernUI',
          stars: 3786,
          forks: 629,
          language: 'TypeScript',
          topics: ['ui', 'components', 'react', 'design-system'],
          updated_at: '2023-11-10T14:22:39Z'
        },
        // Additional web dev repos would go here
      ],
      // Other domains would have their own sample repositories
    };
    
    // Use domain-specific repos if available, or generate generic ones
    const repos = domainRepos[domain] || [
      {
        id: `${domain}-1`,
        name: `${domain}-framework`,
        full_name: `${domain}-org/${domain}-framework`,
        description: `A popular framework for ${domain} development with extensive features`,
        html_url: `https://github.com/${domain}-org/${domain}-framework`,
        stars: Math.floor(Math.random() * 5000) + 1000,
        forks: Math.floor(Math.random() * 1000) + 100,
        language: pickRandomLanguage(),
        topics: [domain, 'framework', 'open-source'],
        updated_at: randomDate()
      },
      {
        id: `${domain}-2`,
        name: `${domain}-toolkit`,
        full_name: `${domain}-dev/${domain}-toolkit`,
        description: `Essential tools and utilities for ${domain} projects`,
        html_url: `https://github.com/${domain}-dev/${domain}-toolkit`,
        stars: Math.floor(Math.random() * 3000) + 500,
        forks: Math.floor(Math.random() * 800) + 50,
        language: pickRandomLanguage(),
        topics: [domain, 'toolkit', 'utilities'],
        updated_at: randomDate()
      },
      {
        id: `${domain}-3`,
        name: `${domain}-examples`,
        full_name: `${domain}-community/${domain}-examples`,
        description: `Collection of example projects and best practices for ${domain}`,
        html_url: `https://github.com/${domain}-community/${domain}-examples`,
        stars: Math.floor(Math.random() * 2000) + 300,
        forks: Math.floor(Math.random() * 500) + 100,
        language: pickRandomLanguage(),
        topics: [domain, 'examples', 'learning'],
        updated_at: randomDate()
      }
    ];
    
    setRepositories(repos);
  };

  // Helper function to pick a random programming language
  const pickRandomLanguage = () => {
    const languages = ['JavaScript', 'TypeScript', 'Python', 'Java', 'Go', 'Rust', 'C++', 'PHP', 'Ruby'];
    return languages[Math.floor(Math.random() * languages.length)];
  };

  // Helper function to generate a random date in the last 3 months
  const randomDate = () => {
    const now = new Date();
    const pastDate = new Date(now.getTime() - Math.random() * 90 * 24 * 60 * 60 * 1000);
    return pastDate.toISOString();
  };

  // Handle domain selection
  const handleDomainSelection = (domain) => {
    setSelectedDomain(domain);
    setSearchTerm(''); // Clear any search term
    // Reset visible count on new domain selection
    const initialCount = 3;
    setVisibleRepoCount(initialCount);
    setTotalReposToShow(initialCount);
    searchRepositories(domain);
  };

  // Handle search form submission
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      setSelectedDomain(''); // Clear any selected domain
      searchRepositories(searchTerm.trim().toLowerCase());
    }
  };

  // Format date to readable string
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Function to increase the number of visible repositories
  const handleShowMore = () => {
    // Increase by 4 for logged-in users, by 2 for guests
    const increment = 3;
    setVisibleRepoCount(prevCount => Math.min(prevCount + increment, repositories.length));
    setTotalReposToShow(prevCount => Math.min(prevCount + increment, repositories.length));
  };

  // Handle repository selection
  const handleRepositorySelect = (repo) => {
    if (typeof onSelectRepository === 'function') {
      onSelectRepository(repo);
    }
  };

  // Repository card component
  const RepositoryCard = ({ repo }) => {
    return (
      <div className="bg-white rounded-lg shadow p-4 border border-gray-100 hover:shadow-md transition-all">
        <div className="flex justify-between items-start mb-2">
          <h4 className="font-bold text-blue-700 text-lg">{repo.name}</h4>
          <div className="flex items-center text-xs text-gray-600">
            <span className="flex items-center mr-3">
              <svg className="w-4 h-4 mr-1 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              {repo.stars.toLocaleString()}
            </span>
            <span className="flex items-center">
              <svg className="w-4 h-4 mr-1 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              {repo.forks.toLocaleString()}
            </span>
          </div>
        </div>
        
        <p className="text-gray-600 text-sm mb-3">{repo.description}</p>
        
        <div className="flex flex-wrap gap-1 mb-3">
          {repo.topics && repo.topics.slice(0, 4).map((topic, index) => (
            <span 
              key={index}
              className="inline-block bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full"
            >
              {topic}
            </span>
          ))}
        </div>
        
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <span className={`w-3 h-3 rounded-full mr-1.5 ${getLanguageColor(repo.language)}`}></span>
            <span className="text-xs text-gray-600">{repo.language}</span>
          </div>
          
          <div className="text-xs text-gray-500">
            Updated {formatDate(repo.updated_at)}
          </div>
        </div>
        
        <div className="mt-3 flex justify-between gap-2">
          <button 
            onClick={() => handleRepositorySelect(repo)} 
            className="flex-1 px-2 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-medium rounded-md transition-colors"
          >
            View Timeline
          </button>
          <a 
            href={repo.html_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 inline-block px-2 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors text-center"
          >
            View on GitHub
          </a>
        </div>
      </div>
    );
  };

  // Limited access card for guests
  const LimitedAccessCard = () => {
    return (
      <div className="bg-white rounded-lg shadow p-6 border border-gray-200 text-center">
        <svg className="w-16 h-16 mx-auto text-blue-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <h3 className="text-xl font-bold text-gray-800 mb-2">Full Access for Members</h3>
        <p className="text-gray-600 mb-6">
          Log in to access our full repository finder with personalized recommendations 
          based on your GitHub activity and interests.
        </p>
        <button className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors">
          Sign In
        </button>
      </div>
    );
  };

  // Helper function to get language color
  const getLanguageColor = (language) => {
    const colors = {
      'JavaScript': 'bg-yellow-400',
      'TypeScript': 'bg-blue-400',
      'Python': 'bg-green-500',
      'Java': 'bg-orange-500',
      'Go': 'bg-cyan-500',
      'Rust': 'bg-red-500',
      'C++': 'bg-pink-500',
      'PHP': 'bg-indigo-400',
      'Ruby': 'bg-red-600',
      'CSS': 'bg-purple-500',
      'HTML': 'bg-orange-600',
      'Shell': 'bg-green-600'
    };
    
    return colors[language] || 'bg-gray-400';
  };

  return (
    <div className="font-sans bg-white border-blue-500 border-2 rounded-lg shadow-md p-5 mb-8">
      <div className="mb-6">
        <p className="text-gray-600 mb-4">
          Find reference projects and repositories in your domain of interest. 
          Select a category below or search for specific technologies or topics.
        </p>
        
        {/* Search form */}
        <form onSubmit={handleSearch} className="mb-4">
          <div className="flex gap-2">
            <input
              type="text"
              className="flex-grow px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Search domains or technologies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md"
            >
              Search
            </button>
          </div>
        </form>
        
        {/* Popular domains tags */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">Popular Domains</h3>
          <div className="flex flex-wrap gap-2">
            {popularDomains.map(domain => (
              <button
                key={domain.id}
                onClick={() => handleDomainSelection(domain.id)}
                className={`flex items-center px-3 py-1.5 rounded-full text-white text-sm ${domain.color} ${selectedDomain === domain.id ? 'ring-2 ring-offset-2 ring-blue-300' : 'hover:opacity-90'}`}
              >
                <span className="mr-1">{domain.icon}</span>
                {domain.name}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Results section */}
      {showResults && (
        <div>
          <div className="border-t border-gray-200 pt-4 mb-4">
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              {selectedDomain ? (
                <>Projects in <span className="text-blue-600">{selectedDomain.replace(/-/g, ' ')}</span></>
              ) : (
                <>Search results for <span className="text-blue-600">{searchTerm}</span></>
              )}
            </h3>
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <p className="text-gray-500">Searching repositories...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 p-4 rounded-md">
              <p className="text-red-600">{error}</p>
            </div>
          ) : (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {repositories.slice(0, totalReposToShow).map(repo => (
                  <RepositoryCard key={repo.id} repo={repo} />
                ))}
                
                {repositories.length === 0 && (
                  <div className="col-span-2 text-center py-12">
                    <p className="text-gray-500">No repositories found matching your criteria.</p>
                  </div>
                )}
              </div>
              
              {/* Show More button */}
              {repositories.length > totalReposToShow && (
                <div className="mt-6 text-center">
                  <button 
                    onClick={handleShowMore}
                    className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium rounded-md transition-colors border border-gray-300"
                  >
                    Show More Projects
                    <span className="ml-2 text-gray-500 text-sm">
                      ({totalReposToShow} of {repositories.length})
                    </span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
      
      {!showResults && (
        <div className="text-center py-12 px-4 bg-gray-50 rounded-lg">
          <svg className="w-16 h-16 mx-auto text-blue-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <h3 className="text-xl font-semibold mb-2">Find Your Next Project</h3>
          <p className="text-gray-600 mb-2">
            Search for domains or click on any category above to discover related projects.
          </p>
        </div>
      )}
      
      <div className="mt-6 border-t border-gray-100 pt-4">
        <h3 className="font-bold text-gray-700 mb-1 text-sm">How Project Finder Works</h3>
        <p className="text-gray-600 text-sm">
          Our project finder helps you discover relevant GitHub repositories based on domains and technologies. 
          Sign in to unlock personalized project recommendations based on your skills and interests.
        </p>
      </div>
    </div>
  );
};

export default DomainProjectFinder; 