import { useState, useEffect, useRef } from 'react';
import { 
  Users, Plus, Search, Upload, Download, Mail, Phone, Briefcase,
  Edit2, Trash2, Inbox, X, CheckCircle, AlertCircle, Filter
} from 'lucide-react';
import { employeesAPI } from '../api/client';
import { useSettings } from '../context/SettingsContext';
import Button from '../components/common/Button';
import { PageLoader } from '../components/common/LoadingSpinner';

const AVAILABILITY_COLORS = {
  available: 'bg-green-500/20 text-green-400',
  partially_available: 'bg-yellow-500/20 text-yellow-400',
  busy: 'bg-orange-500/20 text-orange-400',
  on_leave: 'bg-blue-500/20 text-blue-400',
  unavailable: 'bg-red-500/20 text-red-400',
};

export default function EmployeesPage() {
  const { isLightTheme } = useSettings();
  const isLight = isLightTheme;
  const fileInputRef = useRef(null);
  
  const [employees, setEmployees] = useState([]);
  const [skills, setSkills] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAvailability, setFilterAvailability] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [importResult, setImportResult] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [empRes, skillsRes] = await Promise.all([
        employeesAPI.getAll({ page: 1, page_size: 100 }),
        employeesAPI.getSkills()
      ]);
      setEmployees(empRes.data.data || []);
      setSkills(skillsRes.data || []);
    } catch (err) {
      console.error('Failed to load data:', err);
      setEmployees([]);
      setSkills([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteEmployee = async (employeeId) => {
    try {
      await employeesAPI.delete(employeeId);
      setDeleteConfirm(null);
      loadData();
    } catch (err) {
      console.error('Failed to delete employee:', err);
      alert('Failed to delete employee');
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const response = await employeesAPI.bulkImport(file);
      setImportResult(response.data);
      loadData();
    } catch (err) {
      setImportResult({
        success_count: 0,
        error_count: 1,
        errors: [{ error: err.response?.data?.detail || 'Failed to import file' }]
      });
    }
    
    // Reset file input
    e.target.value = '';
  };

  const downloadTemplate = () => {
    const headers = ['first_name', 'last_name', 'email', 'phone', 'job_title', 'department', 'employee_id', 'skills'];
    const csvContent = headers.join(',') + '\n' + 
      'John,Doe,john.doe@example.com,+1234567890,Software Engineer,Engineering,EMP001,"React, Python, SQL"\n' +
      'Jane,Smith,jane.smith@example.com,+1234567891,Product Manager,Product,EMP002,"Project Management, Agile"';
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'employees_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = 
      emp.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.job_title?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesAvailability = !filterAvailability || emp.availability_status === filterAvailability;
    
    return matchesSearch && matchesAvailability;
  });

  if (isLoading) {
    return <PageLoader text="Loading employees..." />;
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-bold flex items-center gap-3 ${isLight ? 'text-gray-800' : 'text-white'}`}>
            <Users className="w-7 h-7 text-primary-400" />
            Employees
          </h1>
          <p className={`mt-1 ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>
            Manage your team members and their skills
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="secondary" 
            onClick={() => setShowImportModal(true)} 
            leftIcon={<Upload className="w-4 h-4" />}
          >
            Import
          </Button>
          <Button 
            variant="primary" 
            onClick={() => setShowAddModal(true)} 
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Add Employee
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className={`p-4 rounded-xl ${isLight ? 'bg-white shadow-md' : 'bg-slate-800/50 border border-slate-700/50'}`}>
          <p className={`text-sm ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>Total Employees</p>
          <p className={`text-2xl font-bold ${isLight ? 'text-gray-800' : 'text-white'}`}>{employees.length}</p>
        </div>
        <div className={`p-4 rounded-xl ${isLight ? 'bg-white shadow-md' : 'bg-slate-800/50 border border-slate-700/50'}`}>
          <p className={`text-sm ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>Available</p>
          <p className="text-2xl font-bold text-green-500">
            {employees.filter(e => e.availability_status === 'available').length}
          </p>
        </div>
        <div className={`p-4 rounded-xl ${isLight ? 'bg-white shadow-md' : 'bg-slate-800/50 border border-slate-700/50'}`}>
          <p className={`text-sm ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>Busy</p>
          <p className="text-2xl font-bold text-orange-500">
            {employees.filter(e => e.availability_status === 'busy').length}
          </p>
        </div>
        <div className={`p-4 rounded-xl ${isLight ? 'bg-white shadow-md' : 'bg-slate-800/50 border border-slate-700/50'}`}>
          <p className={`text-sm ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>Avg Workload</p>
          <p className={`text-2xl font-bold ${isLight ? 'text-gray-800' : 'text-white'}`}>
            {employees.length > 0 
              ? Math.round(employees.reduce((sum, e) => sum + e.workload_percentage, 0) / employees.length)
              : 0}%
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${isLight ? 'text-gray-400' : 'text-slate-500'}`} />
          <input
            type="text"
            placeholder="Search employees..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
              isLight ? 'bg-white border-gray-200' : 'bg-slate-800 border-slate-700 text-white'
            }`}
          />
        </div>
        <select
          value={filterAvailability}
          onChange={(e) => setFilterAvailability(e.target.value)}
          className={`px-4 py-2 rounded-lg border ${
            isLight ? 'bg-white border-gray-200' : 'bg-slate-800 border-slate-700 text-white'
          }`}
        >
          <option value="">All Availability</option>
          <option value="available">Available</option>
          <option value="partially_available">Partially Available</option>
          <option value="busy">Busy</option>
          <option value="on_leave">On Leave</option>
          <option value="unavailable">Unavailable</option>
        </select>
      </div>

      {/* Employees Grid */}
      {filteredEmployees.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEmployees.map((emp) => (
            <div
              key={emp.id}
              className={`p-6 rounded-xl ${isLight ? 'bg-white shadow-md' : 'bg-slate-800/50 border border-slate-700/50'}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold ${
                    emp.availability_status === 'available' ? 'bg-green-500' :
                    emp.availability_status === 'busy' ? 'bg-orange-500' : 'bg-slate-500'
                  }`}>
                    {emp.first_name[0]}{emp.last_name[0]}
                  </div>
                  <div>
                    <h3 className={`font-semibold ${isLight ? 'text-gray-800' : 'text-white'}`}>
                      {emp.full_name}
                    </h3>
                    <p className={`text-sm ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>
                      {emp.job_title || 'No title'}
                    </p>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded text-xs ${AVAILABILITY_COLORS[emp.availability_status]}`}>
                  {emp.availability_status.replace('_', ' ')}
                </span>
              </div>

              <div className="mt-4 space-y-2">
                <div className={`flex items-center gap-2 text-sm ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>
                  <Mail className="w-4 h-4" />
                  <span className="truncate">{emp.email}</span>
                </div>
                {emp.phone && (
                  <div className={`flex items-center gap-2 text-sm ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>
                    <Phone className="w-4 h-4" />
                    <span>{emp.phone}</span>
                  </div>
                )}
                {emp.department && (
                  <div className={`flex items-center gap-2 text-sm ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>
                    <Briefcase className="w-4 h-4" />
                    <span>{emp.department}</span>
                  </div>
                )}
              </div>

              {/* Workload Bar */}
              <div className="mt-4">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className={isLight ? 'text-gray-500' : 'text-slate-400'}>Workload</span>
                  <span className={isLight ? 'text-gray-700' : 'text-slate-300'}>
                    {emp.current_workload_hours}h / {emp.weekly_capacity_hours}h
                  </span>
                </div>
                <div className={`h-2 rounded-full ${isLight ? 'bg-gray-100' : 'bg-slate-700'}`}>
                  <div
                    className={`h-full rounded-full transition-all ${
                      emp.workload_percentage >= 100 ? 'bg-red-500' :
                      emp.workload_percentage >= 80 ? 'bg-orange-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(100, emp.workload_percentage)}%` }}
                  />
                </div>
              </div>

              {/* Skills */}
              {emp.skills && emp.skills.length > 0 && (
                <div className="mt-4">
                  <div className="flex flex-wrap gap-1">
                    {emp.skills.slice(0, 4).map((skill, idx) => (
                      <span
                        key={idx}
                        className={`px-2 py-0.5 rounded text-xs ${
                          isLight ? 'bg-gray-100 text-gray-600' : 'bg-slate-700 text-slate-300'
                        }`}
                      >
                        {skill.skill_name}
                      </span>
                    ))}
                    {emp.skills.length > 4 && (
                      <span className={`text-xs ${isLight ? 'text-gray-400' : 'text-slate-500'}`}>
                        +{emp.skills.length - 4} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="mt-4 pt-4 border-t border-dashed flex items-center justify-between" 
                   style={{ borderColor: isLight ? '#e5e7eb' : '#374151' }}>
                <span className={`text-xs ${isLight ? 'text-gray-400' : 'text-slate-500'}`}>
                  {emp.active_tasks_count} active task{emp.active_tasks_count !== 1 ? 's' : ''}
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={() => { setEditingEmployee(emp); setShowAddModal(true); }}
                    className={`p-1.5 rounded ${isLight ? 'hover:bg-gray-100' : 'hover:bg-slate-700'}`}
                  >
                    <Edit2 className={`w-4 h-4 ${isLight ? 'text-gray-500' : 'text-slate-400'}`} />
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(emp)}
                    className={`p-1.5 rounded ${isLight ? 'hover:bg-red-50' : 'hover:bg-red-500/10'}`}
                  >
                    <Trash2 className={`w-4 h-4 ${isLight ? 'text-gray-500 hover:text-red-500' : 'text-slate-400 hover:text-red-400'}`} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={`p-12 text-center rounded-xl ${isLight ? 'bg-white shadow-md' : 'bg-slate-800/50 border border-slate-700/50'}`}>
          <Inbox className={`w-16 h-16 mx-auto mb-4 ${isLight ? 'text-gray-300' : 'text-slate-600'}`} />
          <h3 className={`text-xl font-medium mb-2 ${isLight ? 'text-gray-800' : 'text-white'}`}>
            No employees yet
          </h3>
          <p className={`max-w-md mx-auto ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>
            Use the buttons above to add employees manually or import from an Excel/CSV file.
          </p>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { setShowImportModal(false); setImportResult(null); }} />
          <div className={`relative w-full max-w-md rounded-2xl ${isLight ? 'bg-white' : 'bg-slate-900'}`}>
            <div className={`p-6 border-b ${isLight ? 'border-gray-200' : 'border-slate-700'}`}>
              <h2 className={`text-xl font-semibold ${isLight ? 'text-gray-800' : 'text-white'}`}>
                Import Employees
              </h2>
            </div>
            
            <div className="p-6">
              {importResult ? (
                <div className="space-y-4">
                  <div className={`p-4 rounded-lg ${
                    importResult.error_count === 0 
                      ? 'bg-green-50 border border-green-200' 
                      : 'bg-yellow-50 border border-yellow-200'
                  }`}>
                    <div className="flex items-center gap-2">
                      {importResult.error_count === 0 ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-yellow-600" />
                      )}
                      <span className={importResult.error_count === 0 ? 'text-green-700' : 'text-yellow-700'}>
                        {importResult.success_count} employee(s) imported successfully
                        {importResult.error_count > 0 && `, ${importResult.error_count} error(s)`}
                      </span>
                    </div>
                    
                    {importResult.errors && importResult.errors.length > 0 && (
                      <div className="mt-3 space-y-1">
                        {importResult.errors.map((err, idx) => (
                          <p key={idx} className="text-sm text-red-600">
                            {err.row ? `Row ${err.row}: ` : ''}{err.error}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <button
                    onClick={() => { setShowImportModal(false); setImportResult(null); }}
                    className="w-full py-2 rounded-lg bg-primary-500 text-white hover:bg-primary-600"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className={`text-sm ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>
                    Upload an Excel (.xlsx) or CSV file with employee data.
                  </p>
                  
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                      isLight 
                        ? 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
                        : 'border-slate-600 hover:border-primary-500 hover:bg-slate-800'
                    }`}
                  >
                    <Upload className={`w-10 h-10 mx-auto mb-3 ${isLight ? 'text-gray-400' : 'text-slate-500'}`} />
                    <p className={`font-medium ${isLight ? 'text-gray-700' : 'text-slate-300'}`}>
                      Click to upload
                    </p>
                    <p className={`text-sm ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>
                      .xlsx, .xls, or .csv
                    </p>
                  </div>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  
                  <button
                    onClick={downloadTemplate}
                    className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg ${
                      isLight 
                        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        : 'bg-slate-700 text-white hover:bg-slate-600'
                    }`}
                  >
                    <Download className="w-4 h-4" />
                    Download Template
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Employee Modal */}
      {showAddModal && (
        <EmployeeModal
          isOpen={showAddModal}
          onClose={() => { setShowAddModal(false); setEditingEmployee(null); }}
          employee={editingEmployee}
          skills={skills}
          onSuccess={() => {
            setShowAddModal(false);
            setEditingEmployee(null);
            loadData();
          }}
          isLight={isLight}
        />
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)} />
          <div className={`relative w-full max-w-md p-6 rounded-2xl ${isLight ? 'bg-white' : 'bg-slate-900'}`}>
            <h3 className={`text-lg font-semibold mb-2 ${isLight ? 'text-gray-800' : 'text-white'}`}>
              Delete Employee
            </h3>
            <p className={`mb-6 ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>
              Are you sure you want to delete "{deleteConfirm.full_name}"?
            </p>
            <div className="flex items-center justify-end gap-3">
              <Button variant="secondary" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
              <Button variant="danger" onClick={() => handleDeleteEmployee(deleteConfirm.id)} leftIcon={<Trash2 className="w-4 h-4" />}>
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Employee Modal Component
function EmployeeModal({ isOpen, onClose, employee, skills, onSuccess, isLight }) {
  const [formData, setFormData] = useState({
    first_name: employee?.first_name || '',
    last_name: employee?.last_name || '',
    email: employee?.email || '',
    phone: employee?.phone || '',
    job_title: employee?.job_title || '',
    department: employee?.department || '',
    employee_id: employee?.employee_id || '',
    weekly_capacity_hours: employee?.weekly_capacity_hours || 40,
    availability_status: employee?.availability_status || 'available',
    selectedSkills: employee?.skills?.map(s => s.skill_id) || [],
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const submitData = {
        ...formData,
        skills: formData.selectedSkills.map(id => ({
          skill_id: id,
          proficiency: 'intermediate',
          years_experience: 0
        }))
      };
      delete submitData.selectedSkills;
      
      if (employee) {
        await employeesAPI.update(employee.id, submitData);
      } else {
        await employeesAPI.create(submitData);
      }
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save employee');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleSkill = (skillId) => {
    setFormData(prev => ({
      ...prev,
      selectedSkills: prev.selectedSkills.includes(skillId)
        ? prev.selectedSkills.filter(id => id !== skillId)
        : [...prev.selectedSkills, skillId]
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full max-w-lg rounded-2xl my-8 ${isLight ? 'bg-white' : 'bg-slate-900'}`}>
        <div className={`sticky top-0 p-6 border-b rounded-t-2xl z-10 ${isLight ? 'bg-white border-gray-200' : 'bg-slate-900 border-slate-700'}`}>
          <div className="flex items-center justify-between">
            <h2 className={`text-xl font-semibold ${isLight ? 'text-gray-800' : 'text-white'}`}>
              {employee ? 'Edit Employee' : 'Add New Employee'}
            </h2>
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-1 ${isLight ? 'text-gray-700' : 'text-slate-300'}`}>
                First Name *
              </label>
              <input
                type="text"
                required
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                className={`w-full px-3 py-2 rounded-lg border ${
                  isLight ? 'bg-white border-gray-200' : 'bg-slate-800 border-slate-700 text-white'
                }`}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1 ${isLight ? 'text-gray-700' : 'text-slate-300'}`}>
                Last Name *
              </label>
              <input
                type="text"
                required
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                className={`w-full px-3 py-2 rounded-lg border ${
                  isLight ? 'bg-white border-gray-200' : 'bg-slate-800 border-slate-700 text-white'
                }`}
              />
            </div>
          </div>

          <div>
            <label className={`block text-sm font-medium mb-1 ${isLight ? 'text-gray-700' : 'text-slate-300'}`}>
              Email *
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className={`w-full px-3 py-2 rounded-lg border ${
                isLight ? 'bg-white border-gray-200' : 'bg-slate-800 border-slate-700 text-white'
              }`}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-1 ${isLight ? 'text-gray-700' : 'text-slate-300'}`}>
                Phone
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className={`w-full px-3 py-2 rounded-lg border ${
                  isLight ? 'bg-white border-gray-200' : 'bg-slate-800 border-slate-700 text-white'
                }`}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1 ${isLight ? 'text-gray-700' : 'text-slate-300'}`}>
                Employee ID
              </label>
              <input
                type="text"
                value={formData.employee_id}
                onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                className={`w-full px-3 py-2 rounded-lg border ${
                  isLight ? 'bg-white border-gray-200' : 'bg-slate-800 border-slate-700 text-white'
                }`}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-1 ${isLight ? 'text-gray-700' : 'text-slate-300'}`}>
                Job Title
              </label>
              <input
                type="text"
                value={formData.job_title}
                onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
                className={`w-full px-3 py-2 rounded-lg border ${
                  isLight ? 'bg-white border-gray-200' : 'bg-slate-800 border-slate-700 text-white'
                }`}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1 ${isLight ? 'text-gray-700' : 'text-slate-300'}`}>
                Department
              </label>
              <input
                type="text"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className={`w-full px-3 py-2 rounded-lg border ${
                  isLight ? 'bg-white border-gray-200' : 'bg-slate-800 border-slate-700 text-white'
                }`}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-1 ${isLight ? 'text-gray-700' : 'text-slate-300'}`}>
                Weekly Capacity (hours)
              </label>
              <input
                type="number"
                min="1"
                max="168"
                value={formData.weekly_capacity_hours}
                onChange={(e) => setFormData({ ...formData, weekly_capacity_hours: parseInt(e.target.value) })}
                className={`w-full px-3 py-2 rounded-lg border ${
                  isLight ? 'bg-white border-gray-200' : 'bg-slate-800 border-slate-700 text-white'
                }`}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1 ${isLight ? 'text-gray-700' : 'text-slate-300'}`}>
                Availability
              </label>
              <select
                value={formData.availability_status}
                onChange={(e) => setFormData({ ...formData, availability_status: e.target.value })}
                className={`w-full px-3 py-2 rounded-lg border ${
                  isLight ? 'bg-white border-gray-200' : 'bg-slate-800 border-slate-700 text-white'
                }`}
              >
                <option value="available">Available</option>
                <option value="partially_available">Partially Available</option>
                <option value="busy">Busy</option>
                <option value="on_leave">On Leave</option>
                <option value="unavailable">Unavailable</option>
              </select>
            </div>
          </div>

          {/* Skills Selection */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${isLight ? 'text-gray-700' : 'text-slate-300'}`}>
              Skills
            </label>
            <div className="flex flex-wrap gap-2">
              {skills.map((skill) => (
                <button
                  key={skill.id}
                  type="button"
                  onClick={() => toggleSkill(skill.id)}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    formData.selectedSkills.includes(skill.id)
                      ? 'bg-primary-500 text-white'
                      : isLight 
                        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' 
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {skill.name}
                </button>
              ))}
              {skills.length === 0 && (
                <p className={`text-sm ${isLight ? 'text-gray-500' : 'text-slate-500'}`}>
                  No skills defined yet. Skills can be added from the admin panel.
                </p>
              )}
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
              {submitting ? 'Saving...' : (employee ? 'Update Employee' : 'Add Employee')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
