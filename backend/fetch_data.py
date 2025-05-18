from github import Github
from github.GithubException import GithubException
import csv

# ::::: GitHub API Access Token
ACCESS_TOKEN = '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'

# ::::: Fetch Followers
def fetch_followers(user):
    try:
        print("Fetching followers...")
        followers = []
        for count, f in enumerate(user.get_followers(), 1):
            followers.append(f.login)
            if count % 10 == 0:
                print(f"Fetched {count} followers...", end='\r')
        print(f"Total followers fetched: {len(followers)}")
        return followers
    except GithubException as e:
        print(f"Error fetching followers: {e}")
        return []

# ::::: Fetch Stargazers
def fetch_stargazers(repo):
    try:
        print("Fetching stargazers...")
        stargazers = []
        for count, s in enumerate(repo.get_stargazers(), 1):
            stargazers.append(s.login)
            if count % 10 == 0:
                print(f"Fetched {count} stargazers...", end='\r')
        print(f"Total stargazers fetched: {len(stargazers)}")
        return stargazers
    except GithubException as e:
        print(f"Error fetching stargazers: {e}")
        return []

# ::::: Fetch Contributors
def fetch_contributors(repo):
    try:
        print("Fetching contributors...")
        contributors = []
        for count, c in enumerate(repo.get_contributors(), 1):
            contributors.append(c.login)
            if count % 10 == 0:
                print(f"Fetched {count} contributors...", end='\r')
        print(f"Total contributors fetched: {len(contributors)}")
        return contributors
    except GithubException as e:
        print(f"Error fetching contributors: {e}")
        return []

# ::::: Fetch Forks
def fetch_forks(repo):
    try:
        print("Fetching forks...")
        forks = []
        for count, f in enumerate(repo.get_forks(), 1):
            forks.append(f.owner.login)
            if count % 10 == 0:
                print(f"Fetched {count} forks...", end='\r')
        print(f"Total forks fetched: {len(forks)}")
        return forks
    except GithubException as e:
        print(f"Error fetching forks: {e}")
        return []

# ::::: Save Data to CSV
def save_to_csv(filename, data):
    if not data:
        print(f"No data to save for {filename}. Skipping...")
        return
    with open(filename, mode="w", newline="", encoding="utf-8") as file:
        writer = csv.writer(file)
        writer.writerow(["Source", "Target"])
        writer.writerows(data)
    print(f"Data saved to {filename}")

# ::::: Main Data Fetch Function
def fetch_data(username, repo_name):
    try:
        print("Connecting to GitHub...")
        client = Github(ACCESS_TOKEN)
        
        rate = client.get_rate_limit()
        remaining = rate.core.remaining
        print(f"API rate limit: {remaining} requests remaining")
        if remaining == 0:
            print("Rate limit exceeded. Try again later.")
            return

        user = client.get_user(username)
        repo = user.get_repo(repo_name)

        followers = fetch_followers(user)
        save_to_csv("followers.csv", [[username, follower] for follower in followers])

        stargazers = fetch_stargazers(repo)
        save_to_csv("stargazers.csv", [[repo_name, stargazer] for stargazer in stargazers])

        contributors = fetch_contributors(repo)
        save_to_csv("contributors.csv", [[repo_name, contributor] for contributor in contributors])

        forks = fetch_forks(repo)
        save_to_csv("forks.csv", [[repo_name, fork] for fork in forks])

        print("✅ GitHub data fetching completed!")

    except GithubException as e:
        print(f"GitHub API error: {e}")
    except Exception as e:
        print(f"Unhandled error: {e}")

# ::::: Entry Point
if __name__ == "__main__":
    # ::::: Example usage
    fetch_data("torvalds", "linux")
