import { useState, useEffect } from 'react';
import { X, Plus, FileText, FolderPlus, Loader2 } from 'lucide-react';
import { servicesAPI, masterDataAPI } from '../../api/client';
import Button from '../common/Button';

export default function AddServiceModal({ isOpen, onClose, onSuccess }) {
  const [mode, setMode] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [masterData, setMasterData] = useState(null);
  const [customSkill, setCustomSkill] = useState('');
  const [customSkills, setCustomSkills] = useState([]);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    customer_name: '',
    customer_type: 'new',
    customer_contact: '',
    customer_email: '',
    status: 'draft',
    engagement_model_id: '',
    service_category_id: '',
    sector_id: '',
    department_id: '',
    contract_value: '',
    currency: 'USD',
    capex: '',
    opex: '',
    resource_count: 0,
    start_date: '',
    end_date: '',
    technology_ids: [],
    notes: '',
  });

  useEffect(() => {
    if (isOpen && !masterData) {
      loadMasterData();
    }
  }, [isOpen]);

  const loadMasterData = async () => {
    setIsLoading(true);
    try {
      const response = await masterDataAPI.getAll();
      setMasterData(response.data);
    } catch (err) {
      setError('Failed to load form options');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? '' : Number(value)) : value,
    }));
  };

  const handleTechnologyChange = (techId) => {
    setFormData(prev => ({
      ...prev,
      technology_ids: prev.technology_ids.includes(techId)
        ? prev.technology_ids.filter(id => id !== techId)
        : [...prev.technology_ids, techId],
    }));
  };

  const handleAddCustomSkill = () => {
    if (customSkill.trim() && !customSkills.includes(customSkill.trim())) {
      setCustomSkills(prev => [...prev, customSkill.trim()]);
      setCustomSkill('');
    }
  };

  const handleRemoveCustomSkill = (skill) => {
    setCustomSkills(prev => prev.filter(s => s !== skill));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSaving(true);

    try {
      // Validate required fields
      if (!formData.name.trim()) {
        setError('Service name is required');
        setIsSaving(false);
        return;
      }
      if (!formData.customer_name.trim()) {
        setError('Customer name is required');
        setIsSaving(false);
        return;
      }

      const submitData = {
        name: formData.name.trim(),
        description: formData.description?.trim() || null,
        customer_name: formData.customer_name.trim(),
        customer_type: mode === 'new' ? 'new' : 'existing',
        customer_contact: formData.customer_contact?.trim() || null,
        customer_email: formData.customer_email?.trim() || null,
        status: formData.status || 'draft',
        engagement_model_id: formData.engagement_model_id ? parseInt(formData.engagement_model_id) : null,
        service_category_id: formData.service_category_id ? parseInt(formData.service_category_id) : null,
        sector_id: formData.sector_id ? parseInt(formData.sector_id) : null,
        department_id: formData.department_id ? parseInt(formData.department_id) : null,
        contract_value: formData.contract_value ? parseFloat(formData.contract_value) : null,
        currency: formData.currency || 'USD',
        capex: formData.capex ? parseFloat(formData.capex) : null,
        opex: formData.opex ? parseFloat(formData.opex) : null,
        resource_count: parseInt(formData.resource_count) || 0,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        technology_ids: formData.technology_ids || [],
        notes: formData.notes?.trim() || null,
        // CTI field for notes
        cti_managerial_notes: customSkills.length > 0 ? `Additional Skills: ${customSkills.join(', ')}` : null,
      };

      console.log('Submitting service data:', submitData);
      
      const response = await servicesAPI.create(submitData);
      console.log('Service created successfully:', response.data);
      
      // Show success and close
      alert('Service created successfully!');
      onSuccess?.();
      handleClose();
    } catch (err) {
      console.error('Failed to create service:', err);
      const errorMessage = err.response?.data?.detail || 
                          err.response?.data?.message || 
                          err.response?.data?.error?.message || 
                          'Failed to create service. Please try again.';
      setError(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setMode(null);
    setCustomSkills([]);
    setCustomSkill('');
    setFormData({
      name: '',
      description: '',
      customer_name: '',
      customer_type: 'new',
      customer_contact: '',
      customer_email: '',
      status: 'draft',
      engagement_model_id: '',
      service_category_id: '',
      sector_id: '',
      department_id: '',
      contract_value: '',
      currency: 'USD',
      capex: '',
      opex: '',
      resource_count: 0,
      start_date: '',
      end_date: '',
      technology_ids: [],
      notes: '',
    });
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />
      
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-hidden glass-panel animate-fadeIn">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/50">
          <h2 className="text-xl font-semibold text-white">
            {mode === null ? 'Add Service' : mode === 'new' ? 'Add New Customer Service' : 'Add Existing Customer Service'}
          </h2>
          <button onClick={handleClose} className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/50">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {mode === null && (
            <div className="space-y-4">
              <p className="text-slate-400 mb-6">Choose the type of service you want to add:</p>
              
              <button onClick={() => setMode('new')} className="w-full p-6 glass-card hover:border-accent-500/50 transition-all group text-left">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center group-hover:bg-emerald-500/30 transition-colors">
                    <FolderPlus className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-white mb-1">New Customer Service</h3>
                    <p className="text-sm text-slate-400">Create a service for a new customer who is engaging with us for the first time.</p>
                  </div>
                </div>
              </button>
              
              <button onClick={() => setMode('existing')} className="w-full p-6 glass-card hover:border-accent-500/50 transition-all group text-left">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center group-hover:bg-blue-500/30 transition-colors">
                    <FileText className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-white mb-1">Existing Customer Service</h3>
                    <p className="text-sm text-slate-400">Create a service for an existing customer with whom we have prior engagements.</p>
                  </div>
                </div>
              </button>
            </div>
          )}

          {mode !== null && (
            <>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-accent-500 animate-spin" />
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {error && (
                    <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400">{error}</div>
                  )}

                  {/* Basic Info */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider">Basic Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-slate-300 mb-1">Service Name *</label>
                        <input type="text" name="name" value={formData.name} onChange={handleInputChange} className="input" placeholder="e.g., Cloud Migration Project" required />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-slate-300 mb-1">Description</label>
                        <textarea name="description" value={formData.description} onChange={handleInputChange} className="input min-h-[80px]" placeholder="Brief description of the service..." />
                      </div>
                    </div>
                  </div>

                  {/* Customer Info */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider">
                      Customer Information
                      <span className={`ml-2 px-2 py-0.5 text-xs rounded ${mode === 'new' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'}`}>
                        {mode === 'new' ? 'New Customer' : 'Existing Customer'}
                      </span>
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-slate-300 mb-1">Customer Name *</label>
                        <input type="text" name="customer_name" value={formData.customer_name} onChange={handleInputChange} className="input" placeholder="e.g., TechCorp Industries" required />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Contact Person</label>
                        <input type="text" name="customer_contact" value={formData.customer_contact} onChange={handleInputChange} className="input" placeholder="John Doe" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Contact Email</label>
                        <input type="email" name="customer_email" value={formData.customer_email} onChange={handleInputChange} className="input" placeholder="john@techcorp.com" />
                      </div>
                    </div>
                  </div>

                  {/* Service Details */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider">Service Details</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Engagement Model</label>
                        <select name="engagement_model_id" value={formData.engagement_model_id} onChange={handleInputChange} className="select">
                          <option value="">Select Model</option>
                          {masterData?.engagement_models?.map(m => (
                            <option key={m.id} value={m.id}>{m.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Service Category</label>
                        <select name="service_category_id" value={formData.service_category_id} onChange={handleInputChange} className="select">
                          <option value="">Select Category</option>
                          {masterData?.service_categories?.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Sector</label>
                        <select name="sector_id" value={formData.sector_id} onChange={handleInputChange} className="select">
                          <option value="">Select Sector</option>
                          {masterData?.sectors?.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Department</label>
                        <select name="department_id" value={formData.department_id} onChange={handleInputChange} className="select">
                          <option value="">Select Department</option>
                          {masterData?.departments?.map(d => (
                            <option key={d.id} value={d.id}>{d.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Financial & Resources */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider">Financial & Resources</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Contract Value</label>
                        <input type="number" name="contract_value" value={formData.contract_value} onChange={handleInputChange} className="input" placeholder="0.00" min="0" step="0.01" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Currency</label>
                        <select name="currency" value={formData.currency} onChange={handleInputChange} className="select">
                          <option value="USD">USD</option>
                          <option value="EUR">EUR</option>
                          <option value="GBP">GBP</option>
                          <option value="INR">INR</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">CAPEX (Capital Expenditure)</label>
                        <input type="number" name="capex" value={formData.capex} onChange={handleInputChange} className="input" placeholder="0.00" min="0" step="0.01" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">OPEX (Operating Expenditure)</label>
                        <input type="number" name="opex" value={formData.opex} onChange={handleInputChange} className="input" placeholder="0.00" min="0" step="0.01" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Resource Count</label>
                        <input type="number" name="resource_count" value={formData.resource_count} onChange={handleInputChange} className="input" min="0" />
                      </div>
                    </div>
                  </div>

                  {/* Timeline */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider">Timeline</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Start Date</label>
                        <input type="date" name="start_date" value={formData.start_date} onChange={handleInputChange} className="input" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">End Date</label>
                        <input type="date" name="end_date" value={formData.end_date} onChange={handleInputChange} className="input" />
                      </div>
                    </div>
                  </div>

                  {/* Technologies/Skills */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider">Technologies / Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {masterData?.technologies?.map(tech => (
                        <button
                          key={tech.id}
                          type="button"
                          onClick={() => handleTechnologyChange(tech.id)}
                          className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                            formData.technology_ids.includes(tech.id)
                              ? 'bg-accent-500/20 border-accent-500/50 text-accent-400'
                              : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-600'
                          }`}
                        >
                          {tech.name}
                        </button>
                      ))}
                    </div>
                    
                    {/* Custom Skills */}
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Add Custom Skills</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={customSkill}
                          onChange={(e) => setCustomSkill(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCustomSkill())}
                          className="input flex-1"
                          placeholder="Type a skill and press Enter or click Add"
                        />
                        <Button type="button" variant="secondary" onClick={handleAddCustomSkill}>Add</Button>
                      </div>
                      {customSkills.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {customSkills.map(skill => (
                            <span key={skill} className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 rounded-lg">
                              {skill}
                              <button type="button" onClick={() => handleRemoveCustomSkill(skill)} className="hover:text-white">
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider">Notes</h3>
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      className="input min-h-[100px]"
                      placeholder="Add any notes about this service..."
                    />
                  </div>

                  {/* Status */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Initial Status</label>
                    <select name="status" value={formData.status} onChange={handleInputChange} className="select w-48">
                      <option value="draft">Draft</option>
                      <option value="active">Active</option>
                    </select>
                  </div>
                </form>
              )}
            </>
          )}
        </div>

        {mode !== null && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-700/50 bg-slate-900/50">
            <button type="button" onClick={() => setMode(null)} className="text-sm text-slate-400 hover:text-white">← Back to options</button>
            <div className="flex items-center gap-3">
              <Button variant="secondary" onClick={handleClose}>Cancel</Button>
              <Button variant="primary" onClick={handleSubmit} isLoading={isSaving} leftIcon={<Plus className="w-4 h-4" />}>Create Service</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
