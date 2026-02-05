import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, Plus, Search, Calendar, User, Building2, ChevronRight,
  Mail, Phone, Clock, Edit2, Trash2
} from 'lucide-react';
import { inquiriesAPI } from '../api/client';
import { useSettings } from '../context/SettingsContext';
import Button from '../components/common/Button';
import Modal, { ModalForm, ModalFooter, ModalError } from '../components/common/Modal';
import { PageLoader } from '../components/common/LoadingSpinner';

const STATUS_STYLES = {
  new: { bg: 'bg-blue-100 dark:bg-blue-500/20', text: 'text-blue-700 dark:text-blue-400', label: 'New' },
  contacted: { bg: 'bg-yellow-100 dark:bg-yellow-500/20', text: 'text-yellow-700 dark:text-yellow-400', label: 'Contacted' },
  qualified: { bg: 'bg-green-100 dark:bg-green-500/20', text: 'text-green-700 dark:text-green-400', label: 'Qualified' },
  proposal_sent: { bg: 'bg-purple-100 dark:bg-purple-500/20', text: 'text-purple-700 dark:text-purple-400', label: 'Proposal Sent' },
  negotiating: { bg: 'bg-orange-100 dark:bg-orange-500/20', text: 'text-orange-700 dark:text-orange-400', label: 'Negotiating' },
  won: { bg: 'bg-emerald-100 dark:bg-emerald-500/20', text: 'text-emerald-700 dark:text-emerald-400', label: 'Won' },
  lost: { bg: 'bg-red-100 dark:bg-red-500/20', text: 'text-red-700 dark:text-red-400', label: 'Lost' },
  on_hold: { bg: 'bg-gray-100 dark:bg-slate-700', text: 'text-gray-700 dark:text-slate-400', label: 'On Hold' },
};

const PRIORITY_STYLES = {
  low: { bg: 'bg-gray-100 dark:bg-slate-700', text: 'text-gray-600 dark:text-slate-400' },
  medium: { bg: 'bg-blue-100 dark:bg-blue-500/20', text: 'text-blue-600 dark:text-blue-400' },
  high: { bg: 'bg-orange-100 dark:bg-orange-500/20', text: 'text-orange-600 dark:text-orange-400' },
  urgent: { bg: 'bg-red-100 dark:bg-red-500/20', text: 'text-red-600 dark:text-red-400' },
};

