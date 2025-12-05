'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Badge } from "@soundsgood/ui";
import { 
  ChevronDown, 
  ChevronRight, 
  CheckCircle2, 
  Circle, 
  Clock,
  Calendar,
  DollarSign,
  Target,
  Zap,
  Users,
  Shield,
  FileText,
  MessageSquare
} from "lucide-react";

// Roadmap configuration type
interface RoadmapConfig {
  projectName: string;
  subtitle: string;
  effectiveDate: string;
  totalCost: string;
  timeline: string;
  supportPeriod?: string;
  postSupportRate?: number;
  showSupport: boolean;
  payments: Array<{
    name: string;
    amount: string;
    trigger: string;
    status: 'completed' | 'pending';
  }>;
  phases: Array<{
    phase: string;
    title: string;
    status: 'completed' | 'in-progress' | 'upcoming';
    timeline: string;
    payment?: string;
    features: string[];
    color: string;
    icon: string;
  }>;
  features: Array<{
    id: number;
    icon: string;
    title: string;
    color: string;
    textColor: string;
    bgGradient: string;
    shortDescription: string[];
    detailedDescription: string;
    features: string[];
    benefits: string[];
  }>;
}

// Vetted Trainers specific roadmap
const vettedTrainersRoadmap: RoadmapConfig = {
  projectName: "Vetted Trainers Platform",
  subtitle: "All-in-One Training Business Management Solution",
  effectiveDate: "November 21, 2025",
  totalCost: "$6,000",
  timeline: "2-3 months",
  supportPeriod: "1 year complimentary (bug fixes)",
  postSupportRate: 200,
  showSupport: true,
  payments: [
    { name: "Deposit", amount: "$2,000", trigger: "Upon agreement signing", status: "completed" },
    { name: "Milestone 2", amount: "$2,000", trigger: "Within 14 days of working demo", status: "pending" },
    { name: "Final", amount: "$2,000", trigger: "Upon complete delivery", status: "pending" },
  ],
  phases: [
    {
      phase: 'Milestone 1',
      title: 'Initial Development & Foundation',
      status: 'in-progress',
      timeline: 'Weeks 1-4',
      features: [
        'Database architecture and setup',
        'User authentication system (admin, trainers, clients)',
        'Basic admin dashboard framework',
        'Client and trainer profile management',
        'Google Sheets data migration planning',
        'Core API development',
      ],
      color: 'from-blue-500 to-cyan-500',
      icon: '🏗️',
    },
    {
      phase: 'Milestone 2',
      title: 'Working Demo Presentation',
      status: 'upcoming',
      timeline: 'Weeks 6-8',
      payment: '$2,000 due within 14 days',
      features: [
        'Trainer schedule management system',
        'Client booking functionality',
        'SMS integration for reminders',
        'Membership tier management',
        'Admin portal with key metrics',
        'Data migration execution',
      ],
      color: 'from-purple-500 to-pink-500',
      icon: '🎯',
    },
    {
      phase: 'Milestone 3',
      title: 'Final Delivery & Deployment',
      status: 'upcoming',
      timeline: 'Weeks 10-12',
      payment: '$2,000 due upon delivery',
      features: [
        'Email marketing integration',
        'Resource center implementation',
        'Comprehensive admin analytics',
        'Platform testing and QA',
        'Production deployment',
        'Admin training for Youseff and staff',
      ],
      color: 'from-green-500 to-emerald-500',
      icon: '🚀',
    },
  ],
  features: [
    {
      id: 0,
      icon: '🔐',
      title: 'Authentication System',
      color: 'border-blue-500',
      textColor: 'text-blue-500',
      bgGradient: 'from-blue-500 to-cyan-500',
      shortDescription: [
        'Secure client and admin login portals',
        'Role-based access control',
        'Session management',
        'Password recovery',
      ],
      detailedDescription: 'A robust authentication system with secure login portals for clients, trainers, and administrators with role-based permissions.',
      features: [
        'Secure client login portal',
        'Admin dashboard access',
        'Trainer-specific views',
        'Role-based permissions',
        'Secure password handling',
        'Session management',
      ],
      benefits: [
        'Protect sensitive client data',
        'Control access by role',
        'Secure communication channels',
      ],
    },
    {
      id: 1,
      icon: '📊',
      title: 'Database Management',
      color: 'border-purple-500',
      textColor: 'text-purple-500',
      bgGradient: 'from-purple-500 to-pink-500',
      shortDescription: [
        'Complete business database architecture',
        'Google Sheets data migration',
        'Client profiles and history',
        'Trainer information and schedules',
      ],
      detailedDescription: 'Comprehensive database architecture to store and manage all business data, with smooth migration from existing Google Sheets.',
      features: [
        'Client profiles and contact information',
        'Session records and analytics',
        'Membership and billing data',
        'Trainer schedules and availability',
        'Historical data preservation',
        'Data export capabilities',
      ],
      benefits: [
        'Centralized data management',
        'No more scattered spreadsheets',
        'Easy data access and reporting',
      ],
    },
    {
      id: 2,
      icon: '📅',
      title: 'Trainer Schedule Management',
      color: 'border-cyan-500',
      textColor: 'text-cyan-500',
      bgGradient: 'from-cyan-500 to-blue-500',
      shortDescription: [
        'Comprehensive scheduling system',
        'Trainer availability management',
        'Multi-location support',
        'Schedule conflict detection',
      ],
      detailedDescription: 'Complete scheduling system for managing trainer availability across all locations with automatic conflict detection.',
      features: [
        'Set trainer availability hours',
        'Block off time for vacations/breaks',
        'Multi-location scheduling',
        'Visual calendar interface',
        'Schedule templates',
        'Team schedule overview',
      ],
      benefits: [
        'Streamlined schedule management',
        'Prevent scheduling conflicts',
        'Improved trainer coordination',
      ],
    },
    {
      id: 3,
      icon: '📱',
      title: 'Client Booking System',
      color: 'border-green-500',
      textColor: 'text-green-500',
      bgGradient: 'from-green-500 to-emerald-500',
      shortDescription: [
        'Real-time booking platform',
        'Availability display',
        'Booking confirmations',
        'Cancellation management',
      ],
      detailedDescription: 'User-friendly booking platform where clients can see real-time availability and book sessions with their preferred trainers.',
      features: [
        'Real-time availability display',
        'Easy session booking',
        'Booking confirmation emails',
        'Cancellation and rescheduling',
        'Booking history',
        'Waitlist functionality',
      ],
      benefits: [
        'Reduce phone call bookings',
        'Client convenience',
        'Automated confirmations',
      ],
    },
    {
      id: 4,
      icon: '💬',
      title: 'SMS Integration',
      color: 'border-amber-500',
      textColor: 'text-amber-500',
      bgGradient: 'from-amber-500 to-orange-500',
      shortDescription: [
        'Automated text messaging',
        'Booking confirmations via SMS',
        'Appointment reminders',
        'Two-way communication',
      ],
      detailedDescription: 'Integrated SMS system for automated appointment reminders and confirmations to reduce no-shows.',
      features: [
        'Automatic booking confirmations',
        'Appointment reminder texts',
        'Customizable message templates',
        'Bulk messaging capability',
        'Opt-in/opt-out management',
      ],
      benefits: [
        'Reduce no-shows significantly',
        'Improved client communication',
        'Professional touch points',
      ],
    },
    {
      id: 5,
      icon: '💳',
      title: 'Membership Management',
      color: 'border-emerald-500',
      textColor: 'text-emerald-500',
      bgGradient: 'from-emerald-500 to-green-500',
      shortDescription: [
        'Membership tiers and perks',
        'Benefits tracking',
        'Free giveaways management',
        'Automated renewals',
      ],
      detailedDescription: 'Flexible membership system to handle different tiers, perks, and automated benefit tracking.',
      features: [
        'Multiple membership tiers',
        'Perk and benefit tracking',
        'Automatic renewal processing',
        'Member status dashboard',
        'Promotional giveaway tracking',
        'Upgrade/downgrade handling',
      ],
      benefits: [
        'Recurring revenue management',
        'Client retention tools',
        'Clear membership visibility',
      ],
    },
    {
      id: 6,
      icon: '⚙️',
      title: 'Admin Portal',
      color: 'border-indigo-500',
      textColor: 'text-indigo-500',
      bgGradient: 'from-indigo-500 to-purple-500',
      shortDescription: [
        'Business dashboard with key metrics',
        'Staff schedule management',
        'Client engagement tools',
        'Revenue tracking',
      ],
      detailedDescription: 'Comprehensive admin dashboard providing full visibility into business operations, metrics, and management tools.',
      features: [
        'Business KPI dashboard',
        'Staff schedule viewing',
        'Client management tools',
        'Service modification',
        'Revenue tracking',
        'Attendance analytics',
        'Report generation',
      ],
      benefits: [
        'Complete business visibility',
        'Data-driven decisions',
        'Streamlined operations',
      ],
    },
    {
      id: 7,
      icon: '📧',
      title: 'Email Marketing',
      color: 'border-red-500',
      textColor: 'text-red-500',
      bgGradient: 'from-red-500 to-pink-500',
      shortDescription: [
        'Integrated email service',
        'Engagement insights',
        'Campaign management',
        'Automated sequences',
      ],
      detailedDescription: 'Built-in email marketing tools for client communication, campaigns, and engagement tracking.',
      features: [
        'Email campaign builder',
        'Client segmentation',
        'Engagement analytics',
        'Automated sequences',
        'Template library',
        'Open/click tracking',
      ],
      benefits: [
        'Direct client communication',
        'Marketing automation',
        'Engagement insights',
      ],
    },
    {
      id: 8,
      icon: '📚',
      title: 'Resource Center',
      color: 'border-orange-500',
      textColor: 'text-orange-500',
      bgGradient: 'from-orange-500 to-red-500',
      shortDescription: [
        'Client-accessible library',
        'Staff upload functionality',
        'Document organization',
        'Resource categorization',
      ],
      detailedDescription: 'Centralized resource library where staff can upload materials and clients can access helpful content.',
      features: [
        'Document upload system',
        'Category organization',
        'Client access controls',
        'Search functionality',
        'File type support',
        'Download tracking',
      ],
      benefits: [
        'Centralized resources',
        'Easy content sharing',
        'Client self-service',
      ],
    },
  ],
};

