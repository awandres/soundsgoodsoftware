import { NextRequest, NextResponse } from "next/server";
import { auth } from "@soundsgood/auth";
import { 
  db, 
  photos, 
  documents, 
  projects, 
  projectPhases, 
  organizations,
  users, 
  eq, 
  desc, 
  sql, 
  asc,
  calculateCurrentWeek,
  calculateProjectProgress,
  calculateWeeksRemaining,
} from "@soundsgood/db";

/**
 * GET - Dashboard stats and recent activity
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const orgId = (session.user as any).organizationId;

    // Check if user is admin (from database, not cached session)
    const [userRecord] = await db
      .select({ role: users.role })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    const isAdmin = userRecord?.role === "admin";

    // Get organization info
    let organizationName = null;
    if (orgId) {
      const [org] = await db
        .select({ name: organizations.name })
        .from(organizations)
        .where(eq(organizations.id, orgId))
        .limit(1);
      organizationName = org?.name || null;
    }

    // Get photo count
    const photoCountResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(photos)
      .where(
        orgId
          ? eq(photos.organizationId, orgId)
          : eq(photos.uploadedBy, userId)
      );
    const photoCount = Number(photoCountResult[0]?.count || 0);

    // Get photos from this week
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const photosThisWeekResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(photos)
      .where(
        orgId
          ? sql`${photos.organizationId} = ${orgId} AND ${photos.createdAt} >= ${oneWeekAgo}`
          : sql`${photos.uploadedBy} = ${userId} AND ${photos.createdAt} >= ${oneWeekAgo}`
      );
    const photosThisWeek = Number(photosThisWeekResult[0]?.count || 0);

    // Get document count
    const docCountResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(documents)
      .where(
        orgId
          ? eq(documents.organizationId, orgId)
          : eq(documents.uploadedBy, userId)
      );
    const documentCount = Number(docCountResult[0]?.count || 0);

    // Get document types summary
    const docTypesResult = await db
      .select({ type: documents.type })
      .from(documents)
      .where(
        orgId
          ? eq(documents.organizationId, orgId)
          : eq(documents.uploadedBy, userId)
      );
    const docTypes = [...new Set(docTypesResult.map(d => d.type))].filter(Boolean);

    // Get recent photos (last 5)
    const recentPhotos = await db
      .select({
        id: photos.id,
        fileName: photos.fileName,
        createdAt: photos.createdAt,
      })
      .from(photos)
      .where(
        orgId
          ? eq(photos.organizationId, orgId)
          : eq(photos.uploadedBy, userId)
      )
      .orderBy(desc(photos.createdAt))
      .limit(5);

    // Get recent documents (last 5)
    const recentDocs = await db
      .select({
        id: documents.id,
        name: documents.name,
        createdAt: documents.createdAt,
      })
      .from(documents)
      .where(
        orgId
          ? eq(documents.organizationId, orgId)
          : eq(documents.uploadedBy, userId)
      )
      .orderBy(desc(documents.createdAt))
      .limit(5);

    // Combine and sort recent activity
    const recentActivity = [
      ...recentPhotos.map(p => ({
        type: 'photo' as const,
        action: 'Photo uploaded',
        item: p.fileName,
        createdAt: p.createdAt,
      })),
      ...recentDocs.map(d => ({
        type: 'document' as const,
        action: 'Document added',
        item: d.name,
        createdAt: d.createdAt,
      })),
    ]
      .sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, 5);

    // Get project info (first project for this org)
    let projectInfo = null;
    const [project] = await db
      .select()
      .from(projects)
      .where(
        orgId
          ? eq(projects.organizationId, orgId)
          : eq(projects.organizationId, userId)
      )
      .limit(1);

    if (project) {
      // Get phases for this project (may be empty for new projects)
      const phases = await db
        .select()
        .from(projectPhases)
        .where(eq(projectPhases.projectId, project.id))
        .orderBy(asc(projectPhases.orderIndex));

      const currentPhase = phases.find(p => p.status === "in-progress");
      const completedPhases = phases.filter(p => p.status === "completed").length;
      const totalPhases = phases.length;

      // Calculate progress - handles case with no phases
      const progressPercent = calculateProjectProgress({
        completedPhases,
        totalPhases,
        currentPhaseInProgress: !!currentPhase,
      });

      // Calculate current week - handles null startDate
      const currentWeek = calculateCurrentWeek(project.startDate || project.agreementDate);

      // Calculate weeks remaining - handles null targetEndDate
      const weeksRemaining = calculateWeeksRemaining(project.targetEndDate);

      // Flag indicating if project setup is incomplete
      const isSetupIncomplete = totalPhases === 0 || !project.startDate;

      projectInfo = {
        id: project.id,
        name: project.name,
        // Use null-safe values - frontend will display "Unassigned" or "TBD" as needed
        clientName: project.clientName || null,
        status: project.status || "planning",
        currentPhase: currentPhase ? {
          id: currentPhase.id,
          name: currentPhase.name,
          orderIndex: currentPhase.orderIndex,
        } : null,
        totalPhases,
        completedPhases,
        progressPercent,
        currentWeek,
        // Pass null if not set, frontend handles display
        totalWeeks: project.totalWeeks,
        targetEndDate: project.targetEndDate,
        weeksRemaining,
        // Additional flags for UI
        isSetupIncomplete,
        hasPhases: totalPhases > 0,
        projectType: project.projectType || null,
        deliverables: project.deliverables || null,
      };
    }

    return NextResponse.json({
      stats: {
        photoCount,
        photosThisWeek,
        documentCount,
        documentTypes: docTypes,
      },
      recentActivity,
      project: projectInfo,
      organizationName,
      isAdmin,
    });
  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}

