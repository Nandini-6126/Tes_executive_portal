import { useState, useEffect } from 'react';
import { 
  Zap, Plus, Search, Clock, CheckCircle, AlertCircle,
  Calendar, ChevronRight, Sparkles, User, X, 
  Target, Brain, RefreshCw, Briefcase, ArrowRight, List
} from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { servicesAPI, tasksAPI, employeesAPI } from '../api/client';
import Button from '../components/common/Button';
import { PageLoader } from '../components/common/LoadingSpinner';

export default function TaskPilotPage() {
  const { isLightTheme } = useSettings();
  const isLight = isLightTheme;
  
  // Data states
  const [services, setServices] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // UI states
  const [selectedService, setSelectedService] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showCreateOptions, setShowCreateOptions] = useState(false);
  const [showManualCreate, setShowManualCreate] = useState(false);
  const [showAIGenerate, setShowAIGenerate] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  
  // AI states
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiGeneratedTasks, setAiGeneratedTasks] = useState(null);
  const [aiRecommendations, setAiRecommendations] = useState([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedService) {
      loadServiceTasks(selectedService.id);
    }
  }, [selectedService]);

  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      const [servicesRes, employeesRes] = await Promise.all([
        servicesAPI.filter({ page: 1, page_size: 100 }),
        employeesAPI.getAll({ page: 1, page_size: 100 })
      ]);
      setServices(servicesRes.data.data || []);
      setEmployees(employeesRes.data.data || []);
    } catch (err) {
      console.error('Failed to load data:', err);
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

  const handleAIGenerateTasks = async (additionalContext = '') => {
    if (!selectedService) return;
    
    setAiGenerating(true);
    try {
      const response = await tasksAPI.generateTasks({
        service_id: selectedService.id,
        additional_context: additionalContext
      });
      setAiGeneratedTasks(response.data);
    } catch (err) {
      console.error('Failed to generate tasks:', err);
      alert('Failed to generate tasks. Please try again.');
    } finally {
      setAiGenerating(false);
    }
  };

  const handleSaveAITasks = async () => {
    if (!selectedService || !aiGeneratedTasks) return;
    
    setAiGenerating(true);
    try {
      await tasksAPI.generateAndSaveTasks({
        service_id: selectedService.id
      });
      setShowAIGenerate(false);
      setAiGeneratedTasks(null);
      loadServiceTasks(selectedService.id);
    } catch (err) {
      console.error('Failed to save tasks:', err);
      alert('Failed to save tasks. Please try again.');
    } finally {
      setAiGenerating(false);
    }
  };

  const handleGetRecommendations = async (task) => {
    setSelectedTask(task);
    setShowAssignModal(true);
    setLoadingRecommendations(true);
    setAiRecommendations([]);
    
    try {
      const response = await tasksAPI.recommendEmployees({
        task_id: task.id,
        top_n: 3
      });
      setAiRecommendations(response.data.recommendations || []);
    } catch (err) {
      console.error('Failed to get recommendations:', err);
      // Fallback: show available employees
      setAiRecommendations([]);
    } finally {
      setLoadingRecommendations(false);
    }
  };

  const handleAssignTask = async (employeeId, isAiRecommended = false, recommendation = null) => {
    if (!selectedTask) return;
    
    try {
      await tasksAPI.assign(selectedTask.id, {
        employee_id: employeeId,
        is_ai_recommended: isAiRecommended,
        ai_match_score: recommendation?.overall_score,
        ai_reasoning: recommendation?.reasoning
      });
      setShowAssignModal(false);
      setSelectedTask(null);
      setAiRecommendations([]);
      loadServiceTasks(selectedService.id);
    } catch (err) {
      console.error('Failed to assign task:', err);
      alert('Failed to assign task. Please try again.');
    }
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         task.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || task.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'high': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-500/20 text-green-400';
      case 'in_progress': return 'bg-blue-500/20 text-blue-400';
      case 'assigned': return 'bg-purple-500/20 text-purple-400';
      case 'pending': return 'bg-slate-500/20 text-slate-400';
      default: return 'bg-slate-500/20 text-slate-400';
    }
  };

  if (isLoading) {
    return <PageLoader text="Loading Task Pilot..." />;
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-2xl font-bold flex items-center gap-3 ${isLight ? 'text-gray-800' : 'text-white'}`}>
            <Zap className="w-7 h-7 text-yellow-500" />
            Task Pilot
          </h1>
          <p className={`mt-1 ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>
            AI-powered task management and employee assignment
          </p>
        </div>
      </div>

      {/* Service Selection */}
      {!selectedService ? (
        <div className="space-y-4">
          <h2 className={`text-lg font-semibold ${isLight ? 'text-gray-700' : 'text-slate-300'}`}>
            Step 1: Select a Service
          </h2>
          
          {services.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {services.map((service) => (
                <div
                  key={service.id}
                  onClick={() => setSelectedService(service)}
                  className={`p-6 rounded-xl cursor-pointer transition-all hover:scale-102 ${
                    isLight 
                      ? 'bg-white shadow-md hover:shadow-lg border-2 border-transparent hover:border-primary-500' 
                      : 'bg-slate-800/50 border border-slate-700/50 hover:border-primary-500'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        isLight ? 'bg-primary-100' : 'bg-primary-500/20'
                      }`}>
                        <Briefcase className="w-5 h-5 text-primary-500" />
                      </div>
                      <div>
                        <h3 className={`font-semibold ${isLight ? 'text-gray-800' : 'text-white'}`}>
                          {service.name}
                        </h3>
                        <p className={`text-sm ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>
                          {service.customer_name}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className={`w-5 h-5 ${isLight ? 'text-gray-400' : 'text-slate-500'}`} />
                  </div>
                  <div className="mt-4 flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-xs ${getStatusColor(service.status)}`}>
                      {service.status}
                    </span>
                    <span className={`text-xs ${isLight ? 'text-gray-400' : 'text-slate-500'}`}>
                      {service.resource_count || 0} resources
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={`p-12 text-center rounded-xl ${isLight ? 'bg-white shadow-md' : 'bg-slate-800/50 border border-slate-700/50'}`}>
              <Briefcase className={`w-16 h-16 mx-auto mb-4 ${isLight ? 'text-gray-300' : 'text-slate-600'}`} />
              <h3 className={`text-lg font-medium mb-2 ${isLight ? 'text-gray-800' : 'text-white'}`}>
                No Services Yet
              </h3>
              <p className={`mb-4 ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>
                First add a client and create services under it. Then you can manage tasks here.
              </p>
              <Button variant="primary" onClick={() => window.location.href = '/clients'}>
                Go to Clients
              </Button>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Selected Service Header */}
          <div className={`p-4 rounded-xl flex items-center justify-between ${
            isLight ? 'bg-primary-50 border border-primary-200' : 'bg-primary-500/10 border border-primary-500/30'
          }`}>
            <div className="flex items-center gap-4">
              <button
                onClick={() => { setSelectedService(null); setTasks([]); }}
                className={`p-2 rounded-lg ${isLight ? 'hover:bg-primary-100' : 'hover:bg-primary-500/20'}`}
              >
                <ArrowRight className="w-5 h-5 rotate-180 text-primary-500" />
              </button>
              <div>
                <p className={`text-sm ${isLight ? 'text-primary-600' : 'text-primary-400'}`}>Selected Service</p>
                <h3 className={`font-semibold ${isLight ? 'text-primary-800' : 'text-primary-300'}`}>
                  {selectedService.name}
                </h3>
              </div>
            </div>
            <Button
              variant="primary"
              onClick={() => setShowCreateOptions(true)}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Create Tasks
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className={`p-4 rounded-xl ${isLight ? 'bg-white shadow-md' : 'bg-slate-800/50 border border-slate-700/50'}`}>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Target className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className={`text-2xl font-bold ${isLight ? 'text-gray-800' : 'text-white'}`}>{tasks.length}</p>
                  <p className={`text-sm ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>Total Tasks</p>
                </div>
              </div>
            </div>
            <div className={`p-4 rounded-xl ${isLight ? 'bg-white shadow-md' : 'bg-slate-800/50 border border-slate-700/50'}`}>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-500/20 rounded-lg">
                  <Clock className="w-5 h-5 text-yellow-400" />
                </div>
                <div>
                  <p className={`text-2xl font-bold ${isLight ? 'text-gray-800' : 'text-white'}`}>
                    {tasks.filter(t => t.status === 'pending').length}
                  </p>
                  <p className={`text-sm ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>Pending</p>
                </div>
              </div>
            </div>
            <div className={`p-4 rounded-xl ${isLight ? 'bg-white shadow-md' : 'bg-slate-800/50 border border-slate-700/50'}`}>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className={`text-2xl font-bold ${isLight ? 'text-gray-800' : 'text-white'}`}>
                    {tasks.filter(t => t.status === 'completed').length}
                  </p>
                  <p className={`text-sm ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>Completed</p>
                </div>
              </div>
            </div>
            <div className={`p-4 rounded-xl ${isLight ? 'bg-white shadow-md' : 'bg-slate-800/50 border border-slate-700/50'}`}>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <Brain className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className={`text-2xl font-bold ${isLight ? 'text-gray-800' : 'text-white'}`}>AI</p>
                  <p className={`text-sm ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>Powered</p>
                </div>
              </div>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${isLight ? 'text-gray-400' : 'text-slate-500'}`} />
              <input
                type="text"
                placeholder="Search tasks..."
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
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="assigned">Assigned</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          {/* Tasks List */}
          {filteredTasks.length > 0 ? (
            <div className="space-y-3">
              {filteredTasks.map((task) => (
                <div
                  key={task.id}
                  className={`p-4 rounded-xl ${isLight ? 'bg-white shadow-md' : 'bg-slate-800/50 border border-slate-700/50'}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className={`font-semibold ${isLight ? 'text-gray-800' : 'text-white'}`}>
                          {task.title}
                        </h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs border ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs ${getStatusColor(task.status)}`}>
                          {task.status?.replace('_', ' ')}
                        </span>
                        {task.is_ai_generated && (
                          <span className="px-2 py-0.5 rounded-full text-xs bg-purple-500/20 text-purple-400">
                            AI Generated
                          </span>
                        )}
                      </div>
                      <p className={`text-sm mt-1 ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>
                        {task.description}
                      </p>
                      <div className="flex items-center gap-4 mt-3">
                        {task.due_date && (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4 text-slate-500" />
                            <span className={`text-sm ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>
                              Due: {new Date(task.due_date).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4 text-slate-500" />
                          <span className={`text-sm ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>
                            {task.estimated_hours}h estimated
                          </span>
                        </div>
                        {task.required_skills && task.required_skills.length > 0 && (
                          <div className="flex gap-1">
                            {task.required_skills.slice(0, 3).map((skill, idx) => (
                              <span
                                key={idx}
                                className={`px-2 py-0.5 rounded text-xs ${
                                  isLight ? 'bg-gray-100 text-gray-600' : 'bg-slate-700 text-slate-300'
                                }`}
                              >
                                {skill}
                              </span>
                            ))}
                            {task.required_skills.length > 3 && (
                              <span className={`text-xs ${isLight ? 'text-gray-400' : 'text-slate-500'}`}>
                                +{task.required_skills.length - 3}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {task.current_assignee_name ? (
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-white text-sm font-medium">
                            {task.current_assignee_name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <span className={`text-sm ${isLight ? 'text-gray-600' : 'text-slate-300'}`}>
                            {task.current_assignee_name}
                          </span>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleGetRecommendations(task)}
                          className="flex items-center gap-2 px-3 py-1.5 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-colors"
                        >
                          <Sparkles className="w-4 h-4" />
                          AI Assign
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={`p-12 text-center rounded-xl ${isLight ? 'bg-white shadow-md' : 'bg-slate-800/50 border border-slate-700/50'}`}>
              <Target className={`w-16 h-16 mx-auto mb-4 ${isLight ? 'text-gray-300' : 'text-slate-600'}`} />
              <h3 className={`text-lg font-medium mb-2 ${isLight ? 'text-gray-800' : 'text-white'}`}>
                No Tasks Yet
              </h3>
              <p className={`mb-4 ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>
                Create tasks manually or let AI generate them for you.
              </p>
              <Button variant="primary" onClick={() => setShowCreateOptions(true)} leftIcon={<Plus className="w-4 h-4" />}>
                Create Tasks
              </Button>
            </div>
          )}
        </>
      )}

      {/* Create Options Modal */}
      {showCreateOptions && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`w-full max-w-lg rounded-2xl ${isLight ? 'bg-white' : 'bg-slate-900'}`}>
            <div className={`p-6 border-b ${isLight ? 'border-gray-200' : 'border-slate-700'}`}>
              <div className="flex items-center justify-between">
                <h2 className={`text-xl font-semibold ${isLight ? 'text-gray-800' : 'text-white'}`}>
                  Create Tasks
                </h2>
                <button onClick={() => setShowCreateOptions(false)}>
                  <X className={`w-5 h-5 ${isLight ? 'text-gray-500' : 'text-slate-400'}`} />
                </button>
              </div>
              <p className={`text-sm mt-1 ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>
                Choose how you want to create tasks for {selectedService?.name}
              </p>
            </div>
            
            <div className="p-6 space-y-4">
              <button
                onClick={() => { setShowCreateOptions(false); setShowManualCreate(true); }}
                className={`w-full p-4 rounded-xl text-left transition-colors ${
                  isLight 
                    ? 'bg-gray-50 hover:bg-gray-100 border border-gray-200' 
                    : 'bg-slate-800 hover:bg-slate-700 border border-slate-700'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-500/20 rounded-lg">
                    <List className="w-6 h-6 text-blue-500" />
                  </div>
                  <div>
                    <h3 className={`font-semibold ${isLight ? 'text-gray-800' : 'text-white'}`}>
                      Create Manually
                    </h3>
                    <p className={`text-sm ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>
                      Add task details one by one
                    </p>
                  </div>
                </div>
              </button>
              
              <button
                onClick={() => { setShowCreateOptions(false); setShowAIGenerate(true); }}
                className={`w-full p-4 rounded-xl text-left transition-colors ${
                  isLight 
                    ? 'bg-purple-50 hover:bg-purple-100 border border-purple-200' 
                    : 'bg-purple-900/20 hover:bg-purple-900/30 border border-purple-500/30'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-purple-500/20 rounded-lg">
                    <Sparkles className="w-6 h-6 text-purple-500" />
                  </div>
                  <div>
                    <h3 className={`font-semibold ${isLight ? 'text-gray-800' : 'text-white'}`}>
                      AI Generate Tasks
                    </h3>
                    <p className={`text-sm ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>
                      Let AI analyze the service and suggest tasks
                    </p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Create Task Modal */}
      {showManualCreate && (
        <ManualTaskModal
          isOpen={showManualCreate}
          onClose={() => setShowManualCreate(false)}
          serviceId={selectedService?.id}
          onSuccess={() => {
            setShowManualCreate(false);
            loadServiceTasks(selectedService.id);
          }}
          isLight={isLight}
        />
      )}

      {/* AI Generate Tasks Modal */}
      {showAIGenerate && (
        <AIGenerateModal
          isOpen={showAIGenerate}
          onClose={() => { setShowAIGenerate(false); setAiGeneratedTasks(null); }}
          service={selectedService}
          onGenerate={handleAIGenerateTasks}
          onSave={handleSaveAITasks}
          generatedTasks={aiGeneratedTasks}
          isGenerating={aiGenerating}
          isLight={isLight}
        />
      )}

      {/* AI Assignment Modal */}
      {showAssignModal && selectedTask && (
        <AIAssignmentModal
          isOpen={showAssignModal}
          onClose={() => { setShowAssignModal(false); setSelectedTask(null); setAiRecommendations([]); }}
          task={selectedTask}
          recommendations={aiRecommendations}
          employees={employees}
          isLoading={loadingRecommendations}
          onAssign={handleAssignTask}
          isLight={isLight}
        />
      )}
    </div>
  );
}

// Manual Task Creation Modal
function ManualTaskModal({ isOpen, onClose, serviceId, onSuccess, isLight }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    estimated_hours: 8,
    required_skills: '',
    due_date: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      await tasksAPI.create({
        ...formData,
        service_id: serviceId,
        required_skills: formData.required_skills.split(',').map(s => s.trim()).filter(s => s),
        estimated_hours: parseFloat(formData.estimated_hours),
      });
      onSuccess();
    } catch (err) {
      console.error('Failed to create task:', err);
      alert('Failed to create task. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className={`w-full max-w-lg rounded-2xl ${isLight ? 'bg-white' : 'bg-slate-900'}`}>
        <div className={`p-6 border-b ${isLight ? 'border-gray-200' : 'border-slate-700'}`}>
          <div className="flex items-center justify-between">
            <h2 className={`text-xl font-semibold ${isLight ? 'text-gray-800' : 'text-white'}`}>
              Create Task Manually
            </h2>
            <button onClick={onClose}>
              <X className={`w-5 h-5 ${isLight ? 'text-gray-500' : 'text-slate-400'}`} />
            </button>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className={`block text-sm font-medium mb-1 ${isLight ? 'text-gray-700' : 'text-slate-300'}`}>
              Task Title *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
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
              className={`w-full px-3 py-2 rounded-lg border ${
                isLight ? 'bg-white border-gray-200' : 'bg-slate-800 border-slate-700 text-white'
              }`}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-1 ${isLight ? 'text-gray-700' : 'text-slate-300'}`}>
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className={`w-full px-3 py-2 rounded-lg border ${
                  isLight ? 'bg-white border-gray-200' : 'bg-slate-800 border-slate-700 text-white'
                }`}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1 ${isLight ? 'text-gray-700' : 'text-slate-300'}`}>
                Estimated Hours
              </label>
              <input
                type="number"
                min="1"
                value={formData.estimated_hours}
                onChange={(e) => setFormData({ ...formData, estimated_hours: e.target.value })}
                className={`w-full px-3 py-2 rounded-lg border ${
                  isLight ? 'bg-white border-gray-200' : 'bg-slate-800 border-slate-700 text-white'
                }`}
              />
            </div>
          </div>
          
          <div>
            <label className={`block text-sm font-medium mb-1 ${isLight ? 'text-gray-700' : 'text-slate-300'}`}>
              Required Skills (comma-separated)
            </label>
            <input
              type="text"
              placeholder="React, Node.js, PostgreSQL"
              value={formData.required_skills}
              onChange={(e) => setFormData({ ...formData, required_skills: e.target.value })}
              className={`w-full px-3 py-2 rounded-lg border ${
                isLight ? 'bg-white border-gray-200' : 'bg-slate-800 border-slate-700 text-white'
              }`}
            />
          </div>
          
          <div>
            <label className={`block text-sm font-medium mb-1 ${isLight ? 'text-gray-700' : 'text-slate-300'}`}>
              Due Date
            </label>
            <input
              type="date"
              value={formData.due_date}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
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
              {submitting ? 'Creating...' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// AI Generate Tasks Modal
function AIGenerateModal({ isOpen, onClose, service, onGenerate, onSave, generatedTasks, isGenerating, isLight }) {
  const [context, setContext] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className={`w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl ${isLight ? 'bg-white' : 'bg-slate-900'}`}>
        <div className={`sticky top-0 p-6 border-b ${isLight ? 'bg-white border-gray-200' : 'bg-slate-900 border-slate-700'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <Sparkles className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <h2 className={`text-xl font-semibold ${isLight ? 'text-gray-800' : 'text-white'}`}>
                  AI Task Generation
                </h2>
                <p className={`text-sm ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>
                  {service?.name}
                </p>
              </div>
            </div>
            <button onClick={onClose}>
              <X className={`w-5 h-5 ${isLight ? 'text-gray-500' : 'text-slate-400'}`} />
            </button>
          </div>
        </div>
        
        <div className="p-6 space-y-6">
          {!generatedTasks ? (
            <>
              <div>
                <label className={`block text-sm font-medium mb-2 ${isLight ? 'text-gray-700' : 'text-slate-300'}`}>
                  Additional Context (Optional)
                </label>
                <textarea
                  rows={4}
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  placeholder="Provide any specific requirements, constraints, or focus areas for task generation..."
                  className={`w-full px-3 py-2 rounded-lg border ${
                    isLight ? 'bg-white border-gray-200' : 'bg-slate-800 border-slate-700 text-white'
                  }`}
                />
              </div>
              
              <button
                onClick={() => onGenerate(context)}
                disabled={isGenerating}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-medium hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Analyzing Service...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Generate Tasks with AI
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              <div className={`p-4 rounded-lg ${isLight ? 'bg-blue-50' : 'bg-blue-900/20'}`}>
                <p className={`text-sm ${isLight ? 'text-blue-700' : 'text-blue-300'}`}>
                  {generatedTasks.analysis_summary}
                </p>
              </div>
              
              <div>
                <h3 className={`font-semibold mb-3 ${isLight ? 'text-gray-700' : 'text-slate-300'}`}>
                  Generated Tasks ({generatedTasks.tasks?.length || 0})
                </h3>
                <div className="space-y-3">
                  {generatedTasks.tasks?.map((task, idx) => (
                    <div key={idx} className={`p-4 rounded-lg ${isLight ? 'bg-gray-50' : 'bg-slate-800'}`}>
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className={`font-medium ${isLight ? 'text-gray-800' : 'text-white'}`}>
                            {task.title}
                          </h4>
                          <p className={`text-sm mt-1 ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>
                            {task.description}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className={`px-2 py-0.5 rounded text-xs ${
                              task.priority === 'critical' ? 'bg-red-500/20 text-red-400' :
                              task.priority === 'high' ? 'bg-orange-500/20 text-orange-400' :
                              'bg-yellow-500/20 text-yellow-400'
                            }`}>
                              {task.priority}
                            </span>
                            <span className={`text-xs ${isLight ? 'text-gray-400' : 'text-slate-500'}`}>
                              {task.estimated_hours}h
                            </span>
                          </div>
                          {task.required_skills?.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {task.required_skills.map((skill, i) => (
                                <span key={i} className={`px-2 py-0.5 rounded text-xs ${
                                  isLight ? 'bg-gray-200 text-gray-600' : 'bg-slate-700 text-slate-300'
                                }`}>
                                  {skill}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      {task.reasoning && (
                        <p className={`text-xs mt-2 italic ${isLight ? 'text-gray-400' : 'text-slate-500'}`}>
                          💡 {task.reasoning}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => onGenerate(context)}
                  disabled={isGenerating}
                  className={`flex-1 py-2 rounded-lg font-medium ${
                    isLight ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'bg-slate-700 text-white hover:bg-slate-600'
                  }`}
                >
                  Regenerate
                </button>
                <button
                  onClick={onSave}
                  disabled={isGenerating}
                  className="flex-1 py-2 rounded-lg font-medium bg-green-500 text-white hover:bg-green-600 disabled:opacity-50"
                >
                  {isGenerating ? 'Saving...' : 'Save All Tasks'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// AI Assignment Modal
function AIAssignmentModal({ isOpen, onClose, task, recommendations, employees, isLoading, onAssign, isLight }) {
  const [showAllEmployees, setShowAllEmployees] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className={`w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl ${isLight ? 'bg-white' : 'bg-slate-900'}`}>
        <div className={`sticky top-0 p-6 border-b ${isLight ? 'bg-white border-gray-200' : 'bg-slate-900 border-slate-700'}`}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className={`text-xl font-semibold flex items-center gap-2 ${isLight ? 'text-gray-800' : 'text-white'}`}>
                <Sparkles className="w-5 h-5 text-purple-500" />
                Assign Task
              </h2>
              <p className={`text-sm mt-1 ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>
                {task.title}
              </p>
            </div>
            <button onClick={onClose}>
              <X className={`w-5 h-5 ${isLight ? 'text-gray-500' : 'text-slate-400'}`} />
            </button>
          </div>
        </div>

        <div className="p-6">
          {isLoading ? (
            <div className="text-center py-12">
              <RefreshCw className="w-12 h-12 mx-auto animate-spin text-purple-500" />
              <p className={`mt-4 ${isLight ? 'text-gray-600' : 'text-slate-300'}`}>
                AI is analyzing employee skills and workload...
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* AI Recommendations */}
              {recommendations.length > 0 && (
                <div>
                  <h3 className={`text-sm font-semibold mb-3 ${isLight ? 'text-gray-700' : 'text-slate-300'}`}>
                    🤖 AI Recommendations (Top 3)
                  </h3>
                  <div className="space-y-3">
                    {recommendations.map((rec, idx) => (
                      <div
                        key={rec.employee_id}
                        className={`p-4 rounded-xl border ${
                          idx === 0 
                            ? 'border-purple-500/50 bg-purple-500/10' 
                            : isLight ? 'border-gray-200 bg-gray-50' : 'border-slate-700 bg-slate-800/50'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium ${
                              idx === 0 ? 'bg-purple-500' : 'bg-slate-500'
                            }`}>
                              {rec.employee_name.split(' ').map(n => n[0]).join('')}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className={`font-medium ${isLight ? 'text-gray-800' : 'text-white'}`}>
                                  {rec.employee_name}
                                </h4>
                                {idx === 0 && (
                                  <span className="px-2 py-0.5 rounded-full text-xs bg-purple-500/20 text-purple-400">
                                    Best Match
                                  </span>
                                )}
                              </div>
                              <p className={`text-sm ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>
                                {rec.reasoning}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`text-2xl font-bold ${
                              rec.overall_score >= 80 ? 'text-green-500' :
                              rec.overall_score >= 60 ? 'text-yellow-500' : 'text-red-500'
                            }`}>
                              {Math.round(rec.overall_score)}%
                            </div>
                            <p className={`text-xs ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>Match</p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4 mt-4">
                          <div>
                            <p className={`text-xs ${isLight ? 'text-gray-500' : 'text-slate-500'}`}>Skill Match</p>
                            <div className={`h-1.5 rounded-full mt-1 ${isLight ? 'bg-gray-200' : 'bg-slate-700'}`}>
                              <div className="h-full rounded-full bg-blue-500" style={{ width: `${rec.skill_match_score}%` }} />
                            </div>
                          </div>
                          <div>
                            <p className={`text-xs ${isLight ? 'text-gray-500' : 'text-slate-500'}`}>Availability</p>
                            <div className={`h-1.5 rounded-full mt-1 ${isLight ? 'bg-gray-200' : 'bg-slate-700'}`}>
                              <div className="h-full rounded-full bg-green-500" style={{ width: `${rec.availability_score}%` }} />
                            </div>
                          </div>
                          <div>
                            <p className={`text-xs ${isLight ? 'text-gray-500' : 'text-slate-500'}`}>Workload</p>
                            <div className={`h-1.5 rounded-full mt-1 ${isLight ? 'bg-gray-200' : 'bg-slate-700'}`}>
                              <div className="h-full rounded-full bg-purple-500" style={{ width: `${rec.workload_score}%` }} />
                            </div>
                          </div>
                        </div>
                        
                        {rec.matching_skills?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-3">
                            {rec.matching_skills.map((skill, i) => (
                              <span key={i} className="px-2 py-0.5 rounded text-xs bg-green-500/20 text-green-400">
                                ✓ {skill}
                              </span>
                            ))}
                          </div>
                        )}
                        
                        <button
                          onClick={() => onAssign(rec.employee_id, true, rec)}
                          className={`w-full mt-4 py-2 rounded-lg font-medium transition-colors ${
                            idx === 0 
                              ? 'bg-purple-500 text-white hover:bg-purple-600'
                              : isLight 
                                ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                : 'bg-slate-700 text-white hover:bg-slate-600'
                          }`}
                        >
                          Assign to {rec.employee_name.split(' ')[0]}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Manual Selection */}
              <div>
                <button
                  onClick={() => setShowAllEmployees(!showAllEmployees)}
                  className={`text-sm ${isLight ? 'text-primary-600' : 'text-primary-400'} hover:underline`}
                >
                  {showAllEmployees ? 'Hide all employees' : 'Or select from all employees'}
                </button>
                
                {showAllEmployees && (
                  <div className="mt-3 space-y-2">
                    {employees.map((emp) => (
                      <div
                        key={emp.id}
                        className={`p-3 rounded-lg flex items-center justify-between ${
                          isLight ? 'bg-gray-50' : 'bg-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-500 flex items-center justify-center text-white text-sm">
                            {emp.first_name[0]}{emp.last_name[0]}
                          </div>
                          <div>
                            <p className={`font-medium ${isLight ? 'text-gray-800' : 'text-white'}`}>
                              {emp.full_name}
                            </p>
                            <p className={`text-xs ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>
                              {emp.job_title} • {Math.round(emp.workload_percentage)}% workload
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => onAssign(emp.id, false)}
                          className={`px-3 py-1 rounded text-sm ${
                            isLight 
                              ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                              : 'bg-slate-700 text-white hover:bg-slate-600'
                          }`}
                        >
                          Assign
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
