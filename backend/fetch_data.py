from github import Github
import csv
ACCESS_TOKEN = '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'
USERNAME = 'savetree-1'
REPO_NAME = 'OpenNutriTracker'
client = Github(ACCESS_TOKEN)
user = client.get_user(USERNAME)
repo = user.get_repo(REPO_NAME)
def fetch_followers(user):
    followers = user.get_followers()
    return [follower.login for follower in followers]
def fetch_stargazers(repo):
    stargazers = repo.get_stargazers()
    return [stargazer.login for stargazer in stargazers]
def fetch_contributors(repo):
    contributors = repo.get_contributors()
    return [contributor.login for contributor in contributors]
def fetch_forks(repo):
    forks = repo.get_forks()
    return [fork.owner.login for fork in forks]
def save_to_csv(filename, data):
    with open(filename, mode="w", newline="", encoding="utf-8") as file:
        writer = csv.writer(file)
        writer.writerow(["Source", "Target"])  
        writer.writerows(data)
    print(f"Data saved to {filename}")
if __name__ == "__main__":
    followers = fetch_followers(user)
    save_to_csv("followers.csv", [[USERNAME, follower] for follower in followers])
    stargazers = fetch_stargazers(repo)
    save_to_csv("stargazers.csv", [[REPO_NAME, stargazer] for stargazer in stargazers])
    contributors = fetch_contributors(repo)
    save_to_csv("contributors.csv", [[REPO_NAME, contributor] for contributor in contributors])
    forks = fetch_forks(repo)
    save_to_csv("forks.csv", [[REPO_NAME, fork] for fork in forks])
    print("GitHub data fetching completed!")