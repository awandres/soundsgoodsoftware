"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "@soundsgood/auth/client";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Badge,
} from "@soundsgood/ui";
import { CheckCircle, XCircle, AlertCircle, Eye, EyeOff, Sparkles, Building2, ArrowRight, Check } from "lucide-react";

// Business types for the demo flow
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

interface OrganizationSetupData {
  businessName: string;
  businessType?: BusinessType;
  contactName?: string;
  logoUrl?: string;
  logoKey?: string;
  brandColors?: {
    primary?: string;
    secondary?: string;
    accent?: string;
  };
  customPhotoTags?: string[];
}

interface InvitationDetails {
  id: string;
  email: string;
  name: string | null;
  organizationId: string | null;
  organizationData: OrganizationSetupData | null;
  role: string;
  accountType: string | null;
  isDemo: boolean;
  expiresAt: string;
}

function AcceptInviteContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "valid" | "demo" | "error" | "success">("loading");
  const [invitation, setInvitation] = useState<InvitationDetails | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [errorCode, setErrorCode] = useState<string>("");

  // Demo flow state
  const [demoStep, setDemoStep] = useState<"confirm-type" | "preview" | "signup">("confirm-type");
  const [selectedBusinessType, setSelectedBusinessType] = useState<BusinessType | "">("");
  const [isUpdatingType, setIsUpdatingType] = useState(false);
  const [photoTags, setPhotoTags] = useState<string[]>([]);

  // Form state
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Validate token on mount
  useEffect(() => {
    if (!token) {
      setStatus("error");
      setErrorMessage("No invitation token provided");
      setErrorCode("NO_TOKEN");
      return;
    }

    async function validateToken() {
      try {
        const response = await fetch(`/api/invitations/accept?token=${token}`);
        const data = await response.json();

        if (!response.ok) {
          setStatus("error");
          setErrorMessage(data.error || "Invalid invitation");
          setErrorCode(data.code || "UNKNOWN");
          return;
        }

        setInvitation(data.invitation);
        setName(data.invitation.name || "");
        
        // Set initial business type from invitation
        if (data.invitation.organizationData?.businessType) {
          setSelectedBusinessType(data.invitation.organizationData.businessType);
          setPhotoTags(data.invitation.organizationData.customPhotoTags || []);
        }

        // If it's a demo invite, show the demo flow
        if (data.invitation.isDemo) {
          setStatus("demo");
        } else {
          setStatus("valid");
        }
      } catch (err) {
        setStatus("error");
        setErrorMessage("Failed to validate invitation");
        setErrorCode("NETWORK_ERROR");
      }
    }

    validateToken();
  }, [token]);

  const handleBusinessTypeChange = async (newType: BusinessType) => {
    if (!invitation || !token) return;
    
    setSelectedBusinessType(newType);
    setIsUpdatingType(true);

    try {
      const response = await fetch(`/api/invitations/${invitation.id}/update-business-type`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessType: newType, token }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setPhotoTags(data.photoTags || []);
      }
    } catch (err) {
      console.error("Failed to update business type:", err);
    } finally {
      setIsUpdatingType(false);
    }
  };

  const proceedToSignup = () => {
    setDemoStep("signup");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validation
    if (!name.trim()) {
      setFormError("Please enter your name");
      return;
    }

    if (password.length < 8) {
      setFormError("Password must be at least 8 characters");
      return;
    }

    if (password !== confirmPassword) {
      setFormError("Passwords do not match");
      return;
    }

    // Check password strength
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    
    if (!hasUppercase || !hasLowercase || !hasNumber) {
      setFormError("Password must contain uppercase, lowercase, and a number");
      return;
    }

    setIsSubmitting(true);

    try {
      // Step 1: Create the account
      const response = await fetch("/api/invitations/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          password,
          name: name.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setFormError(data.error || "Failed to create account");
        setIsSubmitting(false);
        return;
      }

      // Step 2: Auto sign-in using BetterAuth
      setStatus("success");
      
      const signInResult = await signIn.email({
        email: data.autoLogin.email,
        password: data.autoLogin.password,
      });

      if (signInResult.error) {
        // Account created but sign-in failed - redirect to login
        console.error("Auto sign-in failed:", signInResult.error);
        setTimeout(() => {
          router.push("/login?newAccount=true");
        }, 1500);
        return;
      }

      // Success! Redirect to dashboard with welcome modal
      setTimeout(() => {
        router.push("/dashboard?welcome=new");
      }, 1000);
    } catch (err) {
      setFormError("Failed to create account. Please try again.");
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (status === "loading") {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Spinner size="lg" />
          <p className="mt-4 text-muted-foreground">Validating invitation...</p>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (status === "error") {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            {errorCode === "EXPIRED" ? (
              <AlertCircle className="h-8 w-8 text-amber-500" />
            ) : (
              <XCircle className="h-8 w-8 text-destructive" />
            )}
          </div>
          <CardTitle className="text-xl">
            {errorCode === "EXPIRED" ? "Invitation Expired" : "Invalid Invitation"}
          </CardTitle>
          <CardDescription className="mt-2">
            {errorMessage}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {errorCode === "EXPIRED" && (
            <p className="text-center text-sm text-muted-foreground">
              Please contact the person who invited you to request a new invitation link.
            </p>
          )}
          {errorCode === "ALREADY_ACCEPTED" && (
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-4">
                You already have an account. Please sign in instead.
              </p>
              <Button asChild className="w-full">
                <Link href="/login">Go to Login</Link>
              </Button>
            </div>
          )}
          {!["EXPIRED", "ALREADY_ACCEPTED"].includes(errorCode) && (
            <Button asChild variant="outline" className="w-full">
              <Link href="/">Go Home</Link>
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  // Success state - brief message then auto-redirect
  if (status === "success") {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
            <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle className="text-xl">Welcome! 🎉</CardTitle>
          <CardDescription className="mt-2">
            Your account has been created successfully.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Spinner size="sm" />
            <span>Taking you to your portal...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Demo flow - Business Type Confirmation
  if (status === "demo" && demoStep === "confirm-type") {
    return (
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <Badge variant="outline" className="mx-auto mb-2 text-primary border-primary/30">
            Demo Preview
          </Badge>
          <CardTitle className="text-2xl">Welcome to Your Portal Preview</CardTitle>
          <CardDescription>
            Before we set up your account, let's confirm your business type so we can customize your experience.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Business Info Preview */}
          {invitation?.organizationData?.businessName && (
            <div className="rounded-lg border bg-muted/30 p-4">
              <div className="flex items-center gap-3">
                <Building2 className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">{invitation.organizationData.businessName}</p>
                  <p className="text-sm text-muted-foreground">{invitation.email}</p>
                </div>
              </div>
            </div>
          )}

          {/* Business Type Selector */}
          <div className="space-y-3">
            <Label htmlFor="businessType">What type of business do you have?</Label>
            <Select
              value={selectedBusinessType}
              onValueChange={(value) => handleBusinessTypeChange(value as BusinessType)}
              disabled={isUpdatingType}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select your business type..." />
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
              This helps us customize your photo tags and portal experience.
            </p>
          </div>

          {/* Photo Tags Preview */}
          {photoTags.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Your photo categories will include:</Label>
              <div className="flex flex-wrap gap-2">
                {photoTags.slice(0, 8).map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag.replace(/-/g, " ")}
                  </Badge>
                ))}
                {photoTags.length > 8 && (
                  <Badge variant="outline" className="text-xs">
                    +{photoTags.length - 8} more
                  </Badge>
                )}
              </div>
            </div>
          )}

          <Button 
            className="w-full" 
            onClick={proceedToSignup}
            disabled={!selectedBusinessType || isUpdatingType}
          >
            {isUpdatingType ? (
              <>
                <Spinner size="sm" />
                Updating...
              </>
            ) : (
              <>
                Continue to Create Account
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            You can always change this later in your settings.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Demo flow - Signup form (after confirming type)
  if (status === "demo" && demoStep === "signup") {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-lg font-bold text-primary-foreground">
            SG
          </div>
          <div className="flex items-center justify-center gap-2 mb-2">
            <Badge variant="outline" className="text-primary border-primary/30">
              <Check className="mr-1 h-3 w-3" />
              {businessTypeLabels[selectedBusinessType as BusinessType]}
            </Badge>
          </div>
          <CardTitle className="text-2xl">Create Your Account</CardTitle>
          <CardDescription>
            Set up your password to access your personalized portal
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {formError && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {formError}
              </div>
            )}

            {/* Email (read-only) */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={invitation?.email || ""}
                disabled
                className="bg-muted"
              />
            </div>

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="John Smith"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">Create Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isSubmitting}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                At least 8 characters with uppercase, lowercase, and a number
              </p>
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>

            {/* Password strength indicator */}
            {password && (
              <div className="space-y-1">
                <div className="flex gap-1">
                  <div className={`h-1 flex-1 rounded ${password.length >= 8 ? "bg-green-500" : "bg-muted"}`} />
                  <div className={`h-1 flex-1 rounded ${/[A-Z]/.test(password) && /[a-z]/.test(password) ? "bg-green-500" : "bg-muted"}`} />
                  <div className={`h-1 flex-1 rounded ${/[0-9]/.test(password) ? "bg-green-500" : "bg-muted"}`} />
                  <div className={`h-1 flex-1 rounded ${/[^A-Za-z0-9]/.test(password) ? "bg-green-500" : "bg-muted"}`} />
                </div>
                <p className="text-xs text-muted-foreground">
                  {password.length < 8 ? "Too short" :
                    !(/[A-Z]/.test(password) && /[a-z]/.test(password)) ? "Add mixed case" :
                    !/[0-9]/.test(password) ? "Add a number" :
                    !/[^A-Za-z0-9]/.test(password) ? "Strong (add symbol for extra security)" :
                    "Very strong!"}
                </p>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Spinner size="sm" />
                  Creating Account...
                </>
              ) : (
                "Create Account"
              )}
            </Button>
          </form>

          <button
            type="button"
            onClick={() => setDemoStep("confirm-type")}
            className="mt-4 w-full text-center text-sm text-muted-foreground hover:text-foreground"
          >
            ← Back to business type selection
          </button>
        </CardContent>
      </Card>
    );
  }

  // Valid invitation - standard setup form (non-demo)
  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-lg font-bold text-primary-foreground">
          SG
        </div>
        <CardTitle className="text-2xl">Set Up Your Account</CardTitle>
        <CardDescription>
          Complete your account setup to access your client portal
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {formError}
            </div>
          )}

          {/* Email (read-only) */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={invitation?.email || ""}
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              This is the email your invitation was sent to
            </p>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="John Smith"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={isSubmitting}
            />
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="password">Create Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isSubmitting}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              At least 8 characters with uppercase, lowercase, and a number
            </p>
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={isSubmitting}
            />
          </div>

          {/* Password strength indicator */}
          {password && (
            <div className="space-y-1">
              <div className="flex gap-1">
                <div className={`h-1 flex-1 rounded ${password.length >= 8 ? "bg-green-500" : "bg-muted"}`} />
                <div className={`h-1 flex-1 rounded ${/[A-Z]/.test(password) && /[a-z]/.test(password) ? "bg-green-500" : "bg-muted"}`} />
                <div className={`h-1 flex-1 rounded ${/[0-9]/.test(password) ? "bg-green-500" : "bg-muted"}`} />
                <div className={`h-1 flex-1 rounded ${/[^A-Za-z0-9]/.test(password) ? "bg-green-500" : "bg-muted"}`} />
              </div>
              <p className="text-xs text-muted-foreground">
                {password.length < 8 ? "Too short" :
                  !(/[A-Z]/.test(password) && /[a-z]/.test(password)) ? "Add mixed case" :
                  !/[0-9]/.test(password) ? "Add a number" :
                  !/[^A-Za-z0-9]/.test(password) ? "Strong (add symbol for extra security)" :
                  "Very strong!"}
              </p>
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Spinner size="sm" />
                Creating Account...
              </>
            ) : (
              "Create Account"
            )}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}

export default function AcceptInvitePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <Suspense fallback={
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Spinner size="lg" />
            <p className="mt-4 text-muted-foreground">Loading...</p>
          </CardContent>
        </Card>
      }>
        <AcceptInviteContent />
      </Suspense>
    </main>
  );
}
