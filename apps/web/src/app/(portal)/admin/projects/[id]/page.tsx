"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Target,
  AlertCircle,
  Pencil,
  ChevronRight,
  ListTodo,
  CalendarClock,
  Layers,
  CircleDot,
  Circle,
  CheckCircle,
  PauseCircle,
  AlertTriangle,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Badge,
  Button,
  Progress,
} from "@soundsgood/ui";
import { LoadingScreen } from "@/components/LoadingScreen";

// Project types and statuses
const PROJECT_STATUSES = [
  { value: "planning", label: "Planning", color: "bg-gray-100 text-gray-700" },
  { value: "in-progress", label: "In Progress", color: "bg-blue-100 text-blue-700" },
  { value: "on-hold", label: "On Hold", color: "bg-amber-100 text-amber-700" },
  { value: "completed", label: "Completed", color: "bg-green-100 text-green-700" },
  { value: "cancelled", label: "Cancelled", color: "bg-red-100 text-red-700" },
] as const;

const PROJECT_TYPES = [
  { value: "full_platform", label: "Full Platform" },
  { value: "website_only", label: "Website Only" },
  { value: "crm_only", label: "CRM Only" },
  { value: "booking_only", label: "Booking Only" },
  { value: "custom", label: "Custom" },
] as const;

const PHASE_STATUSES = [
  { value: "upcoming", label: "Upcoming", icon: Circle, color: "text-gray-400" },
  { value: "in-progress", label: "In Progress", icon: CircleDot, color: "text-blue-500" },
  { value: "completed", label: "Completed", icon: CheckCircle, color: "text-green-500" },
  { value: "skipped", label: "Skipped", icon: PauseCircle, color: "text-gray-400" },
] as const;

interface ProjectTask {
  id: string;
  title: string;
  description: string | null;
  assignee: string | null;
  priority: string;
  status: string;
  dueDate: string | null;
  completedAt: string | null;
  phaseId: string | null;
}

interface ProjectPhase {
  id: string;
  name: string;
  description: string | null;
  orderIndex: number;
  status: string;
  isMilestone: boolean;
  milestoneLabel: string | null;
  estimatedStartDate: string | null;
  estimatedEndDate: string | null;
  actualStartDate: string | null;
  actualEndDate: string | null;
  deliverables: { name: string; completed: boolean }[] | null;
  tasks: ProjectTask[];
}

interface ProjectDeadline {
  id: string;
  title: string;
  description: string | null;
  date: string;
  phaseId: string | null;
}

interface Project {
  id: string;
  name: string;
  description: string | null;
  clientName: string | null;
  status: string;
  startDate: string | null;
  targetEndDate: string | null;
  actualEndDate: string | null;
  totalWeeks: number | null;
  agreementDate: string | null;
  contractValue: number | null;
  projectType: string | null;
  organizationId: string | null;
  organizationName: string | null;
  deliverables: any;
  createdAt: string;
}

interface ProjectStats {
  totalPhases: number;
  completedPhases: number;
  progressPercent: number;
  currentWeek: number;
  weeksRemaining: number | null;
  currentPhase: string | null;
  currentPhaseId: string | null;
  hasPhases: boolean;
  isSetupIncomplete: boolean;
  tasks: {
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
    overdue: number;
  };
}

