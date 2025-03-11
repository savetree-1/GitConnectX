
# GitConnectX

## Overview
GitConnectX is a developer network analysis tool for GitHub that extracts and analyzes user interactions using graph-based models and social network analysis. It applies algorithms such as BFS, DFS, Dijkstra's, PageRank, and Louvain clustering to reveal insights into developer influence and collaboration dynamics.

## Features
1. **Graph Visualization** - Displays real-time network graphs of developer interactions.
2. **Influence Ranking** - Identifies key contributors using PageRank and HITS.
3. **Community Detection** - Groups developers into clusters using Louvain.
4. **GitHub Data Extraction** - Fetches user, repository, and contribution data via GitHub API.
5. **Database Storage** - Stores processed data for fast retrieval and analysis.
6. **Interactive Web Dashboard** - Provides a user-friendly interface for exploring GitHub networks.

## System Architecture
1. **Data Collection & Processing**
   - Fetches user and repository data via GitHub API.
   - Constructs Follow Network (developer connections) and Commit Network (developer-repository relations).
2. **Graph Analysis**
   - Models interactions using NetworkX.
   - Applies PageRank & HITS for user influence ranking.
   - Uses Louvain clustering for community detection.
3. **Visualization & Deployment**
   - Interactive graphs with Matplotlib, D3.js, and Gephi.
   - Web dashboard built using Flask/FastAPI & React.js.
   - Data storage in PostgreSQL/MongoDB.

## Data Structures & Algorithms Used
- **Graph Representation** - Adjacency List & Adjacency Matrix.
- **Traversal Algorithms** - BFS and DFS for exploring connections.
- **Shortest Path Algorithm** - Dijkstra’s algorithm for measuring link strength.
- **Influence Ranking** - PageRank and HITS to rank developers.
- **Community Detection** - Louvain algorithm for clustering.

---

## ⚙️ Tech Stack
- **Languages**: Python, JavaScript  
- **Libraries**: PyGitHub, NetworkX, Pandas, NumPy, Matplotlib, D3.js  
- **Frameworks**: Flask/FastAPI, React.js  
- **Database**: PostgreSQL/MongoDB  
- **Deployment**: Docker, AWS/GCP  

---

## 📊 Algorithms Used (DAA & DS)
- **Graph Traversal**: BFS, DFS  
- **Shortest Path**: Dijkstra’s Algorithm  
- **Influence Ranking**: PageRank, HITS  
- **Community Detection**: Louvain Clustering  
- **Data Structures**: Graphs, Hash Maps, Adjacency Lists  

---

## 🛠️ Installation
```sh
# Clone the repository
git clone https://github.com/your-username/GitConnectX.git
cd GitConnectX

# Install dependencies
npm install       # For frontend
pip install -r requirements.txt   # For backend

# Start the backend
cd backend
python app.py

# Start the frontend
cd frontend
npm start
```

---

## 📖 References
1. L. Tang and H. Liu, *Community Detection in Social Networks*, Morgan & Claypool, 2010.  
2. S. Brin and L. Page, "The Anatomy of a Large-Scale Hypertextual Web Search Engine," *Computer Networks*, vol. 30, no. 1, pp. 107-117, 1998.  
3. M. Girvan and M. E. J. Newman, "Community Structure in Social and Biological Networks," *PNAS*, vol. 99, no. 12, pp. 7821-7826, 2002.  

---

## 👥 Who Are We?
**Team Ananta** – A group of passionate developers and researchers dedicated to exploring GitHub's network and providing valuable insights.  
### **Team Members:**
- **Ankush Rawat**  
- **Anika Dewari**  
- **Akhil Nautiyal**  
- **Ayush Negi**  

---

## 🌟 Contributing
Want to contribute? Follow our guidelines and submit a PR! 🚀

📧 **Contact**: ankurawat8844@gmail.com 
🔗 **GitHub**: [GitConnectX](https://github.com/your-username/GitConnectX)

---

**📌 License:** MIT 📜 | **🔗 Developed by**: Team Ananta  
```


