import { NextRequest, NextResponse } from "next/server";
import { auth } from "@soundsgood/auth";
import { db } from "@soundsgood/db/client";
import { photos, documents, projects, projectPhases } from "@soundsgood/db/schema";
import { eq, desc, sql, asc } from "drizzle-orm";

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
    const orgId = session.user.organizationId;

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
      // Get phases for this project
      const phases = await db
        .select()
        .from(projectPhases)
        .where(eq(projectPhases.projectId, project.id))
        .orderBy(asc(projectPhases.orderIndex));

      const currentPhase = phases.find(p => p.status === "in-progress");
      const completedPhases = phases.filter(p => p.status === "completed").length;
      const totalPhases = phases.length;

      // Calculate progress
      const progressPercent = totalPhases > 0 
        ? Math.round(((completedPhases + (currentPhase ? 0.5 : 0)) / totalPhases) * 100)
        : 0;

      // Calculate weeks
      const startDate = project.startDate ? new Date(project.startDate) : new Date(project.agreementDate || Date.now());
      const now = new Date();
      const currentWeek = Math.max(1, Math.ceil((now.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000)));

      projectInfo = {
        id: project.id,
        name: project.name,
        clientName: project.clientName,
        status: project.status,
        currentPhase: currentPhase ? {
          id: currentPhase.id,
          name: currentPhase.name,
          orderIndex: currentPhase.orderIndex,
        } : null,
        totalPhases,
        completedPhases,
        progressPercent,
        currentWeek,
        totalWeeks: project.totalWeeks || 12,
        targetEndDate: project.targetEndDate,
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
    });
  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}

