'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useAdmin } from '@/contexts/AdminContext';
import { useRouter } from 'next/navigation';

export default function RoadmapPage() {
  const { isAdmin, accessLevel } = useAdmin();
  const router = useRouter();
  const [selectedFeature, setSelectedFeature] = useState<number | null>(null);
  const [monthlyRevenue, setMonthlyRevenue] = useState<number>(15000);
  const [numSessions, setNumSessions] = useState<number>(200);

  // Check if user has access (either full or vetted)
  const hasAccess = isAdmin && (accessLevel === 'full' || accessLevel === 'vetted');

  // Redirect if no access
  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-12 max-w-md w-full text-center">
          <div className="mb-6 flex justify-center">
            <Image 
              src="/VT-Logo-White.png" 
              alt="Vetted Trainers Logo" 
              width={80}
              height={80}
              className="h-20 w-auto bg-black p-3 rounded-xl"
            />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-4">Access Restricted</h1>
          <p className="text-gray-600 mb-6" style={{ fontSize: '18px' }}>
            This page requires a Vetted Trainers access key. Please use the Admin Toggle in the navigation to enter your key.
          </p>
          <button 
            onClick={() => router.push('/')}
            className="bg-black text-white px-6 py-3 rounded-lg font-bold hover:bg-gray-800 transition-colors w-full"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  const handlePreviousFeature = () => {
    if (selectedFeature === null) return;
    const newIndex = selectedFeature === 0 ? features.length - 1 : selectedFeature - 1;
    setSelectedFeature(newIndex);
  };

  const handleNextFeature = () => {
    if (selectedFeature === null) return;
    const newIndex = selectedFeature === features.length - 1 ? 0 : selectedFeature + 1;
    setSelectedFeature(newIndex);
  };

  // Calculate costs and savings
  const calculateCosts = () => {
    // Vetted Trainers Platform Costs (per month)
    const hosting = 50; // Vercel Pro
    const database = 19; // Neon Launch plan
    const email = 15; // SendGrid/Resend
    const stripe = monthlyRevenue * 0.029 + (numSessions * 0.30); // 2.9% + $0.30 per transaction
    const totalVettedTrainers = hosting + database + email + stripe;

    // Vergaro + Current Stack Costs (estimated)
    const vergaroBase = 150; // Typical gym management software
    const hubspot = 45; // HubSpot Starter
    const vergaroTransactionFee = monthlyRevenue * 0.035; // Higher transaction fees
    const totalVergaro = vergaroBase + hubspot + vergaroTransactionFee;

    // Savings
    const monthlySavings = totalVergaro - totalVettedTrainers;
    const annualSavings = monthlySavings * 12;

    return {
      vettedTrainers: {
        hosting,
        database,
        email,
        stripe,
        total: totalVettedTrainers
      },
      vergaro: {
        platform: vergaroBase,
        hubspot,
        transactionFees: vergaroTransactionFee,
        total: totalVergaro
      },
      savings: {
        monthly: monthlySavings,
        annual: annualSavings,
        percentage: ((monthlySavings / totalVergaro) * 100)
      }
    };
  };

  const costs = calculateCosts();

  const features = [
    {
      id: 0,
      icon: '📅',
      title: 'Client Booking Management',
      color: 'border-blue-500',
      textColor: 'text-blue-500',
      bgGradient: 'from-blue-500 to-cyan-500',
      shortDescription: [
        'Flexible booking with 5-minute time increments',
        'Multiple location support',
        'Real-time availability display',
        'Automated booking confirmations',
      ],
      detailedDescription: 'A powerful booking system that gives your clients the flexibility they need while keeping your trainers organized. Book sessions in precise 5-minute increments across multiple locations with real-time availability.',
      features: [
        'Granular 5-minute time slot scheduling',
        'Multi-location management (gym, home, virtual)',
        'Calendar sync with Google Calendar, Apple Calendar',
        'Automated SMS and email confirmations',
        'Client self-service booking portal',
        'Recurring session scheduling',
        'Last-minute booking and cancellation policies',
        'Mobile-friendly booking interface',
      ],
      benefits: [
        'Reduce no-shows with automated reminders',
        'Fill schedule gaps with precise time management',
        'Improve client satisfaction with flexible options',
        'Save admin time with self-service booking',
      ],
    },
    {
      id: 1,
      icon: '⏳',
      title: 'Smart Waitlist System',
      color: 'border-purple-500',
      textColor: 'text-purple-500',
      bgGradient: 'from-purple-500 to-pink-500',
      shortDescription: [
        'Automated client notifications when spots open',
        'Priority queue management',
        'Waitlist analytics and insights',
        'Maximize schedule utilization',
      ],
      detailedDescription: 'Never leave money on the table with an intelligent waitlist that automatically fills cancellations and keeps your schedule at maximum capacity.',
      features: [
        'Automatic waitlist notifications via SMS/email',
        'Priority ranking based on membership tier',
        'Time-sensitive acceptance windows',
        'Waitlist analytics dashboard',
        'Multi-trainer waitlist coordination',
        'Client waitlist preferences and availability',
        'Historical waitlist conversion tracking',
        'Demand forecasting and trend analysis',
      ],
      benefits: [
        'Maximize revenue by filling every slot',
        'Reward loyal clients with priority access',
        'Gain insights into demand patterns',
        'Reduce manual coordination time',
      ],
    },
    {
      id: 2,
      icon: '🗓️',
      title: 'Trainer Schedule Management',
      color: 'border-cyan-500',
      textColor: 'text-cyan-500',
      bgGradient: 'from-cyan-500 to-blue-500',
      shortDescription: [
        'Individual trainer calendars and availability',
        'Multi-location schedule coordination',
        'Time-off and vacation management',
        'Session capacity tracking',
      ],
      detailedDescription: 'Empower your trainers with complete control over their schedules while maintaining oversight and coordination across your entire team.',
      features: [
        'Personalized trainer availability settings',
        'Multi-location schedule views',
        'Time-off request and approval workflow',
        'Session type and capacity limits',
        'Schedule templates for recurring availability',
        'Overtime and break-time tracking',
        'Schedule conflict detection',
        'Team calendar overview for coordination',
      ],
      benefits: [
        'Prevent trainer burnout with workload visibility',
        'Streamline schedule coordination across locations',
        'Improve work-life balance for trainers',
        'Reduce scheduling conflicts and errors',
      ],
    },
    {
      id: 3,
      icon: '💳',
      title: 'Membership & Billing',
      color: 'border-green-500',
      textColor: 'text-green-500',
      bgGradient: 'from-green-500 to-emerald-500',
      shortDescription: [
        'Automated twice-monthly billing',
        '6-month & 12-month membership packages',
        'Session-to-session (a la carte) options',
        'Flexible pricing structures',
      ],
      detailedDescription: 'Streamline revenue collection with automated billing that handles memberships, packages, and a la carte sessions - all customized to your business model.',
      features: [
        'Twice-monthly automated billing cycles',
        '6-month and 12-month membership packages',
        'Session-to-session pay-as-you-go options',
        'Custom pricing tiers and discounts',
        'Failed payment retry logic',
        'Payment plan options for large packages',
        'Proration for mid-cycle changes',
        'Multiple payment methods (credit card, ACH, etc.)',
      ],
      benefits: [
        'Predictable cash flow with recurring revenue',
        'Reduce payment collection overhead',
        'Flexible options to suit every client budget',
        'Lower churn with automated renewals',
      ],
    },
    {
      id: 4,
      icon: '💰',
      title: 'Payroll Management',
      color: 'border-emerald-500',
      textColor: 'text-emerald-500',
      bgGradient: 'from-emerald-500 to-green-500',
      shortDescription: [
        'Automated trainer paycheck calculation',
        'Per-session pay tracking',
        'Employee records and HR management',
        'Detailed earnings reports',
      ],
      detailedDescription: 'Eliminate payroll headaches with automated trainer compensation tracking based on sessions completed, packages sold, and custom commission structures.',
      features: [
        'Per-session compensation calculation',
        'Commission tracking on package sales',
        'Bonus and incentive management',
        'Tax document generation (1099)',
        'Pay stub generation and distribution',
        'Hourly vs. per-session pay structures',
        'Direct deposit integration',
        'Year-over-year earnings comparisons',
      ],
      benefits: [
        'Eliminate manual payroll calculations',
        'Transparent earnings for trainer motivation',
        'Reduce payroll errors and disputes',
        'Streamline tax reporting and compliance',
      ],
    },
    {
      id: 5,
      icon: '📚',
      title: 'Training Resources Library',
      color: 'border-orange-500',
      textColor: 'text-orange-500',
      bgGradient: 'from-orange-500 to-red-500',
      shortDescription: [
        'Workout exercise library with visuals',
        'Video demonstrations and form guides',
        'Easy resource creation and management',
        'Categorized by muscle group, difficulty, equipment',
      ],
      detailedDescription: 'Build a comprehensive library of exercises, videos, and training materials that trainers can quickly reference and assign to clients.',
      features: [
        'Exercise database with images and videos',
        'Form cue cards and coaching tips',
        'Equipment requirement tags',
        'Muscle group and movement pattern categorization',
        'Difficulty level classifications',
        'Custom exercise creation tools',
        'Video upload and hosting',
        'Search and filter capabilities',
      ],
      benefits: [
        'Ensure consistency across trainer team',
        'Speed up workout plan creation',
        'Provide clear guidance to clients',
        'Build your brand\'s exercise methodology',
      ],
    },
    {
      id: 6,
      icon: '🎯',
      title: 'Custom Plan Builder',
      color: 'border-pink-500',
      textColor: 'text-pink-500',
      bgGradient: 'from-pink-500 to-purple-500',
      shortDescription: [
        'AI-assisted workout plan creation',
        'Personalized dietary plan builder',
        'Smart workout suggestions based on client data',
        'Template library for quick plan creation',
      ],
      detailedDescription: 'Create personalized workout and nutrition plans in minutes with AI-powered suggestions based on client goals, fitness level, and preferences.',
      features: [
        'AI-generated workout recommendations',
        'Drag-and-drop workout plan builder',
        'Macro and meal planning tools',
        'Recipe library and meal prep guides',
        'Client goal-based plan customization',
        'Progressive overload automation',
        'Plan templates for common goals',
        'Client plan sharing and mobile access',
      ],
      benefits: [
        'Save hours creating customized plans',
        'Deliver professional-grade nutrition guidance',
        'Improve client results with data-driven plans',
        'Scale your business without sacrificing quality',
      ],
    },
    {
      id: 7,
      icon: '🏆',
      title: 'Client Engagement & Incentives',
      color: 'border-yellow-500',
      textColor: 'text-yellow-600',
      bgGradient: 'from-yellow-400 to-orange-500',
      shortDescription: [
        'Streak tracking and progress milestones',
        'Custom achievement badges and goals',
        'Trainer-assigned challenges with rewards',
        'Incentive programs (discounts, spa packages, etc.)',
      ],
      detailedDescription: 'Keep clients motivated and coming back with gamification, achievement tracking, and customizable reward programs that celebrate their progress.',
      features: [
        'Attendance streak tracking',
        'Achievement badge system',
        'Custom trainer-created challenges',
        'Reward redemption system',
        'Progress milestone celebrations',
        'Leaderboards and friendly competition',
        'Discount codes and promotional rewards',
        'Partner integration (spa, nutrition, apparel)',
      ],
      benefits: [
        'Increase client retention and loyalty',
        'Drive consistent attendance and engagement',
        'Create community and competition',
        'Generate referrals through rewards',
      ],
    },
    {
      id: 8,
      icon: '⚙️',
      title: 'Admin Portal & Team Management',
      color: 'border-indigo-500',
      textColor: 'text-indigo-500',
      bgGradient: 'from-indigo-500 to-purple-500',
      shortDescription: [
        'Full-service business management dashboard',
        'Role-based access control (admin, trainer, client)',
        'Team member management and permissions',
        'Comprehensive analytics and reporting',
      ],
      detailedDescription: 'Command central for your training business with powerful admin tools, role-based permissions, and deep analytics to make data-driven decisions.',
      features: [
        'Executive dashboard with KPIs',
        'Role-based permissions system',
        'Team member profiles and access control',
        'Revenue and retention analytics',
        'Client acquisition cost tracking',
        'Trainer performance metrics',
        'Custom report builder',
        'Data export capabilities',
      ],
      benefits: [
        'Make informed business decisions with data',
        'Protect sensitive information with permissions',
        'Monitor business health in real-time',
        'Identify growth opportunities and issues',
      ],
    },
    {
      id: 9,
      icon: '📧',
      title: 'Email Marketing System',
      color: 'border-red-500',
      textColor: 'text-red-500',
      bgGradient: 'from-red-500 to-pink-500',
      shortDescription: [
        'Easy-to-use email blast tool within admin portal',
        'Campaign builder with templates',
        'Segmented client lists for targeted campaigns',
        'Email analytics and engagement tracking',
      ],
      detailedDescription: 'Replace HubSpot with a built-in email marketing system that integrates seamlessly with your client data for personalized, effective campaigns.',
      features: [
        'Drag-and-drop email builder',
        'Pre-designed email templates',
        'Client segmentation by membership, activity, etc.',
        'Automated email sequences',
        'A/B testing capabilities',
        'Email performance analytics',
        'Unsubscribe management',
        'Transactional email integration',
      ],
      benefits: [
        'Save money by eliminating HubSpot',
        'Send highly targeted campaigns',
        'Automate client communication',
        'Improve email effectiveness with data',
      ],
    },
  ];

  const phases = [
    {
      phase: 'Phase 1',
      title: 'MVP - Replace Vergaro',
      status: 'in-progress',
      timeline: 'Months 1-2',
      features: [
        'User authentication & role-based access (admin, trainers, clients)',
        'Client database with profiles, memberships, and history',
        'Training session booking with 5-minute increments',
        'Trainer schedule and availability management',
        'Stripe payment integration for membership billing',
        'Basic admin dashboard with key metrics',
        'Google Sheets import for existing data migration',
      ],
      color: 'from-blue-500 to-cyan-500',
      icon: '🚀',
    },
    {
      phase: 'Phase 2',
      title: 'Enhanced Operations',
      status: 'planned',
      timeline: 'Months 3-4',
      features: [
        'Smart waitlist system with auto-notifications',
        'Automated payroll calculation and processing',
        'Advanced reporting and analytics dashboard',
        'Multi-location coordination and management',
        'Email marketing tools for client communication',
        'Training resources library with workout visuals',
      ],
      color: 'from-purple-500 to-pink-500',
      icon: '⚡',
    },
    {
      phase: 'Phase 3',
      title: 'Client Engagement & Growth',
      status: 'planned',
      timeline: 'Months 5-6',
      features: [
        'Custom workout and dietary plan builder',
        'AI-powered plan recommendations',
        'Client gamification (streaks, achievements, rewards)',
        'Incentive program management',
        'Automated marketing campaigns and sequences',
        'Advanced email automation replacing HubSpot',
      ],
      color: 'from-green-500 to-emerald-500',
      icon: '📈',
    },
    {
      phase: 'Phase 4',
      title: 'Scale & Innovation',
      status: 'planned',
      timeline: 'Months 6+',
      features: [
        'Mobile apps (iOS & Android)',
        'Advanced business intelligence and forecasting',
        'Client self-service portal',
        'Integration marketplace (wearables, nutrition apps)',
        'White-label options for franchise expansion',
        'API for third-party integrations',
      ],
      color: 'from-orange-500 to-red-500',
      icon: '🌟',
    },
  ];

  const getStatusBadge = (status: string) => {
    const styles = {
      planned: 'bg-gray-100 text-gray-700 border-gray-300',
      'in-progress': 'bg-blue-100 text-blue-700 border-blue-300',
      completed: 'bg-green-100 text-green-700 border-green-300',
    };
    return styles[status as keyof typeof styles] || styles.planned;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-black text-white py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center">
            <div className="flex flex-col items-center gap-6 mb-4">
              <Image 
                src="/VT-Logo-White.png" 
                alt="Vetted Trainers Logo" 
                width={300}
                height={128}
                className="h-32 w-auto"
                priority
              />
              <h1 className="text-5xl font-bold">Vetted Trainers</h1>
            </div>
            <p className="text-xl text-gray-300 mb-2">
              All-in-One Training Business Management Platform
            </p>
            <p className="text-lg text-gray-400">
              Replacing Vergaro, Google Sheets, and HubSpot with one powerful, customizable system
            </p>
          </div>
        </div>
      </div>

      {/* Vision Statement */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-12">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Our Vision</h2>
          <p className="text-lg text-gray-600 leading-relaxed" style={{ fontSize: '18px' }}>
            Vetted Trainers is a comprehensive platform designed to replace Vergaro and streamline 
            your entire training business. From migrating your existing Google Sheets database to 
            managing memberships, trainer schedules, payroll, and automated email marketing - we&apos;re 
            building a fully customizable solution tailored to your business needs. Say goodbye to 
            juggling multiple platforms and hello to one integrated system.
          </p>
        </div>

        {/* Key Challenges Being Solved */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <div className="bg-gradient-to-br from-red-50 to-orange-50 border-2 border-red-200 rounded-xl p-6">
            <h3 className="text-xl font-bold text-red-800 mb-3 flex items-center gap-2">
              <span className="text-2xl">⚠️</span>
              Current Pain Points
            </h3>
            <ul className="space-y-2 text-gray-700" style={{ fontSize: '18px' }}>
              <li className="flex items-start gap-2">
                <span className="text-red-500 mt-1">•</span>
                <span>Vergaro lacks customization for business-specific needs</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500 mt-1">•</span>
                <span>Multiple platforms (Vergaro, Google Sheets, HubSpot)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500 mt-1">•</span>
                <span>Manual data entry and synchronization issues</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500 mt-1">•</span>
                <span>Complex membership billing requirements</span>
              </li>
            </ul>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-6">
            <h3 className="text-xl font-bold text-green-800 mb-3 flex items-center gap-2">
              <span className="text-2xl">✅</span>
              Our Solutions
            </h3>
            <ul className="space-y-2 text-gray-700" style={{ fontSize: '18px' }}>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-1">•</span>
                <span>Fully customizable to your business workflows</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-1">•</span>
                <span>All-in-one integrated platform</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-1">•</span>
                <span>Seamless data migration with testing environment</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-1">•</span>
                <span>Automated billing tailored to your membership tiers</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Features Section */}
        <div className="mb-16">
          <h2 className="text-4xl font-bold text-gray-800 mb-4 text-center">
            Platform Features
          </h2>
          <p className="text-center text-gray-600 mb-8 max-w-3xl mx-auto" style={{ fontSize: '18px' }}>
            A comprehensive suite of tools designed to streamline every aspect of your training business
          </p>

          {/* Selected Feature Detail View */}
          {selectedFeature !== null && (
            <div className="mb-8 relative">
              {/* Previous Arrow */}
              <button
                onClick={handlePreviousFeature}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 bg-white hover:bg-gray-100 rounded-full p-3 shadow-lg transition-all hover:scale-110"
                aria-label="Previous feature"
              >
                <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              {/* Next Arrow */}
              <button
                onClick={handleNextFeature}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 bg-white hover:bg-gray-100 rounded-full p-3 shadow-lg transition-all hover:scale-110"
                aria-label="Next feature"
              >
                <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>

              <div className="bg-white rounded-2xl shadow-xl overflow-hidden border-t-4" 
                   style={{ borderTopColor: features[selectedFeature].color.replace('border-', '') }}>
                <div className={`bg-gradient-to-r ${features[selectedFeature].bgGradient} p-8 text-white`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <span className="text-6xl">{features[selectedFeature].icon}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-3xl font-bold">{features[selectedFeature].title}</h3>
                          <span className="text-sm bg-white bg-opacity-20 px-3 py-1 rounded-full">
                            {selectedFeature + 1} of {features.length}
                          </span>
                        </div>
                        <p className="text-lg opacity-90">{features[selectedFeature].detailedDescription}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setSelectedFeature(null)}
                      className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors ml-4"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              
              <div className="p-8">
                <div className="grid md:grid-cols-2 gap-8 mb-6">
                  {/* Key Features */}
                  <div>
                    <h4 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Key Features
                    </h4>
                    <ul className="space-y-3">
                      {features[selectedFeature].features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <span className={`${features[selectedFeature].textColor} mt-1 text-lg`}>•</span>
                          <span className="text-gray-700" style={{ fontSize: '18px' }}>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Business Benefits */}
                  <div>
                    <h4 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                      Business Benefits
                    </h4>
                    <ul className="space-y-3">
                      {features[selectedFeature].benefits.map((benefit, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <svg className="w-6 h-6 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="text-gray-700" style={{ fontSize: '18px' }}>{benefit}</span>
                        </li>
                      ))}
                    </ul>

                    {/* Visual Mockup Placeholder */}
                    <div className="mt-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-6 border-2 border-dashed border-gray-300">
                      <div className="flex items-center justify-center h-32">
                        <div className="text-center">
                          <svg className="w-16 h-16 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <p className="text-gray-500 text-sm">Visual mockup coming soon</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            </div>
          )}

          {/* Feature Cards Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            {features.map((feature) => (
              <div 
                key={feature.id}
                onClick={() => setSelectedFeature(feature.id)}
                className={`bg-white rounded-xl shadow-md hover:shadow-xl transition-all p-6 border-t-4 ${feature.color} cursor-pointer transform hover:-translate-y-1 ${selectedFeature === feature.id ? 'ring-4 ring-blue-200' : ''}`}
              >
                <div className="text-4xl mb-3">{feature.icon}</div>
                <h3 className="text-xl font-bold text-gray-800 mb-3">{feature.title}</h3>
                <ul className="text-gray-600 space-y-2" style={{ fontSize: '18px' }}>
                  {feature.shortDescription.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className={`${feature.textColor} mt-1`}>•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-700">
                  <span>Click to learn more</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Roadmap Timeline */}
        <div className="mb-8">
          <h2 className="text-4xl font-bold text-gray-800 mb-8 text-center">
            Development Roadmap
          </h2>
          
          {/* Timeline connector line */}
          <div className="relative">
            <div className="absolute left-8 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 via-purple-500 via-green-500 to-orange-500 hidden md:block"></div>
            
            <div className="space-y-8">
              {phases.map((phase, index) => (
                <div key={index} className="relative">
                  {/* Timeline dot */}
                  <div className="absolute left-6 top-8 w-5 h-5 rounded-full bg-white border-4 border-current hidden md:block"
                       style={{ color: phase.color.split(' ')[0].replace('from-', '') }}>
                  </div>
                  
                  {/* Content Card */}
                  <div className="md:ml-20 bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
                    {/* Card Header */}
                    <div className={`bg-gradient-to-r ${phase.color} p-6 text-white`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <span className="text-4xl">{phase.icon}</span>
                          <div>
                            <div className="text-sm font-semibold opacity-90">{phase.phase}</div>
                            <h3 className="text-2xl font-bold">{phase.title}</h3>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`inline-block px-4 py-1 rounded-full border-2 ${getStatusBadge(phase.status)} font-semibold text-sm mb-2`}>
                            {phase.status.charAt(0).toUpperCase() + phase.status.slice(1).replace('-', ' ')}
                          </div>
                          <div className="text-sm font-semibold">{phase.timeline}</div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Card Body */}
                    <div className="p-6">
                      <h4 className="font-semibold text-gray-700 mb-4">Key Features:</h4>
                      <div className="grid grid-cols-2 gap-3">
                        {phase.features.map((feature, featureIndex) => (
                          <div 
                            key={featureIndex} 
                            className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-3 border border-gray-200 hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-start gap-2">
                              <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                              </svg>
                              <span className="text-gray-700 text-sm leading-snug">{feature}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Realistic Timeline Section */}
        <div className="mb-16">
          <h2 className="text-4xl font-bold text-gray-800 mb-4 text-center">
            Realistic Development Timeline
          </h2>
          <p className="text-center text-gray-600 mb-8 max-w-3xl mx-auto" style={{ fontSize: '18px' }}>
            With Claude-assisted development, we can build an MVP that replaces Vergaro in just 2 months
          </p>

          {/* MVP Timeline */}
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-8 mb-8 border-2 border-blue-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                <span className="text-4xl">🚀</span>
                Working MVP: 2 Months
              </h3>
              <div className="bg-green-500 text-white px-4 py-2 rounded-lg font-bold">
                Fast Track
              </div>
            </div>
            
            <div className="grid md:grid-cols-4 gap-4 mb-6">
              {/* Sprint 1 */}
              <div className="bg-white rounded-xl p-5 shadow-md">
                <div className="text-blue-600 font-bold mb-2 flex items-center gap-2">
                  <span className="text-2xl">📊</span>
                  Sprint 1
                </div>
                <div className="text-sm text-gray-500 mb-3">Weeks 1-2</div>
                <h4 className="font-bold text-gray-800 mb-2">Foundation</h4>
                <ul className="space-y-1 text-gray-700" style={{ fontSize: '14px' }}>
                  <li className="flex items-start gap-1">
                    <span className="text-blue-500">•</span>
                    <span>Database schema</span>
                  </li>
                  <li className="flex items-start gap-1">
                    <span className="text-blue-500">•</span>
                    <span>Authentication</span>
                  </li>
                  <li className="flex items-start gap-1">
                    <span className="text-blue-500">•</span>
                    <span>Client/Trainer CRUD</span>
                  </li>
                  <li className="flex items-start gap-1">
                    <span className="text-blue-500">•</span>
                    <span>Basic admin panel</span>
                  </li>
                </ul>
              </div>

              {/* Sprint 2 */}
              <div className="bg-white rounded-xl p-5 shadow-md">
                <div className="text-purple-600 font-bold mb-2 flex items-center gap-2">
                  <span className="text-2xl">📅</span>
                  Sprint 2
                </div>
                <div className="text-sm text-gray-500 mb-3">Weeks 3-4</div>
                <h4 className="font-bold text-gray-800 mb-2">Booking Core</h4>
                <ul className="space-y-1 text-gray-700" style={{ fontSize: '14px' }}>
                  <li className="flex items-start gap-1">
                    <span className="text-purple-500">•</span>
                    <span>Booking form & logic</span>
                  </li>
                  <li className="flex items-start gap-1">
                    <span className="text-purple-500">•</span>
                    <span>Calendar interface</span>
                  </li>
                  <li className="flex items-start gap-1">
                    <span className="text-purple-500">•</span>
                    <span>Schedule management</span>
                  </li>
                  <li className="flex items-start gap-1">
                    <span className="text-purple-500">•</span>
                    <span>Conflict validation</span>
                  </li>
                </ul>
              </div>

              {/* Sprint 3 */}
              <div className="bg-white rounded-xl p-5 shadow-md">
                <div className="text-green-600 font-bold mb-2 flex items-center gap-2">
                  <span className="text-2xl">💳</span>
                  Sprint 3
                </div>
                <div className="text-sm text-gray-500 mb-3">Weeks 5-6</div>
                <h4 className="font-bold text-gray-800 mb-2">Payments</h4>
                <ul className="space-y-1 text-gray-700" style={{ fontSize: '14px' }}>
                  <li className="flex items-start gap-1">
                    <span className="text-green-500">•</span>
                    <span>Stripe integration</span>
                  </li>
                  <li className="flex items-start gap-1">
                    <span className="text-green-500">•</span>
                    <span>Membership tiers</span>
                  </li>
                  <li className="flex items-start gap-1">
                    <span className="text-green-500">•</span>
                    <span>Billing workflow</span>
                  </li>
                  <li className="flex items-start gap-1">
                    <span className="text-green-500">•</span>
                    <span>Payment dashboard</span>
                  </li>
                </ul>
              </div>

              {/* Sprint 4 */}
              <div className="bg-white rounded-xl p-5 shadow-md">
                <div className="text-orange-600 font-bold mb-2 flex items-center gap-2">
                  <span className="text-2xl">✨</span>
                  Sprint 4
                </div>
                <div className="text-sm text-gray-500 mb-3">Weeks 7-8</div>
                <h4 className="font-bold text-gray-800 mb-2">Launch Prep</h4>
                <ul className="space-y-1 text-gray-700" style={{ fontSize: '14px' }}>
                  <li className="flex items-start gap-1">
                    <span className="text-orange-500">•</span>
                    <span>Admin reporting</span>
                  </li>
                  <li className="flex items-start gap-1">
                    <span className="text-orange-500">•</span>
                    <span>Google Sheets import</span>
                  </li>
                  <li className="flex items-start gap-1">
                    <span className="text-orange-500">•</span>
                    <span>Bug fixes</span>
                  </li>
                  <li className="flex items-start gap-1">
                    <span className="text-orange-500">•</span>
                    <span>Deployment</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6">
              <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                MVP Success Criteria - Can You Replace Vergaro?
              </h4>
              <div className="grid md:grid-cols-2 gap-4">
                <ul className="space-y-2">
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-700" style={{ fontSize: '18px' }}>Book training sessions</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-700" style={{ fontSize: '18px' }}>Manage client memberships</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-700" style={{ fontSize: '18px' }}>Track trainer schedules</span>
                  </li>
                </ul>
                <ul className="space-y-2">
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-700" style={{ fontSize: '18px' }}>Process payments</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-700" style={{ fontSize: '18px' }}>View business dashboard</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-700" style={{ fontSize: '18px' }}>Import existing data</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Post-MVP Features */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-8 border-2 border-gray-300">
            <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="text-3xl">🔮</span>
              Post-MVP: Months 3-6
            </h3>
            <p className="text-gray-600 mb-6" style={{ fontSize: '18px' }}>
              Once the MVP is live and replacing Vergaro, we&apos;ll iterate weekly based on user feedback:
            </p>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg p-4">
                <div className="font-bold text-blue-600 mb-2">Month 3</div>
                <ul className="space-y-1 text-gray-700" style={{ fontSize: '16px' }}>
                  <li>• Smart waitlist system</li>
                  <li>• Automated payroll</li>
                  <li>• Enhanced reporting</li>
                </ul>
              </div>
              <div className="bg-white rounded-lg p-4">
                <div className="font-bold text-purple-600 mb-2">Month 4-5</div>
                <ul className="space-y-1 text-gray-700" style={{ fontSize: '16px' }}>
                  <li>• Email marketing tools</li>
                  <li>• Plan builder widget</li>
                  <li>• Resources library</li>
                </ul>
              </div>
              <div className="bg-white rounded-lg p-4">
                <div className="font-bold text-green-600 mb-2">Month 6+</div>
                <ul className="space-y-1 text-gray-700" style={{ fontSize: '16px' }}>
                  <li>• Client gamification</li>
                  <li>• Advanced analytics</li>
                  <li>• Mobile apps</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Cost Analysis Section */}
        <div className="mb-16">
          <h2 className="text-4xl font-bold text-gray-800 mb-4 text-center">
            Platform Costs & Savings
          </h2>
          <p className="text-center text-gray-600 mb-8 max-w-3xl mx-auto" style={{ fontSize: '18px' }}>
            Transparent pricing with significant savings compared to your current platform stack
          </p>

          {/* Cost Comparison */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Vetted Trainers Costs */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-8 border-2 border-green-200">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-green-500 text-white rounded-full p-3">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-800">Vetted Trainers</h3>
                  <p className="text-green-700">All-in-One Platform</p>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                  <span className="text-gray-700">Hosting (Vercel Pro)</span>
                  <span className="font-bold text-gray-800">${costs.vettedTrainers.hosting}/mo</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                  <span className="text-gray-700">Database (Neon)</span>
                  <span className="font-bold text-gray-800">${costs.vettedTrainers.database}/mo</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                  <span className="text-gray-700">Email Service</span>
                  <span className="font-bold text-gray-800">${costs.vettedTrainers.email}/mo</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                  <span className="text-gray-700">Payment Processing</span>
                  <span className="font-bold text-gray-800">${costs.vettedTrainers.stripe.toFixed(2)}/mo</span>
                </div>
              </div>

              <div className="border-t-2 border-green-300 pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-xl font-bold text-gray-800">Total Monthly Cost</span>
                  <span className="text-3xl font-bold text-green-600">${costs.vettedTrainers.total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Vergaro + Current Stack */}
            <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl p-8 border-2 border-red-200">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-red-500 text-white rounded-full p-3">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-800">Current Stack</h3>
                  <p className="text-red-700">Multiple Platforms</p>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                  <span className="text-gray-700">Vergaro Platform</span>
                  <span className="font-bold text-gray-800">${costs.vergaro.platform}/mo</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                  <span className="text-gray-700">HubSpot</span>
                  <span className="font-bold text-gray-800">${costs.vergaro.hubspot}/mo</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                  <span className="text-gray-700">Transaction Fees (3.5%)</span>
                  <span className="font-bold text-gray-800">${costs.vergaro.transactionFees.toFixed(2)}/mo</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white rounded-lg opacity-50">
                  <span className="text-gray-700">Manual Process Costs</span>
                  <span className="font-bold text-gray-800">Hidden</span>
                </div>
              </div>

              <div className="border-t-2 border-red-300 pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-xl font-bold text-gray-800">Total Monthly Cost</span>
                  <span className="text-3xl font-bold text-red-600">${costs.vergaro.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Current Assumptions Note */}
          <div className="mb-8">
            <div className="p-4 bg-purple-100 rounded-lg border border-purple-300">
              <p className="text-purple-800" style={{ fontSize: '16px' }}>
                <strong>📊 Current Assumptions:</strong> Based on ${monthlyRevenue.toLocaleString()}/month revenue and {numSessions} sessions, 
                you&apos;re processing an average of ${(monthlyRevenue / numSessions).toFixed(2)} per transaction. 
                Stripe charges 2.9% + $0.30 per transaction = ${((monthlyRevenue / numSessions) * 0.029 + 0.30).toFixed(2)} per session.
              </p>
            </div>
          </div>

          {/* Savings Highlight */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-8 text-white text-center mb-8">
            <h3 className="text-3xl font-bold mb-2">Your Potential Savings</h3>
            <div className="grid md:grid-cols-3 gap-6 mt-6">
              <div>
                <div className="text-5xl font-bold mb-2">${costs.savings.monthly.toFixed(2)}</div>
                <div className="text-xl text-green-100">Per Month</div>
              </div>
              <div>
                <div className="text-5xl font-bold mb-2">${costs.savings.annual.toFixed(2)}</div>
                <div className="text-xl text-green-100">Per Year</div>
              </div>
              <div>
                <div className="text-5xl font-bold mb-2">{costs.savings.percentage.toFixed(0)}%</div>
                <div className="text-xl text-green-100">Cost Reduction</div>
              </div>
            </div>
          </div>

          {/* Interactive Calculator */}
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-8 border-2 border-blue-200">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-4xl">🧮</span>
              <div>
                <h3 className="text-2xl font-bold text-gray-800">Savings Calculator</h3>
                <p className="text-gray-600">Adjust the values to see your potential savings</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-6">
              {/* Monthly Revenue Input */}
              <div className="bg-white rounded-xl p-6">
                <label className="block text-gray-700 font-semibold mb-3" style={{ fontSize: '18px' }}>
                  Monthly Revenue
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-xl font-bold">$</span>
                  <input
                    type="number"
                    value={monthlyRevenue}
                    onChange={(e) => setMonthlyRevenue(Number(e.target.value))}
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg text-xl font-bold focus:border-blue-500 focus:outline-none"
                    min="0"
                    step="1000"
                  />
                </div>
                <div className="mt-3">
                  <input
                    type="range"
                    value={monthlyRevenue}
                    onChange={(e) => setMonthlyRevenue(Number(e.target.value))}
                    min="5000"
                    max="100000"
                    step="1000"
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-gray-500 mt-1">
                    <span>$5K</span>
                    <span>$100K</span>
                  </div>
                </div>
              </div>

              {/* Number of Sessions Input */}
              <div className="bg-white rounded-xl p-6">
                <label className="block text-gray-700 font-semibold mb-3" style={{ fontSize: '18px' }}>
                  Monthly Sessions
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={numSessions}
                    onChange={(e) => setNumSessions(Number(e.target.value))}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-xl font-bold focus:border-blue-500 focus:outline-none"
                    min="0"
                    step="10"
                  />
                </div>
                <div className="mt-3">
                  <input
                    type="range"
                    value={numSessions}
                    onChange={(e) => setNumSessions(Number(e.target.value))}
                    min="50"
                    max="1000"
                    step="10"
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-gray-500 mt-1">
                    <span>50</span>
                    <span>1,000</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Real-time Savings Display */}
            <div className="bg-white rounded-xl p-6">
              <div className="grid md:grid-cols-3 gap-4 text-center">
                <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">Monthly Savings</div>
                  <div className="text-3xl font-bold text-blue-600">${costs.savings.monthly.toFixed(2)}</div>
                </div>
                <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">Annual Savings</div>
                  <div className="text-3xl font-bold text-purple-600">${costs.savings.annual.toFixed(2)}</div>
                </div>
                <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">5-Year Savings</div>
                  <div className="text-3xl font-bold text-green-600">${(costs.savings.annual * 5).toFixed(2)}</div>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <div className="p-4 bg-blue-100 rounded-lg border border-blue-300">
                <p className="text-blue-800" style={{ fontSize: '16px' }}>
                  <strong>💡 Note:</strong> These calculations assume Vergaro charges 3.5% transaction fees vs. Stripe&apos;s 2.9% + $0.30. 
                  Actual savings may be higher when factoring in time saved from automation and reduced manual processes.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-lg p-10 text-white text-center mt-12">
          <h2 className="text-3xl font-bold mb-4">Ready to Migrate from Vergaro?</h2>
          <p className="text-blue-100 mb-6" style={{ fontSize: '18px' }}>
            Let&apos;s discuss your specific business needs and create a customized migration plan that preserves your client relationships
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold text-lg hover:bg-blue-50 transition-colors duration-200">
              Schedule a Demo
            </button>
            <button className="bg-transparent border-2 border-white text-white px-8 py-3 rounded-lg font-semibold text-lg hover:bg-white hover:text-blue-600 transition-colors duration-200">
              Learn More
            </button>
          </div>
        </div>

        {/* Platform Benefits */}
        <div className="grid md:grid-cols-3 gap-6 mt-12">
          <div className="bg-white rounded-xl shadow-md p-6 text-center">
            <div className="text-4xl font-bold text-blue-600 mb-2">100%</div>
            <div className="text-gray-600" style={{ fontSize: '18px' }}>Smooth Data Migration</div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6 text-center">
            <div className="text-4xl font-bold text-purple-600 mb-2">3-in-1</div>
            <div className="text-gray-600" style={{ fontSize: '18px' }}>Platform Consolidation</div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6 text-center">
            <div className="text-4xl font-bold text-green-600 mb-2">Custom</div>
            <div className="text-gray-600" style={{ fontSize: '18px' }}>Built for Your Business</div>
          </div>
        </div>

        {/* UX Mockups Section */}
        <div className="mt-20 mb-16">
          <h2 className="text-4xl font-bold text-gray-800 mb-4 text-center">
            Platform Experience Preview
          </h2>
          <p className="text-center text-gray-600 mb-12 max-w-3xl mx-auto" style={{ fontSize: '18px' }}>
            Modern, intuitive interfaces designed for trainers and clients
          </p>

          {/* Client-Side Mockup */}
          <div className="mb-12">
            <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <span className="bg-black text-white px-4 py-2 rounded-lg">Client View</span>
              <span className="text-gray-500 text-lg">Mobile-First Design</span>
            </h3>
            
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border-4 border-black">
              {/* Mobile Frame */}
              <div className="bg-black p-4">
                <div className="bg-white rounded-2xl shadow-xl max-w-md mx-auto overflow-hidden">
                  {/* Top Bar */}
                  <div className="bg-black text-white px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Image 
                        src="/VT-Logo-White.png" 
                        alt="VT Logo" 
                        width={32}
                        height={32}
                        className="w-8 h-8"
                      />
                      <span className="font-bold text-lg">VT</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                      </svg>
                      <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
                    </div>
                  </div>

                  {/* Welcome Section */}
                  <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100">
                    <h2 className="text-2xl font-bold text-black mb-2">Welcome back, Sarah!</h2>
                    <p className="text-gray-600">Ready for your next session?</p>
                  </div>

                  {/* Quick Stats */}
                  <div className="px-6 pb-6">
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-white rounded-xl p-4 text-center shadow-md border-2 border-black">
                        <div className="text-3xl font-bold text-black mb-1">12</div>
                        <div className="text-xs text-gray-600">Day Streak</div>
                      </div>
                      <div className="bg-white rounded-xl p-4 text-center shadow-md border-2 border-gray-300">
                        <div className="text-3xl font-bold text-black mb-1">24</div>
                        <div className="text-xs text-gray-600">Sessions</div>
                      </div>
                      <div className="bg-white rounded-xl p-4 text-center shadow-md border-2 border-gray-300">
                        <div className="text-3xl font-bold text-black mb-1">8</div>
                        <div className="text-xs text-gray-600">Remaining</div>
                      </div>
                    </div>
                  </div>

                  {/* Upcoming Session */}
                  <div className="px-6 pb-6">
                    <h3 className="font-bold text-gray-800 mb-3">Next Session</h3>
                    <div className="bg-black text-white rounded-xl p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="text-sm text-gray-300">Tomorrow</div>
                          <div className="text-xl font-bold">10:00 AM - 11:00 AM</div>
                        </div>
                        <div className="bg-white text-black px-3 py-1 rounded-full text-xs font-bold">
                          Confirmed
                        </div>
                      </div>
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 bg-gray-700 rounded-full"></div>
                        <div>
                          <div className="font-bold">Alex Mitchell</div>
                          <div className="text-sm text-gray-300">Strength Training</div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button className="flex-1 bg-white text-black py-2 rounded-lg font-bold text-sm hover:bg-gray-200 transition-colors">
                          View Details
                        </button>
                        <button className="px-4 bg-gray-800 text-white py-2 rounded-lg font-bold text-sm hover:bg-gray-700 transition-colors">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="px-6 pb-6">
                    <div className="grid grid-cols-2 gap-3">
                      <button className="bg-white border-2 border-black text-black rounded-xl p-4 font-bold hover:bg-black hover:text-white transition-all">
                        Book Session
                      </button>
                      <button className="bg-white border-2 border-gray-300 text-black rounded-xl p-4 font-bold hover:bg-gray-100 transition-all">
                        My Progress
                      </button>
                    </div>
                  </div>

                  {/* Bottom Nav */}
                  <div className="bg-black text-white px-6 py-4 flex justify-around items-center">
                    <button className="flex flex-col items-center gap-1">
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
                      </svg>
                      <span className="text-xs">Home</span>
                    </button>
                    <button className="flex flex-col items-center gap-1 text-gray-400">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-xs">Schedule</span>
                    </button>
                    <button className="flex flex-col items-center gap-1 text-gray-400">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      <span className="text-xs">Progress</span>
                    </button>
                    <button className="flex flex-col items-center gap-1 text-gray-400">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span className="text-xs">Profile</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Admin-Side Mockup */}
          <div>
            <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <span className="bg-black text-white px-4 py-2 rounded-lg">Admin Dashboard</span>
              <span className="text-gray-500 text-lg">Desktop View</span>
            </h3>
            
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border-4 border-black">
              {/* Admin Header */}
              <div className="bg-black text-white px-8 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Image 
                    src="/VT-Logo-White.png" 
                    alt="VT Logo" 
                    width={40}
                    height={40}
                    className="w-10 h-10"
                  />
                  <div>
                    <div className="font-bold text-lg">Vetted Trainers</div>
                    <div className="text-sm text-gray-300">Admin Dashboard</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <button className="bg-white text-black px-4 py-2 rounded-lg font-bold text-sm hover:bg-gray-200 transition-colors">
                    + New Booking
                  </button>
                  <div className="flex items-center gap-3">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    <div className="w-10 h-10 bg-gray-700 rounded-full"></div>
                  </div>
                </div>
              </div>

              <div className="flex">
                {/* Sidebar */}
                <div className="w-64 bg-gray-900 text-white p-6">
                  <nav className="space-y-2">
                    <button className="w-full flex items-center gap-3 px-4 py-3 bg-white text-black rounded-lg font-semibold">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
                      </svg>
                      Dashboard
                    </button>
                    <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-gray-800 rounded-lg">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Bookings
                    </button>
                    <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-gray-800 rounded-lg">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      Clients
                    </button>
                    <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-gray-800 rounded-lg">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                      Trainers
                    </button>
                    <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-gray-800 rounded-lg">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                      Payments
                    </button>
                    <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-gray-800 rounded-lg">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      Analytics
                    </button>
                  </nav>
                </div>

                {/* Main Content */}
                <div className="flex-1 p-8 bg-gray-50">
                  {/* Stats Grid */}
                  <div className="grid grid-cols-4 gap-4 mb-8">
                    <div className="bg-white rounded-xl p-6 border-2 border-black shadow-md">
                      <div className="text-sm text-gray-600 mb-1">Today&apos;s Sessions</div>
                      <div className="text-4xl font-bold text-black">24</div>
                      <div className="text-sm text-green-600 mt-2">↑ 12% vs yesterday</div>
                    </div>
                    <div className="bg-white rounded-xl p-6 border-2 border-gray-300 shadow-md">
                      <div className="text-sm text-gray-600 mb-1">Active Clients</div>
                      <div className="text-4xl font-bold text-black">156</div>
                      <div className="text-sm text-green-600 mt-2">↑ 8 this week</div>
                    </div>
                    <div className="bg-white rounded-xl p-6 border-2 border-gray-300 shadow-md">
                      <div className="text-sm text-gray-600 mb-1">Monthly Revenue</div>
                      <div className="text-4xl font-bold text-black">$24K</div>
                      <div className="text-sm text-green-600 mt-2">↑ 15% vs last month</div>
                    </div>
                    <div className="bg-white rounded-xl p-6 border-2 border-gray-300 shadow-md">
                      <div className="text-sm text-gray-600 mb-1">Waitlist</div>
                      <div className="text-4xl font-bold text-black">12</div>
                      <div className="text-sm text-gray-600 mt-2">3 pending notifications</div>
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
                    <h3 className="font-bold text-xl mb-4">Today&apos;s Schedule</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-4 bg-black text-white rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold">9:00</div>
                            <div className="text-xs text-gray-300">AM</div>
                          </div>
                          <div className="w-px h-12 bg-gray-700"></div>
                          <div>
                            <div className="font-bold">John Smith - Personal Training</div>
                            <div className="text-sm text-gray-300">Trainer: Alex Mitchell • Location: Main Gym</div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button className="bg-white text-black px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-200">
                            Check In
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-gray-100 rounded-lg border-2 border-gray-300">
                        <div className="flex items-center gap-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-gray-700">10:00</div>
                            <div className="text-xs text-gray-500">AM</div>
                          </div>
                          <div className="w-px h-12 bg-gray-300"></div>
                          <div>
                            <div className="font-bold text-gray-800">Sarah Johnson - Group Class</div>
                            <div className="text-sm text-gray-600">Trainer: Mike Davis • Location: Studio A</div>
                          </div>
                        </div>
                        <div className="text-sm text-gray-500">Upcoming</div>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
                        <div className="flex items-center gap-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-gray-600">11:00</div>
                            <div className="text-xs text-gray-400">AM</div>
                          </div>
                          <div className="w-px h-12 bg-gray-200"></div>
                          <div>
                            <div className="font-bold text-gray-700">Emma Wilson - HIIT Training</div>
                            <div className="text-sm text-gray-500">Trainer: Alex Mitchell • Location: Main Gym</div>
                          </div>
                        </div>
                        <div className="text-sm text-gray-400">Scheduled</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

