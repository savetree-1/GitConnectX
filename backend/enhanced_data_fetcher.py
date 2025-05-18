from github import Github
from github.GithubException import GithubException
import time
import csv
import os
from config import GITHUB_ACCESS_TOKEN, MAX_FOLLOWERS_TO_FETCH, MAX_FOLLOWING_TO_FETCH, MAX_REPOS_TO_FETCH, API_REQUEST_DELAY, DATA_DIR

class GitHubDataFetcher:
    def __init__(self, token=GITHUB_ACCESS_TOKEN):
        self.client = Github(token)
        self.rate_limit_remaining = self.check_rate_limit()
    
    def check_rate_limit(self):
        # ::::: Check API rate limit
        rate = self.client.get_rate_limit()
        remaining = rate.core.remaining
        print(f"API rate limit: {remaining} requests remaining")
        return remaining
    
    def fetch_user_data(self, username):
        # ::::: Fetch user data
        try:
            user = self.client.get_user(username)
            user_data = {
                "login": user.login,
                "name": user.name,
                "bio": user.bio,
                "location": user.location,
                "followers_count": user.followers,
                "following_count": user.following,
                "public_repos_count": user.public_repos,
                "created_at": user.created_at.isoformat(),
                "updated_at": user.updated_at.isoformat() if user.updated_at else None
            }
            
            # ::::: Fetch followers and following
            followers = self.fetch_followers(user)
            following = self.fetch_following(user)
            repositories = self.fetch_repositories(user)
            
            return {
                "user_info": user_data,
                "followers": followers,
                "following": following,
                "repositories": repositories
            }
            
        except GithubException as e:
            print(f"GitHub API error: {e}")
            return None
    
    def fetch_followers(self, user, limit=MAX_FOLLOWERS_TO_FETCH):
        # ::::: Fetch followers
        followers = []
        try:
            for count, follower in enumerate(user.get_followers(), 1):
                if count > limit:
                    break
                followers.append({
                    "login": follower.login,
                    "id": follower.id,
                    "type": "follower"
                })
                time.sleep(API_REQUEST_DELAY)
                if count % 10 == 0:
                    print(f"Fetched {count} followers...", end='\r')
            print(f"Total followers fetched: {len(followers)}")
            return followers
        except GithubException as e:
            print(f"Error fetching followers: {e}")
            return followers
    
    def fetch_following(self, user, limit=MAX_FOLLOWING_TO_FETCH):
        # ::::: Fetch following
        following = []
        try:
            for count, followed_user in enumerate(user.get_following(), 1):
                if count > limit:
                    break
                following.append({
                    "login": followed_user.login,
                    "id": followed_user.id,
                    "type": "following"
                })
                time.sleep(API_REQUEST_DELAY)
                if count % 10 == 0:
                    print(f"Fetched {count} following...", end='\r')
            print(f"Total following fetched: {len(following)}")
            return following
        except GithubException as e:
            print(f"Error fetching following: {e}")
            return following
    
    def fetch_repositories(self, user, limit=MAX_REPOS_TO_FETCH):
        # ::::: Fetch repositories
        repositories = []
        try:
            for count, repo in enumerate(user.get_repos(), 1):
                if count > limit:
                    break
                
                repo_data = {
                    "name": repo.name,
                    "full_name": repo.full_name,
                    "description": repo.description,
                    "language": repo.language,
                    "stars": repo.stargazers_count,
                    "forks": repo.forks_count,
                    "watchers": repo.watchers_count,
                    "created_at": repo.created_at.isoformat(),
                    "updated_at": repo.updated_at.isoformat() if repo.updated_at else None
                }
                
                # ::::: Fetch additional data if available
                if repo.stargazers_count > 0:
                    repo_data["stargazers"] = self.fetch_stargazers(repo)
                
                if repo.forks_count > 0:
                    repo_data["forkers"] = self.fetch_forks(repo)
                
                repositories.append(repo_data)
                time.sleep(API_REQUEST_DELAY)
                if count % 5 == 0:
                    print(f"Fetched {count} repositories...", end='\r')
            
            print(f"Total repositories fetched: {len(repositories)}")
            return repositories
        except GithubException as e:
            print(f"Error fetching repositories: {e}")
            return repositories
    
    # ::::: Fetch stargazers and contributors
    def fetch_stargazers(self, repo):
        # ::::: Fetch stargazers
        pass
    
    def fetch_contributors(self, repo):
        # ::::: Fetch contributors
        pass
    
    def fetch_forks(self, repo):
        # ::::: Fetch forkers
        pass
    
    def save_to_csv(self, data_dict, output_dir=DATA_DIR):
        # ::::: Save data to CSV
        os.makedirs(output_dir, exist_ok=True)
        
        # ::::: Save user info
        if "user_info" in data_dict:
            user_info = data_dict["user_info"]
            with open(os.path.join(output_dir, "user_info.csv"), "w", newline="", encoding="utf-8") as f:
                writer = csv.DictWriter(f, fieldnames=user_info.keys())
                writer.writeheader()
                writer.writerow(user_info)
        
        # ::::: Save followers
        if "followers" in data_dict and data_dict["followers"]:
            with open(os.path.join(output_dir, "followers.csv"), "w", newline="", encoding="utf-8") as f:
                writer = csv.DictWriter(f, fieldnames=data_dict["followers"][0].keys())
                writer.writeheader()
                writer.writerows(data_dict["followers"])
        # ::::: Save following
        if "following" in data_dict and data_dict["following"]:
            with open(os.path.join(output_dir, "following.csv"), "w", newline="", encoding="utf-8") as f:
                writer = csv.DictWriter(f, fieldnames=data_dict["following"][0].keys())
                writer.writeheader()
                writer.writerows(data_dict["following"])
        # ::::: Save repositories
        if "repositories" in data_dict and data_dict["repositories"]:
            # ::::: Extract basic repo info
            basic_repo_info = []
            for repo in data_dict["repositories"]:
                repo_copy = repo.copy()
                # ::::: Remove nested data
                if "stargazers" in repo_copy:
                    del repo_copy["stargazers"]
                if "forkers" in repo_copy:
                    del repo_copy["forkers"]
                basic_repo_info.append(repo_copy)
            if basic_repo_info:
                with open(os.path.join(output_dir, "repositories.csv"), "w", newline="", encoding="utf-8") as f:
                    writer = csv.DictWriter(f, fieldnames=basic_repo_info[0].keys())
                    writer.writeheader()
                    writer.writerows(basic_repo_info) 
        print(f"✅ All data saved to {output_dir}")

def main():
    username = input("Enter GitHub username: ")
    fetcher = GitHubDataFetcher()
    print(f"Fetching comprehensive data for user: {username}")
    user_data = fetcher.fetch_user_data(username)
    if user_data:
        fetcher.save_to_csv(user_data)
        print("Data collection completed!")
    else:
        print("Failed to fetch user data.")

if __name__ == "__main__":
    main()
