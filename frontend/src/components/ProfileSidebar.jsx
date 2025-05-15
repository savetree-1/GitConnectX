import {
  Users,
  Star,
  GitBranch,
  Folder,
} from "lucide-react"

export default function ProfileSidebar({
  profilePicUrl = "",
  name = "Alex Doe",
  username = "alexdoe",
  rankBadge = "Top Contributor",
  stats = { repos: 15, followers: 88, stars: 4, forks: 4 },
  graph = { nodes: 5, edges: 4, density: 40 },
}) {
  return (
    <div className="w-full h-full bg-white rounded-2xl shadow-lg p-25 flex flex-col items-center space-y-5 border-blue-500 border-2">
      
      {/* Avatar */}
      <div className="w-50 h-50 rounded-full overflow-hidden border-4 border-blue-500">
        {profilePicUrl ? (
          <img
            src={profilePicUrl}
            alt={name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center text-4xl text-gray-600">
            {name.slice(0, 2).toUpperCase()}
          </div>
        )}
      </div>

      {/* Name & Username */}
      <div className="text-center">
        <h2 className="text-4xl font-bold text-gray-900">{name}</h2>
        <p className="text-gray-500 text-2xl">@{username}</p>
      </div>

      {/* Rank Badge */}
      <span className="bg-blue-100 text-blue-800 text-3xl font-semibold px-3 py-1 rounded-full">
        {rankBadge}
      </span>

      {/* Stats Section */}
<div className="w-full">
  <div className="border-t border-gray-500 -mx-4 mb-4"></div> {/* Extended line */}
  <div className="grid grid-cols-1 gap-5 text-xl text-gray-700 px-4">
        <div className="flex items-center gap-2">
          <Folder className="w-8 h-8" />
          <span>{stats.repos} Repos</span>
        </div>
        <div className="flex items-center gap-2">
          <Users className="w-8 h-8" />
          <span>{stats.followers} Followers</span>
        </div>
        <div className="flex items-center gap-2">
          <Star className="w-8 h-8" />
          <span>{stats.stars} Stars</span>
        </div>
        <div className="flex items-center gap-2">
          <GitBranch className="w-8 h-8" />
          <span>{stats.forks} Forks</span>
        </div>
      </div>
      </div>

      {/* Graph Summary */}
      <div className="w-full">
  <div className="border-t border-gray-500 -mx-4 mb-4"></div> {/* Extended line */}
  <div className="text-xl text-center text-gray-700 space-y-2 px-4">
        <p className="font-semibold text-2xl text-gray-800">Graph Summary</p>
        <p>Nodes: {graph.nodes}</p>
        <p>Edges: {graph.edges}</p>
        <p>Density: {graph.density.toFixed(2)}</p>
      </div>
    </div>
    </div>
  )
}
