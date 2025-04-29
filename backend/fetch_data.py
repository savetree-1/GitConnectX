import os
import csv
from github import Github
from dotenv import load_dotenv

# Load environment variables from .env
load_dotenv()
ACCESS_TOKEN = os.getenv('GITHUB_TOKEN')

# GitHub config
USERNAME = 'savetree-1'
REPO_NAME = 'OpenNutriTracker'
client = Github(ACCESS_TOKEN)
user = client.get_user(USERNAME)
repo = user.get_repo(REPO_NAME)

def fetch_followers(user):
    return [f.login for f in user.get_followers()]

def fetch_stargazers(repo):
    return [s.login for s in repo.get_stargazers()]

def fetch_contributors(repo):
    return [c.login for c in repo.get_contributors()]

def fetch_forks(repo):
    return [f.owner.login for f in repo.get_forks()]

def save_to_csv(filename, data):
    os.makedirs("dataset", exist_ok=True)
    path = os.path.join("dataset", filename)
    with open(path, mode="w", newline="", encoding="utf-8") as file:
        writer = csv.writer(file)
        writer.writerow(["Source", "Target"])
        writer.writerows(data)
    print(f"✅ Data saved to {path}")

if __name__ == "__main__":
    print("🔄 Fetching GitHub network data...")

    followers = fetch_followers(user)
    save_to_csv("followers.csv", [[USERNAME, f] for f in followers])

    stargazers = fetch_stargazers(repo)
    save_to_csv("stargazers.csv", [[REPO_NAME, s] for s in stargazers])

    contributors = fetch_contributors(repo)
    save_to_csv("contributors.csv", [[REPO_NAME, c] for c in contributors])

    forks = fetch_forks(repo)
    save_to_csv("forks.csv", [[REPO_NAME, f] for f in forks])

    print("✅ GitHub data fetching completed successfully!")
