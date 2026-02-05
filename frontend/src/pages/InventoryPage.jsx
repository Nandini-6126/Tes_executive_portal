import { useState, useEffect } from 'react';
import { 
  Package, Plus, Search, Monitor, HardDrive, Key, AlertCircle,
  CheckCircle, Clock, XCircle, Sparkles, Edit2, Trash2, Filter
} from 'lucide-react';
import { inventoryAPI, aiAPI } from '../api/client';
import { useSettings } from '../context/SettingsContext';
import Button from '../components/common/Button';
import Modal, { ModalForm, ModalFooter, ModalError } from '../components/common/Modal';
import { PageLoader } from '../components/common/LoadingSpinner';

const CATEGORY_ICONS = {
  hardware: Monitor,
  software: HardDrive,
  license: Key,
};

const CATEGORY_COLORS = {
  hardware: { bg: 'bg-blue-100 dark:bg-blue-500/20', text: 'text-blue-600 dark:text-blue-400', icon: 'text-blue-500' },
  software: { bg: 'bg-purple-100 dark:bg-purple-500/20', text: 'text-purple-600 dark:text-purple-400', icon: 'text-purple-500' },
  license: { bg: 'bg-amber-100 dark:bg-amber-500/20', text: 'text-amber-600 dark:text-amber-400', icon: 'text-amber-500' },
};

const STATUS_STYLES = {
  pending: { bg: 'bg-yellow-100 dark:bg-yellow-500/20', text: 'text-yellow-700 dark:text-yellow-400', icon: Clock },
  approved: { bg: 'bg-green-100 dark:bg-green-500/20', text: 'text-green-700 dark:text-green-400', icon: CheckCircle },
  rejected: { bg: 'bg-red-100 dark:bg-red-500/20', text: 'text-red-700 dark:text-red-400', icon: XCircle },
  fulfilled: { bg: 'bg-blue-100 dark:bg-blue-500/20', text: 'text-blue-700 dark:text-blue-400', icon: CheckCircle },
  cancelled: { bg: 'bg-gray-100 dark:bg-slate-700', text: 'text-gray-700 dark:text-slate-400', icon: XCircle },
};

const PRIORITY_STYLES = {
  low: { bg: 'bg-gray-100 dark:bg-slate-700', text: 'text-gray-600 dark:text-slate-400' },
  medium: { bg: 'bg-blue-100 dark:bg-blue-500/20', text: 'text-blue-600 dark:text-blue-400' },
  high: { bg: 'bg-orange-100 dark:bg-orange-500/20', text: 'text-orange-600 dark:text-orange-400' },
  urgent: { bg: 'bg-red-100 dark:bg-red-500/20', text: 'text-red-600 dark:text-red-400' },
};

