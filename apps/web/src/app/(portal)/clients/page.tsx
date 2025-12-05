"use client";

import { useState, useEffect, useRef } from "react";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Spinner,
  Badge,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Textarea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Separator,
  Switch,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@soundsgood/ui";
import { LoadingScreen } from "@/components/LoadingScreen";
import {
  Plus,
  Mail,
  Clock,
  CheckCircle,
  XCircle,
  RotateCw,
  Trash2,
  Send,
  Users,
  Copy,
  Check,
  Building2,
  Palette,
  Crown,
  UserCircle,
  Image as ImageIcon,
  X,
  Sparkles,
  Eye,
  ClipboardList,
  FolderPlus,
  Folder,
  AlertTriangle,
  AlertCircle,
} from "lucide-react";
import { EmailPreviewDialog } from "@/components/EmailPreviewDialog";
import { meetsWCAG, getContrastRating, suggestAccessibleColor } from "@/lib/colorUtils";

// Business types and labels imported from shared config
const businessTypes = [
  "fitness",
  "restaurant",
  "retail",
  "professional_services",
  "ecommerce",
  "real_estate",
  "salon_spa",
  "healthcare",
  "construction",
  "creative_agency",
  "nonprofit",
  "education",
  "reiki",
  "other",
] as const;

type BusinessType = (typeof businessTypes)[number];

const businessTypeLabels: Record<BusinessType, string> = {
  fitness: "Fitness / Gym",
  restaurant: "Restaurant / Food Service",
  retail: "Retail Store",
  professional_services: "Professional Services",
  ecommerce: "E-commerce",
  real_estate: "Real Estate",
  salon_spa: "Salon / Spa",
  healthcare: "Healthcare",
  construction: "Construction / Trades",
  creative_agency: "Creative Agency",
  nonprofit: "Nonprofit",
  education: "Education",
  reiki: "Reiki / Energy Healing",
  other: "Other",
};

interface BrandColors {
  primary?: string;
  secondary?: string;
  accent?: string;
}

interface OrganizationSetupData {
  businessName: string;
  businessType?: BusinessType;
  contactName?: string;
  logoUrl?: string;
  logoKey?: string;
  brandColors?: BrandColors;
  customPhotoTags?: string[];
}

interface Invitation {
  id: string;
  email: string;
  name: string | null;
  status: "pending" | "accepted" | "expired" | "revoked";
  role: string;
  accountType: "team_lead" | "team_member" | null;
  message: string | null;
  organizationData: OrganizationSetupData | null;
  isDemo: boolean;
  expiresAt: string;
  acceptedAt: string | null;
  createdAt: string;
  organization: {
    id: string;
    name: string;
  } | null;
}

