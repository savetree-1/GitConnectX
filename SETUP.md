# GitConnectX Setup Guide

This guide will help you set up and run the GitConnectX application on your local machine.

## Prerequisites

Make sure you have the following installed:

- Python 3.9+ 
- Node.js 14+ and npm
- Git
- MongoDB (optional, app will run in fallback mode without it)

## Step 1: Clone the Repository

```bash
git clone https://github.com/yourusername/GitConnectX.git
cd GitConnectX
```

## Step 2: Backend Setup

### Install Python Dependencies

```bash
# Install required packages
pip install -r requirements.txt
```

### Configure GitHub API Token (Optional but Recommended)

For full functionality, you'll need a GitHub API token:

1. Go to GitHub → Settings → Developer settings → Personal access tokens
2. Generate a new token with these scopes: `repo`, `user`, `read:org`
3. Create a `.env` file in the project root with:

```
GITHUB_API_TOKEN=your_token_here
```

## Step 3: Frontend Setup

```bash
cd frontend
npm install
```

## Step 4: Running the Application

### Start the Backend API Server

```bash
# From the project root:
start_api.bat   # On Windows
# OR
python run_app.py   # On any platform
```

You should see a message that the API is running at http://localhost:5000

### Start the Frontend Dev Server

```bash
# In a new terminal, from the project root:
cd frontend
npm run dev
```

The frontend will be available at http://localhost:3000

## Step 5: Using the Application

1. Open your browser and navigate to http://localhost:3000
2. Enter a GitHub username to visualize their network
3. Toggle comparison mode to view side-by-side networks

## Troubleshooting

### Backend Issues

If you encounter backend errors:

```bash
# Clear cache and restart the API
restart_api.bat   # On Windows
```

### Frontend Issues

If the frontend doesn't display data correctly:

```bash
# In the frontend directory:
npm run clean
npm run dev
```

### MongoDB Issues

If you want to use MongoDB but encounter connection errors:

1. Make sure MongoDB is running on your machine
2. The connection string can be customized in `.env`:
```
MONGODB_URI=mongodb://localhost:27017/gitconnectx
```

## Common Commands Reference

- Start API: `python run_app.py` or `start_api.bat`
- Restart API: `restart_api.bat`
- Start Frontend: `cd frontend && npm run dev`
- Run both (Windows): `start_app.bat` 