cmake_minimum_required(VERSION 3.10)
project(GitConnectX_Algorithms)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Add all source files
set(SOURCES
    graph_build.cpp
    bfs_dfs.cpp
    dijkstra.cpp
    pagerank.cpp
    hits.cpp
    kcore.cpp
    louvain.cpp
)

# Create the library
add_library(gitconnectx_algorithms STATIC ${SOURCES})

# Include directories
target_include_directories(gitconnectx_algorithms PUBLIC ${CMAKE_CURRENT_SOURCE_DIR})

# Create example executable
add_executable(example example.cpp)
target_link_libraries(example gitconnectx_algorithms) 