const statusConfig = {
  pending: { label: "Pending", color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400", icon: Clock },
  accepted: { label: "Accepted", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400", icon: CheckCircle },
  expired: { label: "Expired", color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400", icon: Clock },
  revoked: { label: "Revoked", color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400", icon: XCircle },
};

export default function ClientsPage() {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  // Form state - Basic info
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [accountType, setAccountType] = useState<"team_lead" | "team_member">("team_lead");
  const [isDemo, setIsDemo] = useState(false);

  // Form state - Organization setup
  const [createNewOrg, setCreateNewOrg] = useState(true);
  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] = useState<BusinessType | "">("");
  const [contactName, setContactName] = useState("");

  // Form state - Branding
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoKey, setLogoKey] = useState<string | null>(null);
  const [primaryColor, setPrimaryColor] = useState("#3b82f6");
  const [secondaryColor, setSecondaryColor] = useState("#1e40af");
  const [accentColor, setAccentColor] = useState("#f59e0b");

  // Form state - Project
  const [projectOption, setProjectOption] = useState<"none" | "new" | "existing">("none");
  const [newProjectName, setNewProjectName] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [availableProjects, setAvailableProjects] = useState<Array<{ 
    id: string; 
    name: string; 
    clientName: string;
    organization?: {
      id: string;
      name: string;
      settings?: {
        brandColors?: BrandColors;
        logo?: string;
      };
    };
  }>>([]);
  
  // Track if we loaded colors from an existing project
  const [loadedFromProject, setLoadedFromProject] = useState(false);

  // Form submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [lastInviteLink, setLastInviteLink] = useState<string | null>(null);

  // Email preview state
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewHtml, setPreviewHtml] = useState("");
  const [previewWarnings, setPreviewWarnings] = useState<Array<{
    type: "error" | "warning";
    location: string;
    message: string;
    currentRatio: number;
    requiredRatio: number;
    suggestion?: string;
  }>>([]);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  // Email-specific colors (separate from brand colors)
  const [useEmailColors, setUseEmailColors] = useState(false);
  const [emailPrimaryColor, setEmailPrimaryColor] = useState("#667eea");
  const [emailSecondaryColor, setEmailSecondaryColor] = useState("#764ba2");

  const logoInputRef = useRef<HTMLInputElement>(null);

  // Calculate contrast warnings for color pickers
  const getColorContrast = (color: string) => {
    const contrast = meetsWCAG("#ffffff", color);
    const rating = getContrastRating(contrast.ratio);
    return { ...contrast, ...rating };
  };

  const primaryContrast = getColorContrast(useEmailColors ? emailPrimaryColor : primaryColor);

  // Fetch invitations (can be called from multiple places)
  const fetchInvitations = async () => {
    try {
      const response = await fetch("/api/invitations");
      if (!response.ok) {
        if (response.status === 403) {
          setError("You don't have permission to view this page");
          return;
        }
        throw new Error("Failed to fetch invitations");
      }
      const data = await response.json();
      setInvitations(data.invitations || []);
    } catch (err) {
      setError("Failed to load invitations");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data on mount
  useEffect(() => {
    const abortController = new AbortController();

    const fetchProjects = async () => {
      try {
        const response = await fetch("/api/projects?all=true&includeOrg=true", {
          signal: abortController.signal,
        });
        if (response.ok) {
          const data = await response.json();
          setAvailableProjects(data.projects || []);
        }
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.error("Failed to fetch projects:", err);
        }
      }
    };

    fetchInvitations();
    fetchProjects();

    return () => {
      abortController.abort();
    };
  }, []);

  // Load brand colors when selecting an existing project
  useEffect(() => {
    if (projectOption === "existing" && selectedProjectId) {
      const selectedProject = availableProjects.find(p => p.id === selectedProjectId);
      if (selectedProject?.organization?.settings?.brandColors) {
        const colors = selectedProject.organization.settings.brandColors;
        if (colors.primary) setPrimaryColor(colors.primary);
        if (colors.secondary) setSecondaryColor(colors.secondary);
        if (colors.accent) setAccentColor(colors.accent);
        setLoadedFromProject(true);
      } else {
        // No existing colors - keep current or reset to defaults
        setLoadedFromProject(false);
      }
      
      // Load logo if available
      if (selectedProject?.organization?.settings?.logo) {
        setLogoUrl(selectedProject.organization.settings.logo);
        setLogoPreview(selectedProject.organization.settings.logo);
      }
    } else if (projectOption !== "existing") {
      setLoadedFromProject(false);
    }
  }, [projectOption, selectedProjectId, availableProjects]);

  // Handle logo file selection
  const handleLogoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setFormError("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setFormError("Logo must be smaller than 5MB");
      return;
    }

    setLogoFile(file);
    setFormError(null);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Upload logo to R2
  const uploadLogo = async (): Promise<{ url: string; key: string } | null> => {
    if (!logoFile) return null;

    setIsUploadingLogo(true);
    try {
      // Get presigned URL
      const presignResponse = await fetch(
        `/api/upload?fileName=${encodeURIComponent(logoFile.name)}&fileType=${encodeURIComponent(logoFile.type)}&category=logos`
      );

      if (!presignResponse.ok) {
        throw new Error("Failed to get upload URL");
      }

      const { uploadUrl, publicUrl, fileKey } = await presignResponse.json();

      // Upload to R2
      const uploadResponse = await fetch(uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": logoFile.type,
        },
        body: logoFile,
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload logo");
      }

      setLogoUrl(publicUrl);
      setLogoKey(fileKey);
      return { url: publicUrl, key: fileKey };
    } catch (err) {
      console.error("Logo upload error:", err);
      setFormError("Failed to upload logo. You can try again or continue without a logo.");
      return null;
    } finally {
      setIsUploadingLogo(false);
    }
  };

  // Remove logo
  const removeLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    setLogoUrl(null);
    setLogoKey(null);
    if (logoInputRef.current) {
      logoInputRef.current.value = "";
    }
  };

  // Reset form
  const resetForm = () => {
    setEmail("");
    setName("");
    setMessage("");
    setAccountType("team_lead");
    setIsDemo(false);
    setCreateNewOrg(true);
    setBusinessName("");
    setBusinessType("");
    setContactName("");
    setLogoFile(null);
    setLogoPreview(null);
    setLogoUrl(null);
    setLogoKey(null);
    setPrimaryColor("#3b82f6");
    setSecondaryColor("#1e40af");
    setAccentColor("#f59e0b");
    setProjectOption("none");
    setNewProjectName("");
    setSelectedProjectId("");
    setLoadedFromProject(false);
    setFormError(null);
    setSuccessMessage(null);
    setLastInviteLink(null);
    // Reset email preview state
    setIsPreviewOpen(false);
    setPreviewHtml("");
    setPreviewWarnings([]);
    setUseEmailColors(false);
    setEmailPrimaryColor("#667eea");
    setEmailSecondaryColor("#764ba2");
  };

  // Fetch email preview
  const fetchEmailPreview = async () => {
    setIsPreviewLoading(true);
    try {
      // Determine which colors to use for the email
      const emailColors = useEmailColors
        ? { primary: emailPrimaryColor, secondary: emailSecondaryColor }
        : { primary: primaryColor, secondary: secondaryColor, accent: accentColor };

      // Get organization name - from existing project or from new business name
      let orgNameForPreview = businessName.trim() || "Your Business";
      if (projectOption === "existing" && selectedProjectId) {
        const selectedProject = availableProjects.find(p => p.id === selectedProjectId);
        if (selectedProject?.organization?.name) {
          orgNameForPreview = selectedProject.organization.name;
        } else if (selectedProject?.clientName) {
          orgNameForPreview = selectedProject.clientName;
        }
      }

      const response = await fetch("/api/email-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim() || "client@example.com",
          name: name.trim() || undefined,
          organizationName: orgNameForPreview,
          brandColors: emailColors,
          logoUrl: logoUrl || logoPreview || undefined,
          message: message.trim() || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate preview");
      }

      const data = await response.json();
      setPreviewHtml(data.html);
      setPreviewWarnings(data.warnings || []);
      setIsPreviewOpen(true);
    } catch (err) {
      console.error("Preview error:", err);
      setFormError("Failed to generate email preview. Please try again.");
    } finally {
      setIsPreviewLoading(false);
    }
  };

  // Handle send from preview dialog
  const handleSendFromPreview = async () => {
    setIsPreviewOpen(false);
    // Trigger the form submission
    const form = document.getElementById("invite-form") as HTMLFormElement;
    if (form) {
      form.requestSubmit();
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSuccessMessage(null);
    setLastInviteLink(null);

    if (!email.trim()) {
      setFormError("Email is required");
      return;
    }

    if (createNewOrg && !businessName.trim()) {
      setFormError("Business name is required when creating a new organization");
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload logo if selected
      let uploadedLogo: { url: string; key: string } | null = null;
      if (logoFile) {
        uploadedLogo = await uploadLogo();
      }

      // Build organization data
      let organizationData: OrganizationSetupData | null = null;
      if (createNewOrg) {
        organizationData = {
          businessName: businessName.trim(),
          businessType: businessType || undefined,
          contactName: contactName.trim() || name.trim() || undefined,
          logoUrl: uploadedLogo?.url || logoUrl || undefined,
          logoKey: uploadedLogo?.key || logoKey || undefined,
          brandColors: {
            primary: primaryColor,
            secondary: secondaryColor,
            accent: accentColor,
          },
        };
      }

      // Build project data
      const projectId = projectOption === "existing" ? selectedProjectId : undefined;
      const projectName = projectOption === "new" ? newProjectName.trim() : undefined;

      // If attaching to existing project, send brand colors to update the organization
      const brandColorsToSend = projectOption === "existing" ? {
        primary: primaryColor,
        secondary: secondaryColor,
        accent: accentColor,
      } : undefined;

      const response = await fetch("/api/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          name: name.trim() || null,
          message: message.trim() || null,
          accountType,
          isDemo,
          organizationData,
          projectId,
          projectName,
          brandColors: brandColorsToSend,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setFormError(data.error || "Failed to send invitation");
        setIsSubmitting(false);
        return;
      }

      // Success
      setSuccessMessage(
        data.emailSent
          ? `Invitation sent to ${email}!`
          : `Invitation created for ${email}. Email sending may have failed - check the link below.`
      );
      setLastInviteLink(data.inviteLink);

      // Refresh list
      fetchInvitations();
    } catch (err) {
      setFormError("Failed to send invitation");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Resend invitation
  const handleResend = async (invitationId: string) => {
    try {
      const response = await fetch(`/api/invitations/${invitationId}/resend`, {
        method: "POST",
      });

      if (!response.ok) {
        const data = await response.json();
        alert(data.error || "Failed to resend invitation");
        return;
      }

      fetchInvitations();
    } catch (err) {
      alert("Failed to resend invitation");
    }
  };

  // Revoke invitation
  const handleRevoke = async (invitationId: string) => {
    if (!confirm("Are you sure you want to revoke this invitation?")) return;

    try {
      const response = await fetch(`/api/invitations?id=${invitationId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        alert(data.error || "Failed to revoke invitation");
        return;
      }

      fetchInvitations();
    } catch (err) {
      alert("Failed to revoke invitation");
    }
  };

  // Copy link to clipboard
  const handleCopyLink = async (link: string) => {
    await navigator.clipboard.writeText(link);
    setCopiedLink(link);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  if (isLoading) {
    return <LoadingScreen message="Loading client invitations..." />;
  }

  if (error) {
    return (
      <div className="p-6">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6 text-center">
            <XCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const pendingCount = invitations.filter((i) => i.status === "pending").length;
  const acceptedCount = invitations.filter((i) => i.status === "accepted").length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Client Invitations</h1>
          <p className="text-muted-foreground">
            Invite new clients to access their portal
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Invite Client
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Invite a New Client</DialogTitle>
              <DialogDescription>
                Set up a new client with their organization details and branding.
              </DialogDescription>
            </DialogHeader>

            <form id="invite-form" onSubmit={handleSubmit} className="space-y-6 mt-4">
              {formError && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  {formError}
                </div>
              )}

              {successMessage && (
                <div className="rounded-md bg-green-100 dark:bg-green-900/20 p-3 text-sm text-green-800 dark:text-green-400">
                  <p>{successMessage}</p>
                  {lastInviteLink && (
                    <div className="mt-2 flex items-center gap-2">
                      <Input
                        value={lastInviteLink}
                        readOnly
                        className="text-xs bg-white dark:bg-gray-900"
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => handleCopyLink(lastInviteLink)}
                      >
                        {copiedLink === lastInviteLink ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              )}

              <Tabs defaultValue="contact" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="contact" className="flex items-center gap-2">
                    <UserCircle className="h-4 w-4" />
                    Contact
                  </TabsTrigger>
                  <TabsTrigger value="business" className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Business
                  </TabsTrigger>
                  <TabsTrigger value="project" className="flex items-center gap-2">
                    <ClipboardList className="h-4 w-4" />
                    Project
                  </TabsTrigger>
                  <TabsTrigger value="branding" className="flex items-center gap-2">
                    <Palette className="h-4 w-4" />
                    Branding
                  </TabsTrigger>
                </TabsList>

                {/* Contact Info Tab */}
                <TabsContent value="contact" className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="client@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="name">Contact Name</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="John Smith"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="accountType">Account Type</Label>
                    <Select
                      value={accountType}
                      onValueChange={(value: "team_lead" | "team_member") => setAccountType(value)}
                      disabled={isSubmitting}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="team_lead">
                          <div className="flex items-center gap-2">
                            <Crown className="h-4 w-4 text-amber-500" />
                            <div>
                              <span className="font-medium">Team Lead</span>
                              <span className="text-muted-foreground ml-2 text-xs">
                                Full access to all documents & invoices
                              </span>
                            </div>
                          </div>
                        </SelectItem>
                        <SelectItem value="team_member">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-blue-500" />
                            <div>
                              <span className="font-medium">Team Member</span>
                              <span className="text-muted-foreground ml-2 text-xs">
                                Limited access (no contracts/invoices)
                              </span>
                            </div>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Team Leads have access to contracts, invoices, and other sensitive documents.
                      Team Members have restricted access.
                    </p>
                  </div>

                  {/* Demo Invite Toggle */}
                  <div className="rounded-lg border border-dashed border-primary/30 bg-primary/5 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-primary" />
                        <Label htmlFor="isDemo" className="font-medium cursor-pointer">
                          Demo Invite
                        </Label>
                      </div>
                      <Switch
                        id="isDemo"
                        checked={isDemo}
                        onCheckedChange={setIsDemo}
                        disabled={isSubmitting}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Send a demo invite that lets the client preview their portal and confirm their 
                      business type before completing signup. Perfect for consultations!
                    </p>
                    {isDemo && (
                      <div className="flex items-center gap-2 text-xs text-primary">
                        <Eye className="h-3 w-3" />
                        <span>Client will see a guided demo experience</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Personal Message (optional)</Label>
                    <Textarea
                      id="message"
                      placeholder="Looking forward to working with you..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      disabled={isSubmitting}
                      rows={3}
                    />
                    <p className="text-xs text-muted-foreground">
                      This message will be included in the invitation email.
                    </p>
                  </div>
                </TabsContent>

                {/* Business Info Tab */}
                <TabsContent value="business" className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="businessName">Business Name *</Label>
                    <Input
                      id="businessName"
                      type="text"
                      placeholder="Acme Fitness"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      disabled={isSubmitting}
                    />
                    <p className="text-xs text-muted-foreground">
                      This will be used to create their organization and project.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="businessType">Type of Business</Label>
                    <Select
                      value={businessType}
                      onValueChange={(value: BusinessType) => setBusinessType(value)}
                      disabled={isSubmitting}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select business type..." />
                      </SelectTrigger>
                      <SelectContent>
                        {businessTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {businessTypeLabels[type]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      This determines the default photo tags available for their uploads.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contactName">Primary Contact Name</Label>
                    <Input
                      id="contactName"
                      type="text"
                      placeholder="Jane Doe (if different from above)"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      disabled={isSubmitting}
                    />
                    <p className="text-xs text-muted-foreground">
                      Leave blank to use the contact name from the Contact tab.
                    </p>
                  </div>
                </TabsContent>

                {/* Project Tab */}
                <TabsContent value="project" className="space-y-4 pt-4">
                  <div className="space-y-4">
                    <Label>Project Assignment</Label>
                    <p className="text-sm text-muted-foreground">
                      Optionally pre-assign this client to a project. You can create a new project or assign them to an existing one.
                    </p>
                    
                    <div className="grid grid-cols-3 gap-3">
                      <button
                        type="button"
                        onClick={() => setProjectOption("none")}
                        className={`p-4 rounded-lg border-2 transition-colors ${
                          projectOption === "none" 
                            ? "border-primary bg-primary/5" 
                            : "border-border hover:border-primary/50"
                        }`}
                        disabled={isSubmitting}
                      >
                        <X className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                        <span className="text-sm font-medium">No Project</span>
                        <p className="text-xs text-muted-foreground mt-1">
                          Assign later
                        </p>
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => setProjectOption("new")}
                        className={`p-4 rounded-lg border-2 transition-colors ${
                          projectOption === "new" 
                            ? "border-primary bg-primary/5" 
                            : "border-border hover:border-primary/50"
                        }`}
                        disabled={isSubmitting}
                      >
                        <FolderPlus className="h-6 w-6 mx-auto mb-2 text-primary" />
                        <span className="text-sm font-medium">New Project</span>
                        <p className="text-xs text-muted-foreground mt-1">
                          Create new
                        </p>
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => setProjectOption("existing")}
                        className={`p-4 rounded-lg border-2 transition-colors ${
                          projectOption === "existing" 
                            ? "border-primary bg-primary/5" 
                            : "border-border hover:border-primary/50"
                        }`}
                        disabled={isSubmitting || availableProjects.length === 0}
                      >
                        <Folder className="h-6 w-6 mx-auto mb-2 text-amber-500" />
                        <span className="text-sm font-medium">Existing</span>
                        <p className="text-xs text-muted-foreground mt-1">
                          {availableProjects.length} available
                        </p>
                      </button>
                    </div>

                    {projectOption === "new" && (
                      <div className="space-y-2 pt-2">
                        <Label htmlFor="newProjectName">Project Name</Label>
                        <Input
                          id="newProjectName"
                          type="text"
                          placeholder={businessName ? `${businessName} Website Project` : "Website Project"}
                          value={newProjectName}
                          onChange={(e) => setNewProjectName(e.target.value)}
                          disabled={isSubmitting}
                        />
                        <p className="text-xs text-muted-foreground">
                          A new project will be created with this name when the invitation is accepted.
                        </p>
                      </div>
                    )}

                    {projectOption === "existing" && (
                      <div className="space-y-2 pt-2">
                        <Label htmlFor="existingProject">Select Project</Label>
                        <Select
                          value={selectedProjectId}
                          onValueChange={setSelectedProjectId}
                          disabled={isSubmitting}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Choose an existing project..." />
                          </SelectTrigger>
                          <SelectContent>
                            {availableProjects.map((project) => (
                              <SelectItem key={project.id} value={project.id}>
                                <div className="flex flex-col">
                                  <span className="font-medium">{project.name}</span>
                                  <span className="text-xs text-muted-foreground">{project.clientName}</span>
                                  {project.organization?.settings?.brandColors && (
                                    <div className="flex items-center gap-1 mt-1">
                                      <div 
                                        className="h-2 w-2 rounded-full" 
                                        style={{ backgroundColor: project.organization.settings.brandColors.primary }}
                                      />
                                      <div 
                                        className="h-2 w-2 rounded-full" 
                                        style={{ backgroundColor: project.organization.settings.brandColors.secondary }}
                                      />
                                      <div 
                                        className="h-2 w-2 rounded-full" 
                                        style={{ backgroundColor: project.organization.settings.brandColors.accent }}
                                      />
                                      <span className="text-[10px] text-muted-foreground ml-1">Has branding</span>
                                    </div>
                                  )}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                          The client will be added to this existing project.
                          {loadedFromProject && (
                            <span className="block mt-1 text-primary">
                              ✓ Brand colors loaded from project. You can modify them in the Branding tab.
                            </span>
                          )}
                          {selectedProjectId && !loadedFromProject && (
                            <span className="block mt-1 text-amber-600">
                              No brand colors set for this project. Set them in the Branding tab.
                            </span>
                          )}
                        </p>
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* Branding Tab */}
                <TabsContent value="branding" className="space-y-4 pt-4">
                  {/* Logo Upload */}
                  <div className="space-y-2">
                    <Label>Logo</Label>
                    <div className="flex items-start gap-4">
                      {logoPreview ? (
                        <div className="relative">
                          <div className="h-24 w-24 rounded-lg border border-border overflow-hidden bg-muted">
                            <img
                              src={logoPreview}
                              alt="Logo preview"
                              className="h-full w-full object-contain"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={removeLogo}
                            className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center hover:bg-destructive/90"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => logoInputRef.current?.click()}
                          disabled={isSubmitting || isUploadingLogo}
                          className="h-24 w-24 rounded-lg border-2 border-dashed border-border hover:border-primary/50 flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {isUploadingLogo ? (
                            <Spinner size="sm" />
                          ) : (
                            <>
                              <ImageIcon className="h-8 w-8" />
                              <span className="text-xs">Upload</span>
                            </>
                          )}
                        </button>
                      )}
                      <input
                        ref={logoInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleLogoSelect}
                        className="hidden"
                      />
                      <div className="flex-1 text-sm text-muted-foreground">
                        <p>Upload the client's logo for their portal branding.</p>
                        <p className="text-xs mt-1">Max 5MB. PNG, JPG, or SVG recommended.</p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Brand Colors */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Label>Brand Colors</Label>
                        {loadedFromProject && (
                          <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/30">
                            Loaded from project
                          </Badge>
                        )}
                      </div>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              {primaryContrast.aa ? (
                                <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                              ) : primaryContrast.aaLarge ? (
                                <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                              ) : (
                                <AlertCircle className="h-3.5 w-3.5 text-red-500" />
                              )}
                              <span>Contrast: {primaryContrast.ratio}:1</span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="left" className="max-w-xs">
                            <p className="font-medium">{primaryContrast.label} Contrast</p>
                            <p className="text-xs mt-1">{primaryContrast.description}</p>
                            {!primaryContrast.aa && (
                              <p className="text-xs mt-1 text-amber-400">
                                💡 Consider using a {suggestAccessibleColor(useEmailColors ? emailPrimaryColor : primaryColor) === "#000000" ? "darker" : "lighter"} shade for better readability.
                              </p>
                            )}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="primaryColor" className="text-xs text-muted-foreground">
                          Primary
                        </Label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            id="primaryColor"
                            value={primaryColor}
                            onChange={(e) => setPrimaryColor(e.target.value)}
                            disabled={isSubmitting}
                            className="h-10 w-14 rounded cursor-pointer border border-border"
                          />
                          <Input
                            value={primaryColor}
                            onChange={(e) => setPrimaryColor(e.target.value)}
                            className="flex-1 font-mono text-xs"
                            disabled={isSubmitting}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="secondaryColor" className="text-xs text-muted-foreground">
                          Secondary
                        </Label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            id="secondaryColor"
                            value={secondaryColor}
                            onChange={(e) => setSecondaryColor(e.target.value)}
                            disabled={isSubmitting}
                            className="h-10 w-14 rounded cursor-pointer border border-border"
                          />
                          <Input
                            value={secondaryColor}
                            onChange={(e) => setSecondaryColor(e.target.value)}
                            className="flex-1 font-mono text-xs"
                            disabled={isSubmitting}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="accentColor" className="text-xs text-muted-foreground">
                          Accent
                        </Label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            id="accentColor"
                            value={accentColor}
                            onChange={(e) => setAccentColor(e.target.value)}
                            disabled={isSubmitting}
                            className="h-10 w-14 rounded cursor-pointer border border-border"
                          />
                          <Input
                            value={accentColor}
                            onChange={(e) => setAccentColor(e.target.value)}
                            className="flex-1 font-mono text-xs"
                            disabled={isSubmitting}
                          />
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      These colors will be used to customize the client's portal experience.
                      {projectOption === "existing" && selectedProjectId && (
                        <span className="block mt-1 font-medium text-primary">
                          Changes will update the organization's brand colors.
                        </span>
                      )}
                    </p>
                  </div>

                  <Separator />

                  {/* Email-Specific Colors */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <Label>Email Colors (Optional)</Label>
                      </div>
                      <Switch
                        checked={useEmailColors}
                        onCheckedChange={setUseEmailColors}
                        disabled={isSubmitting}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Override the brand colors for invitation emails only. Useful if you need higher contrast for email readability.
                    </p>

                    {useEmailColors && (
                      <div className="space-y-4 p-4 rounded-lg bg-muted/50 border border-dashed">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label htmlFor="emailPrimaryColor" className="text-xs text-muted-foreground">
                                Email Primary
                              </Label>
                              {!meetsWCAG("#ffffff", emailPrimaryColor).aaLarge && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <AlertCircle className="h-3.5 w-3.5 text-red-500" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Low contrast for white text on this background</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <input
                                type="color"
                                id="emailPrimaryColor"
                                value={emailPrimaryColor}
                                onChange={(e) => setEmailPrimaryColor(e.target.value)}
                                disabled={isSubmitting}
                                className="h-10 w-14 rounded cursor-pointer border border-border"
                              />
                              <Input
                                value={emailPrimaryColor}
                                onChange={(e) => setEmailPrimaryColor(e.target.value)}
                                className="flex-1 font-mono text-xs"
                                disabled={isSubmitting}
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label htmlFor="emailSecondaryColor" className="text-xs text-muted-foreground">
                                Email Secondary
                              </Label>
                              {!meetsWCAG("#ffffff", emailSecondaryColor).aaLarge && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <AlertCircle className="h-3.5 w-3.5 text-red-500" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Low contrast for white text on this background</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <input
                                type="color"
                                id="emailSecondaryColor"
                                value={emailSecondaryColor}
                                onChange={(e) => setEmailSecondaryColor(e.target.value)}
                                disabled={isSubmitting}
                                className="h-10 w-14 rounded cursor-pointer border border-border"
                              />
                              <Input
                                value={emailSecondaryColor}
                                onChange={(e) => setEmailSecondaryColor(e.target.value)}
                                className="flex-1 font-mono text-xs"
                                disabled={isSubmitting}
                              />
                            </div>
                          </div>
                        </div>
                        
                        {/* Email Color Preview */}
                        <div className="flex items-center gap-3 pt-2">
                          <div
                            className="h-8 w-8 rounded shadow-sm relative flex items-center justify-center text-xs font-bold"
                            style={{ 
                              background: `linear-gradient(135deg, ${emailPrimaryColor} 0%, ${emailSecondaryColor} 100%)`,
                              color: "#ffffff"
                            }}
                          >
                            Aa
                          </div>
                          <span className="text-xs text-muted-foreground">
                            Email header gradient preview with white text
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Brand Color Preview */}
                  <div className="rounded-lg border border-border p-4 space-y-4">
                    <p className="text-xs text-muted-foreground">Brand Color Preview</p>
                    <div className="flex items-center gap-3">
                      <div
                        className="h-12 w-12 rounded-lg shadow-sm"
                        style={{ backgroundColor: primaryColor }}
                        title="Primary"
                      />
                      <div
                        className="h-12 w-12 rounded-lg shadow-sm"
                        style={{ backgroundColor: secondaryColor }}
                        title="Secondary"
                      />
                      <div
                        className="h-12 w-12 rounded-lg shadow-sm"
                        style={{ backgroundColor: accentColor }}
                        title="Accent"
                      />
                      {logoPreview && (
                        <>
                          <div className="h-8 w-px bg-border mx-2" />
                          <div className="h-12 w-12 rounded-lg border border-border overflow-hidden">
                            <img src={logoPreview} alt="" className="h-full w-full object-contain" />
                          </div>
                        </>
                      )}
                    </div>
                    
                    {/* Email Header Preview (when not using custom email colors) */}
                    {!useEmailColors && (
                      <div className="pt-2 border-t border-border/50">
                        <p className="text-xs text-muted-foreground mb-2">Email Header Preview</p>
                        <div className="flex items-center gap-3">
                          <div
                            className="h-10 flex-1 max-w-[200px] rounded shadow-sm flex items-center justify-center text-sm font-semibold"
                            style={{ 
                              background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
                              color: "#ffffff"
                            }}
                          >
                            {projectOption === "existing" && selectedProjectId 
                              ? (availableProjects.find(p => p.id === selectedProjectId)?.organization?.name || 
                                 availableProjects.find(p => p.id === selectedProjectId)?.clientName || 
                                 "Your Business")
                              : (businessName || "Your Business")}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            How the email header will look
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>

              <Separator />

              <div className="flex justify-between gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={fetchEmailPreview}
                  disabled={isSubmitting || isUploadingLogo || isPreviewLoading || !email.trim()}
                >
                  {isPreviewLoading ? (
                    <>
                      <Spinner size="sm" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <Eye className="mr-2 h-4 w-4" />
                      Preview Email
                    </>
                  )}
                </Button>
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsDialogOpen(false);
                      resetForm();
                    }}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting || isUploadingLogo}>
                    {isSubmitting ? (
                      <>
                        <Spinner size="sm" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Send Invitation
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Email Preview Dialog */}
        <EmailPreviewDialog
          open={isPreviewOpen}
          onOpenChange={setIsPreviewOpen}
          emailHtml={previewHtml}
          warnings={previewWarnings}
          isLoading={isPreviewLoading}
          onSend={handleSendFromPreview}
          onRefresh={fetchEmailPreview}
          isSending={isSubmitting}
        />
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{invitations.length}</p>
                <p className="text-sm text-muted-foreground">Total Invitations</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/20">
                <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingCount}</p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/20">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{acceptedCount}</p>
                <p className="text-sm text-muted-foreground">Accepted</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Invitations List */}
      <Card>
        <CardHeader>
          <CardTitle>All Invitations</CardTitle>
          <CardDescription>
            Manage and track client invitations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {invitations.length === 0 ? (
            <div className="text-center py-12">
              <Mail className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">No invitations yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Click "Invite Client" to send your first invitation
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {invitations.map((invitation) => {
                const StatusIcon = statusConfig[invitation.status].icon;
                const isExpired = new Date(invitation.expiresAt) < new Date() && invitation.status === "pending";
                const orgName = invitation.organization?.name || (invitation.organizationData as OrganizationSetupData)?.businessName;
                
                return (
                  <div
                    key={invitation.id}
                    className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium">{invitation.email}</p>
                        <Badge
                          variant="secondary"
                          className={isExpired ? statusConfig.expired.color : statusConfig[invitation.status].color}
                        >
                          <StatusIcon className="mr-1 h-3 w-3" />
                          {isExpired ? "Expired" : statusConfig[invitation.status].label}
                        </Badge>
                        {invitation.accountType === "team_lead" && (
                          <Badge variant="outline" className="text-amber-600 border-amber-300">
                            <Crown className="mr-1 h-3 w-3" />
                            Team Lead
                          </Badge>
                        )}
                        {invitation.isDemo && (
                          <Badge variant="outline" className="text-primary border-primary/30 bg-primary/10">
                            <Sparkles className="mr-1 h-3 w-3" />
                            Demo
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        {invitation.name && <span>{invitation.name}</span>}
                        {invitation.name && orgName && <span>·</span>}
                        {orgName && (
                          <span className="flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            {orgName}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Sent {new Date(invitation.createdAt).toLocaleDateString()}
                        {invitation.status === "pending" && !isExpired && (
                          <> · Expires {new Date(invitation.expiresAt).toLocaleDateString()}</>
                        )}
                        {invitation.acceptedAt && (
                          <> · Accepted {new Date(invitation.acceptedAt).toLocaleDateString()}</>
                        )}
                      </p>
                    </div>

                    {invitation.status === "pending" && (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleResend(invitation.id)}
                        >
                          <RotateCw className="mr-1 h-3 w-3" />
                          Resend
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRevoke(invitation.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="mr-1 h-3 w-3" />
                          Revoke
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
