from flask import Flask, request, jsonify
from flask_cors import CORS
import subprocess
import os
import json
import networkx as nx
import pandas as pd
from github import Github
from config import GITHUB_ACCESS_TOKEN, DATA_DIR, PROCESSED_DATA_DIR

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Initialize GitHub client
github_client = Github(GITHUB_ACCESS_TOKEN)

@app.route('/api/analyze', methods=['POST'])
def analyze_user():
    """Analyze a GitHub user"""
    data = request.json
    username = data.get('username')
    compare_username = data.get('compareUsername')
    
    if not username:
        return jsonify({"error": "Username is required"}), 400
    
    try:
        # Step 1: Fetch data using our Python script
        fetch_command = f"python3 enhanced_data_fetcher.py {username}"
        subprocess.run(fetch_command, shell=True, check=True)
        
        # Step 2: Process the data to create graph structures
        process_command = f"python3 data_processor.py"
        subprocess.run(process_command, shell=True, check=True)
        
        # Step 3: Run PageRank on the follow network
        pagerank_command = f"./pagerank {os.path.join(PROCESSED_DATA_DIR, 'follow_network.adjlist')} {os.path.join(PROCESSED_DATA_DIR, 'pagerank_scores.csv')}"
        subprocess.run(pagerank_command, shell=True, check=True)
        
        # Step 4: Load results and prepare response
        user_info = pd.read_csv(os.path.join(DATA_DIR, "user_info.csv")).iloc[0].to_dict()
        pagerank_scores = pd.read_csv(os.path.join(PROCESSED_DATA_DIR, "pagerank_scores.csv"))
        
        # Find user's rank
        if username in pagerank_scores['Node'].values:
            user_rank = pagerank_scores[pagerank_scores['Node'] == username].index[0] + 1
            user_score = float(pagerank_scores[pagerank_scores['Node'] == username]['PageRank'].values[0])
        else:
            user_rank = None
            user_score = None
        
        # Load graph data for visualization
        with open(os.path.join(PROCESSED_DATA_DIR, "follow_network.json"), "r") as f:
            follow_graph = json.load(f)
        
        with open(os.path.join(PROCESSED_DATA_DIR, "commit_network.json"), "r") as f:
            commit_graph = json.load(f)
        
        # Prepare response
        response = {
            "user_info": user_info,
            "rank": {
                "position": user_rank,
                "score": user_score,
                "total_users": len(pagerank_scores)
            },
            "graphs": {
                "follow_network": follow_graph,
                "commit_network": commit_graph
            }
        }
        
        # If compare username was provided, add comparison data
        if compare_username:
            # TODO: Implement comparison logic
            pass
        
        return jsonify(response)
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/user/<username>', methods=['GET'])
def get_user_info(username):
    """Get basic information about a GitHub user"""
    try:
        user = github_client.get_user(username)
        user_data = {
            "login": user.login,
            "name": user.name,
            "avatar_url": user.avatar_url,
            "bio": user.bio,
            "followers": user.followers,
            "following": user.following,
            "public_repos": user.public_repos
        }
        return jsonify(user_data)
    except Exception as e:
        return jsonify({"error": str(e)}), 404

if __name__ == '__main__':
    app.run(debug=True, port=5000)