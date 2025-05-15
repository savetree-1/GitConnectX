import React from 'react';
import GraphVisualization from '../components/GraphVisualization';
import AnalyticsTabs from '../components/AnalyticsTabs';
import RepoAnalysis from '../components/RepoAnalysis';
import ProfileSidebar from '../components/ProfileSidebar';
import Header from '../components/Header';
import Footer from '../components/Footer';

const Dashboard = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <div className="flex flex-grow bg-gray-100">
        {/* Sidebar */}
        <aside className="w-1/4 bg-white shadow-md rounded-2xl pt-18 ">
          <ProfileSidebar />
        </aside>

        {/* Main Content */}
        <main className="w-3/4 p-25 space-y-4 overflow-x-auto">
          <section id="graph-visualization" className="min-w-full border-blue-500 border-2 rounded-2xl shadow-lg p-4">
            <GraphVisualization />
          </section>

          <section id="analytics-tabs">
            <AnalyticsTabs />
          </section>

          <section id="repo-analysis">
            <RepoAnalysis />
          </section>
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default Dashboard;
