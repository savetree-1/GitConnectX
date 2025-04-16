import json
import pandas as pd

def process_followers(input_file, output_file):
    with open(input_file, 'r') as f:
        data = json.load(f)

    # Convert to DataFrame
    df = pd.DataFrame(data)
    df = df[['login']]  # Keep only relevant columns
    df.to_csv(output_file, index=False)

def process_repos(input_file, output_file):
    with open(input_file, 'r') as f:
        data = json.load(f)

    # Convert to DataFrame
    df = pd.DataFrame(data)
    df = df[['name', 'html_url', 'language']]  # Keep relevant columns
    df.to_csv(output_file, index=False)

if __name__ == "__main__":
    process_followers("data/octocat_followers.json", "data/octocat_followers.csv")
    process_repos("data/octocat_repos.json", "data/octocat_repos.csv")