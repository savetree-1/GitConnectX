import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#CCE8DB', '#C1D4E3', '#BEB4D6', '#FADAE2','#F8B3CA','#CC97C1'];

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const { name, value, color } = payload[0];
    return (
      <div className="bg-white shadow-md border border-gray-300 px-3 py-2 rounded text-sm">
        <p className="font-semibold" style={{ color }}>{name}</p>
        <p className="text-gray-700">Value: {value}</p>
      </div>
    );
  }
  return null;
};

const RepoAnalysis = ({ username }) => {
  const [languageData, setLanguageData] = useState([]);
  const [repoData, setRepoData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRepoData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch language data
        const langResponse = await fetch(`http://localhost:5000/api/analyze/languages/${username}`);
        
        // Fetch repositories data
        const reposResponse = await fetch(`http://localhost:5000/api/users/${username}/repositories?sort=stars&limit=10`);
        
        if (!langResponse.ok) {
          throw new Error(`Failed to fetch language data: ${langResponse.statusText}`);
        }
        
        if (!reposResponse.ok) {
          throw new Error(`Failed to fetch repository data: ${reposResponse.statusText}`);
        }
        
        const langData = await langResponse.json();
        const reposData = await reposResponse.json();
        
        // Process language data for the pie chart
        if (langData.status === 'success' && langData.data && langData.data.languages) {
          const languages = langData.data.languages;
          const formattedLangData = Object.entries(languages).map(([name, percentage]) => ({
            name,
            value: percentage
          }));
          setLanguageData(formattedLangData);
        }
        
        // Process repository data for the bar chart
        if (reposData.status === 'success' && reposData.data && reposData.data.repositories) {
          const repos = reposData.data.repositories;
          const formattedRepoData = repos.slice(0, 5).map(repo => ({
            name: repo.name,
            size: repo.size || 0,
            forks: repo.forks_count || 0
          }));
          setRepoData(formattedRepoData);
        }
      } catch (err) {
        console.error('Error fetching repository data:', err);
        setError(err.message);
        
        // Try alternative API endpoint
        try {
          const altLangResponse = await fetch(`http://127.0.0.1:5000/api/analyze/languages/${username}`);
          const altReposResponse = await fetch(`http://127.0.0.1:5000/api/users/${username}/repositories?sort=stars&limit=10`);
          
          if (altLangResponse.ok && altReposResponse.ok) {
            const langData = await altLangResponse.json();
            const reposData = await altReposResponse.json();
            
            // Process language data
            if (langData.status === 'success' && langData.data && langData.data.languages) {
              const languages = langData.data.languages;
              const formattedLangData = Object.entries(languages).map(([name, percentage]) => ({
                name,
                value: percentage
              }));
              setLanguageData(formattedLangData);
            }
            
            // Process repository data
            if (reposData.status === 'success' && reposData.data && reposData.data.repositories) {
              const repos = reposData.data.repositories;
              const formattedRepoData = repos.slice(0, 5).map(repo => ({
                name: repo.name,
                size: repo.size || 0,
                forks: repo.forks_count || 0
              }));
              setRepoData(formattedRepoData);
            }
            
            setError(null);
          } else {
            setError("API server not available. Please ensure the backend is running.");
          }
        } catch (altErr) {
          console.error('Alternative API endpoint also failed:', altErr);
          setError("Could not connect to the API server. Please make sure the backend is running.");
        }
      } finally {
        setLoading(false);
      }
    };
    
    if (username) {
      fetchRepoData();
    }
  }, [username]);

  return (
    <div className="w-full bg-gray-100 rounded-2xl shadow-lg p-6 border-blue-500 border-2">
      <h2 className="text-3xl font-bold mb-6">Your Repositories Analysis</h2>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <p className="text-gray-500 text-xl">Loading repository data...</p>
        </div>
      ) : error ? (
        <div className="flex justify-center items-center flex-col h-64">
          <p className="text-red-500 text-xl mb-4">{error}</p>
          <p className="text-gray-600">Please ensure the API server is running.</p>
        </div>
      ) : (
        <div className="flex flex-col md:flex-row gap-6">        
          {/* Pie Chart Section */}
          <div className="w-full md:w-1/2 bg-white rounded-2xl p-4 shadow border-2 border-blue-200">
            <h3 className="text-xl font-semibold mb-4">Language Distribution</h3>
            {languageData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={languageData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name }) => name}
                    outerRadius={100}
                    dataKey="value"
                  >
                    {languageData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex justify-center items-center h-full">
                <p className="text-gray-500">No language data available</p>
              </div>
            )}
          </div>

          {/* Bar Chart Section */}
          <div className="w-full md:w-1/2 bg-white rounded-2xl p-4 shadow border-2 border-blue-200">
            <h3 className="text-xl font-semibold mb-4">Repo Size vs Forks</h3>
            {repoData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={repoData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="size" fill="#B7B1F2" name="Size (KB)" />
                  <Bar dataKey="forks" fill="#FDB7EA" name="Forks" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex justify-center items-center h-full">
                <p className="text-gray-500">No repository data available</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RepoAnalysis;