// Generic Demo roadmap
const demoRoadmap: RoadmapConfig = {
  projectName: "Your Custom Platform",
  subtitle: "All-in-One Business Management Solution",
  effectiveDate: "Agreement Date",
  totalCost: "$XXXX",
  timeline: "X-X months",
  showSupport: false,
  payments: [
    { name: "Deposit", amount: "$XXXX", trigger: "Upon agreement signing", status: "completed" },
    { name: "Milestone 2", amount: "$XXXX", trigger: "Upon working demo delivery", status: "pending" },
    { name: "Final", amount: "$XXXX", trigger: "Upon complete delivery", status: "pending" },
  ],
  phases: [
    {
      phase: 'Milestone 1',
      title: 'Initial Development & Foundation',
      status: 'in-progress',
      timeline: 'Weeks 1-4',
      features: [
        'Database architecture and setup',
        'User authentication system',
        'Basic admin dashboard framework',
        'Client and staff profile management',
        'Data migration planning',
        'Core API development',
      ],
      color: 'from-blue-500 to-cyan-500',
      icon: '🏗️',
    },
    {
      phase: 'Milestone 2',
      title: 'Working Demo Presentation',
      status: 'upcoming',
      timeline: 'Weeks 6-8',
      payment: '$XXXX due upon demo delivery',
      features: [
        'Schedule management system',
        'Client booking functionality',
        'SMS integration for reminders',
        'Membership management',
        'Admin portal with key metrics',
        'Data migration execution',
      ],
      color: 'from-purple-500 to-pink-500',
      icon: '🎯',
    },
    {
      phase: 'Milestone 3',
      title: 'Final Delivery & Deployment',
      status: 'upcoming',
      timeline: 'Weeks 10-12',
      payment: '$XXXX due upon delivery',
      features: [
        'Email marketing integration',
        'Resource center implementation',
        'Comprehensive admin analytics',
        'Platform testing and QA',
        'Production deployment',
        'Admin training',
      ],
      color: 'from-green-500 to-emerald-500',
      icon: '🚀',
    },
  ],
  features: [
    {
      id: 0,
      icon: '🌐',
      title: 'Web Application',
      color: 'border-blue-500',
      textColor: 'text-blue-500',
      bgGradient: 'from-blue-500 to-cyan-500',
      shortDescription: [
        'Professional online presence',
        'Responsive design for all devices',
        'Modern user interface',
        'Fast loading performance',
      ],
      detailedDescription: 'A professional web application with responsive design that looks great on desktop, tablet, and mobile devices.',
      features: [
        'Responsive design for all screen sizes',
        'Modern, professional interface',
        'Fast page load times',
        'SEO-friendly structure',
        'Accessibility compliance',
        'Cross-browser compatibility',
      ],
      benefits: [
        'Professional online presence',
        'Reach customers on any device',
        'Build trust with modern design',
      ],
    },
    {
      id: 1,
      icon: '🔐',
      title: 'Authentication System',
      color: 'border-purple-500',
      textColor: 'text-purple-500',
      bgGradient: 'from-purple-500 to-pink-500',
      shortDescription: [
        'Secure login portals',
        'Role-based access control',
        'Session management',
        'Password security',
      ],
      detailedDescription: 'A robust authentication system with secure login portals and role-based permissions for different user types.',
      features: [
        'Secure client login portal',
        'Admin dashboard access',
        'Role-based permissions',
        'Secure password handling',
        'Session management',
        'Account recovery',
      ],
      benefits: [
        'Protect sensitive data',
        'Control access by role',
        'Secure user accounts',
      ],
    },
    {
      id: 2,
      icon: '📊',
      title: 'Database Management',
      color: 'border-cyan-500',
      textColor: 'text-cyan-500',
      bgGradient: 'from-cyan-500 to-blue-500',
      shortDescription: [
        'Complete database architecture',
        'Data migration support',
        'Client profiles and history',
        'Business records management',
      ],
      detailedDescription: 'Comprehensive database architecture to store and manage all your business data securely.',
      features: [
        'Client profiles and information',
        'Transaction and session records',
        'Business data management',
        'Historical data preservation',
        'Data backup systems',
        'Export capabilities',
      ],
      benefits: [
        'Centralized data management',
        'Easy data access and reporting',
        'Secure data storage',
      ],
    },
    {
      id: 3,
      icon: '📅',
      title: 'Schedule Management',
      color: 'border-green-500',
      textColor: 'text-green-500',
      bgGradient: 'from-green-500 to-emerald-500',
      shortDescription: [
        'Comprehensive scheduling system',
        'Staff availability management',
        'Calendar interface',
        'Conflict detection',
      ],
      detailedDescription: 'Complete scheduling system for managing staff availability with automatic conflict detection.',
      features: [
        'Set staff availability hours',
        'Block off time for breaks',
        'Visual calendar interface',
        'Schedule templates',
        'Team schedule overview',
        'Automated scheduling',
      ],
      benefits: [
        'Streamlined schedule management',
        'Prevent scheduling conflicts',
        'Improved coordination',
      ],
    },
    {
      id: 4,
      icon: '📱',
      title: 'Booking System',
      color: 'border-amber-500',
      textColor: 'text-amber-500',
      bgGradient: 'from-amber-500 to-orange-500',
      shortDescription: [
        'Real-time booking platform',
        'Availability display',
        'Booking confirmations',
        'Cancellation management',
      ],
      detailedDescription: 'User-friendly booking platform where clients can see real-time availability and book appointments.',
      features: [
        'Real-time availability display',
        'Easy appointment booking',
        'Booking confirmation emails',
        'Cancellation and rescheduling',
        'Booking history',
        'Waitlist functionality',
      ],
      benefits: [
        'Reduce phone call bookings',
        'Client convenience',
        'Automated confirmations',
      ],
    },
    {
      id: 5,
      icon: '💬',
      title: 'SMS Integration',
      color: 'border-emerald-500',
      textColor: 'text-emerald-500',
      bgGradient: 'from-emerald-500 to-green-500',
      shortDescription: [
        'Automated text messaging',
        'Booking confirmations',
        'Appointment reminders',
        'Client notifications',
      ],
      detailedDescription: 'Integrated SMS system for automated appointment reminders and confirmations.',
      features: [
        'Automatic booking confirmations',
        'Appointment reminder texts',
        'Customizable message templates',
        'Notification management',
        'Opt-in/opt-out management',
      ],
      benefits: [
        'Reduce no-shows',
        'Improved communication',
        'Professional touch points',
      ],
    },
    {
      id: 6,
      icon: '💳',
      title: 'Membership Management',
      color: 'border-indigo-500',
      textColor: 'text-indigo-500',
      bgGradient: 'from-indigo-500 to-purple-500',
      shortDescription: [
        'Membership tiers and perks',
        'Benefits tracking',
        'Promotional management',
        'Member dashboard',
      ],
      detailedDescription: 'Flexible membership system to handle different tiers, perks, and benefit tracking.',
      features: [
        'Multiple membership tiers',
        'Perk and benefit tracking',
        'Member status dashboard',
        'Promotional tracking',
        'Upgrade/downgrade handling',
      ],
      benefits: [
        'Recurring revenue management',
        'Client retention tools',
        'Clear membership visibility',
      ],
    },
    {
      id: 7,
      icon: '⚙️',
      title: 'Admin Portal',
      color: 'border-red-500',
      textColor: 'text-red-500',
      bgGradient: 'from-red-500 to-pink-500',
      shortDescription: [
        'Business dashboard with metrics',
        'Staff management',
        'Client engagement tools',
        'Analytics and reporting',
      ],
      detailedDescription: 'Comprehensive admin dashboard providing full visibility into business operations and metrics.',
      features: [
        'Business KPI dashboard',
        'Staff management',
        'Client management tools',
        'Service configuration',
        'Revenue tracking',
        'Report generation',
      ],
      benefits: [
        'Complete business visibility',
        'Data-driven decisions',
        'Streamlined operations',
      ],
    },
    {
      id: 8,
      icon: '📧',
      title: 'Email Service',
      color: 'border-orange-500',
      textColor: 'text-orange-500',
      bgGradient: 'from-orange-500 to-red-500',
      shortDescription: [
        'Integrated email marketing',
        'Engagement insights',
        'Campaign management',
        'Automated communications',
      ],
      detailedDescription: 'Built-in email tools for client communication, campaigns, and engagement tracking.',
      features: [
        'Email campaign tools',
        'Client segmentation',
        'Engagement analytics',
        'Automated sequences',
        'Template library',
      ],
      benefits: [
        'Direct client communication',
        'Marketing automation',
        'Engagement insights',
      ],
    },
  ],
};

