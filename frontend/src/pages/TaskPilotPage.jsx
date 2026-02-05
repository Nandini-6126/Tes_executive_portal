import { useState, useEffect } from 'react';
import { 
  Sparkles, Briefcase, ListTodo, Users, ChevronRight, Plus,
  AlertCircle, CheckCircle, Clock, ArrowLeft, Wand2, UserPlus
} from 'lucide-react';
import { servicesAPI, tasksAPI, employeesAPI, aiAPI } from '../api/client';
import { useSettings } from '../context/SettingsContext';
import Button from '../components/common/Button';
import Modal, { ModalForm, ModalFooter, ModalError } from '../components/common/Modal';
import { PageLoader } from '../components/common/LoadingSpinner';

export default function TaskPilotPage() {
  const { isLightTheme } = useSettings();
  const isLight = isLightTheme;
  
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    setIsLoading(true);
    try {
      const response = await servicesAPI.getAll({ page: 1, page_size: 100 });
      setServices(response.data.data || []);
    } catch (err) {
      console.error('Failed to load services:', err);
      setServices([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadServiceTasks = async (serviceId) => {
    try {
      const response = await tasksAPI.getAll({ service_id: serviceId, page: 1, page_size: 100 });
      setTasks(response.data.data || []);
    } catch (err) {
      console.error('Failed to load tasks:', err);
      setTasks([]);
    }
  };

  const handleSelectService = async (service) => {
    setSelectedService(service);
    await loadServiceTasks(service.id);
  };

  const handleTaskCreated = () => {
    setShowAddTaskModal(false);
    if (selectedService) {
      loadServiceTasks(selectedService.id);
    }
  };

  const handleAITasksGenerated = (generatedTasks) => {
    setShowAIModal(false);
    if (selectedService) {
      loadServiceTasks(selectedService.id);
    }
  };

  if (isLoading) {
    return <PageLoader text="Loading Task Pilot..." />;
  }

  // No services available
  if (services.length === 0) {
    return (
      <div className="space-y-6 animate-fadeIn">
        <Header isLight={isLight} />
        <div className={`p-12 text-center rounded-xl ${
          isLight ? 'bg-white shadow-sm border border-gray-100' : 'bg-slate-800/50 border border-slate-700/50'
        }`}>
          <Briefcase className={`w-16 h-16 mx-auto mb-4 ${isLight ? 'text-gray-300' : 'text-slate-600'}`} />
          <h3 className={`text-xl font-semibold mb-2 ${isLight ? 'text-gray-800' : 'text-white'}`}>
            No Services Available
          </h3>
          <p className={`max-w-md mx-auto mb-6 ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>
            First, add a client and create services under it. Then you can manage tasks and assign employees here.
          </p>
          <Button variant="primary" onClick={() => window.location.href = '/clients'}>
            Go to Clients
          </Button>
        </div>
      </div>
    );
  }

  // Service selection view
  if (!selectedService) {
    return (
      <div className="space-y-6 animate-fadeIn">
        <Header isLight={isLight} />
        
        <div className={`p-6 rounded-xl ${
          isLight ? 'bg-gradient-to-r from-primary-50 to-blue-50 border border-primary-100' : 'bg-gradient-to-r from-primary-500/10 to-blue-500/10 border border-primary-500/20'
        }`}>
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              isLight ? 'bg-white shadow-sm' : 'bg-slate-800'
            }`}>
              <Sparkles className="w-6 h-6 text-primary-500" />
            </div>
            <div>
              <h3 className={`font-semibold ${isLight ? 'text-gray-800' : 'text-white'}`}>
                Select a Service to Get Started
              </h3>
              <p className={`text-sm mt-1 ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>
                Choose a service below to manage its tasks. You can manually create tasks or use AI to analyze 
                the service and generate task recommendations with employee assignments.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((service) => (
            <div
              key={service.id}
              onClick={() => handleSelectService(service)}
              className={`p-5 rounded-xl cursor-pointer transition-all ${
                isLight 
                  ? 'bg-white shadow-sm border border-gray-100 hover:shadow-md hover:border-primary-200' 
                  : 'bg-slate-800/50 border border-slate-700/50 hover:border-primary-500/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    isLight ? 'bg-primary-50' : 'bg-primary-500/10'
                  }`}>
                    <Briefcase className="w-5 h-5 text-primary-500" />
                  </div>
                  <div>
                    <h3 className={`font-semibold ${isLight ? 'text-gray-800' : 'text-white'}`}>
                      {service.name}
                    </h3>
                    <p className={`text-sm ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>
                      {service.client_name || service.customer_name}
                    </p>
                  </div>
                </div>
                <ChevronRight className={`w-5 h-5 ${isLight ? 'text-gray-400' : 'text-slate-500'}`} />
              </div>
              
              <div className="mt-4 pt-4 border-t flex items-center justify-between" style={{ borderColor: isLight ? '#e5e7eb' : '#374151' }}>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                  service.status === 'active' 
                    ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400'
                    : 'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-slate-400'
                }`}>
                  {service.status}
                </span>
                <span className={`text-sm ${isLight ? 'text-gray-500' : 'text-slate-500'}`}>
                  {service.resource_count || 0} resources
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Task management view for selected service
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Back button and header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => { setSelectedService(null); setTasks([]); }}
          className={`p-2 rounded-lg transition-colors ${
            isLight ? 'hover:bg-gray-100 text-gray-600' : 'hover:bg-slate-800 text-slate-400'
          }`}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className={`text-2xl font-bold flex items-center gap-3 ${isLight ? 'text-gray-800' : 'text-white'}`}>
            <Sparkles className="w-7 h-7 text-primary-500" />
            Task Pilot
          </h1>
          <p className={`${isLight ? 'text-gray-500' : 'text-slate-400'}`}>
            Managing tasks for: <span className="font-semibold">{selectedService.name}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="secondary" 
            onClick={() => setShowAIModal(true)}
            leftIcon={<Wand2 className="w-4 h-4" />}
          >
            AI Generate
          </Button>
          <Button 
            variant="primary" 
            onClick={() => setShowAddTaskModal(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Add Task
          </Button>
        </div>
      </div>

      {/* Service info card */}
      <div className={`p-5 rounded-xl ${
        isLight ? 'bg-white shadow-sm border border-gray-100' : 'bg-slate-800/50 border border-slate-700/50'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              isLight ? 'bg-primary-50' : 'bg-primary-500/10'
            }`}>
              <Briefcase className="w-6 h-6 text-primary-500" />
            </div>
            <div>
              <h2 className={`text-lg font-semibold ${isLight ? 'text-gray-800' : 'text-white'}`}>
                {selectedService.name}
              </h2>
              <p className={`text-sm ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>
                Client: {selectedService.client_name || selectedService.customer_name} | Status: {selectedService.status}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className={`text-2xl font-bold ${isLight ? 'text-gray-800' : 'text-white'}`}>
              {tasks.length}
            </p>
            <p className={`text-sm ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>Tasks</p>
          </div>
        </div>
      </div>

      {/* Tasks list */}
      {tasks.length > 0 ? (
        <div className="space-y-3">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              isLight={isLight}
              onAssign={() => { setSelectedTask(task); setShowAssignModal(true); }}
            />
          ))}
        </div>
      ) : (
        <div className={`p-12 text-center rounded-xl border-2 border-dashed ${
          isLight ? 'border-gray-200 bg-gray-50/50' : 'border-slate-700 bg-slate-800/30'
        }`}>
          <ListTodo className={`w-16 h-16 mx-auto mb-4 ${isLight ? 'text-gray-300' : 'text-slate-600'}`} />
          <h3 className={`text-lg font-semibold mb-2 ${isLight ? 'text-gray-800' : 'text-white'}`}>
            No Tasks Yet
          </h3>
          <p className={`max-w-md mx-auto mb-6 ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>
            Create tasks manually or use AI to analyze this service and generate task recommendations with employee assignments.
          </p>
          <div className="flex justify-center gap-3">
            <Button variant="secondary" onClick={() => setShowAIModal(true)} leftIcon={<Wand2 className="w-4 h-4" />}>
              AI Generate Tasks
            </Button>
            <Button variant="primary" onClick={() => setShowAddTaskModal(true)} leftIcon={<Plus className="w-4 h-4" />}>
              Add Task Manually
            </Button>
          </div>
        </div>
      )}

      {/* Add Task Modal */}
      <AddTaskModal
        isOpen={showAddTaskModal}
        onClose={() => setShowAddTaskModal(false)}
        service={selectedService}
        onSuccess={handleTaskCreated}
      />

      {/* AI Generation Modal */}
      <AIGenerateModal
        isOpen={showAIModal}
        onClose={() => setShowAIModal(false)}
        service={selectedService}
        onSuccess={handleAITasksGenerated}
      />

      {/* Assign Employee Modal */}
      <AssignEmployeeModal
        isOpen={showAssignModal}
        onClose={() => { setShowAssignModal(false); setSelectedTask(null); }}
        task={selectedTask}
        onSuccess={() => {
          setShowAssignModal(false);
          setSelectedTask(null);
          loadServiceTasks(selectedService.id);
        }}
      />
    </div>
  );
}

// Header Component
function Header({ isLight }) {
  return (
    <div>
      <h1 className={`text-2xl font-bold flex items-center gap-3 ${isLight ? 'text-gray-800' : 'text-white'}`}>
        <Sparkles className="w-7 h-7 text-primary-500" />
        Task Pilot
      </h1>
      <p className={`mt-1 ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>
        AI-powered task management and employee assignment
      </p>
    </div>
  );
}

// Task Card Component
function TaskCard({ task, isLight, onAssign }) {
  const priorityColors = {
    low: 'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-slate-400',
    medium: 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400',
    high: 'bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400',
    critical: 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400',
  };

  const statusColors = {
    pending: { bg: 'bg-yellow-100 dark:bg-yellow-500/20', text: 'text-yellow-700 dark:text-yellow-400', icon: Clock },
    in_progress: { bg: 'bg-blue-100 dark:bg-blue-500/20', text: 'text-blue-700 dark:text-blue-400', icon: Clock },
    completed: { bg: 'bg-green-100 dark:bg-green-500/20', text: 'text-green-700 dark:text-green-400', icon: CheckCircle },
    blocked: { bg: 'bg-red-100 dark:bg-red-500/20', text: 'text-red-700 dark:text-red-400', icon: AlertCircle },
  };

  const status = statusColors[task.status] || statusColors.pending;
  const StatusIcon = status.icon;

  return (
    <div className={`p-5 rounded-xl ${
      isLight ? 'bg-white shadow-sm border border-gray-100' : 'bg-slate-800/50 border border-slate-700/50'
    }`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h3 className={`font-semibold ${isLight ? 'text-gray-800' : 'text-white'}`}>
              {task.name}
            </h3>
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${status.bg} ${status.text}`}>
              {task.status?.replace('_', ' ')}
            </span>
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${priorityColors[task.priority] || priorityColors.medium}`}>
              {task.priority}
            </span>
          </div>
          
          {task.description && (
            <p className={`text-sm mt-2 ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>
              {task.description}
            </p>
          )}

          <div className="flex items-center gap-4 mt-3 flex-wrap">
            {task.estimated_hours && (
              <span className={`flex items-center gap-1.5 text-sm ${isLight ? 'text-gray-500' : 'text-slate-500'}`}>
                <Clock className="w-4 h-4" />
                {task.estimated_hours}h estimated
              </span>
            )}
            {task.assigned_to && (
              <span className={`flex items-center gap-1.5 text-sm ${isLight ? 'text-gray-500' : 'text-slate-500'}`}>
                <Users className="w-4 h-4" />
                Assigned to: {task.assigned_to}
              </span>
            )}
          </div>
        </div>
        
        <Button 
          variant="secondary" 
          size="sm" 
          onClick={onAssign}
          leftIcon={<UserPlus className="w-4 h-4" />}
        >
          Assign
        </Button>
      </div>

      {/* AI Recommendations */}
      {task.ai_recommendations && task.ai_recommendations.length > 0 && (
        <div className={`mt-4 pt-4 border-t ${isLight ? 'border-gray-100' : 'border-slate-700'}`}>
          <p className={`text-xs font-medium mb-2 ${isLight ? 'text-gray-500' : 'text-slate-500'}`}>
            AI Recommended Employees
          </p>
          <div className="flex gap-2">
            {task.ai_recommendations.slice(0, 3).map((rec, idx) => (
              <span
                key={idx}
                className={`px-3 py-1.5 rounded-lg text-sm ${
                  isLight ? 'bg-primary-50 text-primary-700' : 'bg-primary-500/10 text-primary-400'
                }`}
              >
                {rec.name} ({rec.match_score}%)
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Add Task Modal
function AddTaskModal({ isOpen, onClose, service, onSuccess }) {
  const { isLightTheme } = useSettings();
  const isLight = isLightTheme;
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    priority: 'medium',
    estimated_hours: '',
    required_skills: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setFormData({
      name: '',
      description: '',
      priority: 'medium',
      estimated_hours: '',
      required_skills: '',
    });
    setError('');
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!service) return;
    
    setSubmitting(true);
    setError('');

    try {
      await tasksAPI.create({
        ...formData,
        service_id: service.id,
        estimated_hours: formData.estimated_hours ? parseFloat(formData.estimated_hours) : null,
        status: 'pending',
      });
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create task');
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
      title="Add New Task"
      subtitle={service ? `For service: ${service.name}` : ''}
      size="md"
    >
      <ModalForm onSubmit={handleSubmit}>
        <ModalError message={error} />

        <div>
          <label className={labelClass}>Task Name *</label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Setup development environment"
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Description</label>
          <textarea
            rows={3}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Detailed description of the task..."
            className={inputClass}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
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
              <option value="critical">Critical</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Estimated Hours</label>
            <input
              type="number"
              min="0.5"
              step="0.5"
              value={formData.estimated_hours}
              onChange={(e) => setFormData({ ...formData, estimated_hours: e.target.value })}
              placeholder="e.g., 8"
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label className={labelClass}>Required Skills</label>
          <input
            type="text"
            value={formData.required_skills}
            onChange={(e) => setFormData({ ...formData, required_skills: e.target.value })}
            placeholder="e.g., React, Python, AWS (comma separated)"
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
          {submitting ? 'Creating...' : 'Create Task'}
        </Button>
      </ModalFooter>
    </Modal>
  );
}

// AI Generate Modal
function AIGenerateModal({ isOpen, onClose, service, onSuccess }) {
  const { isLightTheme } = useSettings();
  const isLight = isLightTheme;
  
  const [serviceDetails, setServiceDetails] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    setServiceDetails('');
    setResult(null);
    setError('');
  }, [isOpen]);

  const handleGenerate = async () => {
    if (!service) return;
    
    setLoading(true);
    setError('');

    try {
      const response = await aiAPI.analyzeService({
        service_id: service.id,
        service_name: service.name,
        additional_context: serviceDetails,
      });
      setResult(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to generate tasks. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!result?.tasks) return;
    
    setLoading(true);
    try {
      for (const task of result.tasks) {
        await tasksAPI.create({
          name: task.name,
          description: task.description,
          service_id: service.id,
          priority: task.priority || 'medium',
          estimated_hours: task.estimated_hours,
          status: 'pending',
        });
      }
      onSuccess(result.tasks);
    } catch (err) {
      setError('Failed to create tasks');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="AI Task Generation"
      subtitle="Let AI analyze the service and generate tasks with employee recommendations"
      size="lg"
    >
      <div className="p-6">
        {!result && !loading && (
          <div className="space-y-5">
            <div className={`p-4 rounded-lg flex items-start gap-3 ${
              isLight ? 'bg-primary-50 border border-primary-100' : 'bg-primary-500/10 border border-primary-500/20'
            }`}>
              <Sparkles className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className={`font-medium ${isLight ? 'text-primary-800' : 'text-primary-300'}`}>
                  How it works
                </h4>
                <p className={`text-sm ${isLight ? 'text-primary-700' : 'text-primary-400'}`}>
                  Our AI will analyze the service "{service?.name}" and generate a list of tasks. 
                  It will also recommend the best employees based on their skills and current workload.
                </p>
              </div>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-1.5 ${isLight ? 'text-gray-700' : 'text-slate-300'}`}>
                Additional Context (Optional)
              </label>
              <textarea
                rows={4}
                value={serviceDetails}
                onChange={(e) => setServiceDetails(e.target.value)}
                placeholder="Provide additional details about the service requirements, timeline, or specific needs..."
                className={`w-full px-4 py-2.5 rounded-lg border transition-colors ${
                  isLight 
                    ? 'bg-white border-gray-300 focus:border-primary-500' 
                    : 'bg-slate-800 border-slate-600 text-white focus:border-primary-500'
                } outline-none focus:ring-2 focus:ring-primary-500/20`}
              />
            </div>
          </div>
        )}

        {loading && (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className={isLight ? 'text-gray-600' : 'text-slate-400'}>
              {result ? 'Creating tasks...' : 'Analyzing service and generating tasks...'}
            </p>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 mb-4">
            {error}
          </div>
        )}

        {result && !loading && (
          <div className="space-y-5">
            <div className={`p-4 rounded-lg ${
              isLight ? 'bg-green-50 border border-green-200' : 'bg-green-500/10 border border-green-500/20'
            }`}>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className={isLight ? 'text-green-700' : 'text-green-400'}>
                  Generated {result.tasks?.length || 0} tasks
                </span>
              </div>
            </div>

            <div className="space-y-3 max-h-64 overflow-y-auto">
              {result.tasks?.map((task, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-lg ${
                    isLight ? 'bg-gray-50 border border-gray-200' : 'bg-slate-800/50 border border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className={`font-medium ${isLight ? 'text-gray-800' : 'text-white'}`}>
                        {task.name}
                      </h4>
                      <p className={`text-sm mt-1 ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>
                        {task.description}
                      </p>
                    </div>
                    <span className={`text-sm ${isLight ? 'text-gray-500' : 'text-slate-500'}`}>
                      {task.estimated_hours}h
                    </span>
                  </div>
                  
                  {task.recommended_employees && task.recommended_employees.length > 0 && (
                    <div className="mt-3 pt-3 border-t" style={{ borderColor: isLight ? '#e5e7eb' : '#374151' }}>
                      <p className={`text-xs font-medium mb-2 ${isLight ? 'text-gray-500' : 'text-slate-500'}`}>
                        Recommended Employees
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {task.recommended_employees.map((emp, empIdx) => (
                          <span
                            key={empIdx}
                            className={`px-2 py-1 rounded text-xs ${
                              isLight ? 'bg-primary-100 text-primary-700' : 'bg-primary-500/20 text-primary-400'
                            }`}
                          >
                            {emp.name} ({emp.match_score}%)
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <ModalFooter>
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        {!result ? (
          <Button 
            variant="primary" 
            onClick={handleGenerate}
            disabled={loading}
            leftIcon={<Wand2 className="w-4 h-4" />}
          >
            Generate Tasks
          </Button>
        ) : (
          <Button 
            variant="primary" 
            onClick={handleConfirm}
            disabled={loading}
            leftIcon={<CheckCircle className="w-4 h-4" />}
          >
            Create These Tasks
          </Button>
        )}
      </ModalFooter>
    </Modal>
  );
}

// Assign Employee Modal
function AssignEmployeeModal({ isOpen, onClose, task, onSuccess }) {
  const { isLightTheme } = useSettings();
  const isLight = isLightTheme;
  
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadEmployees();
    }
  }, [isOpen]);

  const loadEmployees = async () => {
    setLoading(true);
    try {
      const response = await employeesAPI.getAll({ page: 1, page_size: 100 });
      setEmployees(response.data.data || []);
    } catch (err) {
      console.error('Failed to load employees:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!task || !selectedEmployee) return;
    
    setLoading(true);
    setError('');

    try {
      await tasksAPI.assign(task.id, { employee_id: selectedEmployee.id });
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to assign employee');
    } finally {
      setLoading(false);
    }
  };

  const availableEmployees = employees.filter(e => e.availability_status === 'available' || e.availability_status === 'partially_available');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Assign Employee"
      subtitle={task ? `Assigning: ${task.name}` : ''}
      size="md"
    >
      <div className="p-6">
        <ModalError message={error} />

        {loading && employees.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-8 h-8 border-3 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : availableEmployees.length > 0 ? (
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {availableEmployees.map((emp) => (
              <div
                key={emp.id}
                onClick={() => setSelectedEmployee(emp)}
                className={`p-4 rounded-lg cursor-pointer transition-all ${
                  selectedEmployee?.id === emp.id
                    ? isLight 
                      ? 'bg-primary-50 border-2 border-primary-500' 
                      : 'bg-primary-500/10 border-2 border-primary-500'
                    : isLight 
                      ? 'bg-gray-50 border border-gray-200 hover:border-gray-300' 
                      : 'bg-slate-800/50 border border-slate-700 hover:border-slate-600'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${
                      emp.availability_status === 'available' ? 'bg-green-500' : 'bg-yellow-500'
                    }`}>
                      {emp.first_name?.[0]}{emp.last_name?.[0]}
                    </div>
                    <div>
                      <p className={`font-medium ${isLight ? 'text-gray-800' : 'text-white'}`}>
                        {emp.full_name}
                      </p>
                      <p className={`text-sm ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>
                        {emp.job_title}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>
                      Workload: {emp.workload_percentage || 0}%
                    </p>
                    <p className={`text-xs ${
                      emp.availability_status === 'available' ? 'text-green-600' : 'text-yellow-600'
                    }`}>
                      {emp.availability_status?.replace('_', ' ')}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Users className={`w-12 h-12 mx-auto mb-3 ${isLight ? 'text-gray-300' : 'text-slate-600'}`} />
            <p className={isLight ? 'text-gray-500' : 'text-slate-400'}>
              No available employees found
            </p>
          </div>
        )}
      </div>

      <ModalFooter>
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button 
          variant="primary" 
          onClick={handleAssign}
          disabled={!selectedEmployee || loading}
          leftIcon={<UserPlus className="w-4 h-4" />}
        >
          {loading ? 'Assigning...' : 'Assign Employee'}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
