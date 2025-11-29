import {
  LayoutDashboard,
  Building2,
  Users,
  FileText,
  Wrench,
  Calculator,
  CalendarDays,
  Briefcase,
  Target,
  Inbox,
  Sparkles,
  DollarSign,
  Building,
  UserCircle,
  Home,
  Store,
  BarChart3,
  PieChart,
  TrendingUp,
  Activity,
  Shield,
  FileCheck,
  ScrollText,
  AlertTriangle,
  Settings,
  CreditCard,
  Plug,
  Code,
  type LucideIcon,
} from 'lucide-react';

export type NavItem = {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  requiredRoles?: string[];
  requiredPermissions?: string[];
  badge?: string; // For "New", "Beta", etc.
  disabled?: boolean;
};

export type NavSection = {
  id: string;
  label: string;
  items: NavItem[];
};

export const SIDEBAR_SECTIONS: NavSection[] = [
  {
    id: 'operations',
    label: 'Operations',
    items: [
      { id: 'dashboard', label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { id: 'properties', label: 'Properties', href: '/properties', icon: Building2 },
      { id: 'leasing', label: 'Leasing', href: '/leasing', icon: FileText, disabled: true },
      { id: 'maintenance', label: 'Maintenance', href: '/maintenance', icon: Wrench, disabled: true },
      { id: 'accounting', label: 'Accounting', href: '/accounting', icon: Calculator, disabled: true },
      { id: 'tasks', label: 'Tasks & Calendar', href: '/tasks', icon: CalendarDays, disabled: true },
    ],
  },
  {
    id: 'growth',
    label: 'Growth & Deals',
    items: [
      { id: 'deals', label: 'Deals Hub', href: '/deals', icon: Briefcase },
      { id: 'buy-boxes', label: 'Buy Boxes', href: '/buy-boxes', icon: Target },
      { id: 'off-market', label: 'Off-Market Inbox', href: '/deals/off-market', icon: Inbox, disabled: true },
      { id: 'ai-advisor', label: 'AI Advisor', href: '/deals/ai-advisor', icon: Sparkles, badge: 'Beta' },
      { id: 'financing', label: 'Financing', href: '/financing', icon: DollarSign, disabled: true },
      { id: 'lender-marketplace', label: 'Lender Marketplace', href: '/financing/marketplace', icon: Building, disabled: true },
    ],
  },
  {
    id: 'relationships',
    label: 'Relationships',
    items: [
      { id: 'crm', label: 'CRM', href: '/crm', icon: UserCircle, disabled: true },
      { id: 'investors', label: 'Investors', href: '/investors', icon: Users },
      { id: 'residents', label: 'Residents', href: '/residents', icon: Home, disabled: true },
      { id: 'vendors', label: 'Vendors & Marketplace', href: '/vendors', icon: Store, disabled: true },
      { id: 'scoutz360', label: 'Scoutz360 Portfolio', href: '/scoutz360', icon: PieChart, disabled: true },
    ],
  },
  {
    id: 'portals',
    label: 'Portals & Admin',
    items: [
      { id: 'owner-portal', label: 'Owner Portal', href: '/portals/owners', icon: Building2, disabled: true },
      { id: 'tenant-portal', label: 'Tenant Portal', href: '/portals/tenants', icon: Home, disabled: true },
      { id: 'investor-portal', label: 'Investor Portal', href: '/portals/investors', icon: Users, disabled: true },
      { id: 'operator-admin', label: 'Operator Admin', href: '/admin/operator', icon: Settings, disabled: true },
      { id: 'users-teams', label: 'Users & Teams', href: '/admin/users', icon: Users, disabled: true },
    ],
  },
  {
    id: 'insights',
    label: 'Insights & Reporting',
    items: [
      { id: 'insights', label: 'Insights', href: '/insights', icon: BarChart3, disabled: true },
      { id: 'portfolio-analytics', label: 'Portfolio Analytics', href: '/insights/portfolio', icon: PieChart, disabled: true },
      { id: 'leasing-analytics', label: 'Leasing Analytics', href: '/insights/leasing', icon: TrendingUp, disabled: true },
      { id: 'operations-analytics', label: 'Operations Analytics', href: '/insights/operations', icon: Activity, disabled: true },
    ],
  },
  {
    id: 'compliance',
    label: 'Compliance',
    items: [
      { id: 'disclosures', label: 'Disclosures', href: '/compliance/disclosures', icon: Shield, disabled: true },
      { id: 'documents', label: 'Documents & E-Sign', href: '/compliance/documents', icon: FileCheck, disabled: true },
      { id: 'audit-log', label: 'Audit Log', href: '/compliance/audit-log', icon: ScrollText, disabled: true },
      { id: 'risk-center', label: 'Risk Center', href: '/compliance/risk-center', icon: AlertTriangle, disabled: true, badge: 'Soon' },
    ],
  },
  {
    id: 'system',
    label: 'System',
    items: [
      { id: 'settings', label: 'Settings', href: '/settings', icon: Settings },
      { id: 'billing', label: 'Billing & Plans', href: '/settings/billing', icon: CreditCard, disabled: true },
      { id: 'integrations', label: 'Integrations', href: '/settings/integrations', icon: Plug, disabled: true },
      { id: 'developer', label: 'Data & API', href: '/settings/developer', icon: Code, disabled: true },
    ],
  },
];

// Role-aware filter (stub - returns all for now)
export type UserContext = {
  roles: string[];
  permissions: string[];
};

export function filterNavSectionsForUser(
  sections: NavSection[],
  user: UserContext | null
): NavSection[] {
  if (!user) return sections; // Show all if no user context

  return sections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => {
        // If no role requirements, show it
        if (!item.requiredRoles?.length && !item.requiredPermissions?.length) {
          return true;
        }
        // Check roles
        const hasRole = item.requiredRoles?.some((role) => user.roles.includes(role)) ?? true;
        // Check permissions
        const hasPermission = item.requiredPermissions?.some((perm) => user.permissions.includes(perm)) ?? true;
        return hasRole && hasPermission;
      }),
    }))
    .filter((section) => section.items.length > 0);
}
