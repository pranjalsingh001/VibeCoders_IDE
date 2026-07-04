// src/pages/DashboardPage.tsx
// ---------------------------
// Enhanced Dashboard with improved project management, status badges, 
// streamlined actions, and better search/filter functionality.

import { useEffect, useMemo, useState } from "react";
import useProjectStore from "../stores/projectStore";
import Button from "../components/ui/Button";
import StatusBadge from "../components/ui/StatusBadge";
import CreateProjectModal from "../components/ui/CreateProjectModal";
import { QueueMonitor } from "../components/QueueMonitor";
import { useNavigate } from "react-router-dom";
import { getProjectDisplayStatus, getStageDisplayName, formatLastUpdated } from "../utils/projectUtils";
import { ProjectStatus } from "../stores/projectStore";

const DashboardPage = () => {
  const { projects, fetchProjects, loading, error, deleteProject } = useProjectStore((state) => ({
    projects: state.projects,
    fetchProjects: state.fetchProjects,
    loading: state.loading,
    error: state.error,
    deleteProject: state.deleteProject,
  }));

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | ProjectStatus>("all");
  const [stageFilter, setStageFilter] = useState<"all" | string>("all");
  const [sortBy, setSortBy] = useState<"name" | "updated" | "created">("updated");
  const [showQueueMonitor, setShowQueueMonitor] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    fetchProjects();
  }, []); // fetchProjects is stable from Zustand store

  const handleDelete = async (projectId: string, projectName: string) => {
    if (window.confirm(`Are you sure you want to delete the project "${projectName}"? This action cannot be undone.`)) {
      try {
        await deleteProject(projectId);
      } catch (error) {
        alert("Failed to delete project. Please try again.");
      }
    }
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let result = projects.filter((p) => {
      if (!p || !p._id) return false;
      
      // Status filter
      if (statusFilter !== "all") {
        const displayStatus = getProjectDisplayStatus(p);
        if (displayStatus.status !== statusFilter) return false;
      }
      
      // Stage filter
      if (stageFilter !== "all" && p.currentStage !== stageFilter) return false;
      
      // Search query
      if (!q) return true;
      return (
        (p.name || "").toLowerCase().includes(q) ||
        (p.idea || "").toLowerCase().includes(q) ||
        (p.description || "").toLowerCase().includes(q) ||
        (p.owner || "").toLowerCase().includes(q)
      );
    });

    // Sort results
    result.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return (a.name || "").localeCompare(b.name || "");
        case "created":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "updated":
        default:
          return new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime();
      }
    });

    return result;
  }, [projects, query, statusFilter, stageFilter, sortBy]);

  const projectStats = useMemo(() => {
    const stats = {
      total: projects.length,
      planned: 0,
      blueprintReady: 0,
      inProgress: 0,
      completed: 0
    };

    projects.forEach(project => {
      const displayStatus = getProjectDisplayStatus(project);
      switch (displayStatus.status) {
        case 'planned':
          stats.planned++;
          break;
        case 'blueprint-ready':
          stats.blueprintReady++;
          break;
        case 'in-progress':
          stats.inProgress++;
          break;
        case 'completed':
          stats.completed++;
          break;
      }
    });

    return stats;
  }, [projects]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Your Projects</h1>
          <p className="text-gray-600 mt-1">
            Manage your development projects through the complete workflow
          </p>
          
          {/* Project Stats */}
          <div className="flex flex-wrap gap-4 mt-3">
            <div className="text-sm text-gray-600">
              <span className="font-medium">{projectStats.total}</span> total projects
            </div>
            {projectStats.planned > 0 && (
              <div className="text-sm text-gray-600">
                <span className="font-medium text-gray-800">{projectStats.planned}</span> planned
              </div>
            )}
            {projectStats.blueprintReady > 0 && (
              <div className="text-sm text-gray-600">
                <span className="font-medium text-purple-800">{projectStats.blueprintReady}</span> blueprint ready
              </div>
            )}
            {projectStats.inProgress > 0 && (
              <div className="text-sm text-gray-600">
                <span className="font-medium text-blue-800">{projectStats.inProgress}</span> in progress
              </div>
            )}
            {projectStats.completed > 0 && (
              <div className="text-sm text-gray-600">
                <span className="font-medium text-green-800">{projectStats.completed}</span> completed
              </div>
            )}
          </div>
        </div>

        <Button onClick={() => setIsCreateOpen(true)} className="lg:self-start">
          + New Project
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg border p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <input
              aria-label="Search projects"
              placeholder="Search by name, idea, description, or owner..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div className="flex flex-wrap gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="planned">Planned</option>
              <option value="blueprint-ready">Blueprint Ready</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>

            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Stages</option>
              <option value="planning">Planning</option>
              <option value="blueprint">Blueprint</option>
              <option value="hld">High-Level Design</option>
              <option value="lld">Low-Level Design</option>
              <option value="codegen">Code Generation</option>
              <option value="completed">Completed</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="updated">Last Updated</option>
              <option value="created">Date Created</option>
              <option value="name">Name</option>
            </select>
          </div>
        </div>
      </div>

      {/* Loading and Error States */}
      {loading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading projects...</p>
        </div>
      )}
      
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Projects Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filtered.length === 0 && !loading ? (
          <div className="col-span-full text-center py-12 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
            <div className="max-w-md mx-auto">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {query || statusFilter !== "all" || stageFilter !== "all" 
                  ? "No projects match your filters" 
                  : "No projects yet"}
              </h3>
              <p className="text-gray-600 mb-4">
                {query || statusFilter !== "all" || stageFilter !== "all"
                  ? "Try adjusting your search or filter criteria"
                  : "Create your first project to get started with the development workflow"}
              </p>
              {!query && statusFilter === "all" && stageFilter === "all" && (
                <Button onClick={() => setIsCreateOpen(true)}>
                  Create Your First Project
                </Button>
              )}
            </div>
          </div>
        ) : (
          filtered.map((project) => {
            const displayStatus = getProjectDisplayStatus(project);
            return (
              <div
                key={project._id}
                className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow p-6"
              >
                {/* Project Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 truncate">
                      {project.name}
                    </h3>
                    <StatusBadge 
                      status={displayStatus.label} 
                      color={displayStatus.color as any}
                    />
                  </div>
                </div>

                {/* Project Description */}
                {project.idea && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {project.idea}
                  </p>
                )}

                {/* Project Metadata */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Current Stage:</span>
                    <span className="font-medium text-gray-700">
                      {getStageDisplayName(project.currentStage)}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Last Updated:</span>
                    <span>{formatLastUpdated(project.updatedAt || project.createdAt)}</span>
                  </div>
                  
                  {project.owner && (
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Owner:</span>
                      <span className="font-medium text-gray-700">{project.owner}</span>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button 
                    onClick={() => navigate(`/projects/${project._id}/workflow`)}
                    className="flex-1"
                    size="sm"
                  >
                    Workflow
                  </Button>
                  <Button
                    onClick={() => navigate(`/projects/${project._id}/workspace`)}
                    variant="secondary"
                    className="flex-1"
                    size="sm"
                  >
                    Workspace
                  </Button>
                  <Button
                    onClick={() => handleDelete(project._id, project.name)}
                    variant="danger"
                    size="sm"
                    className="px-3"
                    title="Delete project"
                  >
                    ×
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Queue Monitor Section */}
      <div className="mt-12">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">System Status</h2>
          <button
            onClick={() => setShowQueueMonitor(!showQueueMonitor)}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
          >
            {showQueueMonitor ? 'Hide Queue Monitor' : 'Show Queue Monitor'}
          </button>
        </div>

        {showQueueMonitor && (
          <div className="bg-white border rounded-lg p-4">
            <QueueMonitor refreshInterval={5000} />
          </div>
        )}
      </div>

      <CreateProjectModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />
    </div>
  );
};

export default DashboardPage;
