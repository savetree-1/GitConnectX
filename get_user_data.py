import requests

def get_user_data(token, username):
    # GitHub API authentication header
    headers = {'Authorization': f'token {token}'}

    # Construct the URL to fetch the user's data
    url = f'https://api.github.com/users/{username}'

    # Make the request to GitHub API
    response = requests.get(url, headers=headers)

    # If the request was successful, return the JSON response
    if response.status_code == 200:
        return response.json()
    else:
        # If there was an error, return None
        return None

# Example usage
token = 'your_personal_access_token_here'  # Replace with your GitHub token
username = 'octocat'  # Replace with the desired GitHub username
data = get_user_data(token, username)

# Print the data or handle it further
if data:
    print(data)
else:
    print("Failed to fetch user data.")
