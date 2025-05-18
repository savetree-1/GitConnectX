from github import Github

# Specify your own access token here

ACCESS_TOKEN = ''

client = Github(ACCESS_TOKEN, per_page=100)

# Specify a username and repository of interest for that user.

USER = 'ahmadawais'
REPO = 'hacktoberfest'

user = client.get_user(USER)
repo = user.get_repo(REPO)

import networkx as nx

g_stargazers = nx.DiGraph()

g_stargazers.add_node(repo.name + '(repo)', type='repo', lang=repo.language, owner=user.login)

stargazers = [ s for s in repo.get_stargazers() ]
print ("Number of stargazers", len(stargazers))
for sg in stargazers:
    g_stargazers.add_node(sg.login + '(user)', type='user')
    g_stargazers.add_edge(sg.login + '(user)', repo.name + '(repo)', type='gazes')

%matplotlib inline
import matplotlib.pyplot as plt
plt.figure(figsize=(15,10))
nx.draw(g_stargazers, with_labels=True, node_size=30)
plt.show()

import networkx as nx

g_forks = nx.DiGraph()

g_forks.add_node(repo.name + '(repo)', type='repo', lang=repo.language, owner=user.login)
# Get a list of people who have bookmarked the repo.
# Since you'll get a lazy iterator back, you have to traverse
# it if you want to get the total number of stargazers.

forks = [ s for s in repo.get_forks() ]
print ("Number of forks", len(forks))
for fork in forks:
    g_forks.add_node(fork.full_name , type='user')
    g_forks.add_edge(fork.full_name, repo.name + '(repo)', type='forks')

%matplotlib inline
import matplotlib.pyplot as plt
plt.figure(figsize=(15,10))
nx.draw(g_forks, with_labels=True, node_size=1000)
plt.show()

# Specify a username

USER = 'Dhanya-Abhirami'

user = client.get_user(USER)

import networkx as nx

g_followers = nx.Graph()

g_followers.add_node(user.login + '(user)', type='user')
# Get a list of people who have bookmarked the repo.
# Since you'll get a lazy iterator back, you have to traverse
# it if you want to get the total number of stargazers.

followers = [ s for s in user.get_followers() ]
print ("Number of followers", len(followers))
for follower in followers:
    g_followers.add_node(follower.login + '(user)', type='user')
    g_followers.add_edge(follower.login + '(user)', user.login + '(repo)', type='follows')
%matplotlib inline
import matplotlib.pyplot as plt
plt.figure(figsize=(15,10))
nx.draw(g_followers, with_labels=True, node_size=1)
plt.show()

for follower in followers:
    followers_2 = [ s for s in follower.get_followers() ]
    for follower_2 in followers_2:
        g_followers.add_node(follower_2.login + '(user)', type='user')
        g_followers.add_edge(follower_2.login + '(user)', follower.login + '(repo)', type='follows')
%matplotlib inline
import matplotlib.pyplot as plt
plt.figure(figsize=(15,10))
nx.draw(g_followers, with_labels=True, node_size=1)
plt.show()

print (nx.info(g_followers))

from operator import itemgetter
from IPython.display import HTML
from IPython.core.display import display

print ("Degree Centrality")
print (sorted(nx.degree_centrality(g_followers).items(),key=itemgetter(1), reverse=True)[:10])

print ("Betweenness Centrality")
print (sorted(nx.betweenness_centrality(g_followers).items(), key=itemgetter(1), reverse=True)[:10])

print ("Closeness Centrality")
print (sorted(nx.closeness_centrality(g_followers).items(), key=itemgetter(1), reverse=True)[:10])

import operator
pr = nx.pagerank(g_followers)
sorted_x = sorted(pr.items(), key=operator.itemgetter(1),reverse=True)
print(sorted_x[:10])

hub, authority = nx.hits(g_followers)
sorted_hub = sorted(hub.items(), key=operator.itemgetter(1),reverse=True)
print("Most Influential Users based on Hub Score")
print(sorted_hub[:10])
print()
sorted_authority = sorted(authority.items(), key=operator.itemgetter(1),reverse=True)
print("Most Influential Users based on Authority Score")
print(sorted_authority[:10])

from networkx.algorithms.community.centrality import girvan_newman
import itertools
comp = girvan_newman(g_followers) 
k = 5
limited = itertools.takewhile(lambda c: len(c) <= k, comp)
print("Number of users in community")
i=1
for communities in limited:
    print("\nIteration",i,"\n\n")
    i+=1
    for c in communities:
        print(len(c))