export default function RoadmapPage() {
  const [selectedFeature, setSelectedFeature] = useState<number | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['phases']));
  const [roadmap, setRoadmap] = useState<RoadmapConfig>(demoRoadmap);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch user's organization to determine which roadmap to show
  useEffect(() => {
    async function fetchUserOrg() {
      try {
        const response = await fetch('/api/dashboard');
        if (response.ok) {
          const data = await response.json();
          // Check if user belongs to Vetted Trainers organization
          if (data.organizationName === 'Vetted Trainers') {
            setRoadmap(vettedTrainersRoadmap);
          } else {
            setRoadmap(demoRoadmap);
          }
        }
      } catch (error) {
        console.error('Failed to fetch organization:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchUserOrg();
  }, []);

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  };

  const handlePreviousFeature = () => {
    if (selectedFeature === null) return;
    const newIndex = selectedFeature === 0 ? roadmap.features.length - 1 : selectedFeature - 1;
    setSelectedFeature(newIndex);
  };

  const handleNextFeature = () => {
    if (selectedFeature === null) return;
    const newIndex = selectedFeature === roadmap.features.length - 1 ? 0 : selectedFeature + 1;
    setSelectedFeature(newIndex);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-700 border-green-300">Completed</Badge>;
      case 'in-progress':
        return <Badge className="bg-blue-100 text-blue-700 border-blue-300">In Progress</Badge>;
      default:
        return <Badge variant="outline" className="text-muted-foreground">Upcoming</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'in-progress':
        return <Clock className="h-5 w-5 text-blue-500 animate-pulse" />;
      default:
        return <Circle className="h-5 w-5 text-muted-foreground/40" />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30">
      {/* Header */}
      <div className="bg-primary text-primary-foreground py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">
            <Badge className="mb-4 bg-primary-foreground/20 text-primary-foreground border-primary-foreground/30 text-sm">
              Project Roadmap
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-3">{roadmap.projectName}</h1>
            <p className="text-xl text-primary-foreground/80 mb-2">
              {roadmap.subtitle}
            </p>
            <p className="text-primary-foreground/60">
              {roadmap.effectiveDate !== "Agreement Date" && `Agreement Date: ${roadmap.effectiveDate} • `}
              Timeline: {roadmap.timeline}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Contract Overview */}
        <Card className="mb-8 border-2 border-primary/20">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              {roadmap.showSupport ? 'Agreement Overview' : 'Project Overview'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`grid gap-6 ${roadmap.showSupport ? 'md:grid-cols-4' : 'md:grid-cols-3'}`}>
              <div className="text-center p-4 bg-primary/5 rounded-lg">
                <DollarSign className="h-8 w-8 mx-auto text-primary mb-2" />
                <p className="text-3xl font-bold">{roadmap.totalCost}</p>
                <p className="text-sm text-muted-foreground">Total Project Cost</p>
              </div>
              <div className="text-center p-4 bg-primary/5 rounded-lg">
                <Calendar className="h-8 w-8 mx-auto text-primary mb-2" />
                <p className="text-3xl font-bold">{roadmap.timeline}</p>
                <p className="text-sm text-muted-foreground">Development Timeline</p>
              </div>
              {roadmap.showSupport && (
                <div className="text-center p-4 bg-primary/5 rounded-lg">
                  <Shield className="h-8 w-8 mx-auto text-primary mb-2" />
                  <p className="text-3xl font-bold">1 Year</p>
                  <p className="text-sm text-muted-foreground">Free Support (Bug Fixes)</p>
                </div>
              )}
              <div className="text-center p-4 bg-primary/5 rounded-lg">
                <Target className="h-8 w-8 mx-auto text-primary mb-2" />
                <p className="text-3xl font-bold">3</p>
                <p className="text-sm text-muted-foreground">Payment Milestones</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Schedule */}
        <Card className="mb-8">
          <CardHeader 
            className="cursor-pointer"
            onClick={() => toggleSection('payments')}
          >
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Payment Schedule
              </span>
              {expandedSections.has('payments') ? 
                <ChevronDown className="h-5 w-5" /> : 
                <ChevronRight className="h-5 w-5" />
              }
            </CardTitle>
          </CardHeader>
          {expandedSections.has('payments') && (
            <CardContent>
              <div className="space-y-4">
                {roadmap.payments.map((payment, index) => (
                  <div 
                    key={index} 
                    className={`flex items-center justify-between p-4 rounded-lg border-2 ${
                      payment.status === 'completed' 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-muted/30 border-border'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      {payment.status === 'completed' ? (
                        <CheckCircle2 className="h-6 w-6 text-green-500" />
                      ) : (
                        <Circle className="h-6 w-6 text-muted-foreground" />
                      )}
                      <div>
                        <p className="font-semibold">{payment.name}</p>
                        <p className="text-sm text-muted-foreground">{payment.trigger}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">{payment.amount}</p>
                      {payment.status === 'completed' && (
                        <Badge className="bg-green-100 text-green-700">Paid</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {roadmap.showSupport && roadmap.postSupportRate && (
                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> Payments not received within 30 days of due date will incur 1.5% monthly interest.
                    Post-year support is available at ${roadmap.postSupportRate}/month.
                  </p>
                </div>
              )}
            </CardContent>
          )}
        </Card>

        {/* Development Timeline */}
        <Card className="mb-8">
          <CardHeader 
            className="cursor-pointer"
            onClick={() => toggleSection('phases')}
          >
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Development Milestones
              </span>
              {expandedSections.has('phases') ? 
                <ChevronDown className="h-5 w-5" /> : 
                <ChevronRight className="h-5 w-5" />
              }
            </CardTitle>
          </CardHeader>
          {expandedSections.has('phases') && (
            <CardContent>
              <div className="space-y-6">
                {roadmap.phases.map((phase, index) => (
                  <div key={index} className="relative">
                    {/* Timeline connector */}
                    {index < roadmap.phases.length - 1 && (
                      <div className="absolute left-[11px] top-12 h-full w-0.5 bg-border" />
                    )}
                    
                    <div className="flex gap-4">
                      {/* Status icon */}
                      <div className="relative z-10 mt-1">
                        {getStatusIcon(phase.status)}
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 pb-6">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className="text-2xl">{phase.icon}</span>
                          <h3 className="text-xl font-bold">{phase.title}</h3>
                          {getStatusBadge(phase.status)}
                        </div>
                        <div className="flex flex-wrap gap-2 mb-3">
                          <Badge variant="outline" className="font-semibold">
                            {phase.phase}
                          </Badge>
                          <Badge variant="outline">
                            {phase.timeline}
                          </Badge>
                          {phase.payment && (
                            <Badge className="bg-amber-100 text-amber-700 border-amber-300">
                              💰 {phase.payment}
                            </Badge>
                          )}
                        </div>
                        <div className="grid md:grid-cols-2 gap-2 mt-4">
                          {phase.features.map((feature, fIndex) => (
                            <div 
                              key={fIndex}
                              className="flex items-start gap-2 text-sm p-2 rounded bg-muted/50"
                            >
                              <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                              <span>{feature}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Timeline Note */}
              {roadmap.showSupport && (
                <div className="mt-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
                  <p className="text-sm text-amber-800">
                    <strong>⏰ Timeline Note:</strong> Timeline accounts for holiday season and may be adjusted by mutual agreement.
                    If working demo is not delivered within 6 months, a 10% reduction applies to remaining payments for each month of delay.
                  </p>
                </div>
              )}
            </CardContent>
          )}
        </Card>

        {/* Platform Features */}
        <Card className="mb-8">
          <CardHeader 
            className="cursor-pointer"
            onClick={() => toggleSection('features')}
          >
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Platform Features
              </span>
              {expandedSections.has('features') ? 
                <ChevronDown className="h-5 w-5" /> : 
                <ChevronRight className="h-5 w-5" />
              }
            </CardTitle>
          </CardHeader>
          {expandedSections.has('features') && (
            <CardContent>
              <p className="text-muted-foreground mb-6">
                Click on any feature to learn more about what&apos;s included in your platform.
              </p>

              {/* Selected Feature Detail View */}
              {selectedFeature !== null && roadmap.features[selectedFeature] && (() => {
                const feature = roadmap.features[selectedFeature]!;
                return (
                <div className="mb-8 relative">
                  {/* Navigation Arrows */}
                  <button
                    onClick={handlePreviousFeature}
                    className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 z-10 bg-background hover:bg-muted rounded-full p-2 shadow-lg transition-all hover:scale-110 border"
                    aria-label="Previous feature"
                  >
                    <ChevronRight className="w-5 h-5 rotate-180" />
                  </button>

                  <button
                    onClick={handleNextFeature}
                    className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 z-10 bg-background hover:bg-muted rounded-full p-2 shadow-lg transition-all hover:scale-110 border"
                    aria-label="Next feature"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>

                  <div className={`rounded-xl overflow-hidden border-2 ${feature.color}`}>
                    <div className={`bg-gradient-to-r ${feature.bgGradient} p-6 text-white`}>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                          <span className="text-5xl">{feature.icon}</span>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-2xl font-bold">{feature.title}</h3>
                              <span className="text-sm bg-white/20 px-2 py-0.5 rounded-full">
                                {selectedFeature + 1} of {roadmap.features.length}
                              </span>
                            </div>
                            <p className="text-white/90">{feature.detailedDescription}</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => setSelectedFeature(null)}
                          className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  
                    <div className="p-6 bg-background">
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-bold mb-3 flex items-center gap-2">
                            <CheckCircle2 className="h-5 w-5 text-primary" />
                            Key Features
                          </h4>
                          <ul className="space-y-2">
                            {feature.features.map((f, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-sm">
                                <span className={feature.textColor}>•</span>
                                <span>{f}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <h4 className="font-bold mb-3 flex items-center gap-2">
                            <Target className="h-5 w-5 text-green-500" />
                            Business Benefits
                          </h4>
                          <ul className="space-y-2">
                            {feature.benefits.map((benefit, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-sm">
                                <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                                <span>{benefit}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                );
              })()}

              {/* Feature Cards Grid */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {roadmap.features.map((feature) => (
                  <div 
                    key={feature.id}
                    onClick={() => setSelectedFeature(feature.id)}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1 ${
                      selectedFeature === feature.id 
                        ? `${feature.color} bg-muted/50` 
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="text-3xl mb-2">{feature.icon}</div>
                    <h3 className="font-bold mb-2">{feature.title}</h3>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {feature.shortDescription.slice(0, 2).map((item, idx) => (
                        <li key={idx} className="flex items-start gap-1">
                          <span className={feature.textColor}>•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                    <p className="mt-2 text-xs text-primary font-medium">
                      Click to learn more →
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          )}
        </Card>

        {/* Client Responsibilities */}
        <Card className="mb-8">
          <CardHeader 
            className="cursor-pointer"
            onClick={() => toggleSection('responsibilities')}
          >
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Client Responsibilities
              </span>
              {expandedSections.has('responsibilities') ? 
                <ChevronDown className="h-5 w-5" /> : 
                <ChevronRight className="h-5 w-5" />
              }
            </CardTitle>
          </CardHeader>
          {expandedSections.has('responsibilities') && (
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-bold mb-3 text-primary">Ongoing Operational Costs</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <Circle className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <span>Web hosting services</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Circle className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <span>Database hosting and storage</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Circle className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <span>Payment processing fees</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Circle className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <span>Third-party API costs (SMS, email)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Circle className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <span>Domain and SSL certificates</span>
                    </li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-bold mb-3 text-primary">Project Participation</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />
                      <span>Provide access to existing data</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />
                      <span>Respond to questions within 48 hours</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />
                      <span>Participate in testing and feedback</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />
                      <span>Designate a primary contact</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />
                      <span>Provide branding assets</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Support & Ownership - Only show for VT */}
        {roadmap.showSupport && (
          <Card className="mb-8">
            <CardHeader 
              className="cursor-pointer"
              onClick={() => toggleSection('support')}
            >
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Support & Ownership
                </span>
                {expandedSections.has('support') ? 
                  <ChevronDown className="h-5 w-5" /> : 
                  <ChevronRight className="h-5 w-5" />
                }
              </CardTitle>
            </CardHeader>
            {expandedSections.has('support') && (
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <h4 className="font-bold mb-3 text-green-800 flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5" />
                      1 Year Free Support Includes
                    </h4>
                    <ul className="space-y-2 text-sm text-green-800">
                      <li>• Bug fixes and error corrections</li>
                      <li>• Security patches and updates</li>
                      <li>• Basic troubleshooting assistance</li>
                      <li>• Up to 5 hours monthly support time</li>
                    </ul>
                  </div>
                  <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                    <h4 className="font-bold mb-3 text-amber-800 flex items-center gap-2">
                      <Circle className="h-5 w-5" />
                      Not Included in Free Support
                    </h4>
                    <ul className="space-y-2 text-sm text-amber-800">
                      <li>• New feature development</li>
                      <li>• Major design changes</li>
                      <li>• Third-party integration additions</li>
                      <li>• Performance optimizations beyond initial scope</li>
                      <li>• Training for new staff members</li>
                    </ul>
                    {roadmap.postSupportRate && (
                      <p className="mt-3 text-xs text-amber-700">
                        Post-year support available at ${roadmap.postSupportRate}/month
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-6 p-4 bg-primary/5 rounded-lg border border-primary/20">
                  <h4 className="font-bold mb-2 flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    Software Ownership
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Upon final payment, you will own full rights to the custom software developed under this agreement.
                    The software may <strong>only</strong> be used for your in-house business operations.
                  </p>
                </div>
              </CardContent>
            )}
          </Card>
        )}

        {/* Software Ownership - For Demo (no support section) */}
        {!roadmap.showSupport && (
          <Card className="mb-8">
            <CardHeader 
              className="cursor-pointer"
              onClick={() => toggleSection('ownership')}
            >
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Software Ownership
                </span>
                {expandedSections.has('ownership') ? 
                  <ChevronDown className="h-5 w-5" /> : 
                  <ChevronRight className="h-5 w-5" />
                }
              </CardTitle>
            </CardHeader>
            {expandedSections.has('ownership') && (
              <CardContent>
                <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                  <p className="text-sm text-muted-foreground">
                    Upon final payment, you will own full rights to the custom software developed under your agreement.
                    The software may be used for your in-house business operations.
                  </p>
                </div>
              </CardContent>
            )}
          </Card>
        )}

        {/* Contact Card */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <MessageSquare className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Questions About Your Project?</h3>
                <p className="mt-1 text-muted-foreground">
                  Your custom business platform is being built to your exact specifications.
                  The sooner we receive your photos, branding assets, and data, the faster
                  we can move through development.
                </p>
                {roadmap.showSupport && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    <strong>Remember:</strong> Your agreement includes platform administrator training for
                    Youseff and designated staff, plus one year of complimentary support after launch.
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
