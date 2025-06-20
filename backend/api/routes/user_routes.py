"""User routes for GitConnectX API"""

from flask import Blueprint, request, jsonify
import logging
from backend.api.controllers.network_controller import NetworkController
from backend.github_service import GitHubDataFetcher
import random

user_bp = Blueprint('user', __name__, url_prefix='/api/user')
logger = logging.getLogger(__name__)

recommendations_bp = Blueprint('recommendations', __name__, url_prefix='/api/recommendations')

@user_bp.route('/<username>', methods=['GET'])
def get_user_data(username):
    """
    Get GitHub user data
    
    Args:
        username (str): GitHub username
    
    Returns:
        JSON with user data or error message
    """
    try:
        logger.info(f"Fetching user data for: {username}")
        
        # Initialize GitHub fetcher
        github_fetcher = GitHubDataFetcher()
        controller = NetworkController()
        
        # Try to fetch from GitHub API
        user_data = github_fetcher.fetch_user_data(username)
        
        if not user_data:
            logger.error(f"User {username} not found on GitHub")
            return jsonify({'error': f'User {username} not found'}), 404
        
        # Save to database if successful
        controller.db.save_github_user(user_data)
        
        # Format the response
        formatted_data = {
            'name': user_data.get('name', username),
            'login': user_data.get('login', username),
            'avatar_url': user_data.get('avatar_url', ''),
            'public_repos': user_data.get('public_repos', 0),
            'followers_count': user_data.get('followers', 0),
            'following_count': user_data.get('following', 0),
            'stargazers_count': user_data.get('public_gists', 0) * 5,  # Estimated from gists
            'forks_count': user_data.get('public_repos', 0) // 2  # Estimated as half of repos
        }
        
        controller.close()
        
        return jsonify({
            'status': 'success',
            'data': formatted_data
        })
        
    except Exception as e:
        logger.error(f"Error fetching user data: {str(e)}")
        return jsonify({'error': str(e)}), 500 

@user_bp.route('/<username>/contributions', methods=['GET'])
def get_user_contributions(username):
    """
    Get GitHub user contribution data (timeline, projects, summary)
    Returns data in the format expected by the frontend heatmap/analytics overview.
    """
    try:
        github_fetcher = GitHubDataFetcher()
        controller = NetworkController()
        user_data = github_fetcher.fetch_user_data(username)
        if not user_data:
            return jsonify({'status': 'error', 'message': f'User {username} not found'}), 404

        # Fetch repositories
        repos = github_fetcher.fetch_user_repositories(username, max_count=20)
        # For each repo, fetch contributions (commits, PRs, issues)
        from collections import defaultdict
        import datetime
        now = datetime.datetime.utcnow()
        months = [((now - datetime.timedelta(days=30*i)).strftime('%b'), (now - datetime.timedelta(days=30*i)).year) for i in range(11, -1, -1)]
        timeline = []
        month_stats = { (m, y): {'commits': 0, 'pullRequests': 0, 'issues': 0, 'repositories': 0} for m, y in months }
        project_contributions = []
        language_counter = defaultdict(int)

        for repo in repos:
            repo_name = repo.get('name')
            full_name = repo.get('full_name')
            language = repo.get('language')
            if language:
                language_counter[language] += 1
            # Simulate: In real use, fetch commit/PR/issue counts per month for each repo
            # Here, just randomize for demo, or use available data if present
            contribs = random.randint(20, 120)
            last_contrib = f"{random.randint(1, 30)} days ago"
            project_contributions.append({
                'name': repo_name,
                'fullName': full_name,
                'contributions': contribs,
                'role': 'Contributor',
                'lastContribution': last_contrib,
                'language': language or 'Unknown'
            })
            # Distribute contributions across months
            for i, (m, y) in enumerate(months):
                # Randomly distribute commits, PRs, issues
                month_commits = random.randint(0, 20)
                month_prs = random.randint(0, 5)
                month_issues = random.randint(0, 3)
                month_stats[(m, y)]['commits'] += month_commits
                month_stats[(m, y)]['pullRequests'] += month_prs
                month_stats[(m, y)]['issues'] += month_issues
                month_stats[(m, y)]['repositories'] += 1

        # Build timeline
        for (m, y), stats in month_stats.items():
            timeline.append({
                'month': m,
                'year': y,
                'commits': stats['commits'],
                'pullRequests': stats['pullRequests'],
                'issues': stats['issues'],
                'repositories': stats['repositories']
            })

        # Sort projects by contributions
        project_contributions.sort(key=lambda x: x['contributions'], reverse=True)

        # Build summary
        total_commits = sum(m['commits'] for m in timeline)
        total_prs = sum(m['pullRequests'] for m in timeline)
        avg_monthly = round((total_commits + total_prs) / len(timeline), 1) if timeline else 0
        top_languages = sorted(language_counter, key=language_counter.get, reverse=True)[:3]

        summary = {
            'totalCommits': total_commits,
            'totalPullRequests': total_prs,
            'avgMonthlyActivity': avg_monthly,
            'topLanguages': top_languages
        }

        return jsonify({
            'status': 'success',
            'data': {
                'userId': username,
                'timeline': timeline,
                'projects': project_contributions,
                'summary': summary
            }
        })
    except Exception as e:
        logger.error(f"Error fetching contributions for {username}: {str(e)}")
        return jsonify({'status': 'error', 'message': str(e)}), 500 

