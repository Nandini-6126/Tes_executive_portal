import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, Plus, Search, Phone, Mail, MapPin, 
  ChevronRight, Edit2, Trash2, Inbox, ExternalLink, Briefcase, X
} from 'lucide-react';
import { clientsAPI, servicesAPI } from '../api/client';
import { useSettings } from '../context/SettingsContext';
import Button from '../components/common/Button';
import { PageLoader } from '../components/common/LoadingSpinner';

export default function ClientsPage() {
  const navigate = useNavigate();
  const { isLightTheme } = useSettings();
  const isLight = isLightTheme;
  
  const [clients, setClients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [expandedClient, setExpandedClient] = useState(null);
  const [clientServices, setClientServices] = useState({});
  const [showAddServiceModal, setShowAddServiceModal] = useState(false);
  const [selectedClientForService, setSelectedClientForService] = useState(null);

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
            <Building2 className="w-7 h-7 text-primary-400" />
            Clients
          </h1>
          <p className={`mt-1 ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>
            Manage your client organizations and their services
          </p>
        </div>
        <Button variant="primary" onClick={() => setShowAddModal(true)} leftIcon={<Plus className="w-4 h-4" />}>
          Add Client
        </Button>
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${isLight ? 'text-gray-400' : 'text-slate-500'}`} />
          <input
            type="text"
            placeholder="Search clients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
              isLight ? 'bg-white border-gray-200' : 'bg-slate-800 border-slate-700 text-white'
            }`}
          />
        </div>
      </div>

      {/* Clients List */}
      {filteredClients.length > 0 ? (
        <div className="space-y-4">
          {filteredClients.map((client) => (
            <div
              key={client.id}
              className={`rounded-xl overflow-hidden ${isLight ? 'bg-white shadow-md' : 'bg-slate-800/50 border border-slate-700/50'}`}
            >
              {/* Client Header */}
              <div 
                className="p-6 cursor-pointer hover:bg-opacity-80 transition-all"
                onClick={() => handleExpandClient(client.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      isLight ? 'bg-primary-100' : 'bg-primary-500/20'
                    }`}>
                      <Building2 className="w-6 h-6 text-primary-500" />
                    </div>
                    <div>
                      <h3 className={`text-lg font-semibold ${isLight ? 'text-gray-800' : 'text-white'}`}>
                        {client.name}
                      </h3>
                      <div className="flex items-center gap-4 mt-1">
                        {client.industry && (
                          <span className={`text-sm ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>
                            {client.industry}
                          </span>
                        )}
                        <span className={`text-sm px-2 py-0.5 rounded ${
                          client.is_active 
                            ? 'bg-green-500/20 text-green-400' 
                            : 'bg-slate-500/20 text-slate-400'
                        }`}>
                          {client.is_active ? 'Active' : 'Inactive'}
                        </span>
                        <span className={`text-sm ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>
                          {client.services_count} service{client.services_count !== 1 ? 's' : ''}
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
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setDeleteConfirm(client); }}
                      className={`p-2 rounded-lg transition-colors ${
                        isLight ? 'hover:bg-red-50 text-gray-500 hover:text-red-500' : 'hover:bg-red-500/10 text-slate-400 hover:text-red-400'
                      }`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <ChevronRight className={`w-5 h-5 transition-transform ${
                      expandedClient === client.id ? 'rotate-90' : ''
                    } ${isLight ? 'text-gray-400' : 'text-slate-500'}`} />
                  </div>
                </div>

                {/* Contact Info */}
                <div className="flex flex-wrap gap-4 mt-4">
                  {client.contact_person && (
                    <span className={`flex items-center gap-1 text-sm ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>
                      <Building2 className="w-4 h-4" /> {client.contact_person}
                    </span>
                  )}
                  {client.contact_email && (
                    <span className={`flex items-center gap-1 text-sm ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>
                      <Mail className="w-4 h-4" /> {client.contact_email}
                    </span>
                  )}
                  {client.contact_phone && (
                    <span className={`flex items-center gap-1 text-sm ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>
                      <Phone className="w-4 h-4" /> {client.contact_phone}
                    </span>
                  )}
                  {(client.city || client.country) && (
                    <span className={`flex items-center gap-1 text-sm ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>
                      <MapPin className="w-4 h-4" /> {[client.city, client.country].filter(Boolean).join(', ')}
                    </span>
                  )}
                </div>
              </div>

              {/* Expanded Services */}
              {expandedClient === client.id && (
                <div className={`border-t ${isLight ? 'border-gray-200 bg-gray-50' : 'border-slate-700 bg-slate-800/30'}`}>
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className={`font-medium ${isLight ? 'text-gray-700' : 'text-slate-300'}`}>
                        Services ({clientServices[client.id]?.length || 0})
                      </h4>
                      <Button 
                        variant="secondary" 
                        size="sm"
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          setSelectedClientForService(client); 
                          setShowAddServiceModal(true); 
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
                              <Briefcase className={`w-5 h-5 ${isLight ? 'text-gray-400' : 'text-slate-500'}`} />
                              <div>
                                <p className={`font-medium ${isLight ? 'text-gray-800' : 'text-white'}`}>
                                  {service.name}
                                </p>
                                <p className={`text-sm ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>
                                  {service.status} • {service.resource_count || 0} resources
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() => navigate(`/services/${service.id}`)}
                              className={`p-2 rounded-lg ${
                                isLight ? 'hover:bg-gray-100 text-gray-500' : 'hover:bg-slate-700 text-slate-400'
                              }`}
                            >
                              <ExternalLink className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className={`text-sm ${isLight ? 'text-gray-500' : 'text-slate-500'}`}>
                        No services yet. Add a service to get started.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className={`p-12 text-center rounded-xl ${isLight ? 'bg-white shadow-md' : 'bg-slate-800/50 border border-slate-700/50'}`}>
          <Inbox className={`w-16 h-16 mx-auto mb-4 ${isLight ? 'text-gray-300' : 'text-slate-600'}`} />
          <h3 className={`text-xl font-medium mb-2 ${isLight ? 'text-gray-800' : 'text-white'}`}>
            No clients yet
          </h3>
          <p className={`max-w-md mx-auto ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>
            Use the "Add Client" button above to get started. You can then add services under each client.
          </p>
        </div>
      )}

      {/* Add/Edit Client Modal */}
      {showAddModal && (
        <ClientModal
          isOpen={showAddModal}
          onClose={() => { setShowAddModal(false); setEditingClient(null); }}
          client={editingClient}
          onSuccess={() => {
            setShowAddModal(false);
            setEditingClient(null);
            loadClients();
          }}
          isLight={isLight}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)} />
          <div className={`relative w-full max-w-md p-6 rounded-2xl ${isLight ? 'bg-white' : 'bg-slate-900'}`}>
            <h3 className={`text-lg font-semibold mb-2 ${isLight ? 'text-gray-800' : 'text-white'}`}>
              Delete Client
            </h3>
            <p className={`mb-6 ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>
              Are you sure you want to delete "<span className={isLight ? 'text-gray-800' : 'text-white'}>{deleteConfirm.name}</span>"? 
              This will also affect all associated services.
            </p>
            <div className="flex items-center justify-end gap-3">
              <Button variant="secondary" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
              <Button variant="danger" onClick={() => handleDeleteClient(deleteConfirm.id)} leftIcon={<Trash2 className="w-4 h-4" />}>
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add Service Modal */}
      {showAddServiceModal && selectedClientForService && (
        <AddServiceModal
          isOpen={showAddServiceModal}
          onClose={() => { setShowAddServiceModal(false); setSelectedClientForService(null); }}
          client={selectedClientForService}
          onSuccess={() => {
            setShowAddServiceModal(false);
            setSelectedClientForService(null);
            // Refresh services for this client
            setClientServices(prev => ({ ...prev, [selectedClientForService.id]: undefined }));
            loadClientServices(selectedClientForService.id);
            loadClients();
          }}
          isLight={isLight}
        />
      )}
    </div>
  );
}

// Client Modal Component
function ClientModal({ isOpen, onClose, client, onSuccess, isLight }) {
  const [formData, setFormData] = useState({
    name: client?.name || '',
    description: client?.description || '',
    contact_person: client?.contact_person || '',
    contact_email: client?.contact_email || '',
    contact_phone: client?.contact_phone || '',
    address: client?.address || '',
    city: client?.city || '',
    country: client?.country || '',
    industry: client?.industry || '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full max-w-lg rounded-2xl my-8 ${isLight ? 'bg-white' : 'bg-slate-900'}`}>
        <div className={`sticky top-0 p-6 border-b rounded-t-2xl ${isLight ? 'bg-white border-gray-200' : 'bg-slate-900 border-slate-700'}`}>
          <h2 className={`text-xl font-semibold ${isLight ? 'text-gray-800' : 'text-white'}`}>
            {client ? 'Edit Client' : 'Add New Client'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className={`block text-sm font-medium mb-1 ${isLight ? 'text-gray-700' : 'text-slate-300'}`}>
              Client Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={`w-full px-3 py-2 rounded-lg border ${
                isLight ? 'bg-white border-gray-200' : 'bg-slate-800 border-slate-700 text-white'
              }`}
            />
          </div>

          <div>
            <label className={`block text-sm font-medium mb-1 ${isLight ? 'text-gray-700' : 'text-slate-300'}`}>
              Industry
            </label>
            <input
              type="text"
              value={formData.industry}
              onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
              placeholder="e.g., Technology, Healthcare, Finance"
              className={`w-full px-3 py-2 rounded-lg border ${
                isLight ? 'bg-white border-gray-200' : 'bg-slate-800 border-slate-700 text-white'
              }`}
            />
          </div>

          <div>
            <label className={`block text-sm font-medium mb-1 ${isLight ? 'text-gray-700' : 'text-slate-300'}`}>
              Contact Person
            </label>
            <input
              type="text"
              value={formData.contact_person}
              onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
              className={`w-full px-3 py-2 rounded-lg border ${
                isLight ? 'bg-white border-gray-200' : 'bg-slate-800 border-slate-700 text-white'
              }`}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-1 ${isLight ? 'text-gray-700' : 'text-slate-300'}`}>
                Email
              </label>
              <input
                type="email"
                value={formData.contact_email}
                onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                className={`w-full px-3 py-2 rounded-lg border ${
                  isLight ? 'bg-white border-gray-200' : 'bg-slate-800 border-slate-700 text-white'
                }`}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1 ${isLight ? 'text-gray-700' : 'text-slate-300'}`}>
                Phone
              </label>
              <input
                type="text"
                value={formData.contact_phone}
                onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                className={`w-full px-3 py-2 rounded-lg border ${
                  isLight ? 'bg-white border-gray-200' : 'bg-slate-800 border-slate-700 text-white'
                }`}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-1 ${isLight ? 'text-gray-700' : 'text-slate-300'}`}>
                City
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className={`w-full px-3 py-2 rounded-lg border ${
                  isLight ? 'bg-white border-gray-200' : 'bg-slate-800 border-slate-700 text-white'
                }`}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1 ${isLight ? 'text-gray-700' : 'text-slate-300'}`}>
                Country
              </label>
              <input
                type="text"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                className={`w-full px-3 py-2 rounded-lg border ${
                  isLight ? 'bg-white border-gray-200' : 'bg-slate-800 border-slate-700 text-white'
                }`}
              />
            </div>
          </div>

          <div>
            <label className={`block text-sm font-medium mb-1 ${isLight ? 'text-gray-700' : 'text-slate-300'}`}>
              Description
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className={`w-full px-3 py-2 rounded-lg border ${
                isLight ? 'bg-white border-gray-200' : 'bg-slate-800 border-slate-700 text-white'
              }`}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 py-2 rounded-lg font-medium ${
                isLight ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'bg-slate-700 text-white hover:bg-slate-600'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2 rounded-lg font-medium bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-50"
            >
              {submitting ? 'Saving...' : (client ? 'Update Client' : 'Add Client')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Add Service Modal Component
function AddServiceModal({ isOpen, onClose, client, onSuccess, isLight }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'active',
    resource_count: 0,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full max-w-lg rounded-2xl my-8 ${isLight ? 'bg-white' : 'bg-slate-900'}`}>
        <div className={`p-6 border-b rounded-t-2xl ${isLight ? 'border-gray-200' : 'border-slate-700'}`}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className={`text-xl font-semibold ${isLight ? 'text-gray-800' : 'text-white'}`}>
                Add Service
              </h2>
              <p className={`text-sm mt-1 ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>
                For client: {client.name}
              </p>
            </div>
            <button onClick={onClose}>
              <X className={`w-5 h-5 ${isLight ? 'text-gray-500' : 'text-slate-400'}`} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className={`block text-sm font-medium mb-1 ${isLight ? 'text-gray-700' : 'text-slate-300'}`}>
              Service Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Website Development, Cloud Migration"
              className={`w-full px-3 py-2 rounded-lg border ${
                isLight ? 'bg-white border-gray-200' : 'bg-slate-800 border-slate-700 text-white'
              }`}
            />
          </div>

          <div>
            <label className={`block text-sm font-medium mb-1 ${isLight ? 'text-gray-700' : 'text-slate-300'}`}>
              Description
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of the service..."
              className={`w-full px-3 py-2 rounded-lg border ${
                isLight ? 'bg-white border-gray-200' : 'bg-slate-800 border-slate-700 text-white'
              }`}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-1 ${isLight ? 'text-gray-700' : 'text-slate-300'}`}>
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className={`w-full px-3 py-2 rounded-lg border ${
                  isLight ? 'bg-white border-gray-200' : 'bg-slate-800 border-slate-700 text-white'
                }`}
              >
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="on_hold">On Hold</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1 ${isLight ? 'text-gray-700' : 'text-slate-300'}`}>
                Resource Count
              </label>
              <input
                type="number"
                min="0"
                value={formData.resource_count}
                onChange={(e) => setFormData({ ...formData, resource_count: parseInt(e.target.value) || 0 })}
                className={`w-full px-3 py-2 rounded-lg border ${
                  isLight ? 'bg-white border-gray-200' : 'bg-slate-800 border-slate-700 text-white'
                }`}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 py-2 rounded-lg font-medium ${
                isLight ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'bg-slate-700 text-white hover:bg-slate-600'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2 rounded-lg font-medium bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-50"
            >
              {submitting ? 'Creating...' : 'Create Service'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
