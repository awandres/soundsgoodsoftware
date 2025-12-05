import { NextRequest, NextResponse } from "next/server";
import { auth } from "@soundsgood/auth";
import { 
  db, 
  projects, 
  projectPhases, 
  projectTasks, 
  projectDeadlines, 
  organizations,
  users, 
  eq, 
  asc,
  calculateCurrentWeek,
  calculateProjectProgress,
  calculateWeeksRemaining,
} from "@soundsgood/db";

// Check if user is admin
async function isAdmin(userId: string, request: NextRequest): Promise<boolean> {
  const host = request.headers.get("host") || "";
  const isLocalhost = host.startsWith("localhost") || host.startsWith("127.0.0.1");
  
  if (isLocalhost) {
    const devAdminCookie = request.cookies.get("dev-admin-mode");
    if (devAdminCookie?.value === "true") return true;
  }
  
  const [user] = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  
  return user?.role === "admin";
}

/**
 * GET - Get a single project with full details (admin only)
 * 
 * Returns the project with all phases, tasks, and deadlines.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    // Get the project
    const [project] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, id))
      .limit(1);

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Get organization name
    let organizationName = null;
    if (project.organizationId) {
      const [org] = await db
        .select({ name: organizations.name })
        .from(organizations)
        .where(eq(organizations.id, project.organizationId))
        .limit(1);
      organizationName = org?.name || null;
    }

    // Get all phases
    const phases = await db
      .select()
      .from(projectPhases)
      .where(eq(projectPhases.projectId, id))
      .orderBy(asc(projectPhases.orderIndex));

    // Get all tasks
    const tasks = await db
      .select()
      .from(projectTasks)
      .where(eq(projectTasks.projectId, id))
      .orderBy(asc(projectTasks.dueDate));

    // Get all deadlines
    const deadlines = await db
      .select()
      .from(projectDeadlines)
      .where(eq(projectDeadlines.projectId, id))
      .orderBy(asc(projectDeadlines.date));

    // Calculate stats
    const completedPhases = phases.filter(p => p.status === "completed").length;
    const currentPhase = phases.find(p => p.status === "in-progress");
    const totalPhases = phases.length;

    const progressPercent = calculateProjectProgress({
      completedPhases,
      totalPhases,
      currentPhaseInProgress: !!currentPhase,
    });

    const currentWeek = calculateCurrentWeek(project.startDate || project.agreementDate);
    const weeksRemaining = calculateWeeksRemaining(project.targetEndDate);

    // Task stats
    const taskStats = {
      total: tasks.length,
      pending: tasks.filter(t => t.status === "pending").length,
      inProgress: tasks.filter(t => t.status === "in-progress").length,
      completed: tasks.filter(t => t.status === "completed").length,
      overdue: tasks.filter(t => 
        t.status !== "completed" && 
        t.dueDate && 
        new Date(t.dueDate) < new Date()
      ).length,
    };

    // Group tasks by phase
    const tasksByPhase: Record<string, typeof tasks> = {};
    const unassignedTasks: typeof tasks = [];
    
    for (const task of tasks) {
      if (task.phaseId) {
        if (!tasksByPhase[task.phaseId]) {
          tasksByPhase[task.phaseId] = [];
        }
        tasksByPhase[task.phaseId]!.push(task);
      } else {
        unassignedTasks.push(task);
      }
    }

    // Upcoming deadlines (next 30 days)
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    const upcomingDeadlines = deadlines.filter(d => 
      new Date(d.date) <= thirtyDaysFromNow && new Date(d.date) >= new Date()
    );

    return NextResponse.json({
      project: {
        ...project,
        organizationName,
      },
      phases: phases.map(phase => ({
        ...phase,
        tasks: tasksByPhase[phase.id] || [],
      })),
      tasks,
      unassignedTasks,
      deadlines,
      upcomingDeadlines,
      stats: {
        totalPhases,
        completedPhases,
        progressPercent,
        currentWeek,
        weeksRemaining,
        currentPhase: currentPhase?.name || null,
        currentPhaseId: currentPhase?.id || null,
        hasPhases: totalPhases > 0,
        isSetupIncomplete: totalPhases === 0 || !project.startDate,
        tasks: taskStats,
      },
    });
  } catch (error) {
    console.error("Get project detail error:", error);
    return NextResponse.json(
      { error: "Failed to fetch project" },
      { status: 500 }
    );
  }
}