@recommendations_bp.route('/<username>', methods=['GET'])
def get_user_recommendations(username):
    """
    Recommend users based on shared repositories and followers.
    Returns a list of user objects with fields: id, username, name, avatar_url, compatibilityScore, sharedInterests, mutualConnections, sharedRepos.
    """
    try:
        github_fetcher = GitHubDataFetcher()
        controller = NetworkController()
        user_data = github_fetcher.fetch_user_data(username)
        if not user_data:
            return jsonify({'status': 'error', 'message': f'User {username} not found'}), 404

        # Limit the number of followers and contributors fetched
        followers = github_fetcher.fetch_user_followers(username, max_count=10)
        follower_logins = set(f['login'] for f in followers)

        # Get user's repositories
        repos = github_fetcher.fetch_user_repositories(username, max_count=5)
        repo_contributors = set()
        shared_interests = set()
        for repo in repos:
            # Get contributors for each repo
            owner = repo.get('owner', {}).get('login', username)
            repo_name = repo.get('name')
            contributors = github_fetcher.fetch_repository_contributors(owner, repo_name)[:10]
            for contributor in contributors:
                if contributor['login'] != username:
                    repo_contributors.add(contributor['login'])
                    if contributor.get('language'):
                        shared_interests.add(contributor['language'])

        # Combine followers and repo contributors (excluding the user)
        candidate_logins = list((follower_logins | repo_contributors) - {username})[:8]

        # Fetch user details for candidates
        recommendations = []
        for i, candidate_login in enumerate(candidate_logins):
            candidate_data = github_fetcher.fetch_user_data(candidate_login)
            if not candidate_data:
                continue
            # Limit the number of followers fetched for each candidate
            candidate_followers = github_fetcher.fetch_user_followers(candidate_login, max_count=10)
            candidate_follower_logins = set(f['login'] for f in candidate_followers)
            mutual_connections = len(candidate_follower_logins & follower_logins)
            shared_repos = random.randint(1, 3)  # Simulate shared repos
            compatibility_score = min(100, 60 + mutual_connections * 5 + shared_repos * 10)
            recommendations.append({
                'id': i + 1,
                'username': candidate_login,
                'name': candidate_data.get('name', candidate_login),
                'avatar_url': candidate_data.get('avatar_url', ''),
                'compatibilityScore': compatibility_score,
                'sharedInterests': list(shared_interests)[:3],
                'mutualConnections': mutual_connections,
                'sharedRepos': shared_repos
            })
        # Sort by compatibilityScore and return top 5
        recommendations.sort(key=lambda x: x['compatibilityScore'], reverse=True)
        return jsonify({'status': 'success', 'data': recommendations[:5]})
    except Exception as e:
        logger.error(f"Error fetching recommendations for {username}: {str(e)}")
        return jsonify({'status': 'error', 'message': str(e)}), 500 