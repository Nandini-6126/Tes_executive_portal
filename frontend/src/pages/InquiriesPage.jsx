import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, Plus, Search, Phone, Mail, Building2, Calendar,
  ChevronRight, Edit2, Trash2, Inbox, X, Filter, DollarSign,
  TrendingUp, CheckCircle, XCircle, Clock, MessageSquare, ArrowRight
} from 'lucide-react';
import { inquiriesAPI } from '../api/client';
import { useSettings } from '../context/SettingsContext';
import Button from '../components/common/Button';
import { PageLoader } from '../components/common/LoadingSpinner';

const STATUS_CONFIG = {
  new: { color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', label: 'New' },
  contacted: { color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30', label: 'Contacted' },
  meeting_scheduled: { color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', label: 'Meeting Scheduled' },
  proposal_sent: { color: 'bg-orange-500/20 text-orange-400 border-orange-500/30', label: 'Proposal Sent' },
  negotiating: { color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', label: 'Negotiating' },
  won: { color: 'bg-green-500/20 text-green-400 border-green-500/30', label: 'Won' },
  lost: { color: 'bg-red-500/20 text-red-400 border-red-500/30', label: 'Lost' },
  on_hold: { color: 'bg-gray-500/20 text-gray-400 border-gray-500/30', label: 'On Hold' },
};

const PRIORITY_CONFIG = {
  low: { color: 'text-gray-400', label: 'Low' },
  medium: { color: 'text-yellow-400', label: 'Medium' },
  high: { color: 'text-orange-400', label: 'High' },
  urgent: { color: 'text-red-400', label: 'Urgent' },
};

const SOURCE_OPTIONS = [
  { value: 'website', label: 'Website' },
  { value: 'referral', label: 'Referral' },
  { value: 'cold_call', label: 'Cold Call' },
  { value: 'email', label: 'Email' },
  { value: 'social_media', label: 'Social Media' },
  { value: 'trade_show', label: 'Trade Show' },
  { value: 'existing_client', label: 'Existing Client' },
  { value: 'partner', label: 'Partner' },
  { value: 'other', label: 'Other' },
];

export default function InquiriesPage() {
  const navigate = useNavigate();
  const { isLightTheme } = useSettings();
  const isLight = isLightTheme;
  
  const [inquiries, setInquiries] = useState([]);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingInquiry, setEditingInquiry] = useState(null);
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    loadData();
  }, [filterStatus]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const params = { page: 1, page_size: 100 };
      if (filterStatus) params.status = filterStatus;
      
      const [inquiriesRes, statsRes] = await Promise.all([
        inquiriesAPI.getAll(params),
        inquiriesAPI.getStats()
      ]);
      
      setInquiries(inquiriesRes.data.data || []);
      setStats(statsRes.data);
    } catch (err) {
      console.error('Failed to load inquiries:', err);
      setInquiries([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteInquiry = async (id) => {
    try {
      await inquiriesAPI.delete(id);
      setDeleteConfirm(null);
      loadData();
    } catch (err) {
      console.error('Failed to delete inquiry:', err);
    }
  };

  const handleConvertInquiry = async (inquiry) => {
    try {
      await inquiriesAPI.convert(inquiry.id, {
        create_client: true,
        create_service: true,
        service_name: inquiry.title,
        contract_value: inquiry.estimated_value
      });
      loadData();
      setSelectedInquiry(null);
    } catch (err) {
      console.error('Failed to convert inquiry:', err);
      alert('Failed to convert inquiry');
    }
  };

  const formatCurrency = (value) => {
    if (!value) return '-';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(value);
  };

  const filteredInquiries = inquiries.filter(inquiry =>
    inquiry.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    inquiry.contact_person.toLowerCase().includes(searchQuery.toLowerCase()) ||
    inquiry.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return <PageLoader text="Loading inquiries..." />;
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-bold flex items-center gap-3 ${isLight ? 'text-gray-800' : 'text-white'}`}>
            <FileText className="w-7 h-7 text-primary-400" />
            Client Inquiries
          </h1>
          <p className={`mt-1 ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>
            Track and manage potential client service inquiries
          </p>
        </div>
        <Button variant="primary" onClick={() => setShowAddModal(true)} leftIcon={<Plus className="w-4 h-4" />}>
          New Inquiry
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className={`p-4 rounded-xl ${isLight ? 'bg-white shadow-md' : 'bg-slate-800/50 border border-slate-700/50'}`}>
            <p className={`text-sm ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>Total Inquiries</p>
            <p className={`text-2xl font-bold ${isLight ? 'text-gray-800' : 'text-white'}`}>{stats.total_inquiries}</p>
          </div>
          <div className={`p-4 rounded-xl ${isLight ? 'bg-white shadow-md' : 'bg-slate-800/50 border border-slate-700/50'}`}>
            <p className={`text-sm ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>New</p>
            <p className="text-2xl font-bold text-blue-500">{stats.new_inquiries}</p>
          </div>
          <div className={`p-4 rounded-xl ${isLight ? 'bg-white shadow-md' : 'bg-slate-800/50 border border-slate-700/50'}`}>
            <p className={`text-sm ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>In Progress</p>
            <p className="text-2xl font-bold text-orange-500">{stats.in_progress}</p>
          </div>
          <div className={`p-4 rounded-xl ${isLight ? 'bg-white shadow-md' : 'bg-slate-800/50 border border-slate-700/50'}`}>
            <p className={`text-sm ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>Won</p>
            <p className="text-2xl font-bold text-green-500">{stats.won}</p>
          </div>
          <div className={`p-4 rounded-xl ${isLight ? 'bg-white shadow-md' : 'bg-slate-800/50 border border-slate-700/50'}`}>
            <p className={`text-sm ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>Conversion Rate</p>
            <p className="text-2xl font-bold text-purple-500">{stats.conversion_rate}%</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${isLight ? 'text-gray-400' : 'text-slate-500'}`} />
          <input
            type="text"
            placeholder="Search inquiries..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
              isLight ? 'bg-white border-gray-200' : 'bg-slate-800 border-slate-700 text-white'
            }`}
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className={`px-4 py-2 rounded-lg border ${
            isLight ? 'bg-white border-gray-200' : 'bg-slate-800 border-slate-700 text-white'
          }`}
        >
          <option value="">All Status</option>
          {Object.entries(STATUS_CONFIG).map(([key, { label }]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>

      {/* Pipeline View */}
      {filteredInquiries.length > 0 ? (
        <div className="space-y-4">
          {filteredInquiries.map((inquiry) => (
            <div
              key={inquiry.id}
              className={`p-6 rounded-xl cursor-pointer transition-all hover:shadow-lg ${
                isLight ? 'bg-white shadow-md' : 'bg-slate-800/50 border border-slate-700/50 hover:border-slate-600'
              }`}
              onClick={() => setSelectedInquiry(inquiry)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`px-2 py-0.5 rounded text-xs border ${STATUS_CONFIG[inquiry.status]?.color || 'bg-gray-500/20 text-gray-400'}`}>
                      {STATUS_CONFIG[inquiry.status]?.label || inquiry.status}
                    </span>
                    <span className={`text-xs ${PRIORITY_CONFIG[inquiry.priority]?.color || 'text-gray-400'}`}>
                      ● {PRIORITY_CONFIG[inquiry.priority]?.label || inquiry.priority}
                    </span>
                    <span className={`text-xs ${isLight ? 'text-gray-400' : 'text-slate-500'}`}>
                      {inquiry.inquiry_number}
                    </span>
                  </div>
                  
                  <h3 className={`text-lg font-semibold ${isLight ? 'text-gray-800' : 'text-white'}`}>
                    {inquiry.title}
                  </h3>
                  
                  <div className="flex items-center gap-4 mt-2">
                    <span className={`flex items-center gap-1 text-sm ${isLight ? 'text-gray-600' : 'text-slate-300'}`}>
                      <Building2 className="w-4 h-4" /> {inquiry.company_name}
                    </span>
                    <span className={`flex items-center gap-1 text-sm ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>
                      <Mail className="w-4 h-4" /> {inquiry.contact_person}
                    </span>
                    {inquiry.estimated_value && (
                      <span className={`flex items-center gap-1 text-sm ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>
                        <DollarSign className="w-4 h-4" /> {formatCurrency(inquiry.estimated_value)}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      inquiry.win_probability >= 70 ? 'bg-green-500/20 text-green-400' :
                      inquiry.win_probability >= 40 ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      <span className="text-sm font-bold">{inquiry.win_probability}%</span>
                    </div>
                  </div>
                  {inquiry.next_follow_up_date && (
                    <span className={`flex items-center gap-1 text-xs ${isLight ? 'text-gray-400' : 'text-slate-500'}`}>
                      <Calendar className="w-3 h-3" /> Follow-up: {new Date(inquiry.next_follow_up_date).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={`p-12 text-center rounded-xl ${isLight ? 'bg-white shadow-md' : 'bg-slate-800/50 border border-slate-700/50'}`}>
          <Inbox className={`w-16 h-16 mx-auto mb-4 ${isLight ? 'text-gray-300' : 'text-slate-600'}`} />
          <h3 className={`text-xl font-medium mb-2 ${isLight ? 'text-gray-800' : 'text-white'}`}>
            No inquiries yet
          </h3>
          <p className={`mb-6 max-w-md mx-auto ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>
            Start tracking client inquiries to manage your sales pipeline effectively.
          </p>
          <Button variant="primary" onClick={() => setShowAddModal(true)} leftIcon={<Plus className="w-4 h-4" />}>
            Add First Inquiry
          </Button>
        </div>
      )}

      {/* Add/Edit Inquiry Modal */}
      {showAddModal && (
        <InquiryModal
          isOpen={showAddModal}
          onClose={() => { setShowAddModal(false); setEditingInquiry(null); }}
          inquiry={editingInquiry}
          onSuccess={() => {
            setShowAddModal(false);
            setEditingInquiry(null);
            loadData();
          }}
          isLight={isLight}
        />
      )}

      {/* Inquiry Detail Modal */}
      {selectedInquiry && (
        <InquiryDetailModal
          inquiry={selectedInquiry}
          onClose={() => setSelectedInquiry(null)}
          onEdit={() => {
            setEditingInquiry(selectedInquiry);
            setShowAddModal(true);
            setSelectedInquiry(null);
          }}
          onDelete={() => {
            setDeleteConfirm(selectedInquiry);
            setSelectedInquiry(null);
          }}
          onConvert={() => handleConvertInquiry(selectedInquiry)}
          onUpdate={loadData}
          isLight={isLight}
        />
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)} />
          <div className={`relative w-full max-w-md p-6 rounded-2xl ${isLight ? 'bg-white' : 'bg-slate-900'}`}>
            <h3 className={`text-lg font-semibold mb-2 ${isLight ? 'text-gray-800' : 'text-white'}`}>
              Delete Inquiry
            </h3>
            <p className={`mb-6 ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>
              Are you sure you want to delete "{deleteConfirm.title}"?
            </p>
            <div className="flex items-center justify-end gap-3">
              <Button variant="secondary" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
              <Button variant="danger" onClick={() => handleDeleteInquiry(deleteConfirm.id)} leftIcon={<Trash2 className="w-4 h-4" />}>
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Inquiry Modal Component
function InquiryModal({ isOpen, onClose, inquiry, onSuccess, isLight }) {
  const [formData, setFormData] = useState({
    company_name: inquiry?.company_name || '',
    contact_person: inquiry?.contact_person || '',
    contact_email: inquiry?.contact_email || '',
    contact_phone: inquiry?.contact_phone || '',
    company_website: inquiry?.company_website || '',
    company_size: inquiry?.company_size || '',
    industry: inquiry?.industry || '',
    title: inquiry?.title || '',
    description: inquiry?.description || '',
    requirements: inquiry?.requirements || '',
    service_type: inquiry?.service_type || '',
    priority: inquiry?.priority || 'medium',
    source: inquiry?.source || 'other',
    estimated_budget: inquiry?.estimated_budget || '',
    estimated_value: inquiry?.estimated_value || '',
    expected_start_date: inquiry?.expected_start_date || '',
    decision_date: inquiry?.decision_date || '',
    next_follow_up_date: inquiry?.next_follow_up_date || '',
    win_probability: inquiry?.win_probability || 50,
    internal_notes: inquiry?.internal_notes || '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const submitData = { ...formData };
      // Convert empty strings to null for optional fields
      Object.keys(submitData).forEach(key => {
        if (submitData[key] === '') submitData[key] = null;
      });
      
      if (inquiry) {
        await inquiriesAPI.update(inquiry.id, submitData);
      } else {
        await inquiriesAPI.create(submitData);
      }
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save inquiry');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full max-w-2xl rounded-2xl my-8 ${isLight ? 'bg-white' : 'bg-slate-900'}`}>
        <div className={`sticky top-0 p-6 border-b rounded-t-2xl z-10 ${isLight ? 'bg-white border-gray-200' : 'bg-slate-900 border-slate-700'}`}>
          <div className="flex items-center justify-between">
            <h2 className={`text-xl font-semibold ${isLight ? 'text-gray-800' : 'text-white'}`}>
              {inquiry ? 'Edit Inquiry' : 'New Client Inquiry'}
            </h2>
            <button onClick={onClose}>
              <X className={`w-5 h-5 ${isLight ? 'text-gray-500' : 'text-slate-400'}`} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Client Information */}
          <div>
            <h3 className={`text-sm font-semibold mb-3 ${isLight ? 'text-gray-700' : 'text-slate-300'}`}>
              Client Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm mb-1 ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>Company Name *</label>
                <input
                  type="text"
                  required
                  value={formData.company_name}
                  onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                  className={`w-full px-3 py-2 rounded-lg border ${isLight ? 'bg-white border-gray-200' : 'bg-slate-800 border-slate-700 text-white'}`}
                />
              </div>
              <div>
                <label className={`block text-sm mb-1 ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>Contact Person *</label>
                <input
                  type="text"
                  required
                  value={formData.contact_person}
                  onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                  className={`w-full px-3 py-2 rounded-lg border ${isLight ? 'bg-white border-gray-200' : 'bg-slate-800 border-slate-700 text-white'}`}
                />
              </div>
              <div>
                <label className={`block text-sm mb-1 ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>Email *</label>
                <input
                  type="email"
                  required
                  value={formData.contact_email}
                  onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                  className={`w-full px-3 py-2 rounded-lg border ${isLight ? 'bg-white border-gray-200' : 'bg-slate-800 border-slate-700 text-white'}`}
                />
              </div>
              <div>
                <label className={`block text-sm mb-1 ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>Phone</label>
                <input
                  type="text"
                  value={formData.contact_phone}
                  onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                  className={`w-full px-3 py-2 rounded-lg border ${isLight ? 'bg-white border-gray-200' : 'bg-slate-800 border-slate-700 text-white'}`}
                />
              </div>
              <div>
                <label className={`block text-sm mb-1 ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>Industry</label>
                <input
                  type="text"
                  value={formData.industry}
                  onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                  className={`w-full px-3 py-2 rounded-lg border ${isLight ? 'bg-white border-gray-200' : 'bg-slate-800 border-slate-700 text-white'}`}
                />
              </div>
              <div>
                <label className={`block text-sm mb-1 ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>Source</label>
                <select
                  value={formData.source}
                  onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                  className={`w-full px-3 py-2 rounded-lg border ${isLight ? 'bg-white border-gray-200' : 'bg-slate-800 border-slate-700 text-white'}`}
                >
                  {SOURCE_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Inquiry Details */}
          <div>
            <h3 className={`text-sm font-semibold mb-3 ${isLight ? 'text-gray-700' : 'text-slate-300'}`}>
              Inquiry Details
            </h3>
            <div className="space-y-4">
              <div>
                <label className={`block text-sm mb-1 ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>Inquiry Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Cloud Migration Services"
                  className={`w-full px-3 py-2 rounded-lg border ${isLight ? 'bg-white border-gray-200' : 'bg-slate-800 border-slate-700 text-white'}`}
                />
              </div>
              <div>
                <label className={`block text-sm mb-1 ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>Description</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className={`w-full px-3 py-2 rounded-lg border ${isLight ? 'bg-white border-gray-200' : 'bg-slate-800 border-slate-700 text-white'}`}
                />
              </div>
              <div>
                <label className={`block text-sm mb-1 ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>Requirements</label>
                <textarea
                  rows={2}
                  value={formData.requirements}
                  onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                  placeholder="Specific requirements mentioned by the client"
                  className={`w-full px-3 py-2 rounded-lg border ${isLight ? 'bg-white border-gray-200' : 'bg-slate-800 border-slate-700 text-white'}`}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm mb-1 ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg border ${isLight ? 'bg-white border-gray-200' : 'bg-slate-800 border-slate-700 text-white'}`}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className={`block text-sm mb-1 ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>Win Probability (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.win_probability}
                    onChange={(e) => setFormData({ ...formData, win_probability: parseInt(e.target.value) })}
                    className={`w-full px-3 py-2 rounded-lg border ${isLight ? 'bg-white border-gray-200' : 'bg-slate-800 border-slate-700 text-white'}`}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Financial */}
          <div>
            <h3 className={`text-sm font-semibold mb-3 ${isLight ? 'text-gray-700' : 'text-slate-300'}`}>
              Financial Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm mb-1 ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>Client's Budget</label>
                <input
                  type="number"
                  value={formData.estimated_budget}
                  onChange={(e) => setFormData({ ...formData, estimated_budget: e.target.value })}
                  className={`w-full px-3 py-2 rounded-lg border ${isLight ? 'bg-white border-gray-200' : 'bg-slate-800 border-slate-700 text-white'}`}
                />
              </div>
              <div>
                <label className={`block text-sm mb-1 ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>Our Estimated Value</label>
                <input
                  type="number"
                  value={formData.estimated_value}
                  onChange={(e) => setFormData({ ...formData, estimated_value: e.target.value })}
                  className={`w-full px-3 py-2 rounded-lg border ${isLight ? 'bg-white border-gray-200' : 'bg-slate-800 border-slate-700 text-white'}`}
                />
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div>
            <h3 className={`text-sm font-semibold mb-3 ${isLight ? 'text-gray-700' : 'text-slate-300'}`}>
              Timeline
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className={`block text-sm mb-1 ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>Expected Start</label>
                <input
                  type="date"
                  value={formData.expected_start_date}
                  onChange={(e) => setFormData({ ...formData, expected_start_date: e.target.value })}
                  className={`w-full px-3 py-2 rounded-lg border ${isLight ? 'bg-white border-gray-200' : 'bg-slate-800 border-slate-700 text-white'}`}
                />
              </div>
              <div>
                <label className={`block text-sm mb-1 ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>Decision Date</label>
                <input
                  type="date"
                  value={formData.decision_date}
                  onChange={(e) => setFormData({ ...formData, decision_date: e.target.value })}
                  className={`w-full px-3 py-2 rounded-lg border ${isLight ? 'bg-white border-gray-200' : 'bg-slate-800 border-slate-700 text-white'}`}
                />
              </div>
              <div>
                <label className={`block text-sm mb-1 ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>Next Follow-up</label>
                <input
                  type="date"
                  value={formData.next_follow_up_date}
                  onChange={(e) => setFormData({ ...formData, next_follow_up_date: e.target.value })}
                  className={`w-full px-3 py-2 rounded-lg border ${isLight ? 'bg-white border-gray-200' : 'bg-slate-800 border-slate-700 text-white'}`}
                />
              </div>
            </div>
          </div>

          {/* Internal Notes */}
          <div>
            <label className={`block text-sm mb-1 ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>Internal Notes</label>
            <textarea
              rows={2}
              value={formData.internal_notes}
              onChange={(e) => setFormData({ ...formData, internal_notes: e.target.value })}
              placeholder="Notes visible only to your team"
              className={`w-full px-3 py-2 rounded-lg border ${isLight ? 'bg-white border-gray-200' : 'bg-slate-800 border-slate-700 text-white'}`}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 py-2 rounded-lg font-medium ${isLight ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'bg-slate-700 text-white hover:bg-slate-600'}`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2 rounded-lg font-medium bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-50"
            >
              {submitting ? 'Saving...' : (inquiry ? 'Update Inquiry' : 'Create Inquiry')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Inquiry Detail Modal
function InquiryDetailModal({ inquiry, onClose, onEdit, onDelete, onConvert, onUpdate, isLight }) {
  const [activityText, setActivityText] = useState('');
  const [activityType, setActivityType] = useState('note');
  const [addingActivity, setAddingActivity] = useState(false);

  const handleAddActivity = async () => {
    if (!activityText.trim()) return;
    
    setAddingActivity(true);
    try {
      await inquiriesAPI.addActivity(inquiry.id, {
        activity_type: activityType,
        title: `${activityType.charAt(0).toUpperCase() + activityType.slice(1)} added`,
        description: activityText
      });
      setActivityText('');
      onUpdate();
    } catch (err) {
      console.error('Failed to add activity:', err);
    } finally {
      setAddingActivity(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full max-w-2xl rounded-2xl max-h-[90vh] overflow-y-auto ${isLight ? 'bg-white' : 'bg-slate-900'}`}>
        <div className={`sticky top-0 p-6 border-b ${isLight ? 'bg-white border-gray-200' : 'bg-slate-900 border-slate-700'}`}>
          <div className="flex items-center justify-between">
            <div>
              <span className={`text-sm ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>{inquiry.inquiry_number}</span>
              <h2 className={`text-xl font-semibold ${isLight ? 'text-gray-800' : 'text-white'}`}>
                {inquiry.title}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={onEdit} className={`p-2 rounded-lg ${isLight ? 'hover:bg-gray-100' : 'hover:bg-slate-700'}`}>
                <Edit2 className="w-5 h-5" />
              </button>
              <button onClick={onDelete} className={`p-2 rounded-lg ${isLight ? 'hover:bg-red-50 text-red-500' : 'hover:bg-red-500/10 text-red-400'}`}>
                <Trash2 className="w-5 h-5" />
              </button>
              <button onClick={onClose}>
                <X className={`w-5 h-5 ${isLight ? 'text-gray-500' : 'text-slate-400'}`} />
              </button>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Status and Quick Info */}
          <div className="flex items-center gap-4 flex-wrap">
            <span className={`px-3 py-1 rounded-full text-sm border ${STATUS_CONFIG[inquiry.status]?.color}`}>
              {STATUS_CONFIG[inquiry.status]?.label}
            </span>
            <span className={`text-sm ${PRIORITY_CONFIG[inquiry.priority]?.color}`}>
              ● {PRIORITY_CONFIG[inquiry.priority]?.label} Priority
            </span>
            <span className={`flex items-center gap-1 text-sm ${isLight ? 'text-gray-600' : 'text-slate-300'}`}>
              <TrendingUp className="w-4 h-4" /> {inquiry.win_probability}% Win Probability
            </span>
          </div>

          {/* Client Info */}
          <div className={`p-4 rounded-lg ${isLight ? 'bg-gray-50' : 'bg-slate-800/50'}`}>
            <h3 className={`text-sm font-semibold mb-3 ${isLight ? 'text-gray-700' : 'text-slate-300'}`}>Client Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Building2 className={`w-4 h-4 ${isLight ? 'text-gray-400' : 'text-slate-500'}`} />
                <span className={isLight ? 'text-gray-700' : 'text-slate-300'}>{inquiry.company_name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className={`w-4 h-4 ${isLight ? 'text-gray-400' : 'text-slate-500'}`} />
                <span className={isLight ? 'text-gray-700' : 'text-slate-300'}>{inquiry.contact_email}</span>
              </div>
              {inquiry.contact_phone && (
                <div className="flex items-center gap-2">
                  <Phone className={`w-4 h-4 ${isLight ? 'text-gray-400' : 'text-slate-500'}`} />
                  <span className={isLight ? 'text-gray-700' : 'text-slate-300'}>{inquiry.contact_phone}</span>
                </div>
              )}
              {inquiry.industry && (
                <div className="flex items-center gap-2">
                  <Briefcase className={`w-4 h-4 ${isLight ? 'text-gray-400' : 'text-slate-500'}`} />
                  <span className={isLight ? 'text-gray-700' : 'text-slate-300'}>{inquiry.industry}</span>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          {inquiry.description && (
            <div>
              <h3 className={`text-sm font-semibold mb-2 ${isLight ? 'text-gray-700' : 'text-slate-300'}`}>Description</h3>
              <p className={`text-sm ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>{inquiry.description}</p>
            </div>
          )}

          {/* Requirements */}
          {inquiry.requirements && (
            <div>
              <h3 className={`text-sm font-semibold mb-2 ${isLight ? 'text-gray-700' : 'text-slate-300'}`}>Requirements</h3>
              <p className={`text-sm ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>{inquiry.requirements}</p>
            </div>
          )}

          {/* Add Activity */}
          <div className={`p-4 rounded-lg ${isLight ? 'bg-gray-50' : 'bg-slate-800/50'}`}>
            <h3 className={`text-sm font-semibold mb-3 ${isLight ? 'text-gray-700' : 'text-slate-300'}`}>Add Activity</h3>
            <div className="flex gap-2 mb-2">
              {['note', 'call', 'email', 'meeting'].map(type => (
                <button
                  key={type}
                  onClick={() => setActivityType(type)}
                  className={`px-3 py-1 rounded text-sm ${
                    activityType === type 
                      ? 'bg-primary-500 text-white' 
                      : isLight ? 'bg-gray-200 text-gray-600' : 'bg-slate-700 text-slate-300'
                  }`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={activityText}
                onChange={(e) => setActivityText(e.target.value)}
                placeholder="Add a note, log a call..."
                className={`flex-1 px-3 py-2 rounded-lg border ${isLight ? 'bg-white border-gray-200' : 'bg-slate-800 border-slate-700 text-white'}`}
              />
              <Button variant="primary" onClick={handleAddActivity} disabled={addingActivity || !activityText.trim()}>
                Add
              </Button>
            </div>
          </div>

          {/* Convert Button */}
          {inquiry.status !== 'won' && inquiry.status !== 'lost' && (
            <Button 
              variant="primary" 
              className="w-full" 
              onClick={onConvert}
              leftIcon={<ArrowRight className="w-4 h-4" />}
            >
              Convert to Client & Service
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
