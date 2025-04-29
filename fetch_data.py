# Import necessary libraries
from github import Github
import csv

# Step 1: Hardcoded GitHub Access Token, User, and Repository
ACCESS_TOKEN = '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'
USERNAME = 'savetree-1'
REPO_NAME = 'OpenNutriTracker'

# Step 2: Initialize GitHub Client
client = Github(ACCESS_TOKEN)

# Step 3: Fetch User and Repository
user = client.get_user(USERNAME)
repo = user.get_repo(REPO_NAME)

# Step 4: Fetch Followers
def fetch_followers(user):
    followers = user.get_followers()
    return [follower.login for follower in followers]

# Step 5: Fetch Stargazers
def fetch_stargazers(repo):
    stargazers = repo.get_stargazers()
    return [stargazer.login for stargazer in stargazers]

# Step 6: Fetch Contributors
def fetch_contributors(repo):
    contributors = repo.get_contributors()
    return [contributor.login for contributor in contributors]

# Step 7: Fetch Forks
def fetch_forks(repo):
    forks = repo.get_forks()
    return [fork.owner.login for fork in forks]

# Step 8: Save Data to CSV
def save_to_csv(filename, data):
    with open(filename, mode="w", newline="", encoding="utf-8") as file:
        writer = csv.writer(file)
        writer.writerow(["Source", "Target"])  # Add headers for edges
        writer.writerows(data)
    print(f"Data saved to {filename}")

# Step 9: Main
if __name__ == "__main__":
    # Fetch and save followers
    followers = fetch_followers(user)
    save_to_csv("followers.csv", [[USERNAME, follower] for follower in followers])

    # Fetch and save stargazers
    stargazers = fetch_stargazers(repo)
    save_to_csv("stargazers.csv", [[REPO_NAME, stargazer] for stargazer in stargazers])

    # Fetch and save contributors
    contributors = fetch_contributors(repo)
    save_to_csv("contributors.csv", [[REPO_NAME, contributor] for contributor in contributors])

    # Fetch and save forks
    forks = fetch_forks(repo)
    save_to_csv("forks.csv", [[REPO_NAME, fork] for fork in forks])

    print("GitHub data fetching completed!")