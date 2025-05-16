# GitConnectX

## Overview
GitConnectX is a developer network analysis tool for GitHub that extracts and analyzes user interactions using graph-based models and social network analysis. It applies algorithms such as BFS, DFS, Dijkstra's, PageRank, and Louvain clustering to reveal insights into developer influence and collaboration dynamics.

## Architecture

### Backend
The backend is built with Flask and provides RESTful APIs to interact with GitHub data. It includes:

- **GitHub Data Fetching**: Fetches user, repository, and connection data using PyGitHub
- **Graph Analysis Algorithms**: Implements PageRank, Louvain clustering, and shortest path algorithms
- **Database Integration**: Stores data in PostgreSQL (structured data) and MongoDB (graph data)
- **API Endpoints**: Provides interfaces for network visualization, influence ranking, and community detection

### C++ Algorithms (Optional)
For performance optimization, computationally intensive graph algorithms can be implemented in C++:

- PageRank for influence ranking
- Louvain for community detection
- Dijkstra's algorithm for shortest paths
- HITS algorithm for hub and authority scores

### Features
1. **Graph Visualization** - Displays real-time network graphs of developer interactions.
2. **Influence Ranking** - Identifies key contributors using PageRank and HITS.
3. **Community Detection** - Groups developers into clusters using Louvain.
4. **GitHub Data Extraction** - Fetches user, repository, and contribution data via GitHub API.
5. **Database Storage** - Stores processed data for fast retrieval and analysis.
6. **Interactive Web Dashboard** - Provides a user-friendly interface for exploring GitHub networks.

## Setup Instructions

### Prerequisites
- Python 3.9+
- PostgreSQL
- MongoDB
- Git
- C++ compiler (optional, for C++ algorithm implementations)

### Installation

1. Clone the repository
```sh
git clone https://github.com/yourusername/GitConnectX.git
cd GitConnectX
```

2. Set up a virtual environment
```sh
python -m venv venv
source venv/bin/activate  # On Windows, use: venv\Scripts\activate
```

3. Install dependencies
```sh
pip install -r requirements.txt
```

4. Set up environment variables
Copy the example environment file and modify it with your own settings:
```sh
cp backend/.env.example .env
```

You need to configure:
- `GITHUB_API_TOKEN`: Your GitHub personal access token
- Database connection strings
- Security settings

5. Initialize databases
```sh
# Create PostgreSQL database
psql -c "CREATE DATABASE gitconnectx;"

# MongoDB should automatically create the database on first use
```

### Running the Application

1. Start the API server
```sh
python -m api.app
```

2. Access the API at http://localhost:5000

## API Endpoints

### User Data
- GET `/api/user/<username>` - Fetch GitHub user data

### Network Analysis
- GET `/api/network/<username>` - Fetch a user's network (followers, following, repositories)
- GET `/api/analyze/path` - Find shortest path between two developers
- GET `/api/analyze/communities` - Detect communities in a user's network
- GET `/api/analyze/rank` - Rank developers in a network using PageRank or HITS

### Repository Data
- GET `/api/repository/<owner>/<repo>` - Fetch repository data
- GET `/api/analyze/languages/<username>` - Analyze programming languages used by a developer

## Algorithms Used
- **Graph Traversal**: BFS, DFS
- **Shortest Path**: Dijkstra's Algorithm
- **Influence Ranking**: PageRank, HITS
- **Community Detection**: Louvain Clustering
- **Data Structures**: Graphs, Hash Maps, Adjacency Lists

## Contributing
Want to contribute? Follow our guidelines and submit a PR!

## License
MIT

## Team
**Team Ananta**
- Ankush Rawat
- Anika Dewari
- Akhil Nautiyal
- Ayush Negi
```


