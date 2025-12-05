"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Pencil,
  Trash2,
  Building2,
  Clock,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Eye,
  FolderKanban,
  PlayCircle,
  PauseCircle,
  TrendingUp,
} from "lucide-react";
import {
  Card,
  CardContent,
  Badge,
  Button,
  Input,
  Label,
  Textarea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@soundsgood/ui";
import { LoadingScreen } from "@/components/LoadingScreen";

// Project types and statuses from schema
const PROJECT_STATUSES = [
  { value: "planning", label: "Planning" },
  { value: "in-progress", label: "In Progress" },
  { value: "on-hold", label: "On Hold" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
] as const;

const PROJECT_TYPES = [
  { value: "full_platform", label: "Full Platform" },
  { value: "website_only", label: "Website Only" },
  { value: "crm_only", label: "CRM Only" },
  { value: "booking_only", label: "Booking Only" },
  { value: "custom", label: "Custom" },
] as const;

interface ProjectStats {
  totalPhases: number;
  completedPhases: number;
  progressPercent: number;
  currentWeek: number;
  weeksRemaining: number | null;
  currentPhase: string | null;
  hasPhases: boolean;
  isSetupIncomplete: boolean;
}

interface Project {
  id: string;
  name: string;
  description: string | null;
  clientName: string | null;
  status: string;
  startDate: string | null;
  targetEndDate: string | null;
  totalWeeks: number | null;
  agreementDate: string | null;
  projectType: string | null;
  organizationId: string | null;
  organizationName: string | null;
  createdAt: string;
  stats: ProjectStats;
}

interface Organization {
  id: string;
  name: string;
}

function getStatusColor(status: string) {
  switch (status) {
    case "completed":
      return "bg-green-100 text-green-700";
    case "in-progress":
      return "bg-blue-100 text-blue-700";
    case "on-hold":
      return "bg-amber-100 text-amber-700";
    case "cancelled":
      return "bg-red-100 text-red-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "TBD";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function AdminProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dialog state
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    clientName: "",
    status: "planning",
    organizationId: "",
    projectType: "",
    startDate: "",
    targetEndDate: "",
    totalWeeks: "",
    agreementDate: "",
  });

  useEffect(() => {
    const abortController = new AbortController();

    const checkAdminAndFetch = async () => {
      try {
        // Try to fetch projects - API will check admin status from database
        const response = await fetch("/api/admin/projects", {
          signal: abortController.signal,
        });
        
        if (response.status === 403) {
          setError("Admin access required");
          if (!abortController.signal.aborted) setIsLoading(false);
          return;
        }
        
        if (response.status === 401) {
          setError("Please log in to continue");
          if (!abortController.signal.aborted) setIsLoading(false);
          return;
        }
        
        if (response.ok) {
          const data = await response.json();
          setProjects(data.projects);
          setIsAdmin(true);
        } else {
          throw new Error("Failed to fetch projects");
        }

        // Fetch organizations for the dropdown
        await fetchOrganizations(abortController.signal);
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.error("Error:", err);
          setError("Failed to load data");
        }
      } finally {
        if (!abortController.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    checkAdminAndFetch();

    return () => {
      abortController.abort();
    };
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await fetch("/api/admin/projects");
      if (response.ok) {
        const data = await response.json();
        setProjects(data.projects);
      } else {
        throw new Error("Failed to fetch projects");
      }
    } catch (err) {
      console.error("Failed to fetch projects:", err);
      setError("Failed to load projects");
    }
  };

  const fetchOrganizations = async (signal?: AbortSignal) => {
    try {
      // Using the admin users API to get org list (or create a dedicated endpoint)
      const response = await fetch("/api/admin/users", { signal });
      if (response.ok) {
        const data = await response.json();
        // Extract unique organizations
        const orgs = data.users
          .filter((u: { organization?: { id: string; name: string } }) => u.organization)
          .map((u: { organization: { id: string; name: string } }) => u.organization)
          .filter((org: Organization, index: number, self: Organization[]) => 
            self.findIndex(o => o.id === org.id) === index
          );
        setOrganizations(orgs);
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        console.error("Failed to fetch organizations:", err);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      clientName: "",
      status: "planning",
      organizationId: "",
      projectType: "",
      startDate: "",
      targetEndDate: "",
      totalWeeks: "",
      agreementDate: "",
    });
  };

  const openCreateDialog = () => {
    resetForm();
    setShowCreateDialog(true);
  };

  const openEditDialog = (project: Project) => {
    setSelectedProject(project);
    setFormData({
      name: project.name,
      description: project.description || "",
      clientName: project.clientName || "",
      status: project.status,
      organizationId: project.organizationId || "",
      projectType: project.projectType || "",
      startDate: project.startDate ? String(project.startDate).split("T")[0] ?? "" : "",
      targetEndDate: project.targetEndDate ? String(project.targetEndDate).split("T")[0] ?? "" : "",
      totalWeeks: project.totalWeeks?.toString() || "",
      agreementDate: project.agreementDate ? String(project.agreementDate).split("T")[0] ?? "" : "",
    });
    setShowEditDialog(true);
  };

  const openDeleteDialog = (project: Project) => {
    setSelectedProject(project);
    setShowDeleteDialog(true);
  };

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch("/api/admin/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description || null,
          clientName: formData.clientName || null,
          status: formData.status,
          organizationId: formData.organizationId || null,
          projectType: formData.projectType || null,
          startDate: formData.startDate || null,
          targetEndDate: formData.targetEndDate || null,
          totalWeeks: formData.totalWeeks ? parseInt(formData.totalWeeks) : null,
          agreementDate: formData.agreementDate || null,
        }),
      });

      if (response.ok) {
        setShowCreateDialog(false);
        await fetchProjects();
      } else {
        const data = await response.json();
        setError(data.error || "Failed to create project");
      }
    } catch (err) {
      console.error("Create error:", err);
      setError("Failed to create project");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedProject || !formData.name.trim()) {
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch("/api/admin/projects", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedProject.id,
          name: formData.name.trim(),
          description: formData.description || null,
          clientName: formData.clientName || null,
          status: formData.status,
          organizationId: formData.organizationId || null,
          projectType: formData.projectType || null,
          startDate: formData.startDate || null,
          targetEndDate: formData.targetEndDate || null,
          totalWeeks: formData.totalWeeks ? parseInt(formData.totalWeeks) : null,
          agreementDate: formData.agreementDate || null,
        }),
      });

      if (response.ok) {
        setShowEditDialog(false);
        setSelectedProject(null);
        await fetchProjects();
      } else {
        const data = await response.json();
        setError(data.error || "Failed to update project");
      }
    } catch (err) {
      console.error("Update error:", err);
      setError("Failed to update project");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedProject) return;

    setIsSaving(true);
    try {
      const response = await fetch(`/api/admin/projects?id=${selectedProject.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setShowDeleteDialog(false);
        setSelectedProject(null);
        await fetchProjects();
      } else {
        const data = await response.json();
        setError(data.error || "Failed to delete project");
      }
    } catch (err) {
      console.error("Delete error:", err);
      setError("Failed to delete project");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <LoadingScreen message="Loading projects..." />;
  }

  if (error && !isAdmin) {
    return (
      <div className="p-6 lg:p-8">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
            <p className="text-lg font-semibold text-destructive">{error}</p>
            <p className="text-sm text-muted-foreground mt-2">
              You need admin access to view this page.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate summary stats
  const stats = {
    total: projects.length,
    inProgress: projects.filter(p => p.status === "in-progress").length,
    planning: projects.filter(p => p.status === "planning").length,
    completed: projects.filter(p => p.status === "completed").length,
    onHold: projects.filter(p => p.status === "on-hold").length,
    avgProgress: projects.length > 0 
      ? Math.round(projects.reduce((sum, p) => sum + p.stats.progressPercent, 0) / projects.length)
      : 0,
  };

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects Overview</h1>
          <p className="mt-2 text-muted-foreground">
            Manage client projects, track progress, and monitor deliverables.
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          New Project
        </Button>
      </div>

      {/* Summary Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800">
                <FolderKanban className="h-5 w-5 text-slate-600 dark:text-slate-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total Projects</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
                <PlayCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.inProgress}</p>
                <p className="text-xs text-muted-foreground">In Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                <Clock className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.planning}</p>
                <p className="text-xs text-muted-foreground">Planning</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.completed}</p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900">
                <PauseCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.onHold}</p>
                <p className="text-xs text-muted-foreground">On Hold</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900">
                <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.avgProgress}%</p>
                <p className="text-xs text-muted-foreground">Avg Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Error banner */}
      {error && (
        <Card className="mb-6 border-destructive/50 bg-destructive/10">
          <CardContent className="py-3 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <span className="text-sm text-destructive">{error}</span>
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto"
              onClick={() => setError(null)}
            >
              Dismiss
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Projects list */}
      {projects.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No projects yet</h3>
            <p className="text-sm text-muted-foreground mt-1 mb-4">
              Create your first project to get started.
            </p>
            <Button onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Create Project
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {projects.map((project) => (
            <Card key={project.id} className="hover:shadow-md transition-shadow">
              <CardContent className="py-4">
                <div className="flex items-start justify-between gap-4">
                  {/* Project info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold truncate">{project.name}</h3>
                      <Badge className={getStatusColor(project.status)}>
                        {PROJECT_STATUSES.find(s => s.value === project.status)?.label || project.status}
                      </Badge>
                      {project.stats.isSetupIncomplete && (
                        <Badge variant="outline" className="text-amber-600 border-amber-300">
                          Setup Incomplete
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {project.clientName || "Unassigned"} 
                      {project.organizationName && ` • ${project.organizationName}`}
                    </p>
                  </div>

                  {/* Stats */}
                  <div className="hidden md:flex items-center gap-6 text-sm">
                    <div className="text-center">
                      <div className="text-muted-foreground">Progress</div>
                      <div className="font-semibold">{project.stats.progressPercent}%</div>
                    </div>
                    <div className="text-center">
                      <div className="text-muted-foreground">Phases</div>
                      <div className="font-semibold">
                        {project.stats.completedPhases}/{project.stats.totalPhases || "—"}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-muted-foreground">Week</div>
                      <div className="font-semibold">
                        {project.stats.currentWeek}
                        {project.totalWeeks && `/${project.totalWeeks}`}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-muted-foreground">Target</div>
                      <div className="font-semibold">{formatDate(project.targetEndDate)}</div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/admin/projects/${project.id}`)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(project)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => openDeleteDialog(project)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Mobile stats */}
                <div className="md:hidden mt-3 grid grid-cols-4 gap-2 text-xs text-center">
                  <div>
                    <div className="text-muted-foreground">Progress</div>
                    <div className="font-semibold">{project.stats.progressPercent}%</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Phases</div>
                    <div className="font-semibold">
                      {project.stats.completedPhases}/{project.stats.totalPhases || "—"}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Week</div>
                    <div className="font-semibold">{project.stats.currentWeek}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Target</div>
                    <div className="font-semibold">{formatDate(project.targetEndDate)}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog 
        open={showCreateDialog || showEditDialog} 
        onOpenChange={(open) => {
          if (!open) {
            setShowCreateDialog(false);
            setShowEditDialog(false);
            setSelectedProject(null);
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {showCreateDialog ? "Create New Project" : "Edit Project"}
            </DialogTitle>
            <DialogDescription>
              {showCreateDialog
                ? "Only the project name is required. You can fill in other details later."
                : "Update the project details below."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Name - Required */}
            <div className="grid gap-2">
              <Label htmlFor="name">
                Project Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Vetted Trainers Platform"
              />
            </div>

            {/* Client Name */}
            <div className="grid gap-2">
              <Label htmlFor="clientName">Client Name</Label>
              <Input
                id="clientName"
                value={formData.clientName}
                onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                placeholder="e.g., Vetted Trainers Inc."
              />
            </div>

            {/* Organization */}
            <div className="grid gap-2">
              <Label htmlFor="organization">Organization</Label>
              <Select
                value={formData.organizationId || "none"}
                onValueChange={(value) => setFormData({ ...formData, organizationId: value === "none" ? "" : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select organization" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {organizations.map((org) => (
                    <SelectItem key={org.id} value={org.id}>
                      {org.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status and Type */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PROJECT_STATUSES.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="projectType">Project Type</Label>
                <Select
                  value={formData.projectType || "none"}
                  onValueChange={(value) => setFormData({ ...formData, projectType: value === "none" ? "" : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Not Set</SelectItem>
                    {PROJECT_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Description */}
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of the project..."
                rows={3}
              />
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="targetEndDate">Target End Date</Label>
                <Input
                  id="targetEndDate"
                  type="date"
                  value={formData.targetEndDate}
                  onChange={(e) => setFormData({ ...formData, targetEndDate: e.target.value })}
                />
              </div>
            </div>

            {/* Agreement and Weeks */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="agreementDate">Agreement Date</Label>
                <Input
                  id="agreementDate"
                  type="date"
                  value={formData.agreementDate}
                  onChange={(e) => setFormData({ ...formData, agreementDate: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="totalWeeks">Total Weeks</Label>
                <Input
                  id="totalWeeks"
                  type="number"
                  min="1"
                  value={formData.totalWeeks}
                  onChange={(e) => setFormData({ ...formData, totalWeeks: e.target.value })}
                  placeholder="e.g., 12"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateDialog(false);
                setShowEditDialog(false);
                setSelectedProject(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={showCreateDialog ? handleCreate : handleUpdate}
              disabled={isSaving || !formData.name.trim()}
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : showCreateDialog ? (
                "Create Project"
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete &ldquo;{selectedProject?.name}&rdquo; and all its
              phases, tasks, and deadlines. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedProject(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Project"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

