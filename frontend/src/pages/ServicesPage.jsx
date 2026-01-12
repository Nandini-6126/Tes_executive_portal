import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, Plus, Users, Building2, ExternalLink, Trash2, Inbox, FileText, ChevronDown, ChevronUp, Edit2, Eye } from 'lucide-react';
import { useFilters } from '../context/FilterContext';
import { usePermissions } from '../hooks/usePermissions';
import { servicesAPI, masterDataAPI } from '../api/client';
import FilterPanel from '../components/common/FilterPanel';
import Button from '../components/common/Button';
import { PageLoader } from '../components/common/LoadingSpinner';
import AddServiceModal from '../components/services/AddServiceModal';

const STATUS_BADGES = {
  active: 'badge-success',
  completed: 'badge-info',
  on_hold: 'badge-warning',
  draft: 'badge-neutral',
  cancelled: 'badge-error',
};

const STATUS_TABS = [
  { key: 'all', label: 'All Services' },
  { key: 'active', label: 'Ongoing' },
  { key: 'draft', label: 'Yet to Start' },
  { key: 'completed', label: 'Completed' },
  { key: 'on_hold', label: 'On Hold' },
];

export default function ServicesPage() {
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [masterData, setMasterData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFiltering, setIsFiltering] = useState(false);
  const [expandedNotes, setExpandedNotes] = useState({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [pagination, setPagination] = useState({ total: 0, page: 1, pageSize: 20, totalPages: 0 });
  
  const { servicesFilters, setServicesFilters, resetFilters } = useFilters();
  const { canWriteServices, canDeleteServices } = usePermissions();

  useEffect(() => {
    loadMasterData();
    loadServices();
  }, []);

  useEffect(() => {
    loadServices();
  }, [activeTab]);

  const loadMasterData = async () => {
    try {
      const response = await masterDataAPI.getAll();
      setMasterData(response.data);
    } catch (err) {
      console.error('Failed to load master data:', err);
    }
  };

  const loadServices = async (filters = {}) => {
    setIsLoading(true);
    try {
      const requestFilters = {
        page: 1,
        page_size: 50,
        sort_field: 'created_at',
        sort_direction: 'desc',
        ...filters,
      };
      
      // Apply status filter based on active tab - must be an array
      if (activeTab !== 'all') {
        requestFilters.status = [activeTab];
      }
      
      const response = await servicesAPI.filter(requestFilters);
      setServices(response.data.data || []);
      setPagination({
        total: response.data.total || 0,
        page: response.data.page || 1,
        pageSize: response.data.page_size || 50,
        totalPages: response.data.total_pages || 0,
      });
    } catch (err) {
      console.error('Failed to load services:', err);
      setServices([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyFilters = async () => {
    setIsFiltering(true);
    try {
      const filters = {};
      if (servicesFilters.search) filters.search = servicesFilters.search;
      if (servicesFilters.engagement_model_id) filters.engagement_model_id = parseInt(servicesFilters.engagement_model_id);
      if (servicesFilters.service_category_id) filters.service_category_id = parseInt(servicesFilters.service_category_id);
      if (servicesFilters.sector_id) filters.sector_id = parseInt(servicesFilters.sector_id);
      if (servicesFilters.technology_ids?.length) filters.technology_ids = servicesFilters.technology_ids;
      await loadServices(filters);
    } finally {
      setIsFiltering(false);
    }
  };

  const handleDeleteService = async (serviceId) => {
    try {
      await servicesAPI.delete(serviceId);
      setDeleteConfirm(null);
      loadServices();
    } catch (err) {
      console.error('Failed to delete service:', err);
      alert('Failed to delete service');
    }
  };

  const toggleNotes = (serviceId) => {
    setExpandedNotes(prev => ({ ...prev, [serviceId]: !prev[serviceId] }));
  };

  const formatCurrency = (v, currency = 'USD') => {
    if (!v) return '-';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: 0 }).format(v);
  };

  const canEditService = (service) => {
    // Can edit until completed
    return canWriteServices && service.status !== 'completed';
  };

  const canDeleteService = (service) => {
    // Can delete until completed
    return canDeleteServices && service.status !== 'completed';
  };

  const filterConfig = masterData ? [
    { key: 'engagement_model_id', label: 'Engagement Model', type: 'select', options: masterData.engagement_models?.map(m => ({ value: m.id, label: m.name })) || [] },
    { key: 'service_category_id', label: 'Service Category', type: 'select', options: masterData.service_categories?.map(c => ({ value: c.id, label: c.name })) || [] },
    { key: 'sector_id', label: 'Sector', type: 'select', options: masterData.sectors?.map(s => ({ value: s.id, label: s.name })) || [] },
    { key: 'technology_ids', label: 'Technologies', type: 'multiselect', options: masterData.technologies?.map(t => ({ value: t.id, label: t.name })) || [] },
  ] : [];

  // Get counts for tabs
  const getTabCount = (status) => {
    if (status === 'all') return services.length;
    return services.filter(s => s.status === status).length;
  };

  if (isLoading && services.length === 0) {
    return <PageLoader text="Loading services..." />;
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Briefcase className="w-7 h-7 text-primary-400" />Services
          </h1>
          <p className="text-slate-400 mt-1">Manage client engagements and service deliveries</p>
        </div>
        {canWriteServices && (
          <Button variant="primary" onClick={() => setShowAddModal(true)} leftIcon={<Plus className="w-4 h-4" />}>Add Service</Button>
        )}
      </div>

      {/* Status Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-dark-700/50 pb-4">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              activeTab === tab.key
                ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                : 'text-slate-400 hover:text-white hover:bg-dark-800/50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {masterData && (
        <FilterPanel
          filters={filterConfig}
          values={servicesFilters}
          onChange={setServicesFilters}
          onApply={handleApplyFilters}
          onReset={() => { resetFilters('services'); loadServices(); }}
          isLoading={isFiltering}
        />
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">
          Showing <span className="text-white font-medium">{services.length}</span> services
          {activeTab !== 'all' && <span className="text-slate-500"> ({activeTab.replace('_', ' ')})</span>}
        </p>
      </div>

      {services.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {services.map((service) => (
            <div key={service.id} className="glass-card hover:border-dark-600/50 transition-all group">
              <div className="p-6 border-b border-dark-700/50">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`badge ${STATUS_BADGES[service.status] || 'badge-neutral'}`}>{service.status?.replace('_', ' ')}</span>
                      {service.customer_type === 'new' && <span className="badge badge-info">New Client</span>}
                    </div>
                    <h3 className="text-lg font-semibold text-white group-hover:text-primary-400 transition-colors">{service.name}</h3>
                    <div className="flex items-center gap-2 mt-1 text-sm text-slate-400">
                      <Building2 className="w-4 h-4" />{service.customer_name}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => navigate(`/services/${service.id}`)}
                      className="p-2 text-slate-500 hover:text-primary-400 hover:bg-primary-500/10 rounded-lg transition-colors"
                      title="View details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    {canEditService(service) && (
                      <button
                        onClick={() => navigate(`/services/${service.id}`)}
                        className="p-2 text-slate-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                        title="Edit service"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}
                    {canDeleteService(service) && (
                      <button
                        onClick={() => setDeleteConfirm(service)}
                        className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Delete service"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Contract Value</p>
                    <p className="text-lg font-semibold text-white">{formatCurrency(service.contract_value, service.currency)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Resources</p>
                    <p className="text-lg font-semibold text-white flex items-center gap-1"><Users className="w-4 h-4 text-primary-400" />{service.resource_count || 0}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Sector</p>
                    <p className="text-sm text-white">{service.sector_name || '-'}</p>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {service.engagement_model_name && <span className="px-2 py-1 text-xs bg-dark-800/50 text-slate-300 rounded">{service.engagement_model_name}</span>}
                  {service.service_category_name && <span className="px-2 py-1 text-xs bg-dark-800/50 text-slate-300 rounded">{service.service_category_name}</span>}
                  {service.technology_names?.slice(0, 3).map((tech) => (
                    <span key={tech} className="px-2 py-1 text-xs bg-accent-500/10 text-accent-400 rounded">{tech}</span>
                  ))}
                  {service.technology_names?.length > 3 && <span className="px-2 py-1 text-xs text-slate-400">+{service.technology_names.length - 3}</span>}
                </div>

                {/* Notes Section */}
                {service.notes && (
                  <div className="pt-2">
                    <button 
                      onClick={() => toggleNotes(service.id)}
                      className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
                    >
                      <FileText className="w-4 h-4" />
                      <span>Notes</span>
                      {expandedNotes[service.id] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    {expandedNotes[service.id] && (
                      <div className="mt-2 p-3 bg-dark-800/30 rounded-lg text-sm text-slate-300">
                        {service.notes}
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              <div className="px-6 py-4 bg-dark-800/30 border-t border-dark-700/50 flex items-center justify-between">
                <span className="text-xs text-slate-500">Manager: {service.manager_name || '-'}</span>
                <button 
                  onClick={() => navigate(`/services/${service.id}`)}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs text-primary-400 hover:bg-primary-500/10 rounded-lg transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />Details
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-card p-12 text-center">
          <Inbox className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-white mb-2">
            {activeTab === 'all' ? 'No services yet' : `No ${activeTab.replace('_', ' ')} services`}
          </h3>
          <p className="text-slate-400 mb-6 max-w-md mx-auto">
            {activeTab === 'all' 
              ? 'Get started by adding your first service. You can add services for new customers or existing customers.'
              : `There are no services with "${activeTab.replace('_', ' ')}" status.`}
          </p>
          {canWriteServices && activeTab === 'all' && (
            <Button variant="primary" onClick={() => setShowAddModal(true)} leftIcon={<Plus className="w-4 h-4" />}>
              Add Your First Service
            </Button>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)} />
          <div className="relative w-full max-w-md glass-panel p-6 animate-fadeIn">
            <h3 className="text-lg font-semibold text-white mb-2">Delete Service</h3>
            <p className="text-slate-400 mb-6">
              Are you sure you want to delete "<span className="text-white">{deleteConfirm.name}</span>"? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3">
              <Button variant="secondary" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
              <Button variant="danger" onClick={() => handleDeleteService(deleteConfirm.id)} leftIcon={<Trash2 className="w-4 h-4" />}>
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      <AddServiceModal 
        isOpen={showAddModal} 
        onClose={() => setShowAddModal(false)} 
        onSuccess={() => {
          setShowAddModal(false);
          setActiveTab('all');  // Reset to all services
          loadServices();  // Reload services list
        }} 
      />
    </div>
  );
}
