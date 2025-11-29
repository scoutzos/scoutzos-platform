import { getDashboardStats, getRecentActivity, getUpcomingRent } from '@/lib/dashboard/queries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Users, FileText, Wrench, TrendingUp, AlertTriangle, Calendar, DollarSign } from 'lucide-react';
import Link from 'next/link';

export default async function DashboardPage() {
  const [stats, activity, upcomingRent] = await Promise.all([
    getDashboardStats(),
    getRecentActivity(),
    getUpcomingRent(),
  ]);

  if (!stats) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Please complete your profile setup to view the dashboard.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your property management</p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Properties</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProperties}</div>
            <p className="text-xs text-muted-foreground">
              {stats.vacantProperties} vacant, {stats.occupiedProperties} occupied
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Occupancy Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.occupancyRate}%</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeLeases} active leases
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${stats.monthlyRevenue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.collectionRate}% collected
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Tenants</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeTenants}</div>
            <p className="text-xs text-muted-foreground">
              {stats.newLeads} new leads this month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts Row */}
      <div className="grid gap-4 md:grid-cols-3">
        {stats.urgentMaintenance > 0 && (
          <Card className="border-red-200 bg-red-50">
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
              <CardTitle className="text-sm font-medium text-red-800">Urgent Maintenance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-700">{stats.urgentMaintenance}</div>
              <Link href="/maintenance?priority=high" className="text-xs text-red-600 hover:underline">
                View urgent requests →
              </Link>
            </CardContent>
          </Card>
        )}

        {stats.expiringLeases > 0 && (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <Calendar className="h-5 w-5 text-yellow-600 mr-2" />
              <CardTitle className="text-sm font-medium text-yellow-800">Expiring Leases</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-700">{stats.expiringLeases}</div>
              <Link href="/leases?expiring=60" className="text-xs text-yellow-600 hover:underline">
                Leases expiring in 60 days →
              </Link>
            </CardContent>
          </Card>
        )}

        {stats.openMaintenance > 0 && (
          <Card>
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <Wrench className="h-5 w-5 text-muted-foreground mr-2" />
              <CardTitle className="text-sm font-medium">Open Maintenance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.openMaintenance}</div>
              <Link href="/maintenance" className="text-xs text-muted-foreground hover:underline">
                View all requests →
              </Link>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Activity and Rent Due */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {activity.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent activity</p>
            ) : (
              <div className="space-y-4">
                {activity.map((item) => (
                  <div key={`${item.type}-${item.id}`} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-2 h-2 rounded-full ${
                        item.type === 'maintenance' ? 'bg-orange-500' :
                        item.type === 'lead' ? 'bg-green-500' : 'bg-blue-500'
                      }`} />
                      <div>
                        <p className="text-sm font-medium">{item.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(item.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-full bg-muted">
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Rent */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Rent Due</CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingRent.length === 0 ? (
              <p className="text-sm text-muted-foreground">No active leases</p>
            ) : (
              <div className="space-y-4">
                {upcomingRent.slice(0, 5).map((lease: any) => (
                  <div key={lease.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">
                        {lease.tenant?.first_name} {lease.tenant?.last_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {lease.property?.address_line1 || lease.property?.name}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">${lease.rent_amount?.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">
                        Due: {lease.rent_due_day || 1}
                        {lease.rent_due_day === 1 ? 'st' :
                         lease.rent_due_day === 2 ? 'nd' :
                         lease.rent_due_day === 3 ? 'rd' : 'th'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/properties/new"
              className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              <Building2 className="h-4 w-4 mr-2" />
              Add Property
            </Link>
            <Link
              href="/tenants/new"
              className="inline-flex items-center px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80"
            >
              <Users className="h-4 w-4 mr-2" />
              Add Tenant
            </Link>
            <Link
              href="/leases/new"
              className="inline-flex items-center px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80"
            >
              <FileText className="h-4 w-4 mr-2" />
              Create Lease
            </Link>
            <Link
              href="/maintenance/new"
              className="inline-flex items-center px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80"
            >
              <Wrench className="h-4 w-4 mr-2" />
              Log Maintenance
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
