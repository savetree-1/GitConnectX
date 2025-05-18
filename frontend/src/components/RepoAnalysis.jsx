import React, { useEffect, useState } from 'react';
import {
  PieChart, Pie, Cell, Tooltip, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer
} from 'recharts';

const COLORS = ['#CCE8DB', '#C1D4E3', '#BEB4D6', '#FADAE2', '#F8B3CA', '#CC97C1'];

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

        const langResponse = await fetch(`http://localhost:5000/api/analyze/languages/${username}`);
        const reposResponse = await fetch(`http://localhost:5000/api/users/${username}/repositories?sort=stars&limit=10`);

        if (!langResponse.ok) throw new Error(`Failed to fetch language data: ${langResponse.statusText}`);
        if (!reposResponse.ok) throw new Error(`Failed to fetch repository data: ${reposResponse.statusText}`);

        const langData = await langResponse.json();
        const reposData = await reposResponse.json();

        if (langData.status === 'success' && langData.data && langData.data.languages) {
          const languages = langData.data.languages;
          const formattedLangData = Object.entries(languages).map(([name, percentage]) => ({
            name,
            value: percentage
          }));
          setLanguageData(formattedLangData);
        }

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
          console.error('Alternative API failed:', altErr);
          setError("Could not connect to the API server.");
        }
      } finally {
        setLoading(false);
      }
    };

    if (username) fetchRepoData();
  }, [username]);


  return (
    <div className="w-full bg-white rounded-xl shadow-lg p-6 border-blue-300 border-2">
      <h2 className="text-2xl font-bold mb-6">Your Repositories Analysis</h2>

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
        <>
          {/* Charts Section */}
          <div className="flex flex-col md:flex-row gap-6 mb-6">
            <div className="w-full md:w-1/2 bg-white rounded-lg p-4 shadow-md border-blue-300 border-2">
              <h3 className="text-xl font-semibold mb-4">Language Distribution</h3>
              {languageData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={languageData} cx="50%" cy="50%" outerRadius={100} label dataKey="value">
                      {languageData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-500 text-center">No language data available</p>
              )}
            </div>

            <div className="w-full md:w-1/2 bg-white rounded-lg p-4 shadow-md border-blue-300 border-2">
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
                <p className="text-gray-500 text-center">No repository data available</p>
              )}
            </div>
          </div>

          {/* Network Visualizations with Zoom */}
          <div className="flex flex-col gap-6">
            {/* Follower Network */}
            <div className="bg-white p-4 rounded-lg shadow-md border-blue-300 border-2">
              <h3 className="text-xl font-semibold mb-4">Follower Network</h3>
              <p className="text-sm text-gray-600 mb-2">Zoom with scroll / drag to explore.</p>
              <div className="h-80 overflow-hidden">
                  {/* Add your follower network SVG elements here */}
                  <circle cx="300" cy="200" r="20" fill="#3B82F6" />
                  <text x="300" y="230" textAnchor="middle" fontSize="12">main/repo</text>
                  <line x1="300" y1="200" x2="400" y2="130" stroke="#ccc" />
                  <circle cx="400" cy="130" r="15" fill="#FBBF24" />
              </div>
            </div>

            {/* Bipartite Network */}
            <div className="bg-white p-4 rounded-lg shadow-md border-blue-300 border-2">
              <h3 className="text-xl font-semibold mb-4">Bipartite Network</h3>
              <div className="h-80 overflow-hidden">
                  {/* Your Bipartite Network SVG content */}
                  <circle cx="300" cy="100" r="20" fill="#F97316" />
                  <text x="300" y="130" textAnchor="middle" fontSize="12">hub1</text>
                  <line x1="300" y1="100" x2="150" y2="150" stroke="#ccc" />
                  <circle cx="150" cy="150" r="15" fill="#3B82F6" />
              </div>
            </div>

            {/* Forks Network */}
            <div className="bg-white p-4 rounded-lg shadow-md border-blue-300 border-2">
              <h3 className="text-xl font-semibold mb-4">Forks Network</h3>
              <div className="h-80 overflow-hidden">
                  {/* Your Forks Network SVG content */}
                  <circle cx="300" cy="120" r="20" fill="#EF4444" />
                  <text x="300" y="150" textAnchor="middle" fontSize="12">Main Repo</text>
                  <line x1="300" y1="120" x2="150" y2="300" stroke="#ccc" />
                  <circle cx="150" cy="300" r="15" fill="#10B981" />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default RepoAnalysis;
