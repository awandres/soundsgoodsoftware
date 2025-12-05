"use client";

import { useState, useEffect } from "react";
import {
  CheckCircle2,
  Circle,
  Clock,
  Calendar,
  Target,
  MessageSquare,
  Zap,
  ChevronDown,
  ChevronRight,
  Square,
  CheckSquare,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Badge, Spinner } from "@soundsgood/ui";
import { LoadingScreen } from "@/components/LoadingScreen";

// Deliverable type with completion status
interface Deliverable {
  name: string;
  completed: boolean;
}

// Types matching the database schema
interface Project {
  id: string;
  name: string;
  description: string | null;
  clientName: string | null;  // Now optional
  status: string;
  startDate: string | null;
  targetEndDate: string | null;
  totalWeeks: number | null;
  agreementDate: string | null;
  projectType: string | null;
  deliverables: Record<string, unknown> | null;
}

interface ProjectPhase {
  id: string;
  name: string;
  description: string | null;
  orderIndex: number;
  status: string;
  isMilestone: boolean | null;
  milestoneLabel: string | null;
  estimatedStartDate: string | null;
  estimatedEndDate: string | null;
  actualStartDate: string | null;
  actualEndDate: string | null;
  deliverables: Deliverable[] | null;
}

interface ProjectTask {
  id: string;
  title: string;
  description: string | null;
  assignee: string | null;
  priority: string;
  status: string;
  dueDate: string | null;
}

interface ProjectDeadline {
  id: string;
  title: string;
  date: string;
}

interface ProjectStats {
  completedPhases: number;
  totalPhases: number;
  currentPhase: ProjectPhase | null;
  currentWeek: number;
  weeksRemaining: number | null;
  progressPercent: number;
  hasPhases: boolean;
  isSetupIncomplete: boolean;
}

function getStatusIcon(status: string) {
  switch (status) {
    case "completed":
      return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    case "in-progress":
      return <Clock className="h-5 w-5 text-blue-500 animate-pulse" />;
    default:
      return <Circle className="h-5 w-5 text-muted-foreground/40" />;
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case "completed":
      return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Completed</Badge>;
    case "in-progress":
      return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">In Progress</Badge>;
    default:
      return <Badge variant="outline" className="text-muted-foreground">Upcoming</Badge>;
  }
}

