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
  desc, 
  asc,
  calculateCurrentWeek,
  calculateProjectProgress,
  calculateWeeksRemaining,
} from "@soundsgood/db";

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
    const orgId = (session.user as any).organizationId;

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

      // Calculate stats - handles partial data gracefully
      const completedPhases = phases.filter(p => p.status === "completed").length;
      const currentPhase = phases.find(p => p.status === "in-progress");
      const totalPhases = phases.length;

      // Calculate current week - handles null startDate
      const currentWeek = calculateCurrentWeek(project.startDate || project.agreementDate);

      // Calculate weeks remaining - handles null targetEndDate  
      const weeksRemaining = calculateWeeksRemaining(project.targetEndDate);
      
      // Calculate progress percentage - handles no phases
      const progressPercent = calculateProjectProgress({
        completedPhases,
        totalPhases,
        currentPhaseInProgress: !!currentPhase,
      });

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
          progressPercent,
          // Additional data for UI
          hasPhases: totalPhases > 0,
          isSetupIncomplete: totalPhases === 0 || !project.startDate,
        },
        isAdmin: userIsAdmin,
      });
    }

    // Check if user is admin
    const userIsAdmin = await isAdmin(session.user.id, request);
    const showAll = searchParams.get("all") === "true";
    const includeOrgDetails = searchParams.get("includeOrg") === "true";

    // Admins can see all projects when requesting with ?all=true
    let userProjects;
    if (userIsAdmin && showAll) {
      if (includeOrgDetails) {
        // Include organization details for brand colors
        const projectsWithOrgs = await db
          .select({
            project: projects,
            organization: organizations,
          })
          .from(projects)
          .leftJoin(organizations, eq(projects.organizationId, organizations.id))
          .orderBy(desc(projects.createdAt));

        return NextResponse.json({ 
          projects: projectsWithOrgs.map(row => ({
            ...row.project,
            organization: row.organization,
          }))
        });
      } else {
        userProjects = await db
          .select()
          .from(projects)
          .orderBy(desc(projects.createdAt));
      }
    } else {
      userProjects = await db
        .select()
        .from(projects)
        .where(
          orgId
            ? eq(projects.organizationId, orgId)
            : eq(projects.organizationId, session.user.id) // fallback
        )
        .orderBy(desc(projects.createdAt));
    }

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

/**
 * POST - Create a new project (admin only)
 * 
 * Only name is required - all other fields are optional.
 * Allows partial project creation with progressive enhancement.
 */
export async function POST(request: NextRequest) {
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
    const {
      name,
      organizationId,
      description,
      clientName,
      status,
      startDate,
      targetEndDate,
      totalWeeks,
      agreementDate,
      contractValue,
      projectType,
      deliverables,
    } = body;

    // Only name is required
    if (!name || typeof name !== "string" || name.trim() === "") {
      return NextResponse.json(
        { error: "Project name is required" },
        { status: 400 }
      );
    }

    // Create the project with all provided fields
    const [newProject] = await db
      .insert(projects)
      .values({
        name: name.trim(),
        organizationId: organizationId || null,
        description: description || null,
        clientName: clientName || null,
        status: status || "planning",
        startDate: startDate ? new Date(startDate) : null,
        targetEndDate: targetEndDate ? new Date(targetEndDate) : null,
        totalWeeks: totalWeeks || null,
        agreementDate: agreementDate ? new Date(agreementDate) : null,
        contractValue: contractValue || null,
        projectType: projectType || null,
        deliverables: deliverables || null,
      })
      .returning();

    return NextResponse.json({ project: newProject }, { status: 201 });
  } catch (error) {
    console.error("Create project error:", error);
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Delete a project (admin only)
 * 
 * This will cascade delete all phases, tasks, and deadlines.
 */
export async function DELETE(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("id");

    if (!projectId) {
      return NextResponse.json({ error: "Project ID required" }, { status: 400 });
    }

    // Delete the project (cascades to phases, tasks, deadlines)
    const [deletedProject] = await db
      .delete(projects)
      .where(eq(projects.id, projectId))
      .returning();

    if (!deletedProject) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json({ 
      message: "Project deleted successfully",
      project: deletedProject 
    });
  } catch (error) {
    console.error("Delete project error:", error);
    return NextResponse.json(
      { error: "Failed to delete project" },
      { status: 500 }
    );
  }
}

