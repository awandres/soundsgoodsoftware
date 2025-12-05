"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ImageIcon, 
  FileText, 
  ArrowRight, 
  TrendingUp, 
  Target, 
  Zap, 
  PartyPopper, 
  Sparkles, 
  X,
  FolderKanban,
  Users,
  Pin,
  PinOff,
  CheckCircle,
  Clock,
  AlertCircle,
  ExternalLink,
  ChevronRight,
} from "lucide-react";
import { Button, Card, CardContent, CardHeader, CardTitle, CardDescription, Spinner, Badge, Progress } from "@soundsgood/ui";
import { LoadingScreen } from "@/components/LoadingScreen";

interface DashboardStats {
  photoCount: number;
  photosThisWeek: number;
  documentCount: number;
  documentTypes: string[];
}

interface ActivityItem {
  type: "photo" | "document";
  action: string;
  item: string;
  createdAt: string | null;
}

interface ProjectInfo {
  id: string;
  name: string;
  clientName: string | null;
  status: string;
  currentPhase: {
    id: string;
    name: string;
    orderIndex: number;
  } | null;
  totalPhases: number;
  completedPhases: number;
  progressPercent: number;
  currentWeek: number;
  totalWeeks: number | null;
  targetEndDate: string | null;
  weeksRemaining: number | null;
  isSetupIncomplete: boolean;
  hasPhases: boolean;
  projectType: string | null;
}

interface AdminProject {
  id: string;
  name: string;
  clientName: string | null;
  status: string;
  organizationName: string | null;
  projectType: string | null;
  stats: {
    totalPhases: number;
    completedPhases: number;
    progressPercent: number;
    currentWeek: number;
    weeksRemaining: number | null;
    currentPhase: string | null;
    hasPhases: boolean;
    isSetupIncomplete: boolean;
  };
}

// Format relative time
function formatRelativeTime(dateStr: string | null): string {
  if (!dateStr) return "Recently";
  
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  
  return date.toLocaleDateString();
}

// Format document types for display
function formatDocTypes(types: string[]): string {
  if (types.length === 0) return "No documents yet";
  if (types.length <= 3) return types.map(t => t.charAt(0).toUpperCase() + t.slice(1)).join(", ");
  return `${types.slice(0, 2).map(t => t.charAt(0).toUpperCase() + t.slice(1)).join(", ")} +${types.length - 2} more`;
}

// Get status color
function getStatusColor(status: string) {
  switch (status) {
    case "completed": return "bg-green-100 text-green-700";
    case "in-progress": return "bg-blue-100 text-blue-700";
    case "on-hold": return "bg-amber-100 text-amber-700";
    case "cancelled": return "bg-red-100 text-red-700";
    default: return "bg-gray-100 text-gray-700";
  }
}

// Get status label
function getStatusLabel(status: string) {
  switch (status) {
    case "in-progress": return "In Progress";
    case "on-hold": return "On Hold";
    default: return status.charAt(0).toUpperCase() + status.slice(1);
  }
}

// Local storage key for pinned projects
const PINNED_PROJECTS_KEY = "admin-pinned-projects";

function DashboardContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [project, setProject] = useState<ProjectInfo | null>(null);
  const [organizationName, setOrganizationName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showWelcome, setShowWelcome] = useState(false);
  
  // Admin-specific state
  const [isAdmin, setIsAdmin] = useState(false);
  const [allProjects, setAllProjects] = useState<AdminProject[]>([]);
  const [pinnedProjectIds, setPinnedProjectIds] = useState<string[]>([]);

  // Check for welcome param (new user from invitation)
  useEffect(() => {
    if (searchParams.get("welcome") === "new") {
      setShowWelcome(true);
      // Clean up the URL without the welcome param
      router.replace("/dashboard", { scroll: false });
    }
  }, [searchParams, router]);

  // Load pinned projects from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(PINNED_PROJECTS_KEY);
    if (stored) {
      try {
        setPinnedProjectIds(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse pinned projects:", e);
      }
    }
  }, []);

  useEffect(() => {
    const abortController = new AbortController();
    
    const fetchDashboardData = async () => {
      try {
        const response = await fetch("/api/dashboard", {
          signal: abortController.signal,
        });
        if (response.ok) {
          const data = await response.json();
          setStats(data.stats);
          setRecentActivity(data.recentActivity);
          setProject(data.project);
          setOrganizationName(data.organizationName);
          setIsAdmin(data.isAdmin || false);
          
          // If admin, also fetch all projects
          if (data.isAdmin) {
            fetchAllProjects(abortController.signal);
          }
        }
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error("Failed to fetch dashboard data:", error);
        }
      } finally {
        if (!abortController.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    const fetchAllProjects = async (signal: AbortSignal) => {
      try {
        const response = await fetch("/api/admin/projects", { signal });
        if (response.ok) {
          const data = await response.json();
          setAllProjects(data.projects || []);
        }
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error("Failed to fetch projects:", error);
        }
      }
    };

    fetchDashboardData();
    
    // Cleanup: abort fetch when component unmounts or navigates away
    return () => {
      abortController.abort();
    };
  }, []);

  const togglePinProject = (projectId: string) => {
    setPinnedProjectIds(prev => {
      let newPinned: string[];
      if (prev.includes(projectId)) {
        // Unpin
        newPinned = prev.filter(id => id !== projectId);
      } else {
        // Pin (max 2)
        if (prev.length >= 2) {
          // Replace the oldest pinned project
          newPinned = [prev[1] ?? projectId, projectId];
        } else {
          newPinned = [...prev, projectId];
        }
      }
      localStorage.setItem(PINNED_PROJECTS_KEY, JSON.stringify(newPinned));
      return newPinned;
    });
  };

  // Get pinned projects data
  const pinnedProjects = allProjects.filter(p => pinnedProjectIds.includes(p.id));
  const activeProjects = allProjects.filter(p => p.status === "in-progress");
  const projectStats = {
    total: allProjects.length,
    inProgress: allProjects.filter(p => p.status === "in-progress").length,
    completed: allProjects.filter(p => p.status === "completed").length,
    planning: allProjects.filter(p => p.status === "planning").length,
  };

  // Show loading screen while fetching data
  if (isLoading) {
    return <LoadingScreen message="Loading your dashboard..." />;
  }

  // Admin Dashboard
  if (isAdmin) {
    return (
      <div className="p-6 lg:p-8">
        {/* Admin Welcome */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="mt-2 text-muted-foreground">
            Overview of all client projects and quick access to management tools.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-slate-100">
                  <FolderKanban className="h-5 w-5 text-slate-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{projectStats.total}</p>
                  <p className="text-xs text-muted-foreground">Total Projects</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100">
                  <Clock className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{projectStats.inProgress}</p>
                  <p className="text-xs text-muted-foreground">In Progress</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-100">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{projectStats.completed}</p>
                  <p className="text-xs text-muted-foreground">Completed</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gray-100">
                  <AlertCircle className="h-5 w-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{projectStats.planning}</p>
                  <p className="text-xs text-muted-foreground">Planning</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pinned Projects */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Pin className="h-5 w-5 text-primary" />
                Focus Projects
              </h2>
              <p className="text-sm text-muted-foreground">
                Pin up to 2 projects to monitor closely
              </p>
            </div>
          </div>

          {pinnedProjects.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-8 text-center">
                <Pin className="mx-auto h-8 w-8 text-muted-foreground mb-3" />
                <p className="font-medium">No projects pinned yet</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Pin a project from the list below to see it here
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {pinnedProjects.map(project => (
                <Card key={project.id} className="border-primary/20 bg-primary/5">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{project.name}</CardTitle>
                        <CardDescription>
                          {project.clientName || "No client"} 
                          {project.organizationName && ` • ${project.organizationName}`}
                        </CardDescription>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => togglePinProject(project.id)}
                        className="text-primary"
                      >
                        <PinOff className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Status</span>
                        <Badge className={getStatusColor(project.status)}>
                          {getStatusLabel(project.status)}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">{project.stats.progressPercent}%</span>
                      </div>
                      <Progress value={project.stats.progressPercent} className="h-2" />
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Current Phase</span>
                        <span className="font-medium">{project.stats.currentPhase || "—"}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Week</span>
                        <span className="font-medium">{project.stats.currentWeek}</span>
                      </div>
                      <Button asChild variant="outline" size="sm" className="w-full mt-2">
                        <Link href={`/admin/projects/${project.id}`}>
                          View Details
                          <ExternalLink className="ml-2 h-3 w-3" />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* All Active Projects */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Active Projects</CardTitle>
                <CardDescription>All projects currently in progress</CardDescription>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href="/admin/projects">
                  View All
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {activeProjects.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No active projects at the moment
              </p>
            ) : (
              <div className="space-y-2">
                {activeProjects.slice(0, 5).map(project => (
                  <div
                    key={project.id}
                    className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors"
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => togglePinProject(project.id)}
                      className={pinnedProjectIds.includes(project.id) ? "text-primary" : "text-muted-foreground"}
                    >
                      {pinnedProjectIds.includes(project.id) ? (
                        <Pin className="h-4 w-4 fill-current" />
                      ) : (
                        <Pin className="h-4 w-4" />
                      )}
                    </Button>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{project.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {project.clientName || "No client"}
                        {project.stats.currentPhase && ` • ${project.stats.currentPhase}`}
                      </p>
                    </div>
                    <div className="text-right text-sm">
                      <p className="font-medium">{project.stats.progressPercent}%</p>
                      <p className="text-xs text-muted-foreground">Week {project.stats.currentWeek}</p>
                    </div>
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/admin/projects/${project.id}`}>
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-4 mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FolderKanban className="h-5 w-5 text-primary" />
                Manage Projects
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Create new projects, update timelines, and track deliverables.
              </p>
              <Button asChild>
                <Link href="/admin/projects">
                  Go to Projects
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Manage Clients
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Invite new clients, manage access, and view client details.
              </p>
              <Button asChild variant="outline">
                <Link href="/clients">
                  Go to Clients
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Client Dashboard (existing code below)
  return (
    <div className="p-6 lg:p-8">
      {/* First-time Welcome Modal */}
      {showWelcome && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="relative mx-4 w-full max-w-lg animate-in fade-in zoom-in duration-300">
            <Card className="border-2 border-primary/20 shadow-2xl">
              <button
                onClick={() => setShowWelcome(false)}
                className="absolute right-4 top-4 rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
              
              <CardContent className="pt-8 pb-8 text-center">
                {/* Celebration Icon */}
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/5">
                  <PartyPopper className="h-10 w-10 text-primary" />
                </div>
                
                {/* Welcome Message */}
                <h2 className="text-2xl font-bold tracking-tight mb-2">
                  Welcome to Your {organizationName || "Business"} App Portal! 🎉
                </h2>
                <p className="text-muted-foreground mb-6">
                  Your account is all set up and ready to go. This is your personal dashboard where you can manage everything related to your project.
                </p>
                
                {/* Quick Tips */}
                <div className="bg-muted/50 rounded-lg p-4 mb-6 text-left">
                  <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    Here&apos;s what you can do:
                  </h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <ImageIcon className="h-4 w-4 mt-0.5 text-blue-500" />
                      <span><strong>Upload Photos</strong> — Share images for your website</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <FileText className="h-4 w-4 mt-0.5 text-green-500" />
                      <span><strong>View Documents</strong> — Access contracts & project files</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Target className="h-4 w-4 mt-0.5 text-orange-500" />
                      <span><strong>Track Progress</strong> — See your project timeline</span>
                    </li>
                  </ul>
                </div>
                
                {/* CTA Button */}
                <Button 
                  onClick={() => setShowWelcome(false)} 
                  className="w-full"
                  size="lg"
                >
                  Let&apos;s Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Welcome header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          {showWelcome 
            ? `Welcome to Your ${organizationName || "Business"} App Portal! 👋` 
            : "Welcome back! 👋"
          }
        </h1>
        <p className="mt-2 text-muted-foreground">
          {organizationName 
            ? `Here's an overview of ${organizationName}'s project and recent activity.`
            : "Here's an overview of your project and recent activity."
          }
        </p>
      </div>

      {/* Project Progress Card */}
      {project && (
        <Card className={`mb-8 ${project.isSetupIncomplete ? 'border-amber-200 bg-amber-50/50' : 'border-primary/20 bg-primary/5'}`}>
          <CardContent className="pt-6">
            {project.isSetupIncomplete ? (
              // Setup incomplete state
              <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-2 text-sm text-amber-700 mb-1">
                    <Zap className="h-4 w-4" />
                    <span>Project Setup In Progress</span>
                  </div>
                  <h3 className="text-xl font-bold text-amber-900">
                    {project.name}
                  </h3>
                  <p className="text-sm text-amber-700 mt-1">
                    {!project.hasPhases 
                      ? "Project phases are being defined"
                      : "Timeline details are being finalized"}
                  </p>
                </div>
                <div>
                  <Button asChild variant="outline" size="sm">
                    <Link href="/project-status">
                      View Status
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            ) : (
              // Normal project progress view
              <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                {/* Current Phase */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <Zap className="h-4 w-4 text-primary" />
                    <span>Current Phase</span>
                  </div>
                  <h3 className="text-xl font-bold text-primary">
                    {project.currentPhase?.name || "Getting Started"}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Phase {project.currentPhase?.orderIndex || 1} of {project.totalPhases}
                    {project.totalWeeks 
                      ? ` • Week ${project.currentWeek} of ${project.totalWeeks}`
                      : ` • Week ${project.currentWeek}`}
                  </p>
                </div>

                {/* Progress */}
                <div className="lg:w-64">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Overall Progress</span>
                    <span className="font-bold">{project.progressPercent}%</span>
                  </div>
                  <div className="h-3 w-full rounded-full bg-muted">
                    <div 
                      className="h-3 rounded-full bg-primary transition-all"
                      style={{ width: `${project.progressPercent}%` }}
                    />
                  </div>
                </div>

                {/* View Details */}
                <div>
                  <Button asChild variant="outline" size="sm">
                    <Link href="/project-status">
                      View Timeline
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Quick stats */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Photos Uploaded
            </CardTitle>
            <ImageIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Spinner size="sm" />
            ) : (
              <>
                <p className="text-3xl font-bold">{stats?.photoCount ?? 0}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  {stats?.photosThisWeek ? (
                    <>
                      <TrendingUp className="h-3 w-3 text-green-500" />
                      +{stats.photosThisWeek} this week
                    </>
                  ) : (
                    "No uploads this week"
                  )}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Documents
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Spinner size="sm" />
            ) : (
              <>
                <p className="text-3xl font-bold">{stats?.documentCount ?? 0}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDocTypes(stats?.documentTypes ?? [])}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Project Timeline
            </CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Spinner size="sm" />
            ) : project ? (
              <>
                <p className="text-3xl font-bold">Week {project.currentWeek}</p>
                <p className="text-xs text-muted-foreground">
                  {project.totalWeeks 
                    ? `of ${project.totalWeeks} weeks total`
                    : "Timeline TBD"}
                </p>
              </>
            ) : (
              <>
                <p className="text-3xl font-bold text-primary">Active</p>
                <p className="text-xs text-muted-foreground">
                  Portal ready for uploads
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upload photos card */}
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-primary" />
              Upload Photos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-muted-foreground">
              Share photos for your website — trainer headshots, facility images, 
              marketing materials, and more.
            </p>
            <Button asChild>
              <Link href="/photos">
                Go to Photos
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Documents card */}
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              View Documents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-muted-foreground">
              Access and upload your project documents including contracts, roadmaps, 
              and brand guidelines.
            </p>
            <Button asChild variant="outline">
              <Link href="/documents">
                View Documents
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent activity */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Spinner size="lg" />
            </div>
          ) : recentActivity.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <p>No recent activity yet.</p>
              <p className="text-sm mt-1">Upload some photos or documents to get started!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentActivity.map((activity, i) => (
                <div key={i} className="flex items-center gap-4 text-sm">
                  <div className={`h-2 w-2 rounded-full ${
                    activity.type === 'photo' ? 'bg-blue-500' : 'bg-green-500'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <span className="font-medium">{activity.action}:</span>{" "}
                    <span className="text-muted-foreground truncate">{activity.item}</span>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatRelativeTime(activity.createdAt)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<LoadingScreen message="Loading your dashboard..." />}>
      <DashboardContent />
    </Suspense>
  );
}
