/**
 * Project Display Utilities
 * 
 * Helper functions for displaying project data with meaningful placeholders
 * when values are null/undefined.
 */

// Default placeholder values
const PLACEHOLDERS = {
  date: "TBD",
  text: "Not Set",
  client: "Unassigned",
  number: "—",
  status: "Unknown",
  phase: "Not Started",
  weeks: "TBD",
} as const;

/**
 * Display a project value with appropriate placeholder when null/undefined
 */
export function displayProjectValue(
  value: unknown,
  type: "date" | "text" | "number" | "status" | "client" | "phase" | "weeks"
): string {
  if (value === null || value === undefined || value === "") {
    return PLACEHOLDERS[type];
  }

  switch (type) {
    case "date":
      if (value instanceof Date) {
        return formatDate(value);
      }
      if (typeof value === "string") {
        const date = new Date(value);
        return isNaN(date.getTime()) ? PLACEHOLDERS.date : formatDate(date);
      }
      return PLACEHOLDERS.date;

    case "number":
      if (typeof value === "number") {
        return value.toString();
      }
      return PLACEHOLDERS.number;

    case "weeks":
      if (typeof value === "number") {
        return `${value} week${value !== 1 ? "s" : ""}`;
      }
      return PLACEHOLDERS.weeks;

    case "status":
      if (typeof value === "string") {
        return formatStatus(value);
      }
      return PLACEHOLDERS.status;

    default:
      return String(value);
  }
}

/**
 * Format a date for display
 */
export function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Format a short date (MM/DD)
 */
export function formatShortDate(date: Date): string {
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

/**
 * Format a status string for display
 */
export function formatStatus(status: string): string {
  return status
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Get display values for a project with all placeholders filled in
 */
export function getProjectDisplayData(project: {
  name: string;
  description?: string | null;
  clientName?: string | null;
  status?: string | null;
  startDate?: Date | string | null;
  targetEndDate?: Date | string | null;
  actualEndDate?: Date | string | null;
  totalWeeks?: number | null;
  agreementDate?: Date | string | null;
  projectType?: string | null;
}) {
  return {
    name: project.name,
    description: displayProjectValue(project.description, "text"),
    clientName: displayProjectValue(project.clientName, "client"),
    status: displayProjectValue(project.status, "status"),
    startDate: displayProjectValue(project.startDate, "date"),
    targetEndDate: displayProjectValue(project.targetEndDate, "date"),
    actualEndDate: displayProjectValue(project.actualEndDate, "date"),
    totalWeeks: displayProjectValue(project.totalWeeks, "weeks"),
    agreementDate: displayProjectValue(project.agreementDate, "date"),
    projectType: displayProjectValue(project.projectType, "text"),
    
    // Raw values for conditional logic
    hasStartDate: project.startDate !== null && project.startDate !== undefined,
    hasTargetEndDate: project.targetEndDate !== null && project.targetEndDate !== undefined,
    hasTotalWeeks: project.totalWeeks !== null && project.totalWeeks !== undefined,
    hasClientName: project.clientName !== null && project.clientName !== undefined && project.clientName !== "",
    isComplete: project.status === "completed",
    isInProgress: project.status === "in-progress",
    isPlanning: project.status === "planning",
  };
}

/**
 * Calculate project progress with safe defaults
 */
export function calculateProjectProgress(params: {
  completedPhases: number;
  totalPhases: number;
  currentPhaseInProgress: boolean;
}): number {
  const { completedPhases, totalPhases, currentPhaseInProgress } = params;
  
  if (totalPhases === 0) {
    return 0;
  }
  
  const progress = completedPhases + (currentPhaseInProgress ? 0.5 : 0);
  return Math.round((progress / totalPhases) * 100);
}

/**
 * Calculate current week of a project
 */
export function calculateCurrentWeek(startDate: Date | string | null | undefined): number {
  if (!startDate) {
    return 1;
  }
  
  const start = typeof startDate === "string" ? new Date(startDate) : startDate;
  if (isNaN(start.getTime())) {
    return 1;
  }
  
  const now = new Date();
  const diffMs = now.getTime() - start.getTime();
  const diffWeeks = Math.ceil(diffMs / (7 * 24 * 60 * 60 * 1000));
  
  return Math.max(1, diffWeeks);
}

/**
 * Calculate weeks remaining until target end date
 */
export function calculateWeeksRemaining(targetEndDate: Date | string | null | undefined): number | null {
  if (!targetEndDate) {
    return null;
  }
  
  const target = typeof targetEndDate === "string" ? new Date(targetEndDate) : targetEndDate;
  if (isNaN(target.getTime())) {
    return null;
  }
  
  const now = new Date();
  const diffMs = target.getTime() - now.getTime();
  const diffWeeks = Math.ceil(diffMs / (7 * 24 * 60 * 60 * 1000));
  
  return diffWeeks;
}