function getPriorityBadge(priority: string) {
  switch (priority) {
    case "high":
    case "urgent":
      return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">High Priority</Badge>;
    case "medium":
      return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Medium</Badge>;
    default:
      return <Badge variant="outline">Low</Badge>;
  }
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "TBD";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatShortDate(dateStr: string): string {
  const date = new Date(dateStr);
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

export default function ProjectStatusPage() {
  const [project, setProject] = useState<Project | null>(null);
  const [phases, setPhases] = useState<ProjectPhase[]>([]);
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [deadlines, setDeadlines] = useState<ProjectDeadline[]>([]);
  const [stats, setStats] = useState<ProjectStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchProjectData();
    // Check admin status from cookie
    checkAdminStatus();

    // Listen for admin mode changes from the DevAdminBar
    const handleAdminModeChange = (event: CustomEvent<{ isAdmin: boolean }>) => {
      setIsAdmin(event.detail.isAdmin);
    };

    window.addEventListener("dev-admin-mode-changed", handleAdminModeChange as EventListener);
    return () => {
      window.removeEventListener("dev-admin-mode-changed", handleAdminModeChange as EventListener);
    };
  }, []);

  const checkAdminStatus = async () => {
    try {
      const response = await fetch("/api/dev/admin-mode");
      if (response.ok) {
        const data = await response.json();
        setIsAdmin(data.isDevAdmin);
      }
    } catch (err) {
      // Ignore errors - admin mode is optional
    }
  };

  const fetchProjectData = async () => {
    try {
      // First get list of projects to find the user's project
      const listResponse = await fetch("/api/projects");
      if (!listResponse.ok) throw new Error("Failed to fetch projects");
      
      const { projects } = await listResponse.json();
      
      if (!projects || projects.length === 0) {
        setError("No project found");
        setIsLoading(false);
        return;
      }

      // Get the first (or only) project with full details
      const projectId = projects[0].id;
      const detailResponse = await fetch(`/api/projects?id=${projectId}`);
      if (!detailResponse.ok) throw new Error("Failed to fetch project details");

      const data = await detailResponse.json();
      setProject(data.project);
      setPhases(data.phases);
      setTasks(data.tasks);
      setDeadlines(data.deadlines);
      setStats(data.stats);
      setIsAdmin(data.isAdmin || false);
    } catch (err) {
      console.error("Failed to fetch project data:", err);
      setError("Failed to load project data");
    } finally {
      setIsLoading(false);
    }
  };

  const togglePhaseExpanded = (phaseId: string) => {
    setExpandedPhases((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(phaseId)) {
        newSet.delete(phaseId);
      } else {
        newSet.add(phaseId);
      }
      return newSet;
    });
  };

  const toggleDeliverable = async (phaseId: string, deliverableIndex: number) => {
    if (!isAdmin) return;

    const phase = phases.find((p) => p.id === phaseId);
    if (!phase?.deliverables) return;

    // Create updated deliverables
    const updatedDeliverables = phase.deliverables.map((d, i) =>
      i === deliverableIndex ? { ...d, completed: !d.completed } : d
    );

    // Optimistic update
    setPhases((prev) =>
      prev.map((p) =>
        p.id === phaseId ? { ...p, deliverables: updatedDeliverables } : p
      )
    );

    // Save to server
    try {
      const response = await fetch("/api/projects", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phaseId, deliverables: updatedDeliverables }),
      });

      if (!response.ok) {
        throw new Error("Failed to update deliverable");
      }
    } catch (err) {
      console.error("Failed to update deliverable:", err);
      // Revert on error
      setPhases((prev) =>
        prev.map((p) =>
          p.id === phaseId ? { ...p, deliverables: phase.deliverables } : p
        )
      );
    }
  };


  if (isLoading) {
    return <LoadingScreen message="Loading project timeline..." />;
  }

  if (error || !project) {
    return (
      <div className="p-6 lg:p-8">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">{error || "No project data available"}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
          <span>Project for</span>
          <Badge variant="outline" className="font-semibold">
            {project.clientName || "Unassigned"}
          </Badge>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Project Status</h1>
        <p className="mt-2 text-muted-foreground">
          {project.name} • {project.agreementDate ? `Agreement signed ${formatDate(project.agreementDate)}` : "Agreement pending"}
        </p>
      </div>

      {/* Overview Cards */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Overall Progress
            </CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats?.progressPercent ?? 0}%</p>
            <div className="mt-2 h-2 w-full rounded-full bg-muted">
              <div 
                className="h-2 rounded-full bg-primary transition-all"
                style={{ width: `${stats?.progressPercent ?? 0}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Current Phase
            </CardTitle>
            <Zap className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <p className="text-lg font-bold text-primary">{stats?.currentPhase?.name || "—"}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Phase {stats?.currentPhase?.orderIndex || 0} of {stats?.totalPhases || 0}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Project Timeline
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">Week {stats?.currentWeek || 1}</p>
            <p className="text-xs text-muted-foreground">
              {project.totalWeeks ? `of ${project.totalWeeks} weeks` : "Timeline TBD"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Target Launch
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-lg font-bold">{formatDate(project.targetEndDate)}</p>
            <p className="text-xs text-muted-foreground">
              {stats?.weeksRemaining && stats.weeksRemaining > 0 
                ? `~${stats.weeksRemaining} weeks remaining` 
                : "Timeline TBD"}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Timeline - takes 2 columns */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Project Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              {phases.length === 0 ? (
                <div className="py-8 text-center">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                    <Clock className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <h3 className="font-semibold text-muted-foreground">No phases defined yet</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Project phases will appear here once they&apos;re set up.
                  </p>
                </div>
              ) : (
              <div className="space-y-6">
                {phases.map((phase, index) => (
                  <div key={phase.id} className="relative flex gap-4">
                    {/* Timeline line */}
                    {index < phases.length - 1 && (
                      <div className={`absolute left-[9px] top-8 h-full w-0.5 ${
                        phase.status === "completed" ? "bg-green-200" : "bg-muted"
                      }`} />
                    )}
                    
                    {/* Status icon */}
                    <div className="relative z-10 mt-0.5">
                      {getStatusIcon(phase.status)}
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 pb-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className={`font-semibold ${
                          phase.status === "completed" ? "text-muted-foreground" : ""
                        }`}>
                          {phase.name}
                        </h3>
                        {getStatusBadge(phase.status)}
                        {phase.isMilestone && phase.milestoneLabel && (
                          <Badge className="text-sm font-semibold bg-primary/10 border-2 border-primary/30 text-primary hover:bg-primary/10">
                            {phase.milestoneLabel}
                          </Badge>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {phase.description}
                      </p>
                      <p className="mt-2 text-sm font-medium text-muted-foreground">
                        {phase.status === "completed" && phase.actualEndDate && (
                          <>✓ Completed: {formatDate(phase.actualEndDate)}</>
                        )}
                        {phase.status === "in-progress" && phase.actualStartDate && (
                          <>● Started: {formatDate(phase.actualStartDate)}</>
                        )}
                        {phase.status === "upcoming" && phase.estimatedStartDate && (
                          <>○ Estimated: {formatDate(phase.estimatedStartDate)}</>
                        )}
                      </p>
                      
                      {/* Expandable deliverables checklist */}
                      {phase.deliverables && phase.deliverables.length > 0 && (
                        <div className="mt-3">
                          <button
                            onClick={() => togglePhaseExpanded(phase.id)}
                            className="flex items-center gap-1.5 text-xs text-primary hover:underline font-medium"
                          >
                            {expandedPhases.has(phase.id) ? (
                              <ChevronDown className="h-3.5 w-3.5" />
                            ) : (
                              <ChevronRight className="h-3.5 w-3.5" />
                            )}
                            {phase.deliverables.length} deliverable{phase.deliverables.length > 1 ? "s" : ""}
                            {" "}
                            <span className="text-muted-foreground font-normal">
                              ({phase.deliverables.filter((d) => d.completed).length}/{phase.deliverables.length} done)
                            </span>
                          </button>
                          
                          {/* Expanded checklist */}
                          {expandedPhases.has(phase.id) && (
                            <div className="mt-2 ml-1 space-y-1.5 border-l-2 border-muted pl-3">
                              {phase.deliverables.map((deliverable, dIndex) => (
                                <div
                                  key={dIndex}
                                  className={`flex items-center gap-2 text-sm ${
                                    isAdmin ? "cursor-pointer hover:bg-muted/50 -ml-1 pl-1 py-0.5 rounded" : ""
                                  }`}
                                  onClick={() => isAdmin && toggleDeliverable(phase.id, dIndex)}
                                >
                                  {deliverable.completed ? (
                                    <CheckSquare className={`h-4 w-4 text-green-500 ${isAdmin ? "" : ""}`} />
                                  ) : (
                                    <Square className={`h-4 w-4 text-muted-foreground/50 ${isAdmin ? "" : ""}`} />
                                  )}
                                  <span className={deliverable.completed ? "text-muted-foreground line-through" : ""}>
                                    {deliverable.name}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column - Tasks & Deadlines */}
        <div className="space-y-6">
          {/* Current Tasks */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <MessageSquare className="h-4 w-4" />
                Action Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              {tasks.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No pending tasks
                </p>
              ) : (
                <div className="space-y-4">
                  {tasks.map((task) => (
                    <div key={task.id} className="rounded-lg border p-3">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium">{task.title}</p>
                        {getPriorityBadge(task.priority)}
                      </div>
                      <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                        <span>Assigned: {task.assignee || "Unassigned"}</span>
                        <span>Due: {formatDate(task.dueDate)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Deadlines */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Calendar className="h-4 w-4" />
                Key Dates
              </CardTitle>
            </CardHeader>
            <CardContent>
              {deadlines.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No upcoming deadlines
                </p>
              ) : (
                <div className="space-y-3">
                  {deadlines.map((deadline) => (
                    <div key={deadline.id} className="flex items-center gap-3 text-sm">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                        {formatShortDate(deadline.date)}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{deadline.title}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(deadline.date)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Info Card */}
      <Card className="mt-6 border-blue-200 bg-blue-50/50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100">
              <MessageSquare className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-900">
                Questions about your {project.clientName || project.name} platform?
              </h3>
              <p className="mt-1 text-sm text-blue-800">
                Your custom business management platform is on track! Remember, the sooner we receive 
                your photos, facility images, and data, the faster we can move 
                into development. Questions about the timeline or deliverables? Just reach out.
              </p>
              <p className="mt-2 text-sm text-blue-800">
                <strong>Reminder:</strong> Your agreement includes 1 year of complimentary support 
                (bug fixes) after launch, plus admin training for your team.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
