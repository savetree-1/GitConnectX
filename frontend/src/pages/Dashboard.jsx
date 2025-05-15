import React from 'react';
import GraphVisualization from '../components/GraphVisualization';
import AnalyticsTabs from '../components/AnalyticsTabs';
import RepoAnalysis from '../components/RepoAnalysis';
import ProfileSidebar from '../components/ProfileSidebar';
import Header from '../components/Header';
import Footer from '../components/Footer';

const Dashboard = () => {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-r from-blue-900 via-purple-800 to-indigo-800">
      <Header />
      <div className="flex flex-grow ">
        {/* Sidebar */}
        <aside className="w-1/4 shadow-md rounded-2xl pt-18 ">
          <ProfileSidebar />
        </aside>

        {/* Main Content */}
        <main className=" w-3/4 p-30 space-y-12 overflow-x-auto">
          <section id="graph-visualization" className="min-w-full">
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
