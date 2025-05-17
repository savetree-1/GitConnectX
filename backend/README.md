# GitConnectX Backend

The backend for GitConnectX, a GitHub network analysis application that visualizes follower networks, commit patterns, and community structures.

## Features

- **GitHub OAuth Authentication**: Login with GitHub to access personalized data
- **Local Authentication**: Register and login with email/password
- **User Network Analysis**: Retrieve follower/following graphs
- **Community Detection**: Identify communities within GitHub networks using Louvain and Girvan-Newman algorithms
- **Commit Networks**: Analyze repository contribution patterns
- **Developer Influence**: PageRank and HITS algorithms for determining influential developers
- **Path Finding**: Find the shortest connection path between GitHub users

## Technology Stack

- **Framework**: Flask
- **Authentication**: JWT + GitHub OAuth
- **Database**: MongoDB for document storage
- **Graph Analysis**: NetworkX, python-louvain
- **GitHub Integration**: PyGithub

## Setup

### Prerequisites

- Python 3.8+
- MongoDB
- Git

### Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/GitConnectX.git
cd GitConnectX
```

2. Install dependencies:

```bash
pip install -r requirements.txt
```

3. Set up environment variables in a `.env` file:

```
# API Configuration
SECRET_KEY=your_secret_key
DEBUG=True

# Database Configuration (MongoDB)
MONGODB_URI=mongodb://localhost:27017/gitconnectx

# GitHub OAuth
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_REDIRECT_URI=http://localhost:5000/api/auth/github/callback
GITHUB_API_TOKEN=your_github_personal_access_token

# JWT Configuration
JWT_SECRET_KEY=your_jwt_secret
JWT_ALGORITHM=HS256
JWT_EXPIRATION_DELTA=86400
```

4. Make sure MongoDB is running:

```bash
# Start MongoDB (command may vary based on your installation)
mongod --dbpath /path/to/data/directory
```

### Running the Server

Run the backend server:

```bash
python run_backend.py
```

The API will be available at `http://localhost:5000`.

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login with email/password
- `GET /api/auth/github/login` - Initiate GitHub OAuth flow
- `GET /api/auth/github/callback` - GitHub OAuth callback
- `GET /api/auth/status` - Check authentication status
- `POST /api/auth/logout` - Logout

### Network Analysis

- `GET /api/network/followers/{username}` - Get follower network for a user
- `GET /api/network/commits/{username}` - Get commit network for a user
- `GET /api/network/pagerank` - Get PageRank scores for users
- `GET /api/network/communities` - Get community assignments for users
- `GET /api/network/path` - Find shortest path between two users

## Development

### Project Structure

```
backend/
├── api/
│   ├── auth/
│   │   ├── __init__.py
│   │   ├── github_auth.py
│   │   ├── jwt_auth.py
│   │   └── local_auth.py
│   ├── controllers/
│   │   └── network_controller.py
│   ├── models/
│   │   └── user.py
│   ├── routes/
│   │   └── network_routes.py
│   ├── __init__.py
│   └── app.py
├── database_mongo.py
├── github_service.py
├── graph_service.py
├── config.py
└── run.py
```

### Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 