export default function InventoryPage() {
  const { isLightTheme } = useSettings();
  const isLight = isLightTheme;
  
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [editingRequest, setEditingRequest] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    setIsLoading(true);
    try {
      const response = await inventoryAPI.getAll({ page: 1, page_size: 100 });
      setRequests(response.data.data || []);
    } catch (err) {
      console.error('Failed to load requests:', err);
      setRequests([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteRequest = async (id) => {
    try {
      await inventoryAPI.delete(id);
      setDeleteConfirm(null);
      loadRequests();
    } catch (err) {
      console.error('Failed to delete request:', err);
      alert('Failed to delete request');
    }
  };

  const filteredRequests = requests.filter(req => {
    const matchesSearch = req.item_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !filterCategory || req.category === filterCategory;
    const matchesStatus = !filterStatus || req.status === filterStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    approved: requests.filter(r => r.status === 'approved').length,
    hardware: requests.filter(r => r.category === 'hardware').length,
    software: requests.filter(r => r.category === 'software').length,
    license: requests.filter(r => r.category === 'license').length,
  };

  if (isLoading) {
    return <PageLoader text="Loading inventory requests..." />;
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-bold flex items-center gap-3 ${isLight ? 'text-gray-800' : 'text-white'}`}>
            <Package className="w-7 h-7 text-primary-500" />
            Inventory Requests
          </h1>
          <p className={`mt-1 ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>
            Manage hardware, software, and license requests
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="secondary" 
            onClick={() => setShowAIModal(true)} 
            leftIcon={<Sparkles className="w-4 h-4" />}
          >
            AI Analysis
          </Button>
          <Button 
            variant="primary" 
            onClick={() => setShowRequestModal(true)} 
            leftIcon={<Plus className="w-4 h-4" />}
          >
            New Request
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard label="Total" value={stats.total} isLight={isLight} />
        <StatCard label="Pending" value={stats.pending} color="yellow" isLight={isLight} />
        <StatCard label="Approved" value={stats.approved} color="green" isLight={isLight} />
        <StatCard label="Hardware" value={stats.hardware} color="blue" isLight={isLight} />
        <StatCard label="Software" value={stats.software} color="purple" isLight={isLight} />
        <StatCard label="Licenses" value={stats.license} color="amber" isLight={isLight} />
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${isLight ? 'text-gray-400' : 'text-slate-500'}`} />
          <input
            type="text"
            placeholder="Search by item name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-10 pr-4 py-3 rounded-xl border ${
              isLight 
                ? 'bg-white border-gray-200 focus:border-primary-500' 
                : 'bg-slate-800 border-slate-700 text-white focus:border-primary-500'
            } focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all`}
          />
        </div>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className={`px-4 py-3 rounded-xl border ${
            isLight 
              ? 'bg-white border-gray-200' 
              : 'bg-slate-800 border-slate-700 text-white'
          } focus:outline-none focus:ring-2 focus:ring-primary-500/20`}
        >
          <option value="">All Categories</option>
          <option value="hardware">Hardware</option>
          <option value="software">Software</option>
          <option value="license">License</option>
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className={`px-4 py-3 rounded-xl border ${
            isLight 
              ? 'bg-white border-gray-200' 
              : 'bg-slate-800 border-slate-700 text-white'
          } focus:outline-none focus:ring-2 focus:ring-primary-500/20`}
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="fulfilled">Fulfilled</option>
        </select>
      </div>

      {/* Requests Grid */}
      {filteredRequests.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRequests.map((request) => (
            <RequestCard
              key={request.id}
              request={request}
              isLight={isLight}
              onEdit={() => { setEditingRequest(request); setShowRequestModal(true); }}
              onDelete={() => setDeleteConfirm(request)}
            />
          ))}
        </div>
      ) : (
        <div className={`p-12 text-center rounded-xl ${
          isLight ? 'bg-white shadow-sm border border-gray-100' : 'bg-slate-800/50 border border-slate-700/50'
        }`}>
          <Package className={`w-16 h-16 mx-auto mb-4 ${isLight ? 'text-gray-300' : 'text-slate-600'}`} />
          <h3 className={`text-xl font-semibold mb-2 ${isLight ? 'text-gray-800' : 'text-white'}`}>
            {searchQuery || filterCategory || filterStatus ? 'No requests found' : 'No requests yet'}
          </h3>
          <p className={`max-w-md mx-auto mb-6 ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>
            {searchQuery || filterCategory || filterStatus 
              ? 'Try adjusting your filters.'
              : 'Start by creating a new hardware, software, or license request.'
            }
          </p>
          {!searchQuery && !filterCategory && !filterStatus && (
            <Button variant="primary" onClick={() => setShowRequestModal(true)} leftIcon={<Plus className="w-4 h-4" />}>
              Create First Request
            </Button>
          )}
        </div>
      )}

      {/* Request Modal */}
      <RequestModal
        isOpen={showRequestModal}
        onClose={() => { setShowRequestModal(false); setEditingRequest(null); }}
        request={editingRequest}
        onSuccess={() => {
          setShowRequestModal(false);
          setEditingRequest(null);
          loadRequests();
        }}
      />

      {/* AI Analysis Modal */}
      <AIAnalysisModal
        isOpen={showAIModal}
        onClose={() => setShowAIModal(false)}
        requests={requests}
      />

      {/* Delete Confirmation */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Delete Request"
        size="sm"
      >
        <div className="p-6">
          <p className={isLight ? 'text-gray-600' : 'text-slate-400'}>
            Are you sure you want to delete the request for <strong className={isLight ? 'text-gray-800' : 'text-white'}>"{deleteConfirm?.item_name}"</strong>?
          </p>
        </div>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
          <Button variant="danger" onClick={() => handleDeleteRequest(deleteConfirm?.id)} leftIcon={<Trash2 className="w-4 h-4" />}>
            Delete
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}

// Stat Card
function StatCard({ label, value, color, isLight }) {
  const colorClasses = {
    yellow: 'text-yellow-600',
    green: 'text-green-600',
    blue: 'text-blue-600',
    purple: 'text-purple-600',
    amber: 'text-amber-600',
    default: isLight ? 'text-gray-800' : 'text-white'
  };
  
  return (
    <div className={`p-4 rounded-xl ${
      isLight ? 'bg-white shadow-sm border border-gray-100' : 'bg-slate-800/50 border border-slate-700/50'
    }`}>
      <p className={`text-xs ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>{label}</p>
      <p className={`text-xl font-bold mt-1 ${colorClasses[color] || colorClasses.default}`}>{value}</p>
    </div>
  );
}

// Request Card
function RequestCard({ request, isLight, onEdit, onDelete }) {
  const category = CATEGORY_COLORS[request.category] || CATEGORY_COLORS.hardware;
  const status = STATUS_STYLES[request.status] || STATUS_STYLES.pending;
  const priority = PRIORITY_STYLES[request.priority] || PRIORITY_STYLES.medium;
  const CategoryIcon = CATEGORY_ICONS[request.category] || Package;
  const StatusIcon = status.icon;
  
  return (
    <div className={`p-5 rounded-xl ${
      isLight ? 'bg-white shadow-sm border border-gray-100' : 'bg-slate-800/50 border border-slate-700/50'
    }`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${category.bg}`}>
            <CategoryIcon className={`w-5 h-5 ${category.icon}`} />
          </div>
          <div>
            <h3 className={`font-semibold ${isLight ? 'text-gray-800' : 'text-white'}`}>
              {request.item_name}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${category.bg} ${category.text}`}>
                {request.category}
              </span>
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${priority.bg} ${priority.text}`}>
                {request.priority}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onEdit}
            className={`p-1.5 rounded-lg ${isLight ? 'hover:bg-gray-100 text-gray-500' : 'hover:bg-slate-700 text-slate-400'}`}
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            className={`p-1.5 rounded-lg ${isLight ? 'hover:bg-red-50 text-gray-500 hover:text-red-500' : 'hover:bg-red-500/10 text-slate-400 hover:text-red-400'}`}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {request.description && (
        <p className={`mt-3 text-sm line-clamp-2 ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>
          {request.description}
        </p>
      )}

      <div className="mt-4 pt-4 border-t flex items-center justify-between" style={{ borderColor: isLight ? '#e5e7eb' : '#374151' }}>
        <div className="flex items-center gap-2">
          <span className={`text-sm ${isLight ? 'text-gray-500' : 'text-slate-500'}`}>
            Qty: {request.quantity}
          </span>
          {request.estimated_cost && (
            <span className={`text-sm font-medium ${isLight ? 'text-gray-700' : 'text-slate-300'}`}>
              ${request.estimated_cost}
            </span>
          )}
        </div>
        <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${status.bg} ${status.text}`}>
          <StatusIcon className="w-3.5 h-3.5" />
          {request.status}
        </span>
      </div>
    </div>
  );
}

// Request Modal
function RequestModal({ isOpen, onClose, request, onSuccess }) {
  const { isLightTheme } = useSettings();
  const isLight = isLightTheme;
  
  const [formData, setFormData] = useState({
    item_name: '',
    category: 'hardware',
    description: '',
    quantity: 1,
    priority: 'medium',
    justification: '',
    estimated_cost: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (request) {
      setFormData({
        item_name: request.item_name || '',
        category: request.category || 'hardware',
        description: request.description || '',
        quantity: request.quantity || 1,
        priority: request.priority || 'medium',
        justification: request.justification || '',
        estimated_cost: request.estimated_cost || '',
      });
    } else {
      setFormData({
        item_name: '',
        category: 'hardware',
        description: '',
        quantity: 1,
        priority: 'medium',
        justification: '',
        estimated_cost: '',
      });
    }
    setError('');
  }, [request, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const submitData = {
        ...formData,
        estimated_cost: formData.estimated_cost ? parseFloat(formData.estimated_cost) : null,
      };
      
      if (request) {
        await inventoryAPI.update(request.id, submitData);
      } else {
        await inventoryAPI.create(submitData);
      }
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save request');
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
      title={request ? 'Edit Request' : 'New Inventory Request'}
      subtitle="Request hardware, software, or licenses for your team"
      size="md"
    >
      <ModalForm onSubmit={handleSubmit}>
        <ModalError message={error} />

        <div>
          <label className={labelClass}>Item Name *</label>
          <input
            type="text"
            required
            value={formData.item_name}
            onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
            placeholder="e.g., MacBook Pro, Visual Studio License"
            className={inputClass}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Category *</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className={inputClass}
            >
              <option value="hardware">Hardware</option>
              <option value="software">Software</option>
              <option value="license">License</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Priority</label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              className={inputClass}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Quantity</label>
            <input
              type="number"
              min="1"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Estimated Cost ($)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={formData.estimated_cost}
              onChange={(e) => setFormData({ ...formData, estimated_cost: e.target.value })}
              placeholder="0.00"
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label className={labelClass}>Description</label>
          <textarea
            rows={2}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Detailed description of the item..."
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Justification</label>
          <textarea
            rows={2}
            value={formData.justification}
            onChange={(e) => setFormData({ ...formData, justification: e.target.value })}
            placeholder="Why is this item needed?"
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
          disabled={submitting || !formData.item_name}
        >
          {submitting ? 'Saving...' : (request ? 'Update Request' : 'Submit Request')}
        </Button>
      </ModalFooter>
    </Modal>
  );
}

// AI Analysis Modal
function AIAnalysisModal({ isOpen, onClose, requests }) {
  const { isLightTheme } = useSettings();
  const isLight = isLightTheme;
  
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const runAnalysis = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await aiAPI.analyzeInventory({ requests });
      setAnalysis(response.data);
    } catch (err) {
      setError('Failed to run AI analysis. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setAnalysis(null);
      setError('');
    }
  }, [isOpen]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="AI Inventory Analysis"
      subtitle="Get intelligent insights about your inventory requests"
      size="lg"
    >
      <div className="p-6">
        {!analysis && !loading && (
          <div className="text-center py-8">
            <Sparkles className={`w-16 h-16 mx-auto mb-4 ${isLight ? 'text-primary-400' : 'text-primary-500'}`} />
            <h3 className={`text-lg font-semibold mb-2 ${isLight ? 'text-gray-800' : 'text-white'}`}>
              AI-Powered Analysis
            </h3>
            <p className={`max-w-md mx-auto mb-6 ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>
              Our AI will analyze your {requests.length} inventory request{requests.length !== 1 ? 's' : ''} and provide 
              optimization suggestions, cost analysis, and procurement recommendations.
            </p>
            <Button 
              variant="primary" 
              onClick={runAnalysis}
              leftIcon={<Sparkles className="w-4 h-4" />}
              disabled={requests.length === 0}
            >
              Run Analysis
            </Button>
            {requests.length === 0 && (
              <p className="text-sm text-red-500 mt-2">No requests to analyze</p>
            )}
          </div>
        )}

        {loading && (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className={isLight ? 'text-gray-600' : 'text-slate-400'}>Analyzing your inventory requests...</p>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700">
            {error}
          </div>
        )}

        {analysis && (
          <div className="space-y-6">
            {/* Summary */}
            <div className={`p-4 rounded-lg ${isLight ? 'bg-gray-50 border border-gray-200' : 'bg-slate-800/50 border border-slate-700'}`}>
              <h4 className={`font-semibold mb-2 ${isLight ? 'text-gray-800' : 'text-white'}`}>Summary</h4>
              <p className={isLight ? 'text-gray-600' : 'text-slate-400'}>{analysis.summary || 'Analysis complete.'}</p>
            </div>

            {/* Recommendations */}
            {analysis.recommendations && analysis.recommendations.length > 0 && (
              <div>
                <h4 className={`font-semibold mb-3 ${isLight ? 'text-gray-800' : 'text-white'}`}>Recommendations</h4>
                <div className="space-y-2">
                  {analysis.recommendations.map((rec, idx) => (
                    <div 
                      key={idx}
                      className={`p-3 rounded-lg flex items-start gap-3 ${
                        isLight ? 'bg-blue-50 border border-blue-100' : 'bg-blue-500/10 border border-blue-500/20'
                      }`}
                    >
                      <CheckCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                      <p className={isLight ? 'text-gray-700' : 'text-slate-300'}>{rec}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Cost Analysis */}
            {analysis.cost_analysis && (
              <div className={`p-4 rounded-lg ${isLight ? 'bg-green-50 border border-green-200' : 'bg-green-500/10 border border-green-500/20'}`}>
                <h4 className={`font-semibold mb-2 ${isLight ? 'text-gray-800' : 'text-white'}`}>Cost Analysis</h4>
                <p className={isLight ? 'text-gray-600' : 'text-slate-400'}>{analysis.cost_analysis}</p>
              </div>
            )}
          </div>
        )}
      </div>

      <ModalFooter>
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
        {analysis && (
          <Button variant="primary" onClick={runAnalysis} leftIcon={<Sparkles className="w-4 h-4" />}>
            Re-run Analysis
          </Button>
        )}
      </ModalFooter>
    </Modal>
  );
}
