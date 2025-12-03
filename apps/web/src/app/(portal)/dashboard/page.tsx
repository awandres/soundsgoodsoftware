"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ImageIcon, FileText, ArrowRight, TrendingUp, Target, Zap } from "lucide-react";
import { Button, Card, CardContent, CardHeader, CardTitle, Spinner, Badge } from "@soundsgood/ui";

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
  clientName: string;
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
  totalWeeks: number;
  targetEndDate: string | null;
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

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [project, setProject] = useState<ProjectInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch("/api/dashboard");
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
        setRecentActivity(data.recentActivity);
        setProject(data.project);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 lg:p-8">
      {/* Welcome header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back! 👋
        </h1>
        <p className="mt-2 text-muted-foreground">
          Here&apos;s an overview of your project and recent activity.
        </p>
      </div>

      {/* Project Progress Card */}
      {project && (
        <Card className="mb-8 border-primary/20 bg-primary/5">
          <CardContent className="pt-6">
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
                  Phase {project.currentPhase?.orderIndex || 1} of {project.totalPhases} • Week {project.currentWeek} of {project.totalWeeks}
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
                  of {project.totalWeeks} weeks total
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
