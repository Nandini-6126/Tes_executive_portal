import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { servicesAPI } from '../api/client';
import { Briefcase, Users, TrendingUp, Activity, Inbox, PieChart } from 'lucide-react';
import Button from '../components/common/Button';
import { PageLoader } from '../components/common/LoadingSpinner';

export default function DashboardPage() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [services, setServices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Load analytics and services in parallel
      const [analyticsRes, servicesRes] = await Promise.allSettled([
        servicesAPI.getAnalytics(),
        servicesAPI.filter({ page: 1, page_size: 100 })
      ]);
      
      // Handle analytics response
      if (analyticsRes.status === 'fulfilled') {
        setAnalytics(analyticsRes.value.data);
      } else {
        console.error('Failed to load analytics:', analyticsRes.reason);
        setAnalytics({
          total_services: 0,
          active_services: 0,
          completed_services: 0,
          on_hold_services: 0,
          draft_services: 0,
          total_contract_value: 0,
          total_resources: 0,
          new_customers: 0,
          existing_customers: 0,
          services_by_status: {},
          services_by_sector: {},
          services_by_category: {},
        });
      }
      
      // Handle services response
      if (servicesRes.status === 'fulfilled') {
        setServices(servicesRes.value.data.data || []);
      } else {
        console.error('Failed to load services:', servicesRes.reason);
        setServices([]);
      }
    } catch (err) {
      console.error('Failed to load data:', err);
      setAnalytics(null);
      setServices([]);
    } finally {
      setIsLoading(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, suffix = '', description, color = 'primary' }) => (
    <div className="glass-card p-6 hover:border-dark-600/50 transition-all duration-300 group">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-400 mb-1">{title}</p>
          <p className="text-3xl font-bold text-white">{value}{suffix}</p>
          {description && <p className="text-xs text-slate-500 mt-2">{description}</p>}
        </div>
        <div className={`w-12 h-12 rounded-xl bg-${color}-500/10 flex items-center justify-center group-hover:bg-${color}-500/20 transition-colors`}>
          <Icon className={`w-6 h-6 text-${color}-400`} />
        </div>
      </div>
    </div>
  );

  const formatCurrency = (value) => {
    if (!value) return '$0';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
  };

  // Pie chart component
  const PieChartComponent = ({ data, title }) => {
    const total = Object.values(data).reduce((a, b) => a + b, 0);
    if (total === 0) return null;
    
    const colors = {
      active: '#10b981',
      completed: '#3b82f6',
      on_hold: '#f59e0b',
      draft: '#6b7280',
      cancelled: '#ef4444',
    };
    
    let currentAngle = 0;
    const segments = Object.entries(data).map(([key, value]) => {
      const percentage = (value / total) * 100;
      const angle = (value / total) * 360;
      const startAngle = currentAngle;
      currentAngle += angle;
      
      const startRad = (startAngle - 90) * Math.PI / 180;
      const endRad = (currentAngle - 90) * Math.PI / 180;
      
      const x1 = 50 + 40 * Math.cos(startRad);
      const y1 = 50 + 40 * Math.sin(startRad);
      const x2 = 50 + 40 * Math.cos(endRad);
      const y2 = 50 + 40 * Math.sin(endRad);
      
      const largeArc = angle > 180 ? 1 : 0;
      
      return {
        key,
        value,
        percentage,
        color: colors[key] || '#6b7280',
        path: `M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`
      };
    }).filter(s => s.value > 0);

    return (
      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <PieChart className="w-5 h-5 text-primary-400" />
          {title}
        </h2>
        <div className="flex items-center gap-6">
          <svg viewBox="0 0 100 100" className="w-32 h-32">
            {segments.map((seg, i) => (
              <path key={i} d={seg.path} fill={seg.color} className="hover:opacity-80 transition-opacity cursor-pointer" />
            ))}
            <circle cx="50" cy="50" r="20" fill="#1a2038" />
            <text x="50" y="50" textAnchor="middle" dy="0.3em" className="fill-white text-xs font-bold">{total}</text>
          </svg>
          <div className="flex-1 space-y-2">
            {segments.map((seg) => (
              <div key={seg.key} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: seg.color }} />
                  <span className="text-slate-400 capitalize">{seg.key.replace('_', ' ')}</span>
                </div>
                <span className="text-white font-medium">{seg.value} ({seg.percentage.toFixed(0)}%)</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Resource breakdown by service
  const ResourceBreakdown = ({ services }) => {
    const servicesWithResources = services.filter(s => s.resource_count > 0);
    const totalResources = servicesWithResources.reduce((sum, s) => sum + (s.resource_count || 0), 0);
    
    if (servicesWithResources.length === 0) {
      return (
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-primary-400" />
            Resource Breakdown by Project
          </h2>
          <p className="text-slate-500 text-sm">No resources allocated yet</p>
        </div>
      );
    }

    return (
      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-primary-400" />
          Resource Breakdown by Project
        </h2>
        <div className="space-y-3">
          {servicesWithResources.slice(0, 8).map((service) => {
            const percentage = totalResources > 0 ? (service.resource_count / totalResources) * 100 : 0;
            return (
              <div key={service.id}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-slate-300 truncate max-w-[200px]">{service.name}</span>
                  <span className="text-white font-medium">{service.resource_count} ({percentage.toFixed(0)}%)</span>
                </div>
                <div className="w-full h-2 bg-dark-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-primary-500 to-accent-500 rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-4 pt-4 border-t border-dark-700/50 flex justify-between text-sm">
          <span className="text-slate-400">Total Resources</span>
          <span className="text-white font-bold">{totalResources}</span>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return <PageLoader text="Loading dashboard..." />;
  }

  const hasData = analytics && analytics.total_services > 0;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Welcome back, {user?.full_name || user?.username}
          </h1>
          <p className="text-slate-400 mt-1">
            {hasData ? "Here's your organization overview" : "Get started by adding your first service"}
          </p>
        </div>
      </div>

      {hasData ? (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Services"
              value={analytics.total_services}
              icon={Briefcase}
              description={`${analytics.active_services} active`}
            />
            <StatCard
              title="Active Services"
              value={analytics.active_services}
              icon={Activity}
              description={`${analytics.on_hold_services || 0} on hold`}
            />
            <StatCard
              title="Total Resources"
              value={analytics.total_resources}
              icon={Users}
              description="Across all services"
            />
            <StatCard
              title="Contract Value"
              value={formatCurrency(analytics.total_contract_value)}
              icon={TrendingUp}
              description="Total portfolio value"
            />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pie Chart - Services by Status */}
            <PieChartComponent 
              data={analytics.services_by_status || {}} 
              title="Services by Status"
            />
            
            {/* Resource Breakdown */}
            <ResourceBreakdown services={services} />
          </div>

          {/* Additional Info */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Services by Sector */}
            <div className="glass-card p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Services by Sector</h2>
              {Object.keys(analytics.services_by_sector || {}).length > 0 ? (
                <div className="space-y-3">
                  {Object.entries(analytics.services_by_sector).map(([sector, count]) => (
                    <div key={sector} className="flex items-center justify-between">
                      <span className="text-sm text-slate-400">{sector}</span>
                      <span className="text-sm font-medium text-white">{count}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500">No sector data available</p>
              )}
            </div>

            {/* Customer Breakdown */}
            <div className="glass-card p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Customer Breakdown</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">New Customers</span>
                  <span className="text-sm font-medium text-emerald-400">{analytics.new_customers}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">Existing Customers</span>
                  <span className="text-sm font-medium text-blue-400">{analytics.existing_customers}</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="glass-card p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
              <div className="space-y-2">
                <Button variant="primary" className="w-full justify-start" onClick={() => window.location.href = '/services'}>
                  <Briefcase className="w-4 h-4 mr-2" /> View All Services
                </Button>
                <Button variant="secondary" className="w-full justify-start" onClick={() => window.location.href = '/services'}>
                  <Activity className="w-4 h-4 mr-2" /> Add New Service
                </Button>
              </div>
            </div>
          </div>
        </>
      ) : (
        /* Empty State */
        <div className="glass-card p-12 text-center">
          <Inbox className="w-20 h-20 text-slate-600 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-white mb-3">Welcome to Tessolve Executive Portal</h2>
          <p className="text-slate-400 mb-8 max-w-lg mx-auto">
            Your dashboard will show analytics and insights once you start adding services. 
            Get started by creating your first service engagement.
          </p>
          <Button variant="primary" onClick={() => window.location.href = '/services'} leftIcon={<Briefcase className="w-4 h-4" />}>
            Go to Services
          </Button>
        </div>
      )}
    </div>
  );
}