interface ProjectData {
  project: Project;
  phases: ProjectPhase[];
  tasks: ProjectTask[];
  unassignedTasks: ProjectTask[];
  deadlines: ProjectDeadline[];
  upcomingDeadlines: ProjectDeadline[];
  stats: ProjectStats;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "TBD";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatCurrency(cents: number | null): string {
  if (!cents) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(cents / 100);
}

function getStatusBadge(status: string) {
  const statusConfig = PROJECT_STATUSES.find(s => s.value === status);
  return statusConfig || { label: status, color: "bg-gray-100 text-gray-700" };
}

function getPhaseStatusConfig(status: string) {
  return PHASE_STATUSES.find(s => s.value === status) || PHASE_STATUSES[0];
}

function getPriorityColor(priority: string) {
  switch (priority) {
    case "urgent": return "text-red-600 bg-red-100";
    case "high": return "text-orange-600 bg-orange-100";
    case "medium": return "text-blue-600 bg-blue-100";
    default: return "text-gray-600 bg-gray-100";
  }
}

function getTaskStatusIcon(status: string) {
  switch (status) {
    case "completed": return <CheckCircle className="h-4 w-4 text-green-500" />;
    case "in-progress": return <CircleDot className="h-4 w-4 text-blue-500" />;
    case "cancelled": return <PauseCircle className="h-4 w-4 text-gray-400" />;
    default: return <Circle className="h-4 w-4 text-gray-400" />;
  }
}

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [data, setData] = useState<ProjectData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPhaseId, setSelectedPhaseId] = useState<string | null>(null);

  useEffect(() => {
    const abortController = new AbortController();

    const fetchProjectData = async () => {
      try {
        const response = await fetch(`/api/admin/projects/${id}`, {
          signal: abortController.signal,
        });
        if (response.ok) {
          const result = await response.json();
          setData(result);
          // Auto-select current phase, or first phase if none in progress
          if (result.stats.currentPhaseId) {
            setSelectedPhaseId(result.stats.currentPhaseId);
          } else if (result.phases.length > 0) {
            setSelectedPhaseId(result.phases[0].id);
          }
        } else if (response.status === 404) {
          setError("Project not found");
        } else {
          throw new Error("Failed to fetch project");
        }
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.error("Error:", err);
          setError("Failed to load project data");
        }
      } finally {
        if (!abortController.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    fetchProjectData();

    return () => {
      abortController.abort();
    };
  }, [id]);

  const selectPhase = (phaseId: string) => {
    setSelectedPhaseId(phaseId);
  };
  
  // Get the currently selected phase
  const selectedPhase = data?.phases.find(p => p.id === selectedPhaseId) || null;

  if (isLoading) {
    return <LoadingScreen message="Loading project details..." />;
  }

  if (error || !data) {
    return (
      <div className="p-6 lg:p-8">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
            <p className="text-lg font-semibold text-destructive">{error || "Project not found"}</p>
            <Button variant="outline" className="mt-4" onClick={() => router.push("/admin/projects")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Projects
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { project, phases, deadlines, upcomingDeadlines, stats, unassignedTasks } = data;
  const statusBadge = getStatusBadge(project.status);

  return (
    <div className="p-6 lg:p-8">
      {/* Back link and header */}
      <div className="mb-6">
        <Button variant="ghost" size="sm" onClick={() => router.push("/admin/projects")} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Projects
        </Button>
        
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
              <Badge className={statusBadge.color}>{statusBadge.label}</Badge>
              {stats.isSetupIncomplete && (
                <Badge variant="outline" className="text-amber-600 border-amber-300">
                  Setup Incomplete
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground">
              {project.clientName || "Unassigned Client"}
              {project.organizationName && ` • ${project.organizationName}`}
              {project.projectType && ` • ${PROJECT_TYPES.find(t => t.value === project.projectType)?.label || project.projectType}`}
            </p>
          </div>
          <Button variant="outline" onClick={() => router.push(`/admin/projects?edit=${project.id}`)}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit Project
          </Button>
        </div>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-3xl font-bold text-primary">{stats.progressPercent}%</p>
            <p className="text-xs text-muted-foreground">Progress</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-3xl font-bold">{stats.completedPhases}/{stats.totalPhases}</p>
            <p className="text-xs text-muted-foreground">Phases Complete</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-3xl font-bold">
              {stats.currentWeek}
              {project.totalWeeks && <span className="text-lg text-muted-foreground">/{project.totalWeeks}</span>}
            </p>
            <p className="text-xs text-muted-foreground">Current Week</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-3xl font-bold">{stats.tasks.completed}/{stats.tasks.total}</p>
            <p className="text-xs text-muted-foreground">Tasks Done</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className={`text-3xl font-bold ${stats.tasks.overdue > 0 ? "text-red-600" : ""}`}>
              {stats.tasks.overdue}
            </p>
            <p className="text-xs text-muted-foreground">Overdue Tasks</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-3xl font-bold">{upcomingDeadlines.length}</p>
            <p className="text-xs text-muted-foreground">Upcoming Deadlines</p>
          </CardContent>
        </Card>
      </div>

      {/* Progress bar */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Overall Progress</span>
            <span className="text-sm text-muted-foreground">{stats.progressPercent}%</span>
          </div>
          <Progress value={stats.progressPercent} className="h-3" />
          {stats.currentPhase && (
            <p className="text-sm text-muted-foreground mt-2">
              Current Phase: <span className="font-medium">{stats.currentPhase}</span>
            </p>
          )}
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main content - Phases */}
        <div className="lg:col-span-2 space-y-6">
          {/* Project Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Project Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Start Date</p>
                  <p className="font-medium">{formatDate(project.startDate)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Target End Date</p>
                  <p className="font-medium">{formatDate(project.targetEndDate)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Agreement Date</p>
                  <p className="font-medium">{formatDate(project.agreementDate)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Total Weeks</p>
                  <p className="font-medium">{project.totalWeeks || "TBD"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Contract Value</p>
                  <p className="font-medium">{formatCurrency(project.contractValue)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Weeks Remaining</p>
                  <p className="font-medium">{stats.weeksRemaining ?? "—"}</p>
                </div>
              </div>
              {project.description && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-xs text-muted-foreground mb-1">Description</p>
                  <p className="text-sm">{project.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Phases */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Layers className="h-5 w-5" />
                Project Phases ({phases.length})
              </CardTitle>
              <CardDescription>
                Select a phase to view its deliverables and tasks
              </CardDescription>
            </CardHeader>
            <CardContent>
              {phases.length === 0 ? (
                <div className="text-center py-8">
                  <Layers className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="font-medium">No phases defined yet</p>
                  <p className="text-sm text-muted-foreground">Add phases to track project progress</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {phases.map((phase) => {
                    const statusConfig = getPhaseStatusConfig(phase.status);
                    const StatusIcon = statusConfig.icon;
                    const isSelected = selectedPhaseId === phase.id;
                    const completedTasks = phase.tasks.filter(t => t.status === "completed").length;
                    const totalTasks = phase.tasks.length;
                    const completedDeliverables = phase.deliverables?.filter(d => d.completed).length || 0;
                    const totalDeliverables = phase.deliverables?.length || 0;

                    return (
                      <button
                        key={phase.id}
                        className={`w-full p-4 flex items-center gap-3 text-left rounded-lg border transition-all ${
                          isSelected 
                            ? "border-primary bg-primary/5 ring-2 ring-primary/20" 
                            : phase.status === "in-progress" 
                              ? "border-blue-200 bg-blue-50/50 hover:bg-blue-50" 
                              : "hover:bg-accent/50"
                        }`}
                        onClick={() => selectPhase(phase.id)}
                      >
                        <StatusIcon className={`h-5 w-5 ${statusConfig.color} shrink-0`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{phase.name}</span>
                            {phase.isMilestone && (
                              <Badge variant="outline" className="text-xs">Milestone</Badge>
                            )}
                            {phase.status === "completed" && (
                              <Badge className="text-xs bg-green-100 text-green-700">Complete</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                            <span>{formatDate(phase.estimatedStartDate)} - {formatDate(phase.estimatedEndDate)}</span>
                            {totalTasks > 0 && (
                              <span className="flex items-center gap-1">
                                <ListTodo className="h-3 w-3" />
                                {completedTasks}/{totalTasks}
                              </span>
                            )}
                            {totalDeliverables > 0 && (
                              <span className="flex items-center gap-1">
                                <Target className="h-3 w-3" />
                                {completedDeliverables}/{totalDeliverables}
                              </span>
                            )}
                          </div>
                        </div>
                        <ChevronRight className={`h-4 w-4 transition-transform shrink-0 ${isSelected ? "text-primary rotate-90" : "text-muted-foreground"}`} />
                      </button>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Unassigned Tasks */}
          {unassignedTasks.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <ListTodo className="h-5 w-5" />
                  Unassigned Tasks ({unassignedTasks.length})
                </CardTitle>
                <CardDescription>Tasks not linked to any phase</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {unassignedTasks.map(task => (
                    <div key={task.id} className="flex items-center gap-3 p-2 rounded hover:bg-accent/50">
                      {getTaskStatusIcon(task.status)}
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${task.status === "completed" ? "line-through text-muted-foreground" : ""}`}>
                          {task.title}
                        </p>
                      </div>
                      {task.priority !== "medium" && (
                        <Badge className={`text-xs ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </Badge>
                      )}
                      {task.dueDate && (
                        <span className="text-xs text-muted-foreground">
                          {formatDate(task.dueDate)}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Task Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <ListTodo className="h-5 w-5" />
                Task Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Circle className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">Pending</span>
                  </div>
                  <span className="font-medium">{stats.tasks.pending}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CircleDot className="h-4 w-4 text-blue-500" />
                    <span className="text-sm">In Progress</span>
                  </div>
                  <span className="font-medium">{stats.tasks.inProgress}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Completed</span>
                  </div>
                  <span className="font-medium">{stats.tasks.completed}</span>
                </div>
                {stats.tasks.overdue > 0 && (
                  <div className="flex items-center justify-between text-red-600">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="text-sm">Overdue</span>
                    </div>
                    <span className="font-medium">{stats.tasks.overdue}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Deadlines */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CalendarClock className="h-5 w-5" />
                Upcoming Deadlines
              </CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingDeadlines.length === 0 ? (
                <p className="text-sm text-muted-foreground">No upcoming deadlines in the next 30 days</p>
              ) : (
                <div className="space-y-3">
                  {upcomingDeadlines.map(deadline => {
                    const daysUntil = Math.ceil(
                      (new Date(deadline.date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                    );
                    return (
                      <div key={deadline.id} className="flex items-start gap-3">
                        <div className={`shrink-0 text-xs font-medium px-2 py-1 rounded ${
                          daysUntil <= 3 ? "bg-red-100 text-red-700" : 
                          daysUntil <= 7 ? "bg-amber-100 text-amber-700" : 
                          "bg-gray-100 text-gray-700"
                        }`}>
                          {daysUntil === 0 ? "Today" : daysUntil === 1 ? "Tomorrow" : `${daysUntil}d`}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{deadline.title}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(deadline.date)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {deadlines.length > upcomingDeadlines.length && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-xs text-muted-foreground">
                    {deadlines.length - upcomingDeadlines.length} more deadline(s) beyond 30 days
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Selected Phase Details */}
          <Card className={selectedPhase ? "border-primary/30" : ""}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="h-5 w-5" />
                {selectedPhase ? "Phase Deliverables" : "Select a Phase"}
              </CardTitle>
              {selectedPhase && (
                <CardDescription className="flex items-center gap-2">
                  {(() => {
                    const statusConfig = getPhaseStatusConfig(selectedPhase.status);
                    const StatusIcon = statusConfig.icon;
                    return (
                      <>
                        <StatusIcon className={`h-4 w-4 ${statusConfig.color}`} />
                        <span className="font-medium">{selectedPhase.name}</span>
                      </>
                    );
                  })()}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              {!selectedPhase ? (
                <p className="text-sm text-muted-foreground">
                  Select a phase from the list to view its deliverables
                </p>
              ) : (
                <div className="space-y-4">
                  {/* Phase Status Banner */}
                  {selectedPhase.status === "completed" && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 border border-green-200">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="text-sm font-medium text-green-800">Phase Completed</p>
                        {selectedPhase.actualEndDate && (
                          <p className="text-xs text-green-600">
                            Completed on {formatDate(selectedPhase.actualEndDate)}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {selectedPhase.status === "in-progress" && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-50 border border-blue-200">
                      <CircleDot className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="text-sm font-medium text-blue-800">Currently Active</p>
                        <p className="text-xs text-blue-600">
                          {formatDate(selectedPhase.estimatedStartDate)} - {formatDate(selectedPhase.estimatedEndDate)}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Phase Deliverables */}
                  {selectedPhase.deliverables && selectedPhase.deliverables.length > 0 ? (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
                        Deliverables ({selectedPhase.deliverables.filter(d => d.completed).length}/{selectedPhase.deliverables.length})
                      </p>
                      <div className="space-y-2">
                        {selectedPhase.deliverables.map((deliverable, i) => (
                          <div 
                            key={i} 
                            className={`flex items-start gap-3 p-2 rounded-lg ${
                              deliverable.completed 
                                ? "bg-green-50/50" 
                                : "bg-gray-50"
                            }`}
                          >
                            {deliverable.completed ? (
                              <CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                            ) : (
                              <Circle className="h-5 w-5 text-gray-300 shrink-0 mt-0.5" />
                            )}
                            <span className={`text-sm ${deliverable.completed ? "text-green-800" : ""}`}>
                              {deliverable.name}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <Target className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">
                        No deliverables defined for this phase
                      </p>
                    </div>
                  )}

                  {/* Phase Tasks */}
                  {selectedPhase.tasks.length > 0 && (
                    <div className="pt-4 border-t">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
                        Tasks ({selectedPhase.tasks.filter(t => t.status === "completed").length}/{selectedPhase.tasks.length})
                      </p>
                      <div className="space-y-2">
                        {selectedPhase.tasks.map(task => (
                          <div 
                            key={task.id} 
                            className="flex items-center gap-2 text-sm"
                          >
                            {getTaskStatusIcon(task.status)}
                            <span className={task.status === "completed" ? "line-through text-muted-foreground" : ""}>
                              {task.title}
                            </span>
                            {task.dueDate && task.status !== "completed" && new Date(task.dueDate) < new Date() && (
                              <AlertTriangle className="h-3 w-3 text-red-500 ml-auto" />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Phase Description */}
                  {selectedPhase.description && (
                    <div className="pt-4 border-t">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                        Description
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {selectedPhase.description}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Project-Level Deliverables (from schema) */}
          {project.deliverables && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Layers className="h-5 w-5" />
                  Project Deliverables
                </CardTitle>
                <CardDescription>Overall project components</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(project.deliverables).map(([key, value]: [string, any]) => {
                    if (key === "custom" || !value?.enabled) return null;
                    return (
                      <div key={key} className="flex items-center gap-2">
                        {value.status === "complete" ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : value.status === "in-progress" ? (
                          <CircleDot className="h-4 w-4 text-blue-500" />
                        ) : (
                          <Circle className="h-4 w-4 text-gray-400" />
                        )}
                        <span className="text-sm capitalize">{key}</span>
                        <Badge variant="outline" className="text-xs ml-auto capitalize">
                          {value.status}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

