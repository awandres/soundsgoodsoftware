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
 * GET - List all projects with summary stats (admin only)
 * 
 * Returns all projects in the system with calculated stats.
 * Optionally filter by organization.
 */
export async function GET(request: NextRequest) {
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
    const organizationId = searchParams.get("organizationId");
    const includeStats = searchParams.get("includeStats") !== "false";

    // Build query
    let allProjects;
    if (organizationId) {
      allProjects = await db
        .select()
        .from(projects)
        .where(eq(projects.organizationId, organizationId))
        .orderBy(desc(projects.createdAt));
    } else {
      allProjects = await db
        .select()
        .from(projects)
        .orderBy(desc(projects.createdAt));
    }

    // If stats are requested, calculate them for each project
    if (includeStats) {
      const projectsWithStats = await Promise.all(
        allProjects.map(async (project) => {
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

          // Get phases
          const phases = await db
            .select()
            .from(projectPhases)
            .where(eq(projectPhases.projectId, project.id))
            .orderBy(asc(projectPhases.orderIndex));

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

          return {
            ...project,
            organizationName,
            stats: {
              totalPhases,
              completedPhases,
              progressPercent,
              currentWeek,
              weeksRemaining,
              currentPhase: currentPhase?.name || null,
              hasPhases: totalPhases > 0,
              isSetupIncomplete: totalPhases === 0 || !project.startDate,
            },
          };
        })
      );

      return NextResponse.json({ projects: projectsWithStats });
    }

    return NextResponse.json({ projects: allProjects });
  } catch (error) {
    console.error("Admin projects API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 }
    );
  }
}

/**
 * POST - Create a new project (admin only)
 * 
 * Creates a new project with only required fields.
 * Returns the created project with its ID.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
 * PUT - Update a project (admin only)
 * 
 * Updates any field of a project.
 * Supports partial updates.
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userIsAdmin = await isAdmin(session.user.id, request);
    if (!userIsAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: "Project ID required" }, { status: 400 });
    }

    // Build update object with only provided fields
    const updateFields: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (updateData.name !== undefined) updateFields.name = updateData.name;
    if (updateData.organizationId !== undefined) updateFields.organizationId = updateData.organizationId || null;
    if (updateData.description !== undefined) updateFields.description = updateData.description || null;
    if (updateData.clientName !== undefined) updateFields.clientName = updateData.clientName || null;
    if (updateData.status !== undefined) updateFields.status = updateData.status;
    if (updateData.startDate !== undefined) updateFields.startDate = updateData.startDate ? new Date(updateData.startDate) : null;
    if (updateData.targetEndDate !== undefined) updateFields.targetEndDate = updateData.targetEndDate ? new Date(updateData.targetEndDate) : null;
    if (updateData.actualEndDate !== undefined) updateFields.actualEndDate = updateData.actualEndDate ? new Date(updateData.actualEndDate) : null;
    if (updateData.totalWeeks !== undefined) updateFields.totalWeeks = updateData.totalWeeks || null;
    if (updateData.agreementDate !== undefined) updateFields.agreementDate = updateData.agreementDate ? new Date(updateData.agreementDate) : null;
    if (updateData.contractValue !== undefined) updateFields.contractValue = updateData.contractValue || null;
    if (updateData.projectType !== undefined) updateFields.projectType = updateData.projectType || null;
    if (updateData.deliverables !== undefined) updateFields.deliverables = updateData.deliverables || null;

    const [updatedProject] = await db
      .update(projects)
      .set(updateFields)
      .where(eq(projects.id, id))
      .returning();

    if (!updatedProject) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json({ project: updatedProject });
  } catch (error) {
    console.error("Update project error:", error);
    return NextResponse.json(
      { error: "Failed to update project" },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Delete a project (admin only)
 * 
 * Deletes a project and all its associated data (phases, tasks, deadlines).
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userIsAdmin = await isAdmin(session.user.id, request);
    if (!userIsAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("id");

    if (!projectId) {
      return NextResponse.json({ error: "Project ID required" }, { status: 400 });
    }

    // Due to cascade delete, this will remove all phases, tasks, and deadlines
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

