import { NextRequest, NextResponse } from "next/server";
import { auth } from "@soundsgood/auth";
import { db } from "@soundsgood/db/client";
import { projects, projectPhases, projectTasks, projectDeadlines, users } from "@soundsgood/db/schema";
import { eq, desc, asc } from "drizzle-orm";

// Check if user is admin (either by role or localhost dev mode)
async function isAdmin(userId: string, request: NextRequest): Promise<boolean> {
  // Check if localhost (dev mode)
  const host = request.headers.get("host") || "";
  const isLocalhost = host.startsWith("localhost") || host.startsWith("127.0.0.1");
  
  if (isLocalhost) {
    // In dev mode, check for dev-admin cookie
    const devAdminCookie = request.cookies.get("dev-admin-mode");
    if (devAdminCookie?.value === "true") return true;
  }
  
  // Check actual user role in database
  const [user] = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  
  return user?.role === "admin";
}

/**
 * GET - Get project(s) for the current user/organization
 * 
 * Query params:
 * - id: Get specific project with all details
 * - (none): List all projects for the user
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("id");
    const orgId = session.user.organizationId;

    // Get specific project with all related data
    if (projectId) {
      const [project] = await db
        .select()
        .from(projects)
        .where(eq(projects.id, projectId))
        .limit(1);

      if (!project) {
        return NextResponse.json({ error: "Project not found" }, { status: 404 });
      }

      // Verify user has access to this project
      if (project.organizationId !== orgId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }

      // Get phases ordered by index
      const phases = await db
        .select()
        .from(projectPhases)
        .where(eq(projectPhases.projectId, projectId))
        .orderBy(asc(projectPhases.orderIndex));

      // Get active tasks
      const tasks = await db
        .select()
        .from(projectTasks)
        .where(eq(projectTasks.projectId, projectId))
        .orderBy(desc(projectTasks.dueDate));

      // Get upcoming deadlines
      const deadlines = await db
        .select()
        .from(projectDeadlines)
        .where(eq(projectDeadlines.projectId, projectId))
        .orderBy(asc(projectDeadlines.date));

      // Calculate stats
      const completedPhases = phases.filter(p => p.status === "completed").length;
      const currentPhase = phases.find(p => p.status === "in-progress");
      const totalPhases = phases.length;

      // Calculate current week
      const startDate = project.startDate ? new Date(project.startDate) : new Date(project.agreementDate || Date.now());
      const now = new Date();
      const currentWeek = Math.max(1, Math.ceil((now.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000)));

      // Calculate weeks remaining
      const targetEnd = project.targetEndDate ? new Date(project.targetEndDate) : null;
      const weeksRemaining = targetEnd ? Math.ceil((targetEnd.getTime() - now.getTime()) / (7 * 24 * 60 * 60 * 1000)) : null;

      // Check if user is admin
      const userIsAdmin = await isAdmin(session.user.id, request);

      return NextResponse.json({
        project,
        phases,
        tasks: tasks.filter(t => t.status !== "completed" && t.status !== "cancelled"),
        deadlines,
        stats: {
          completedPhases,
          totalPhases,
          currentPhase,
          currentWeek,
          weeksRemaining,
          progressPercent: Math.round(((completedPhases + (currentPhase ? 0.5 : 0)) / totalPhases) * 100),
        },
        isAdmin: userIsAdmin,
      });
    }

    // List all projects for the organization
    const userProjects = await db
      .select()
      .from(projects)
      .where(
        orgId
          ? eq(projects.organizationId, orgId)
          : eq(projects.organizationId, session.user.id) // fallback
      )
      .orderBy(desc(projects.createdAt));

    return NextResponse.json({ projects: userProjects });
  } catch (error) {
    console.error("Projects API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch project data" },
      { status: 500 }
    );
  }
}

/**
 * PUT - Update a project phase (for admin use)
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check admin access
    const userIsAdmin = await isAdmin(session.user.id, request);
    if (!userIsAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const body = await request.json();
    const { phaseId, status, actualStartDate, actualEndDate } = body;

    if (!phaseId) {
      return NextResponse.json({ error: "Phase ID required" }, { status: 400 });
    }

    // Update the phase
    const [updatedPhase] = await db
      .update(projectPhases)
      .set({
        status: status || undefined,
        actualStartDate: actualStartDate ? new Date(actualStartDate) : undefined,
        actualEndDate: actualEndDate ? new Date(actualEndDate) : undefined,
        updatedAt: new Date(),
      })
      .where(eq(projectPhases.id, phaseId))
      .returning();

    return NextResponse.json({ phase: updatedPhase });
  } catch (error) {
    console.error("Update phase error:", error);
    return NextResponse.json(
      { error: "Failed to update phase" },
      { status: 500 }
    );
  }
}

/**
 * PATCH - Update deliverables for a phase (admin only)
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check admin access
    const userIsAdmin = await isAdmin(session.user.id, request);
    if (!userIsAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const body = await request.json();
    const { phaseId, deliverables } = body;

    if (!phaseId || !deliverables) {
      return NextResponse.json({ error: "Phase ID and deliverables required" }, { status: 400 });
    }

    // Update the deliverables
    const [updatedPhase] = await db
      .update(projectPhases)
      .set({
        deliverables,
        updatedAt: new Date(),
      })
      .where(eq(projectPhases.id, phaseId))
      .returning();

    return NextResponse.json({ phase: updatedPhase });
  } catch (error) {
    console.error("Update deliverables error:", error);
    return NextResponse.json(
      { error: "Failed to update deliverables" },
      { status: 500 }
    );
  }
}

