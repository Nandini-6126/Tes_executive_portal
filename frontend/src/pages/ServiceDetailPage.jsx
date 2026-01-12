import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Edit2, Save, X, Building2, Users, Calendar, 
  DollarSign, Briefcase, Tag, FileText, Loader2, Trash2
} from 'lucide-react';
import { servicesAPI, masterDataAPI } from '../api/client';
import { usePermissions } from '../hooks/usePermissions';
import Button from '../components/common/Button';
import { PageLoader } from '../components/common/LoadingSpinner';

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'active', label: 'Active' },
  { value: 'on_hold', label: 'On Hold' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const STATUS_COLORS = {
  active: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  completed: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  on_hold: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  draft: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  cancelled: 'bg-red-500/20 text-red-400 border-red-500/30',
};

export default function ServiceDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { canWriteServices, canDeleteServices } = usePermissions();
  
  const [service, setService] = useState(null);
  const [masterData, setMasterData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({});

  useEffect(() => {
    loadService();
    loadMasterData();
  }, [id]);

  const loadService = async () => {
    setIsLoading(true);
    try {
      const response = await servicesAPI.getById(id);
      setService(response.data);
      setFormData(response.data);
    } catch (err) {
      console.error('Failed to load service:', err);
      setError('Failed to load service details');
    } finally {
      setIsLoading(false);
    }
  };

  const loadMasterData = async () => {
    try {
      const response = await masterDataAPI.getAll();
      setMasterData(response.data);
    } catch (err) {
      console.error('Failed to load master data:', err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? null : Number(value)) : value,
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError('');
    try {
      const updateData = {
        name: formData.name,
        description: formData.description,
        notes: formData.notes,
        customer_name: formData.customer_name,
        customer_contact: formData.customer_contact,
        customer_email: formData.customer_email,
        status: formData.status,
        engagement_model_id: formData.engagement_model_id ? parseInt(formData.engagement_model_id) : null,
        service_category_id: formData.service_category_id ? parseInt(formData.service_category_id) : null,
        sector_id: formData.sector_id ? parseInt(formData.sector_id) : null,
        department_id: formData.department_id ? parseInt(formData.department_id) : null,
        contract_value: formData.contract_value ? parseFloat(formData.contract_value) : null,
        capex: formData.capex ? parseFloat(formData.capex) : null,
        opex: formData.opex ? parseFloat(formData.opex) : null,
        resource_count: formData.resource_count ? parseInt(formData.resource_count) : 0,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
      };
      
      await servicesAPI.update(id, updateData);
      await loadService();
      setIsEditing(false);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to update service');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this service?')) return;
    try {
      await servicesAPI.delete(id);
      navigate('/services');
    } catch (err) {
      setError('Failed to delete service');
    }
  };

  const handleCancel = () => {
    setFormData(service);
    setIsEditing(false);
    setError('');
  };

  const formatCurrency = (value, currency = 'USD') => {
    if (!value) return '-';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: 0 }).format(value);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  if (isLoading) {
    return <PageLoader text="Loading service details..." />;
  }

  if (!service) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400">Service not found</p>
        <Button variant="secondary" onClick={() => navigate('/services')} className="mt-4">
          Back to Services
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/services')}
            className="p-2 text-slate-400 hover:text-white hover:bg-dark-800/50 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">{service.name}</h1>
            <p className="text-slate-400 mt-1 flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              {service.customer_name}
              <span className={`ml-2 px-2 py-0.5 text-xs rounded-full border ${STATUS_COLORS[service.status]}`}>
                {service.status}
              </span>
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {canWriteServices && !isEditing && (
            <Button variant="primary" onClick={() => setIsEditing(true)} leftIcon={<Edit2 className="w-4 h-4" />}>
              Edit Service
            </Button>
          )}
          {canDeleteServices && !isEditing && (
            <Button variant="danger" onClick={handleDelete} leftIcon={<Trash2 className="w-4 h-4" />}>
              Delete
            </Button>
          )}
          {isEditing && (
            <>
              <Button variant="secondary" onClick={handleCancel} leftIcon={<X className="w-4 h-4" />}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSave} isLoading={isSaving} leftIcon={<Save className="w-4 h-4" />}>
                Save Changes
              </Button>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <div className="glass-card p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-primary-400" />
              Basic Information
            </h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm text-slate-400 mb-1">Service Name</label>
                {isEditing ? (
                  <input type="text" name="name" value={formData.name || ''} onChange={handleInputChange} className="input" />
                ) : (
                  <p className="text-white">{service.name}</p>
                )}
              </div>
              
              <div className="col-span-2">
                <label className="block text-sm text-slate-400 mb-1">Description</label>
                {isEditing ? (
                  <textarea name="description" value={formData.description || ''} onChange={handleInputChange} className="input min-h-[80px]" />
                ) : (
                  <p className="text-slate-300">{service.description || '-'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1">Status</label>
                {isEditing ? (
                  <select name="status" value={formData.status || ''} onChange={handleInputChange} className="select">
                    {STATUS_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                ) : (
                  <span className={`inline-flex px-2.5 py-1 text-xs rounded-full border ${STATUS_COLORS[service.status]}`}>
                    {service.status}
                  </span>
                )}
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1">Customer Type</label>
                <span className={`inline-flex px-2.5 py-1 text-xs rounded-full border ${service.customer_type === 'new' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-blue-500/20 text-blue-400 border-blue-500/30'}`}>
                  {service.customer_type === 'new' ? 'New Customer' : 'Existing Customer'}
                </span>
              </div>
            </div>
          </div>

          {/* Customer Info */}
          <div className="glass-card p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary-400" />
              Customer Information
            </h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Customer Name</label>
                {isEditing ? (
                  <input type="text" name="customer_name" value={formData.customer_name || ''} onChange={handleInputChange} className="input" />
                ) : (
                  <p className="text-white">{service.customer_name}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm text-slate-400 mb-1">Contact Person</label>
                {isEditing ? (
                  <input type="text" name="customer_contact" value={formData.customer_contact || ''} onChange={handleInputChange} className="input" />
                ) : (
                  <p className="text-slate-300">{service.customer_contact || '-'}</p>
                )}
              </div>
              
              <div className="col-span-2">
                <label className="block text-sm text-slate-400 mb-1">Contact Email</label>
                {isEditing ? (
                  <input type="email" name="customer_email" value={formData.customer_email || ''} onChange={handleInputChange} className="input" />
                ) : (
                  <p className="text-slate-300">{service.customer_email || '-'}</p>
                )}
              </div>
            </div>
          </div>

          {/* Service Configuration */}
          <div className="glass-card p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Tag className="w-5 h-5 text-primary-400" />
              Service Configuration
            </h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Engagement Model</label>
                {isEditing ? (
                  <select name="engagement_model_id" value={formData.engagement_model_id || ''} onChange={handleInputChange} className="select">
                    <option value="">Select Model</option>
                    {masterData?.engagement_models?.map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                ) : (
                  <p className="text-white">{service.engagement_model_name || '-'}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm text-slate-400 mb-1">Service Category</label>
                {isEditing ? (
                  <select name="service_category_id" value={formData.service_category_id || ''} onChange={handleInputChange} className="select">
                    <option value="">Select Category</option>
                    {masterData?.service_categories?.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                ) : (
                  <p className="text-white">{service.service_category_name || '-'}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm text-slate-400 mb-1">Sector</label>
                {isEditing ? (
                  <select name="sector_id" value={formData.sector_id || ''} onChange={handleInputChange} className="select">
                    <option value="">Select Sector</option>
                    {masterData?.sectors?.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                ) : (
                  <p className="text-white">{service.sector_name || '-'}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm text-slate-400 mb-1">Department</label>
                {isEditing ? (
                  <select name="department_id" value={formData.department_id || ''} onChange={handleInputChange} className="select">
                    <option value="">Select Department</option>
                    {masterData?.departments?.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                ) : (
                  <p className="text-white">{service.department_name || '-'}</p>
                )}
              </div>
            </div>

            {/* Technologies */}
            <div className="mt-4">
              <label className="block text-sm text-slate-400 mb-2">Technologies</label>
              <div className="flex flex-wrap gap-2">
                {service.technology_names?.length > 0 ? (
                  service.technology_names.map((tech) => (
                    <span key={tech} className="px-3 py-1 text-sm bg-accent-500/10 text-accent-400 border border-accent-500/30 rounded-lg">
                      {tech}
                    </span>
                  ))
                ) : (
                  <span className="text-slate-500">No technologies assigned</span>
                )}
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="glass-card p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary-400" />
              Notes
            </h2>
            {isEditing ? (
              <textarea 
                name="notes" 
                value={formData.notes || ''} 
                onChange={handleInputChange} 
                className="input min-h-[120px]" 
                placeholder="Add notes about this service..."
              />
            ) : (
              <p className="text-slate-300 whitespace-pre-wrap">{service.notes || 'No notes added'}</p>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Financial Summary */}
          <div className="glass-card p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-primary-400" />
              Financial Details
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Contract Value</label>
                {isEditing ? (
                  <input type="number" name="contract_value" value={formData.contract_value || ''} onChange={handleInputChange} className="input" placeholder="0.00" min="0" step="0.01" />
                ) : (
                  <p className="text-2xl font-bold text-white">{formatCurrency(service.contract_value, service.currency)}</p>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">CAPEX</label>
                  {isEditing ? (
                    <input type="number" name="capex" value={formData.capex || ''} onChange={handleInputChange} className="input" placeholder="0.00" min="0" step="0.01" />
                  ) : (
                    <p className="text-lg font-semibold text-emerald-400">{formatCurrency(service.capex, service.currency)}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm text-slate-400 mb-1">OPEX</label>
                  {isEditing ? (
                    <input type="number" name="opex" value={formData.opex || ''} onChange={handleInputChange} className="input" placeholder="0.00" min="0" step="0.01" />
                  ) : (
                    <p className="text-lg font-semibold text-blue-400">{formatCurrency(service.opex, service.currency)}</p>
                  )}
                </div>
              </div>

              {isEditing && (
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Currency</label>
                  <select name="currency" value={formData.currency || 'USD'} onChange={handleInputChange} className="select">
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                    <option value="INR">INR</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Resources */}
          <div className="glass-card p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-primary-400" />
              Resources
            </h2>
            
            <div>
              <label className="block text-sm text-slate-400 mb-1">Resource Count</label>
              {isEditing ? (
                <input type="number" name="resource_count" value={formData.resource_count || 0} onChange={handleInputChange} className="input" min="0" />
              ) : (
                <p className="text-2xl font-bold text-white">{service.resource_count || 0}</p>
              )}
            </div>
          </div>

          {/* Timeline */}
          <div className="glass-card p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary-400" />
              Timeline
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Start Date</label>
                {isEditing ? (
                  <input type="date" name="start_date" value={formData.start_date || ''} onChange={handleInputChange} className="input" />
                ) : (
                  <p className="text-white">{formatDate(service.start_date)}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm text-slate-400 mb-1">End Date</label>
                {isEditing ? (
                  <input type="date" name="end_date" value={formData.end_date || ''} onChange={handleInputChange} className="input" />
                ) : (
                  <p className="text-white">{formatDate(service.end_date)}</p>
                )}
              </div>
            </div>
          </div>

          {/* Manager Info */}
          <div className="glass-card p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Manager</h2>
            <p className="text-white">{service.manager_name || 'Not assigned'}</p>
            <p className="text-xs text-slate-500 mt-2">
              Created: {formatDate(service.created_at)}
            </p>
            {service.updated_at && (
              <p className="text-xs text-slate-500">
                Updated: {formatDate(service.updated_at)}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
