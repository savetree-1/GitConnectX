import React from 'react';
import { PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer } from 'recharts';

const languageData = [
  { name: 'HTML', value: 100  },
  { name: 'CSS', value: 200 },
  { name:'Jupiter Notebooks', value: 100},
  { name: 'Python', value: 300 },
  { name: 'JavaScript', value: 400 },
  { name: 'Others' , value: 50}
];

const COLORS = ['#CCE8DB', '#C1D4E3', '#BEB4D6', '#FADAE2','#F8B3CA','#CC97C1'];

const repoData = [
  { name: 'Repo A', size: 120, forks: 10 },
  { name: 'Repo B', size: 200, forks: 20 },
  { name: 'Repo C', size: 80, forks: 5 },
  { name: 'Repo D', size: 160, forks: 12 },
];

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

const RepoAnalysis = () => {
  return (
    <div className="w-full bg-gray-100 rounded-2xl shadow-lg p-6 border-blue-500 border-2">
      <h2 className="text-3xl font-bold mb-6">Repositories Analysis</h2>
      <div className="flex flex-col md:flex-row gap-6">        
        {/* Pie Chart Section */}
        <div className="w-full md:w-1/2 bg-white rounded-2xl p-4 shadow border-2 border-blue-200">
          <h3 className="text-xl font-semibold mb-4">Language Distribution</h3>
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
        </div>

        {/* Bar Chart Section */}
        <div className="w-full md:w-1/2 bg-white rounded-2xl p-4 shadow border-2 border-blue-200">
          <h3 className="text-xl font-semibold mb-4">Repo Size vs Forks</h3>
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
        </div>

      </div>
    </div>
  );
};

export default RepoAnalysis;
