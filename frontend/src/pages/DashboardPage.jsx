import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { dashboardAPI } from '../api/client';
import { 
  Briefcase, Users, TrendingUp, Activity, DollarSign, Clock, 
  AlertTriangle, CheckCircle, Target, ArrowUpRight, ArrowDownRight,
  Building2, Zap, FileText, Calendar, ChevronRight, PieChart
} from 'lucide-react';
import Button from '../components/common/Button';
import { PageLoader } from '../components/common/LoadingSpinner';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isLightTheme } = useSettings();
  const isLight = isLightTheme;
  
  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setIsLoading(true);
    try {
      const response = await dashboardAPI.getAnalytics();
      setAnalytics(response.data);
    } catch (err) {
      console.error('Failed to load analytics:', err);
      // Set default empty state
      setAnalytics(null);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value) => {
    if (!value) return '$0';
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD', 
      minimumFractionDigits: 0, 
      maximumFractionDigits: 0 
    }).format(value);
  };

  const formatNumber = (value) => {
    return new Intl.NumberFormat('en-US').format(value || 0);
  };

  const StatCard = ({ title, value, subtitle, icon: Icon, trend, trendUp, color = 'primary', onClick }) => (
    <div 
      onClick={onClick}
      className={`p-6 rounded-xl transition-all ${onClick ? 'cursor-pointer hover:scale-105' : ''} ${
        isLight ? 'bg-white shadow-md hover:shadow-lg' : 'bg-slate-800/50 border border-slate-700/50 hover:border-slate-600/50'
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className={`text-sm ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>{title}</p>
          <p className={`text-3xl font-bold mt-1 ${isLight ? 'text-gray-800' : 'text-white'}`}>{value}</p>
          {subtitle && <p className={`text-xs mt-1 ${isLight ? 'text-gray-400' : 'text-slate-500'}`}>{subtitle}</p>}
          {trend !== undefined && (
            <div className={`flex items-center gap-1 mt-2 text-sm ${trendUp ? 'text-green-500' : 'text-red-500'}`}>
              {trendUp ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
              <span>{trend}%</span>
            </div>
          )}
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-${color}-500/10`}>
          <Icon className={`w-6 h-6 text-${color}-500`} />
        </div>
      </div>
    </div>
  );

  // Mini chart for revenue by month
  const MiniBarChart = ({ data }) => {
    if (!data || data.length === 0) return null;
    const maxValue = Math.max(...data.map(d => d.value), 1);
    
    return (
      <div className="flex items-end gap-1 h-16">
        {data.map((item, idx) => (
          <div key={idx} className="flex flex-col items-center flex-1">
            <div 
              className="w-full bg-primary-500/60 rounded-t transition-all hover:bg-primary-500"
              style={{ height: `${(item.value / maxValue) * 100}%`, minHeight: '4px' }}
            />
            <span className={`text-[10px] mt-1 ${isLight ? 'text-gray-400' : 'text-slate-500'}`}>
              {item.month?.split(' ')[0]}
            </span>
          </div>
        ))}
      </div>
    );
  };

  // Donut chart component
  const DonutChart = ({ data, title, colors }) => {
    const total = Object.values(data).reduce((a, b) => a + b, 0);
    if (total === 0) return null;
    
    const defaultColors = ['#10b981', '#3b82f6', '#f59e0b', '#6b7280', '#ef4444', '#8b5cf6'];
    const chartColors = colors || defaultColors;
    
    let currentAngle = 0;
    const segments = Object.entries(data).filter(([_, v]) => v > 0).map(([key, value], idx) => {
      const percentage = (value / total) * 100;
      const angle = (value / total) * 360;
      const startAngle = currentAngle;
      currentAngle += angle;
      
      const startRad = (startAngle - 90) * Math.PI / 180;
      const endRad = (currentAngle - 90) * Math.PI / 180;
      
      const x1 = 50 + 35 * Math.cos(startRad);
      const y1 = 50 + 35 * Math.sin(startRad);
      const x2 = 50 + 35 * Math.cos(endRad);
      const y2 = 50 + 35 * Math.sin(endRad);
      
      const largeArc = angle > 180 ? 1 : 0;
      
      return {
        key: key.replace(/_/g, ' '),
        value,
        percentage,
        color: chartColors[idx % chartColors.length],
        path: angle >= 360 
          ? `M 50 15 A 35 35 0 1 1 49.99 15` 
          : `M 50 50 L ${x1} ${y1} A 35 35 0 ${largeArc} 1 ${x2} ${y2} Z`
      };
    });

    return (
      <div className={`p-6 rounded-xl ${isLight ? 'bg-white shadow-md' : 'bg-slate-800/50 border border-slate-700/50'}`}>
        <h3 className={`text-sm font-medium mb-4 ${isLight ? 'text-gray-700' : 'text-slate-300'}`}>{title}</h3>
        <div className="flex items-center gap-4">
          <svg viewBox="0 0 100 100" className="w-24 h-24">
            {segments.map((seg, i) => (
              <path key={i} d={seg.path} fill={seg.color} className="hover:opacity-80 transition-opacity" />
            ))}
            <circle cx="50" cy="50" r="18" fill={isLight ? '#fff' : '#1e293b'} />
            <text x="50" y="50" textAnchor="middle" dy="0.3em" className={`text-xs font-bold ${isLight ? 'fill-gray-800' : 'fill-white'}`}>
              {total}
            </text>
          </svg>
          <div className="flex-1 space-y-1">
            {segments.slice(0, 5).map((seg) => (
              <div key={seg.key} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: seg.color }} />
                  <span className={`capitalize ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>{seg.key}</span>
                </div>
                <span className={isLight ? 'text-gray-800' : 'text-white'}>{seg.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return <PageLoader text="Loading dashboard..." />;
  }

  const hasData = analytics && (analytics.services?.total > 0 || analytics.employees?.total > 0);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-bold ${isLight ? 'text-gray-800' : 'text-white'}`}>
            Welcome back, {user?.full_name || user?.username}
          </h1>
          <p className={`mt-1 ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>
            {hasData ? "Here's your organization overview" : "Get started by adding your first data"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => navigate('/inquiries')} leftIcon={<FileText className="w-4 h-4" />}>
            New Inquiry
          </Button>
          <Button variant="primary" onClick={() => navigate('/clients')} leftIcon={<Building2 className="w-4 h-4" />}>
            Add Client
          </Button>
        </div>
      </div>

      {hasData ? (
        <>
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <StatCard
              title="Total Revenue"
              value={formatCurrency(analytics.revenue?.total_contract_value)}
              icon={DollarSign}
              color="green"
              onClick={() => navigate('/clients')}
            />
            <StatCard
              title="Active Services"
              value={analytics.services?.active || 0}
              subtitle={`of ${analytics.services?.total || 0} total`}
              icon={Briefcase}
              color="blue"
              onClick={() => navigate('/services')}
            />
            <StatCard
              title="Team Members"
              value={analytics.employees?.total || 0}
              subtitle={`${analytics.employees?.available || 0} available`}
              icon={Users}
              color="purple"
              onClick={() => navigate('/employees')}
            />
            <StatCard
              title="Pending Tasks"
              value={analytics.tasks?.pending || 0}
              subtitle={`${analytics.tasks?.overdue || 0} overdue`}
              icon={Target}
              color="orange"
              onClick={() => navigate('/task-pilot')}
            />
            <StatCard
              title="Open Inquiries"
              value={(analytics.inquiries?.new || 0) + (analytics.inquiries?.in_progress || 0)}
              subtitle={`${analytics.inquiries?.conversion_rate || 0}% conversion`}
              icon={FileText}
              color="cyan"
              onClick={() => navigate('/inquiries')}
            />
            <StatCard
              title="Avg Utilization"
              value={`${Math.round(analytics.employees?.average_workload || 0)}%`}
              subtitle={`${analytics.employees?.overloaded_count || 0} overloaded`}
              icon={Activity}
              color="pink"
            />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Revenue Trend */}
            <div className={`p-6 rounded-xl ${isLight ? 'bg-white shadow-md' : 'bg-slate-800/50 border border-slate-700/50'}`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-sm font-medium ${isLight ? 'text-gray-700' : 'text-slate-300'}`}>
                  Revenue Trend (6 months)
                </h3>
                <TrendingUp className={`w-4 h-4 ${isLight ? 'text-gray-400' : 'text-slate-500'}`} />
              </div>
              <MiniBarChart data={analytics.revenue?.by_month || []} />
              <div className="mt-4 pt-4 border-t border-dashed" style={{ borderColor: isLight ? '#e5e7eb' : '#374151' }}>
                <div className="flex justify-between text-sm">
                  <span className={isLight ? 'text-gray-500' : 'text-slate-400'}>Active Revenue</span>
                  <span className={`font-semibold ${isLight ? 'text-gray-800' : 'text-white'}`}>
                    {formatCurrency(analytics.revenue?.active_revenue)}
                  </span>
                </div>
              </div>
            </div>

            {/* Services by Status */}
            <DonutChart
              data={analytics.services?.by_status || {}}
              title="Services by Status"
              colors={['#10b981', '#3b82f6', '#f59e0b', '#6b7280', '#ef4444']}
            />

            {/* Inquiries Pipeline */}
            <DonutChart
              data={analytics.inquiries?.by_status || {}}
              title="Inquiries Pipeline"
              colors={['#8b5cf6', '#06b6d4', '#f59e0b', '#3b82f6', '#10b981', '#ef4444', '#6b7280']}
            />
          </div>

          {/* Employee Workload & Deadlines */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Employee Workload */}
            <div className={`p-6 rounded-xl ${isLight ? 'bg-white shadow-md' : 'bg-slate-800/50 border border-slate-700/50'}`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-sm font-medium ${isLight ? 'text-gray-700' : 'text-slate-300'}`}>
                  Team Workload
                </h3>
                <Button variant="ghost" size="sm" onClick={() => navigate('/employees')}>
                  View All <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
              <div className="space-y-3">
                {(analytics.employees?.workload_distribution || []).slice(0, 5).map((emp, idx) => (
                  <div key={idx}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className={isLight ? 'text-gray-600' : 'text-slate-300'}>{emp.name}</span>
                      <span className={`font-medium ${
                        emp.workload >= 100 ? 'text-red-500' :
                        emp.workload >= 80 ? 'text-orange-500' : 
                        isLight ? 'text-gray-800' : 'text-white'
                      }`}>
                        {emp.workload}%
                      </span>
                    </div>
                    <div className={`h-2 rounded-full ${isLight ? 'bg-gray-100' : 'bg-slate-700'}`}>
                      <div
                        className={`h-full rounded-full transition-all ${
                          emp.workload >= 100 ? 'bg-red-500' :
                          emp.workload >= 80 ? 'bg-orange-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(100, emp.workload)}%` }}
                      />
                    </div>
                  </div>
                ))}
                {(!analytics.employees?.workload_distribution || analytics.employees.workload_distribution.length === 0) && (
                  <p className={`text-sm ${isLight ? 'text-gray-500' : 'text-slate-500'}`}>No employees yet</p>
                )}
              </div>
            </div>

            {/* Upcoming Deadlines */}
            <div className={`p-6 rounded-xl ${isLight ? 'bg-white shadow-md' : 'bg-slate-800/50 border border-slate-700/50'}`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-sm font-medium ${isLight ? 'text-gray-700' : 'text-slate-300'}`}>
                  Upcoming Deadlines
                </h3>
                <Button variant="ghost" size="sm" onClick={() => navigate('/task-pilot')}>
                  View All <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
              <div className="space-y-3">
                {(analytics.upcoming_deadlines || []).map((deadline, idx) => (
                  <div 
                    key={idx}
                    className={`p-3 rounded-lg ${isLight ? 'bg-gray-50' : 'bg-slate-700/50'}`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className={`font-medium text-sm ${isLight ? 'text-gray-800' : 'text-white'}`}>
                          {deadline.title}
                        </p>
                        <p className={`text-xs ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>
                          {deadline.service_name}
                        </p>
                      </div>
                      <div className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs ${
                        deadline.days_left <= 2 ? 'bg-red-500/20 text-red-400' :
                        deadline.days_left <= 7 ? 'bg-orange-500/20 text-orange-400' :
                        'bg-green-500/20 text-green-400'
                      }`}>
                        <Calendar className="w-3 h-3" />
                        {deadline.days_left === 0 ? 'Today' : 
                         deadline.days_left === 1 ? 'Tomorrow' : 
                         `${deadline.days_left} days`}
                      </div>
                    </div>
                  </div>
                ))}
                {(!analytics.upcoming_deadlines || analytics.upcoming_deadlines.length === 0) && (
                  <p className={`text-sm ${isLight ? 'text-gray-500' : 'text-slate-500'}`}>No upcoming deadlines</p>
                )}
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className={`p-6 rounded-xl ${isLight ? 'bg-white shadow-md' : 'bg-slate-800/50 border border-slate-700/50'}`}>
            <h3 className={`text-sm font-medium mb-4 ${isLight ? 'text-gray-700' : 'text-slate-300'}`}>
              Recent Activity
            </h3>
            <div className="space-y-3">
              {(analytics.recent_activities || []).map((activity, idx) => (
                <div 
                  key={idx}
                  className={`flex items-center gap-4 p-3 rounded-lg ${isLight ? 'bg-gray-50' : 'bg-slate-700/30'}`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    activity.type === 'service' ? 'bg-blue-500/20' :
                    activity.type === 'inquiry' ? 'bg-purple-500/20' :
                    activity.type === 'task' ? 'bg-orange-500/20' : 'bg-green-500/20'
                  }`}>
                    {activity.type === 'service' && <Briefcase className="w-5 h-5 text-blue-500" />}
                    {activity.type === 'inquiry' && <FileText className="w-5 h-5 text-purple-500" />}
                    {activity.type === 'task' && <Target className="w-5 h-5 text-orange-500" />}
                    {activity.type === 'employee' && <Users className="w-5 h-5 text-green-500" />}
                  </div>
                  <div className="flex-1">
                    <p className={`font-medium text-sm ${isLight ? 'text-gray-800' : 'text-white'}`}>
                      {activity.title}
                    </p>
                    <p className={`text-xs ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>
                      {activity.description}
                    </p>
                  </div>
                  <span className={`text-xs ${isLight ? 'text-gray-400' : 'text-slate-500'}`}>
                    {new Date(activity.timestamp).toLocaleDateString()}
                  </span>
                </div>
              ))}
              {(!analytics.recent_activities || analytics.recent_activities.length === 0) && (
                <p className={`text-sm ${isLight ? 'text-gray-500' : 'text-slate-500'}`}>No recent activity</p>
              )}
            </div>
          </div>
        </>
      ) : (
        /* Empty State */
        <div className={`p-12 text-center rounded-xl ${isLight ? 'bg-white shadow-md' : 'bg-slate-800/50 border border-slate-700/50'}`}>
          <PieChart className={`w-20 h-20 mx-auto mb-6 ${isLight ? 'text-gray-300' : 'text-slate-600'}`} />
          <h2 className={`text-2xl font-bold mb-3 ${isLight ? 'text-gray-800' : 'text-white'}`}>
            Welcome to Your Executive Portal
          </h2>
          <p className={`mb-8 max-w-lg mx-auto ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>
            Your dashboard will show comprehensive analytics once you start adding data. 
            Get started by adding clients, employees, or tracking new inquiries.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Button variant="primary" onClick={() => navigate('/clients')} leftIcon={<Building2 className="w-4 h-4" />}>
              Add Client
            </Button>
            <Button variant="secondary" onClick={() => navigate('/employees')} leftIcon={<Users className="w-4 h-4" />}>
              Add Employees
            </Button>
            <Button variant="secondary" onClick={() => navigate('/inquiries')} leftIcon={<FileText className="w-4 h-4" />}>
              Track Inquiry
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