export default function InquiriesPage() {
  const navigate = useNavigate();
  const { isLightTheme } = useSettings();
  const isLight = isLightTheme;
  
  const [inquiries, setInquiries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingInquiry, setEditingInquiry] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    loadInquiries();
  }, []);

  const loadInquiries = async () => {
    setIsLoading(true);
    try {
      const response = await inquiriesAPI.getAll({ page: 1, page_size: 100 });
      setInquiries(response.data.data || []);
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
      loadInquiries();
    } catch (err) {
      console.error('Failed to delete inquiry:', err);
      alert('Failed to delete inquiry');
    }
  };

  const filteredInquiries = inquiries.filter(inq => {
    const matchesSearch = 
      inq.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inq.contact_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inq.service_requested?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !filterStatus || inq.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: inquiries.length,
    new: inquiries.filter(i => i.status === 'new').length,
    inProgress: inquiries.filter(i => ['contacted', 'qualified', 'proposal_sent', 'negotiating'].includes(i.status)).length,
    won: inquiries.filter(i => i.status === 'won').length,
  };

  if (isLoading) {
    return <PageLoader text="Loading inquiries..." />;
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-bold flex items-center gap-3 ${isLight ? 'text-gray-800' : 'text-white'}`}>
            <FileText className="w-7 h-7 text-primary-500" />
            Client Inquiries
          </h1>
          <p className={`mt-1 ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>
            Manage new service inquiries from potential clients
          </p>
        </div>
        <Button 
          variant="primary" 
          onClick={() => setShowAddModal(true)} 
          leftIcon={<Plus className="w-4 h-4" />}
        >
          New Inquiry
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Inquiries" value={stats.total} isLight={isLight} />
        <StatCard label="New" value={stats.new} color="blue" isLight={isLight} />
        <StatCard label="In Progress" value={stats.inProgress} color="yellow" isLight={isLight} />
        <StatCard label="Won" value={stats.won} color="green" isLight={isLight} />
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${isLight ? 'text-gray-400' : 'text-slate-500'}`} />
          <input
            type="text"
            placeholder="Search by company, contact, or service..."
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
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className={`px-4 py-3 rounded-xl border ${
            isLight 
              ? 'bg-white border-gray-200' 
              : 'bg-slate-800 border-slate-700 text-white'
          } focus:outline-none focus:ring-2 focus:ring-primary-500/20`}
        >
          <option value="">All Status</option>
          {Object.entries(STATUS_STYLES).map(([key, val]) => (
            <option key={key} value={key}>{val.label}</option>
          ))}
        </select>
      </div>

      {/* Inquiries List */}
      {filteredInquiries.length > 0 ? (
        <div className="space-y-3">
          {filteredInquiries.map((inquiry) => (
            <InquiryCard
              key={inquiry.id}
              inquiry={inquiry}
              isLight={isLight}
              onClick={() => navigate(`/inquiries/${inquiry.id}`)}
              onEdit={() => { setEditingInquiry(inquiry); setShowAddModal(true); }}
              onDelete={() => setDeleteConfirm(inquiry)}
            />
          ))}
        </div>
      ) : (
        <div className={`p-12 text-center rounded-xl ${
          isLight ? 'bg-white shadow-sm border border-gray-100' : 'bg-slate-800/50 border border-slate-700/50'
        }`}>
          <FileText className={`w-16 h-16 mx-auto mb-4 ${isLight ? 'text-gray-300' : 'text-slate-600'}`} />
          <h3 className={`text-xl font-semibold mb-2 ${isLight ? 'text-gray-800' : 'text-white'}`}>
            {searchQuery || filterStatus ? 'No inquiries found' : 'No inquiries yet'}
          </h3>
          <p className={`max-w-md mx-auto mb-6 ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>
            {searchQuery || filterStatus 
              ? 'Try adjusting your search or filter.'
              : 'Start by adding a new client inquiry about your services.'
            }
          </p>
          {!searchQuery && !filterStatus && (
            <Button variant="primary" onClick={() => setShowAddModal(true)} leftIcon={<Plus className="w-4 h-4" />}>
              Add New Inquiry
            </Button>
          )}
        </div>
      )}

      {/* Add/Edit Modal */}
      <InquiryModal
        isOpen={showAddModal}
        onClose={() => { setShowAddModal(false); setEditingInquiry(null); }}
        inquiry={editingInquiry}
        onSuccess={() => {
          setShowAddModal(false);
          setEditingInquiry(null);
          loadInquiries();
        }}
      />

      {/* Delete Confirmation */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Delete Inquiry"
        size="sm"
      >
        <div className="p-6">
          <p className={isLight ? 'text-gray-600' : 'text-slate-400'}>
            Are you sure you want to delete the inquiry from <strong className={isLight ? 'text-gray-800' : 'text-white'}>"{deleteConfirm?.company_name}"</strong>?
          </p>
        </div>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
          <Button variant="danger" onClick={() => handleDeleteInquiry(deleteConfirm?.id)} leftIcon={<Trash2 className="w-4 h-4" />}>
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
    blue: 'text-blue-600',
    yellow: 'text-yellow-600',
    green: 'text-green-600',
    default: isLight ? 'text-gray-800' : 'text-white'
  };
  
  return (
    <div className={`p-5 rounded-xl ${
      isLight ? 'bg-white shadow-sm border border-gray-100' : 'bg-slate-800/50 border border-slate-700/50'
    }`}>
      <p className={`text-sm ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>{label}</p>
      <p className={`text-2xl font-bold mt-1 ${colorClasses[color] || colorClasses.default}`}>{value}</p>
    </div>
  );
}

// Inquiry Card
function InquiryCard({ inquiry, isLight, onClick, onEdit, onDelete }) {
  const status = STATUS_STYLES[inquiry.status] || STATUS_STYLES.new;
  const priority = PRIORITY_STYLES[inquiry.priority] || PRIORITY_STYLES.medium;
  
  return (
    <div
      className={`p-5 rounded-xl cursor-pointer transition-all ${
        isLight 
          ? 'bg-white shadow-sm border border-gray-100 hover:shadow-md hover:border-gray-200' 
          : 'bg-slate-800/50 border border-slate-700/50 hover:border-slate-600'
      }`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h3 className={`font-semibold ${isLight ? 'text-gray-800' : 'text-white'}`}>
              {inquiry.company_name}
            </h3>
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${status.bg} ${status.text}`}>
              {status.label}
            </span>
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${priority.bg} ${priority.text}`}>
              {inquiry.priority}
            </span>
          </div>
          
          <p className={`text-sm mt-1 ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>
            {inquiry.service_requested}
          </p>
          
          <div className="flex items-center gap-4 mt-3 flex-wrap">
            <span className={`flex items-center gap-1.5 text-sm ${isLight ? 'text-gray-500' : 'text-slate-500'}`}>
              <User className="w-4 h-4" />
              {inquiry.contact_name}
            </span>
            {inquiry.contact_email && (
              <span className={`flex items-center gap-1.5 text-sm ${isLight ? 'text-gray-500' : 'text-slate-500'}`}>
                <Mail className="w-4 h-4" />
                {inquiry.contact_email}
              </span>
            )}
            <span className={`flex items-center gap-1.5 text-sm ${isLight ? 'text-gray-500' : 'text-slate-500'}`}>
              <Calendar className="w-4 h-4" />
              {new Date(inquiry.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            className={`p-2 rounded-lg ${isLight ? 'hover:bg-gray-100 text-gray-500' : 'hover:bg-slate-700 text-slate-400'}`}
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className={`p-2 rounded-lg ${isLight ? 'hover:bg-red-50 text-gray-500 hover:text-red-500' : 'hover:bg-red-500/10 text-slate-400 hover:text-red-400'}`}
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <ChevronRight className={`w-5 h-5 ${isLight ? 'text-gray-400' : 'text-slate-500'}`} />
        </div>
      </div>
    </div>
  );
}

// Inquiry Modal
function InquiryModal({ isOpen, onClose, inquiry, onSuccess }) {
  const { isLightTheme } = useSettings();
  const isLight = isLightTheme;
  
  const [formData, setFormData] = useState({
    company_name: '',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    service_requested: '',
    description: '',
    status: 'new',
    priority: 'medium',
    source: 'direct',
    expected_budget: '',
    expected_timeline: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (inquiry) {
      setFormData({
        company_name: inquiry.company_name || '',
        contact_name: inquiry.contact_name || '',
        contact_email: inquiry.contact_email || '',
        contact_phone: inquiry.contact_phone || '',
        service_requested: inquiry.service_requested || '',
        description: inquiry.description || '',
        status: inquiry.status || 'new',
        priority: inquiry.priority || 'medium',
        source: inquiry.source || 'direct',
        expected_budget: inquiry.expected_budget || '',
        expected_timeline: inquiry.expected_timeline || '',
      });
    } else {
      setFormData({
        company_name: '',
        contact_name: '',
        contact_email: '',
        contact_phone: '',
        service_requested: '',
        description: '',
        status: 'new',
        priority: 'medium',
        source: 'direct',
        expected_budget: '',
        expected_timeline: '',
      });
    }
    setError('');
  }, [inquiry, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      if (inquiry) {
        await inquiriesAPI.update(inquiry.id, formData);
      } else {
        await inquiriesAPI.create(formData);
      }
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save inquiry');
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
      title={inquiry ? 'Edit Inquiry' : 'New Client Inquiry'}
      subtitle={inquiry ? `Editing inquiry from ${inquiry.company_name}` : 'Enter the client inquiry details'}
      size="lg"
    >
      <ModalForm onSubmit={handleSubmit}>
        <ModalError message={error} />

        <div className={`p-4 rounded-lg ${isLight ? 'bg-gray-50 border border-gray-200' : 'bg-slate-800/50 border border-slate-700'}`}>
          <h4 className={`font-medium mb-3 ${isLight ? 'text-gray-700' : 'text-slate-300'}`}>
            Company Information
          </h4>
          <div className="space-y-4">
            <div>
              <label className={labelClass}>Company Name *</label>
              <input
                type="text"
                required
                value={formData.company_name}
                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                placeholder="Enter company name"
                className={inputClass}
              />
            </div>
          </div>
        </div>

        <div className={`p-4 rounded-lg ${isLight ? 'bg-gray-50 border border-gray-200' : 'bg-slate-800/50 border border-slate-700'}`}>
          <h4 className={`font-medium mb-3 ${isLight ? 'text-gray-700' : 'text-slate-300'}`}>
            Contact Details
          </h4>
          <div className="space-y-4">
            <div>
              <label className={labelClass}>Contact Name *</label>
              <input
                type="text"
                required
                value={formData.contact_name}
                onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                placeholder="Primary contact person"
                className={inputClass}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Email *</label>
                <input
                  type="email"
                  required
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
          </div>
        </div>

        <div className={`p-4 rounded-lg ${isLight ? 'bg-gray-50 border border-gray-200' : 'bg-slate-800/50 border border-slate-700'}`}>
          <h4 className={`font-medium mb-3 ${isLight ? 'text-gray-700' : 'text-slate-300'}`}>
            Service Information
          </h4>
          <div className="space-y-4">
            <div>
              <label className={labelClass}>Service Requested *</label>
              <input
                type="text"
                required
                value={formData.service_requested}
                onChange={(e) => setFormData({ ...formData, service_requested: e.target.value })}
                placeholder="e.g., Web Development, Cloud Migration"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Description</label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Detailed description of what the client needs..."
                className={inputClass}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Expected Budget</label>
                <input
                  type="text"
                  value={formData.expected_budget}
                  onChange={(e) => setFormData({ ...formData, expected_budget: e.target.value })}
                  placeholder="e.g., $10,000 - $50,000"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Expected Timeline</label>
                <input
                  type="text"
                  value={formData.expected_timeline}
                  onChange={(e) => setFormData({ ...formData, expected_timeline: e.target.value })}
                  placeholder="e.g., 3 months"
                  className={inputClass}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className={inputClass}
            >
              {Object.entries(STATUS_STYLES).map(([key, val]) => (
                <option key={key} value={key}>{val.label}</option>
              ))}
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
          <div>
            <label className={labelClass}>Source</label>
            <select
              value={formData.source}
              onChange={(e) => setFormData({ ...formData, source: e.target.value })}
              className={inputClass}
            >
              <option value="direct">Direct</option>
              <option value="referral">Referral</option>
              <option value="website">Website</option>
              <option value="social_media">Social Media</option>
              <option value="advertisement">Advertisement</option>
              <option value="other">Other</option>
            </select>
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
          disabled={submitting || !formData.company_name || !formData.contact_name || !formData.contact_email || !formData.service_requested}
        >
          {submitting ? 'Saving...' : (inquiry ? 'Update Inquiry' : 'Create Inquiry')}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
