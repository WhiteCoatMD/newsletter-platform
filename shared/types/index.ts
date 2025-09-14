export interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'creator' | 'subscriber' | 'admin';
  isVerified: boolean;
  subscription?: {
    plan: 'free' | 'launch' | 'scale' | 'max';
    status: 'active' | 'canceled' | 'past_due';
    currentPeriodEnd: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface Newsletter {
  _id: string;
  userId: string;
  name: string;
  description: string;
  subdomain: string;
  customDomain?: string;
  branding: {
    logo?: string;
    primaryColor: string;
    secondaryColor: string;
    font: string;
  };
  settings: {
    allowComments: boolean;
    enableReferrals: boolean;
    enablePaidSubscriptions: boolean;
    enableAds: boolean;
  };
  subscriberCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Post {
  _id: string;
  newsletterId: string;
  title: string;
  content: string;
  excerpt: string;
  featuredImage?: string;
  status: 'draft' | 'scheduled' | 'published' | 'sent';
  visibility: 'public' | 'subscribers' | 'paid';
  publishedAt?: Date;
  scheduledFor?: Date;
  tags: string[];
  audioUrl?: string;
  seoTitle?: string;
  seoDescription?: string;
  templateId?: string;
  analytics: {
    opens: number;
    clicks: number;
    revenue: number;
  };
  abTest?: {
    isActive: boolean;
    variants: Array<{
      id: string;
      subject: string;
      percentage: number;
      opens: number;
      clicks: number;
    }>;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface Subscriber {
  _id: string;
  newsletterId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  status: 'active' | 'unsubscribed' | 'bounced';
  subscriptionType: 'free' | 'paid';
  paidTier?: string;
  segments: string[];
  source: string;
  referredBy?: string;
  location?: {
    country: string;
    city: string;
  };
  engagement: {
    openRate: number;
    clickRate: number;
    lastOpened?: Date;
    lastClicked?: Date;
  };
  customFields: Record<string, any>;
  subscribedAt: Date;
  unsubscribedAt?: Date;
}

export interface Template {
  _id: string;
  userId: string;
  name: string;
  description: string;
  thumbnail: string;
  content: string;
  category: 'newsletter' | 'website' | 'form';
  isPublic: boolean;
  usageCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReferralProgram {
  _id: string;
  newsletterId: string;
  isActive: boolean;
  rewards: Array<{
    referralCount: number;
    reward: string;
    description: string;
  }>;
  settings: {
    shareMessage: string;
    thanksMessage: string;
  };
}

export interface Campaign {
  _id: string;
  postId: string;
  newsletterId: string;
  subject: string;
  sentAt: Date;
  totalSent: number;
  analytics: {
    delivered: number;
    opens: number;
    uniqueOpens: number;
    clicks: number;
    uniqueClicks: number;
    unsubscribes: number;
    bounces: number;
    revenue: number;
  };
  segmentIds: string[];
}

export interface Segment {
  _id: string;
  newsletterId: string;
  name: string;
  description: string;
  conditions: Array<{
    field: string;
    operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'is_set' | 'is_not_set';
    value: string;
  }>;
  subscriberCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Advertisement {
  _id: string;
  newsletterId: string;
  title: string;
  content: string;
  imageUrl?: string;
  targetUrl: string;
  placement: 'header' | 'content' | 'footer' | 'sidebar';
  status: 'active' | 'paused' | 'ended';
  budget: number;
  spent: number;
  analytics: {
    impressions: number;
    clicks: number;
    conversions: number;
  };
  startDate: Date;
  endDate: Date;
  createdAt: Date;
}

export interface Sponsorship {
  _id: string;
  newsletterId: string;
  sponsorName: string;
  sponsorEmail: string;
  title: string;
  content: string;
  imageUrl?: string;
  targetUrl: string;
  price: number;
  status: 'pending' | 'approved' | 'active' | 'completed' | 'rejected';
  postIds: string[];
  startDate: Date;
  endDate: Date;
  createdAt: Date;
}

export interface WebsitePage {
  _id: string;
  newsletterId: string;
  slug: string;
  title: string;
  content: string;
  metaTitle?: string;
  metaDescription?: string;
  isPublished: boolean;
  templateId?: string;
  customCss?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SubscribeForm {
  _id: string;
  newsletterId: string;
  name: string;
  title: string;
  description: string;
  buttonText: string;
  successMessage: string;
  redirectUrl?: string;
  fields: Array<{
    name: string;
    type: 'text' | 'email' | 'select' | 'checkbox';
    label: string;
    required: boolean;
    options?: string[];
  }>;
  styling: {
    backgroundColor: string;
    textColor: string;
    buttonColor: string;
    borderRadius: number;
  };
  isActive: boolean;
  submissions: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T = any> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}