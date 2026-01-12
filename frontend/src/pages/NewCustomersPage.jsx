import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, Building2, ExternalLink, Calendar, DollarSign, Inbox } from 'lucide-react';
import { servicesAPI } from '../api/client';
import { PageLoader } from '../components/common/LoadingSpinner';

const STATUS_BADGES = {
  active: 'badge-success',
  completed: 'badge-info',
  on_hold: 'badge-warning',
  draft: 'badge-neutral',
  cancelled: 'badge-error',
};

export default function NewCustomersPage() {
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadNewCustomers();
  }, []);

  const loadNewCustomers = async () => {
    setIsLoading(true);
    try {
      const response = await servicesAPI.filter({
        page: 1,
        page_size: 100,
        customer_type: 'new',
        sort_field: 'created_at',
        sort_direction: 'desc',
      });
      setServices(response.data.data || []);
    } catch (err) {
      console.error('Failed to load new customers:', err);
      setServices([]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (v, currency = 'USD') => {
    if (!v) return '-';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: 0 }).format(v);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  if (isLoading) {
    return <PageLoader text="Loading new customers..." />;
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <UserPlus className="w-7 h-7 text-emerald-400" />
            New Customers
          </h1>
          <p className="text-slate-400 mt-1">Services for first-time customers</p>
        </div>
        <div className="glass-card px-4 py-2">
          <span className="text-slate-400 text-sm">Total New Customers: </span>
          <span className="text-white font-bold text-lg">{services.length}</span>
        </div>
      </div>

      {services.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {services.map((service) => (
            <div key={service.id} className="glass-card hover:border-emerald-500/30 transition-all group cursor-pointer" onClick={() => navigate(`/services/${service.id}`)}>
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <span className={`badge ${STATUS_BADGES[service.status] || 'badge-neutral'}`}>
                      {service.status?.replace('_', ' ')}
                    </span>
                    <h3 className="text-lg font-semibold text-white mt-2 group-hover:text-emerald-400 transition-colors">
                      {service.name}
                    </h3>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-emerald-400" />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Building2 className="w-4 h-4 text-slate-500" />
                    <span className="text-slate-300">{service.customer_name}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="w-4 h-4 text-slate-500" />
                    <span className="text-white font-medium">{formatCurrency(service.contract_value, service.currency)}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-slate-500" />
                    <span className="text-slate-400">Started: {formatDate(service.start_date)}</span>
                  </div>
                </div>

                {/* Technologies */}
                {service.technology_names?.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {service.technology_names.slice(0, 3).map((tech) => (
                      <span key={tech} className="px-2 py-1 text-xs bg-emerald-500/10 text-emerald-400 rounded">
                        {tech}
                      </span>
                    ))}
                    {service.technology_names.length > 3 && (
                      <span className="px-2 py-1 text-xs text-slate-500">+{service.technology_names.length - 3}</span>
                    )}
                  </div>
                )}
              </div>

              <div className="px-6 py-3 bg-dark-800/30 border-t border-dark-700/50 flex items-center justify-between">
                <span className="text-xs text-slate-500">{service.sector_name || 'No sector'}</span>
                <span className="flex items-center gap-1 text-xs text-emerald-400">
                  <ExternalLink className="w-3 h-3" /> View Details
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-card p-12 text-center">
          <Inbox className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-white mb-2">No New Customers Yet</h3>
          <p className="text-slate-400 mb-6 max-w-md mx-auto">
            When you add services for new customers, they will appear here.
          </p>
        </div>
      )}
    </div>
  );
}
