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

## Tech Stack
- **Languages**: Python, JavaScript (React.js)
- **Libraries**: NetworkX, Pandas, NumPy, Matplotlib, D3.js, PyGitHub
- **Frameworks**: Flask/FastAPI, React.js
- **Database**: PostgreSQL/MongoDB
- **Cloud & Deployment**: Docker, AWS/GCP

## Installation & Setup
### Prerequisites
- Python 3.8+
- Node.js 14+
- PostgreSQL/MongoDB

### Steps
1. Clone the repository:
   ```sh
   git clone https://github.com/yourusername/GitConnectX.git
   cd GitConnectX
   ```
2. Set up the backend:
   ```sh
   cd backend
   pip install -r requirements.txt
   python app.py
   ```
3. Set up the frontend:
   ```sh
   cd frontend
   npm install
   npm start
   ```

## Usage
- Enter a GitHub username to analyze their network.
- View graphs showing developer influence and connections.
- Explore ranked lists of top contributors.

## Contributing
1. Fork the repository.
2. Create a new branch (`feature-xyz`).
3. Commit changes and push.
4. Open a pull request.

## License
MIT License

## References
- **GitHub API Documentation** - https://docs.github.com/en/rest
- **NetworkX Documentation** - https://networkx.org/documentation/stable/
- **Louvain Clustering** - https://arxiv.org/abs/0803.0476
