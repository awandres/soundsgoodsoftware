import Link from "next/link";
import { ImageIcon, FileText, Clock, ArrowRight } from "lucide-react";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@soundsgood/ui";

export default function DashboardPage() {
  return (
    <div className="p-6 lg:p-8">
      {/* Welcome header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back, Vetted Trainers! 👋
        </h1>
        <p className="mt-2 text-muted-foreground">
          Here&apos;s an overview of your project and recent activity.
        </p>
      </div>

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
            <p className="text-3xl font-bold">dd-12</p>
            <p className="text-xs text-muted-foreground">
              dd-+3 this week
            </p>
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
            <p className="text-3xl font-bold">dd-3</p>
            <p className="text-xs text-muted-foreground">
              dd-Contract, Roadmap, Brand Guide
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Project Status
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary">dd-In Progress</p>
            <p className="text-xs text-muted-foreground">
              dd-Phase 2 of 4
            </p>
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
              Access your project documents including contracts, roadmaps, 
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
          <div className="space-y-4">
            {[
              { action: "dd-Document added", item: "dd-Project Roadmap v2", time: "dd-2 hours ago" },
              { action: "dd-Photo uploaded", item: "dd-trainer-john.jpg", time: "dd-1 day ago" },
              { action: "dd-Project update", item: "dd-Phase 2 started", time: "dd-3 days ago" },
            ].map((activity, i) => (
              <div key={i} className="flex items-center gap-4 text-sm">
                <div className="h-2 w-2 rounded-full bg-primary" />
                <div className="flex-1">
                  <span className="font-medium">{activity.action}:</span>{" "}
                  <span className="text-muted-foreground">{activity.item}</span>
                </div>
                <span className="text-xs text-muted-foreground">{activity.time}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

