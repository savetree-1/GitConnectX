import requests
GITHUB_TOKEN = "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"
HEADERS = {'Authorization': f'token {GITHUB_TOKEN}'}

def fetch_followers(username):
    url = f'https://api.github.com/users/{username}/followers'
    response = requests.get(url, headers=HEADERS)
    if response.status_code == 200:
        return response.json()
    else:
        raise Exception(f"Error: {response.status_code}, {response.text}")

def fetch_repos(username):
    url = f'https://api.github.com/users/{username}/repos'
    response = requests.get(url, headers=HEADERS)
    if response.status_code == 200:
        return response.json()
    else:
        raise Exception(f"Error: {response.status_code}, {response.text}")

if __name__ == "__main__":
    username = "octocat"
    try:
        followers = fetch_followers(username)
        repos = fetch_repos(username)
        print(f"Followers: {followers}")
        print(f"Repositories: {repos}")
    except Exception as e:
        print(e)