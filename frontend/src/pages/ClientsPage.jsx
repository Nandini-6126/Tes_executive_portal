import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, Plus, Search, Phone, Mail, MapPin, 
  ChevronDown, Edit2, Trash2, Briefcase, ExternalLink
} from 'lucide-react';
import { clientsAPI, servicesAPI } from '../api/client';
import { useSettings } from '../context/SettingsContext';
import Button from '../components/common/Button';
import Modal, { ModalForm, ModalFooter, ModalError } from '../components/common/Modal';
import { PageLoader } from '../components/common/LoadingSpinner';

export default function ClientsPage() {
  const navigate = useNavigate();
  const { isLightTheme } = useSettings();
  const isLight = isLightTheme;
  
  const [clients, setClients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [expandedClient, setExpandedClient] = useState(null);
  const [clientServices, setClientServices] = useState({});

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    setIsLoading(true);
    try {
      const response = await clientsAPI.getAll({ page: 1, page_size: 100 });
      setClients(response.data.data || []);
    } catch (err) {
      console.error('Failed to load clients:', err);
      setClients([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadClientServices = async (clientId) => {
    if (clientServices[clientId]) return;
    try {
      const response = await clientsAPI.getServices(clientId);
      setClientServices(prev => ({
        ...prev,
        [clientId]: response.data.services || []
      }));
    } catch (err) {
      console.error('Failed to load services:', err);
    }
  };

  const handleExpandClient = (clientId) => {
    if (expandedClient === clientId) {
      setExpandedClient(null);
    } else {
      setExpandedClient(clientId);
      loadClientServices(clientId);
    }
  };

  const handleDeleteClient = async (clientId) => {
    try {
      await clientsAPI.delete(clientId);
      setDeleteConfirm(null);
      loadClients();
    } catch (err) {
      console.error('Failed to delete client:', err);
      alert('Failed to delete client');
    }
  };

  const handleClientSaved = () => {
    setShowAddModal(false);
    setEditingClient(null);
    loadClients();
  };

  const handleServiceSaved = () => {
    setShowServiceModal(false);
    if (selectedClient) {
      setClientServices(prev => ({ ...prev, [selectedClient.id]: undefined }));
      loadClientServices(selectedClient.id);
    }
    setSelectedClient(null);
    loadClients();
  };

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.contact_person?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.industry?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return <PageLoader text="Loading clients..." />;
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-bold flex items-center gap-3 ${isLight ? 'text-gray-800' : 'text-white'}`}>
            <Building2 className="w-7 h-7 text-primary-500" />
            Clients
          </h1>
          <p className={`mt-1 ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>
            Manage your client organizations and their services
          </p>
        </div>
        <Button 
          variant="primary" 
          onClick={() => setShowAddModal(true)} 
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Add Client
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${isLight ? 'text-gray-400' : 'text-slate-500'}`} />
        <input
          type="text"
          placeholder="Search clients by name, contact, or industry..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={`w-full pl-10 pr-4 py-3 rounded-xl border ${
            isLight 
              ? 'bg-white border-gray-200 focus:border-primary-500' 
              : 'bg-slate-800 border-slate-700 text-white focus:border-primary-500'
          } focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all`}
        />
      </div>

      {/* Clients List */}
      {filteredClients.length > 0 ? (
        <div className="space-y-4">
          {filteredClients.map((client) => (
            <div
              key={client.id}
              className={`rounded-xl overflow-hidden transition-all ${
                isLight 
                  ? 'bg-white shadow-sm hover:shadow-md border border-gray-100' 
                  : 'bg-slate-800/50 border border-slate-700/50 hover:border-slate-600'
              }`}
            >
              {/* Client Header */}
              <div 
                className={`p-5 cursor-pointer transition-colors ${
                  isLight ? 'hover:bg-gray-50' : 'hover:bg-slate-800'
                }`}
                onClick={() => handleExpandClient(client.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      isLight ? 'bg-primary-50' : 'bg-primary-500/10'
                    }`}>
                      <Building2 className="w-6 h-6 text-primary-500" />
                    </div>
                    <div>
                      <h3 className={`text-lg font-semibold ${isLight ? 'text-gray-800' : 'text-white'}`}>
                        {client.name}
                      </h3>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        {client.industry && (
                          <span className={`text-sm ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>
                            {client.industry}
                          </span>
                        )}
                        <span className={`text-sm px-2 py-0.5 rounded-full ${
                          client.is_active 
                            ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400' 
                            : 'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-slate-400'
                        }`}>
                          {client.is_active ? 'Active' : 'Inactive'}
                        </span>
                        <span className={`text-sm ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>
                          {client.services_count || 0} service{client.services_count !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); setEditingClient(client); setShowAddModal(true); }}
                      className={`p-2 rounded-lg transition-colors ${
                        isLight ? 'hover:bg-gray-100 text-gray-500' : 'hover:bg-slate-700 text-slate-400'
                      }`}
                      title="Edit client"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setDeleteConfirm(client); }}
                      className={`p-2 rounded-lg transition-colors ${
                        isLight ? 'hover:bg-red-50 text-gray-500 hover:text-red-500' : 'hover:bg-red-500/10 text-slate-400 hover:text-red-400'
                      }`}
                      title="Delete client"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <ChevronDown className={`w-5 h-5 transition-transform ${
                      expandedClient === client.id ? 'rotate-180' : ''
                    } ${isLight ? 'text-gray-400' : 'text-slate-500'}`} />
                  </div>
                </div>

                {/* Contact Info */}
                {(client.contact_person || client.contact_email || client.contact_phone) && (
                  <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-dashed" style={{ borderColor: isLight ? '#e5e7eb' : '#374151' }}>
                    {client.contact_person && (
                      <span className={`flex items-center gap-2 text-sm ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>
                        <Building2 className="w-4 h-4" /> {client.contact_person}
                      </span>
                    )}
                    {client.contact_email && (
                      <span className={`flex items-center gap-2 text-sm ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>
                        <Mail className="w-4 h-4" /> {client.contact_email}
                      </span>
                    )}
                    {client.contact_phone && (
                      <span className={`flex items-center gap-2 text-sm ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>
                        <Phone className="w-4 h-4" /> {client.contact_phone}
                      </span>
                    )}
                    {(client.city || client.country) && (
                      <span className={`flex items-center gap-2 text-sm ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>
                        <MapPin className="w-4 h-4" /> {[client.city, client.country].filter(Boolean).join(', ')}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Expanded Services Section */}
              {expandedClient === client.id && (
                <div className={`border-t ${isLight ? 'border-gray-100 bg-gray-50/50' : 'border-slate-700 bg-slate-900/30'}`}>
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className={`font-semibold ${isLight ? 'text-gray-700' : 'text-slate-300'}`}>
                        Services ({clientServices[client.id]?.length || 0})
                      </h4>
                      <Button 
                        variant="secondary" 
                        size="sm"
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          setSelectedClient(client); 
                          setShowServiceModal(true); 
                        }}
                        leftIcon={<Plus className="w-4 h-4" />}
                      >
                        Add Service
                      </Button>
                    </div>
                    
                    {clientServices[client.id]?.length > 0 ? (
                      <div className="space-y-2">
                        {clientServices[client.id].map((service) => (
                          <div
                            key={service.id}
                            className={`p-4 rounded-lg flex items-center justify-between ${
                              isLight ? 'bg-white border border-gray-200' : 'bg-slate-800 border border-slate-700'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                isLight ? 'bg-blue-50' : 'bg-blue-500/10'
                              }`}>
                                <Briefcase className="w-5 h-5 text-blue-500" />
                              </div>
                              <div>
                                <p className={`font-medium ${isLight ? 'text-gray-800' : 'text-white'}`}>
                                  {service.name}
                                </p>
                                <p className={`text-sm ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>
                                  <span className={`inline-block px-2 py-0.5 rounded text-xs mr-2 ${
                                    service.status === 'active' 
                                      ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400'
                                      : 'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-slate-400'
                                  }`}>
                                    {service.status}
                                  </span>
                                  {service.resource_count || 0} resources
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() => navigate(`/services/${service.id}`)}
                              className={`p-2 rounded-lg ${
                                isLight ? 'hover:bg-gray-100 text-gray-500' : 'hover:bg-slate-700 text-slate-400'
                              }`}
                              title="View service details"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className={`text-center py-8 rounded-lg border-2 border-dashed ${
                        isLight ? 'border-gray-200 text-gray-500' : 'border-slate-700 text-slate-500'
                      }`}>
                        <Briefcase className="w-10 h-10 mx-auto mb-2 opacity-50" />
                        <p>No services yet</p>
                        <p className="text-sm mt-1">Click "Add Service" to create one</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className={`p-12 text-center rounded-xl ${
          isLight ? 'bg-white shadow-sm border border-gray-100' : 'bg-slate-800/50 border border-slate-700/50'
        }`}>
          <Building2 className={`w-16 h-16 mx-auto mb-4 ${isLight ? 'text-gray-300' : 'text-slate-600'}`} />
          <h3 className={`text-xl font-semibold mb-2 ${isLight ? 'text-gray-800' : 'text-white'}`}>
            No clients yet
          </h3>
          <p className={`max-w-md mx-auto mb-6 ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>
            Get started by adding your first client. You can then add services under each client.
          </p>
          <Button 
            variant="primary" 
            onClick={() => setShowAddModal(true)} 
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Add Your First Client
          </Button>
        </div>
      )}

      {/* Add/Edit Client Modal */}
      <ClientModal
        isOpen={showAddModal}
        onClose={() => { setShowAddModal(false); setEditingClient(null); }}
        client={editingClient}
        onSuccess={handleClientSaved}
      />

      {/* Add Service Modal */}
      <ServiceModal
        isOpen={showServiceModal}
        onClose={() => { setShowServiceModal(false); setSelectedClient(null); }}
        client={selectedClient}
        onSuccess={handleServiceSaved}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Delete Client"
        size="sm"
      >
        <div className="p-6">
          <p className={`${isLight ? 'text-gray-600' : 'text-slate-400'}`}>
            Are you sure you want to delete <strong className={isLight ? 'text-gray-800' : 'text-white'}>"{deleteConfirm?.name}"</strong>?
            This will also affect all associated services.
          </p>
        </div>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setDeleteConfirm(null)}>
            Cancel
          </Button>
          <Button 
            variant="danger" 
            onClick={() => handleDeleteClient(deleteConfirm?.id)}
            leftIcon={<Trash2 className="w-4 h-4" />}
          >
            Delete Client
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}

// Client Modal Component
function ClientModal({ isOpen, onClose, client, onSuccess }) {
  const { isLightTheme } = useSettings();
  const isLight = isLightTheme;
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    contact_person: '',
    contact_email: '',
    contact_phone: '',
    address: '',
    city: '',
    country: '',
    industry: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (client) {
      setFormData({
        name: client.name || '',
        description: client.description || '',
        contact_person: client.contact_person || '',
        contact_email: client.contact_email || '',
        contact_phone: client.contact_phone || '',
        address: client.address || '',
        city: client.city || '',
        country: client.country || '',
        industry: client.industry || '',
      });
    } else {
      setFormData({
        name: '',
        description: '',
        contact_person: '',
        contact_email: '',
        contact_phone: '',
        address: '',
        city: '',
        country: '',
        industry: '',
      });
    }
    setError('');
  }, [client, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      if (client) {
        await clientsAPI.update(client.id, formData);
      } else {
        await clientsAPI.create(formData);
      }
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save client');
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = `w-full px-4 py-2.5 rounded-lg border transition-colors ${
    isLight 
      ? 'bg-white border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20' 
      : 'bg-slate-800 border-slate-600 text-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20'
  } outline-none`;

  const labelClass = `block text-sm font-medium mb-1.5 ${isLight ? 'text-gray-700' : 'text-slate-300'}`;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={client ? 'Edit Client' : 'Add New Client'}
      subtitle={client ? `Editing ${client.name}` : 'Enter the client organization details'}
      size="md"
    >
      <ModalForm onSubmit={handleSubmit}>
        <ModalError message={error} />

        <div>
          <label className={labelClass}>Client Name *</label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Enter client organization name"
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Industry</label>
          <input
            type="text"
            value={formData.industry}
            onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
            placeholder="e.g., Technology, Healthcare, Finance"
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Contact Person</label>
          <input
            type="text"
            value={formData.contact_person}
            onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
            placeholder="Primary contact name"
            className={inputClass}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Email</label>
            <input
              type="email"
              value={formData.contact_email}
              onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
              placeholder="contact@company.com"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Phone</label>
            <input
              type="text"
              value={formData.contact_phone}
              onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
              placeholder="+1 234 567 8900"
              className={inputClass}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>City</label>
            <input
              type="text"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              placeholder="City"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Country</label>
            <input
              type="text"
              value={formData.country}
              onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              placeholder="Country"
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label className={labelClass}>Description</label>
          <textarea
            rows={3}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Brief description of the client..."
            className={inputClass}
          />
        </div>
      </ModalForm>

      <ModalFooter>
        <Button variant="secondary" onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button 
          variant="primary" 
          onClick={handleSubmit}
          disabled={submitting || !formData.name}
        >
          {submitting ? 'Saving...' : (client ? 'Update Client' : 'Add Client')}
        </Button>
      </ModalFooter>
    </Modal>
  );
}

// Service Modal Component
function ServiceModal({ isOpen, onClose, client, onSuccess }) {
  const { isLightTheme } = useSettings();
  const isLight = isLightTheme;
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'active',
    resource_count: 0,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setFormData({
      name: '',
      description: '',
      status: 'active',
      resource_count: 0,
    });
    setError('');
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!client) return;
    
    setSubmitting(true);
    setError('');

    try {
      await servicesAPI.create({
        ...formData,
        client_id: client.id,
        customer_name: client.name,
        customer_type: 'existing',
      });
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create service');
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = `w-full px-4 py-2.5 rounded-lg border transition-colors ${
    isLight 
      ? 'bg-white border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20' 
      : 'bg-slate-800 border-slate-600 text-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20'
  } outline-none`;

  const labelClass = `block text-sm font-medium mb-1.5 ${isLight ? 'text-gray-700' : 'text-slate-300'}`;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Service"
      subtitle={client ? `For client: ${client.name}` : ''}
      size="md"
    >
      <ModalForm onSubmit={handleSubmit}>
        <ModalError message={error} />

        <div>
          <label className={labelClass}>Service Name *</label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Website Development, Cloud Migration"
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Description</label>
          <textarea
            rows={3}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Brief description of the service..."
            className={inputClass}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className={inputClass}
            >
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="on_hold">On Hold</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Resource Count</label>
            <input
              type="number"
              min="0"
              value={formData.resource_count}
              onChange={(e) => setFormData({ ...formData, resource_count: parseInt(e.target.value) || 0 })}
              className={inputClass}
            />
          </div>
        </div>
      </ModalForm>

      <ModalFooter>
        <Button variant="secondary" onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button 
          variant="primary" 
          onClick={handleSubmit}
          disabled={submitting || !formData.name}
        >
          {submitting ? 'Creating...' : 'Create Service'}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
