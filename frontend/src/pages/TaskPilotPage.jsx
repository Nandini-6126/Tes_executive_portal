import { useState, useEffect } from 'react';
import { 
  Zap, Plus, Search, Filter, Users, Clock, CheckCircle, AlertCircle,
  Calendar, ChevronRight, Sparkles, User, X, Edit2, Trash2, 
  Target, BarChart3, Brain, MessageSquare, RefreshCw
} from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

// Mock data for UI demonstration
const mockTasks = [
  {
    id: 1,
    title: 'Frontend Development - Dashboard Module',
    description: 'Implement the main dashboard with analytics widgets',
    required_skills: ['React', 'TypeScript', 'Tailwind CSS'],
    deadline: '2025-01-15',
    priority: 'high',
    status: 'pending',
    estimated_hours: 40,
    assigned_to: null,
  },
  {
    id: 2,
    title: 'API Integration - Payment Gateway',
    description: 'Integrate Stripe payment gateway for subscription handling',
    required_skills: ['Node.js', 'REST API', 'PostgreSQL'],
    deadline: '2025-01-20',
    priority: 'critical',
    status: 'in_progress',
    estimated_hours: 24,
    assigned_to: { id: 1, name: 'John Smith', avatar: 'J' },
  },
  {
    id: 3,
    title: 'Database Optimization',
    description: 'Optimize slow queries and add proper indexing',
    required_skills: ['PostgreSQL', 'Query Optimization'],
    deadline: '2025-01-25',
    priority: 'medium',
    status: 'pending',
    estimated_hours: 16,
    assigned_to: null,
  },
];

const mockEmployees = [
  {
    id: 1,
    name: 'John Smith',
    avatar: 'J',
    skills: ['React', 'TypeScript', 'Node.js', 'PostgreSQL'],
    current_workload: 32,
    max_capacity: 40,
    active_tasks: 2,
    availability: 'available',
  },
  {
    id: 2,
    name: 'Sarah Johnson',
    avatar: 'S',
    skills: ['Python', 'Machine Learning', 'PostgreSQL', 'REST API'],
    current_workload: 24,
    max_capacity: 40,
    active_tasks: 1,
    availability: 'available',
  },
  {
    id: 3,
    name: 'Mike Chen',
    avatar: 'M',
    skills: ['React', 'Vue.js', 'Tailwind CSS', 'TypeScript'],
    current_workload: 40,
    max_capacity: 40,
    active_tasks: 3,
    availability: 'busy',
  },
  {
    id: 4,
    name: 'Emily Davis',
    avatar: 'E',
    skills: ['Node.js', 'REST API', 'MongoDB', 'Docker'],
    current_workload: 16,
    max_capacity: 40,
    active_tasks: 1,
    availability: 'available',
  },
];

export default function TaskPilotPage() {
  const { isLightTheme } = useSettings();
  const isLight = isLightTheme;
  
  const [activeTab, setActiveTab] = useState('tasks');
  const [tasks, setTasks] = useState(mockTasks);
  const [employees] = useState(mockEmployees);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [aiRecommendations, setAiRecommendations] = useState([]);
  const [loadingAI, setLoadingAI] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Get AI recommendations for a task
  const getAIRecommendations = async (task) => {
    setLoadingAI(true);
    setSelectedTask(task);
    setShowAssignModal(true);
    
    // Simulate AI processing
    setTimeout(() => {
      const recommendations = employees.map(emp => {
        // Calculate skill match score
        const matchingSkills = task.required_skills.filter(skill => 
          emp.skills.some(s => s.toLowerCase().includes(skill.toLowerCase()))
        );
        const skillScore = (matchingSkills.length / task.required_skills.length) * 100;
        
        // Calculate workload score
        const availableHours = emp.max_capacity - emp.current_workload;
        const workloadScore = Math.min((availableHours / task.estimated_hours) * 100, 100);
        
        // Calculate deadline feasibility
        const daysUntilDeadline = Math.ceil((new Date(task.deadline) - new Date()) / (1000 * 60 * 60 * 24));
        const deadlineScore = daysUntilDeadline > 7 ? 100 : daysUntilDeadline > 3 ? 70 : 40;
        
        // Overall score
        const overallScore = Math.round((skillScore * 0.5) + (workloadScore * 0.3) + (deadlineScore * 0.2));
        
        return {
          employee: emp,
          skillScore: Math.round(skillScore),
          workloadScore: Math.round(workloadScore),
          deadlineScore: Math.round(deadlineScore),
          overallScore,
          matchingSkills,
          reasoning: generateReasoning(emp, task, skillScore, workloadScore, matchingSkills),
        };
      }).sort((a, b) => b.overallScore - a.overallScore);
      
      setAiRecommendations(recommendations);
      setLoadingAI(false);
    }, 1500);
  };

  const generateReasoning = (emp, task, skillScore, workloadScore, matchingSkills) => {
    const reasons = [];
    
    if (skillScore >= 80) {
      reasons.push(`Excellent skill match (${matchingSkills.join(', ')})`);
    } else if (skillScore >= 50) {
      reasons.push(`Good skill coverage with ${matchingSkills.join(', ')}`);
    } else {
      reasons.push(`Limited skill match - may need training`);
    }
    
    if (workloadScore >= 80) {
      reasons.push(`Has capacity for this task (${emp.max_capacity - emp.current_workload}h available)`);
    } else if (workloadScore >= 50) {
      reasons.push(`Moderate availability - may need workload adjustment`);
    } else {
      reasons.push(`High current workload - consider reassigning other tasks`);
    }
    
    return reasons.join('. ') + '.';
  };

  const assignTask = (taskId, employeeId) => {
    const employee = employees.find(e => e.id === employeeId);
    setTasks(tasks.map(t => 
      t.id === taskId 
        ? { ...t, assigned_to: employee, status: 'in_progress' }
        : t
    ));
    setShowAssignModal(false);
    setSelectedTask(null);
    setAiRecommendations([]);
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         task.description.toLowerCase().includes(searchQuery.toLowerCase());
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
      case 'pending': return 'bg-slate-500/20 text-slate-400';
      default: return 'bg-slate-500/20 text-slate-400';
    }
  };

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
            AI-powered task assignment and employee workload management
          </p>
        </div>
        <button
          onClick={() => setShowCreateTask(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Create Task
        </button>
      </div>

      {/* Stats Cards */}
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
              <p className={`text-sm ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>Pending Assignment</p>
            </div>
          </div>
        </div>
        <div className={`p-4 rounded-xl ${isLight ? 'bg-white shadow-md' : 'bg-slate-800/50 border border-slate-700/50'}`}>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <Users className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className={`text-2xl font-bold ${isLight ? 'text-gray-800' : 'text-white'}`}>
                {employees.filter(e => e.availability === 'available').length}
              </p>
              <p className={`text-sm ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>Available Employees</p>
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
              <p className={`text-sm ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>Powered Matching</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className={`flex gap-1 p-1 rounded-lg ${isLight ? 'bg-gray-100' : 'bg-slate-800/50'}`}>
        {['tasks', 'employees', 'analytics'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'bg-primary-500 text-white'
                : isLight ? 'text-gray-600 hover:bg-gray-200' : 'text-slate-400 hover:bg-slate-700'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Tasks Tab */}
      {activeTab === 'tasks' && (
        <div className="space-y-4">
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
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          {/* Tasks List */}
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
                        {task.status.replace('_', ' ')}
                      </span>
                    </div>
                    <p className={`text-sm mt-1 ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>
                      {task.description}
                    </p>
                    <div className="flex items-center gap-4 mt-3">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4 text-slate-500" />
                        <span className={`text-sm ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>
                          Due: {new Date(task.deadline).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4 text-slate-500" />
                        <span className={`text-sm ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>
                          {task.estimated_hours}h estimated
                        </span>
                      </div>
                      <div className="flex gap-1">
                        {task.required_skills.map((skill, idx) => (
                          <span
                            key={idx}
                            className={`px-2 py-0.5 rounded text-xs ${
                              isLight ? 'bg-gray-100 text-gray-600' : 'bg-slate-700 text-slate-300'
                            }`}
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {task.assigned_to ? (
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-white text-sm font-medium">
                          {task.assigned_to.avatar}
                        </div>
                        <span className={`text-sm ${isLight ? 'text-gray-600' : 'text-slate-300'}`}>
                          {task.assigned_to.name}
                        </span>
                      </div>
                    ) : (
                      <button
                        onClick={() => getAIRecommendations(task)}
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
        </div>
      )}

      {/* Employees Tab */}
      {activeTab === 'employees' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {employees.map((emp) => (
            <div
              key={emp.id}
              className={`p-4 rounded-xl ${isLight ? 'bg-white shadow-md' : 'bg-slate-800/50 border border-slate-700/50'}`}
            >
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-medium ${
                  emp.availability === 'available' ? 'bg-green-500' : 'bg-orange-500'
                }`}>
                  {emp.avatar}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className={`font-semibold ${isLight ? 'text-gray-800' : 'text-white'}`}>
                      {emp.name}
                    </h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      emp.availability === 'available' 
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-orange-500/20 text-orange-400'
                    }`}>
                      {emp.availability}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {emp.skills.map((skill, idx) => (
                      <span
                        key={idx}
                        className={`px-2 py-0.5 rounded text-xs ${
                          isLight ? 'bg-gray-100 text-gray-600' : 'bg-slate-700 text-slate-300'
                        }`}
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className={isLight ? 'text-gray-500' : 'text-slate-400'}>Workload</span>
                      <span className={isLight ? 'text-gray-600' : 'text-slate-300'}>
                        {emp.current_workload}/{emp.max_capacity}h
                      </span>
                    </div>
                    <div className={`h-2 rounded-full ${isLight ? 'bg-gray-100' : 'bg-slate-700'}`}>
                      <div
                        className={`h-full rounded-full ${
                          emp.current_workload >= emp.max_capacity 
                            ? 'bg-red-500' 
                            : emp.current_workload >= emp.max_capacity * 0.8 
                              ? 'bg-orange-500' 
                              : 'bg-green-500'
                        }`}
                        style={{ width: `${(emp.current_workload / emp.max_capacity) * 100}%` }}
                      />
                    </div>
                  </div>
                  <p className={`text-sm mt-2 ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>
                    {emp.active_tasks} active task(s)
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className={`p-8 rounded-xl text-center ${isLight ? 'bg-white shadow-md' : 'bg-slate-800/50 border border-slate-700/50'}`}>
          <BarChart3 className={`w-16 h-16 mx-auto mb-4 ${isLight ? 'text-gray-300' : 'text-slate-600'}`} />
          <h3 className={`text-lg font-semibold ${isLight ? 'text-gray-800' : 'text-white'}`}>
            Analytics Dashboard
          </h3>
          <p className={`mt-2 ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>
            Coming soon - Track task completion rates, employee performance, and AI recommendation accuracy
          </p>
        </div>
      )}

      {/* AI Assignment Modal */}
      {showAssignModal && selectedTask && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`w-full max-w-2xl rounded-2xl max-h-[90vh] overflow-y-auto ${
            isLight ? 'bg-white' : 'bg-slate-900'
          }`}>
            <div className={`sticky top-0 p-6 border-b ${isLight ? 'bg-white border-gray-200' : 'bg-slate-900 border-slate-700'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className={`text-xl font-semibold flex items-center gap-2 ${isLight ? 'text-gray-800' : 'text-white'}`}>
                    <Sparkles className="w-5 h-5 text-purple-500" />
                    AI Task Assignment
                  </h2>
                  <p className={`text-sm mt-1 ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>
                    {selectedTask.title}
                  </p>
                </div>
                <button 
                  onClick={() => { setShowAssignModal(false); setSelectedTask(null); setAiRecommendations([]); }}
                  className={isLight ? 'text-gray-500 hover:text-gray-700' : 'text-slate-400 hover:text-white'}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6">
              {loadingAI ? (
                <div className="text-center py-12">
                  <RefreshCw className="w-12 h-12 mx-auto animate-spin text-purple-500" />
                  <p className={`mt-4 ${isLight ? 'text-gray-600' : 'text-slate-300'}`}>
                    AI is analyzing employee skills, workload, and deadlines...
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className={`text-sm ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>
                    Based on skill match, current workload, and deadline feasibility:
                  </p>
                  
                  {aiRecommendations.map((rec, idx) => (
                    <div
                      key={rec.employee.id}
                      className={`p-4 rounded-xl border ${
                        idx === 0 
                          ? 'border-purple-500/50 bg-purple-500/10' 
                          : isLight ? 'border-gray-200 bg-gray-50' : 'border-slate-700 bg-slate-800/50'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium ${
                            rec.employee.availability === 'available' ? 'bg-green-500' : 'bg-orange-500'
                          }`}>
                            {rec.employee.avatar}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className={`font-medium ${isLight ? 'text-gray-800' : 'text-white'}`}>
                                {rec.employee.name}
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
                            rec.overallScore >= 80 ? 'text-green-500' :
                            rec.overallScore >= 60 ? 'text-yellow-500' : 'text-red-500'
                          }`}>
                            {rec.overallScore}%
                          </div>
                          <p className={`text-xs ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>Match Score</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 mt-4">
                        <div>
                          <p className={`text-xs ${isLight ? 'text-gray-500' : 'text-slate-500'}`}>Skill Match</p>
                          <div className={`h-1.5 rounded-full mt-1 ${isLight ? 'bg-gray-200' : 'bg-slate-700'}`}>
                            <div className="h-full rounded-full bg-blue-500" style={{ width: `${rec.skillScore}%` }} />
                          </div>
                          <p className={`text-sm mt-1 ${isLight ? 'text-gray-600' : 'text-slate-300'}`}>{rec.skillScore}%</p>
                        </div>
                        <div>
                          <p className={`text-xs ${isLight ? 'text-gray-500' : 'text-slate-500'}`}>Availability</p>
                          <div className={`h-1.5 rounded-full mt-1 ${isLight ? 'bg-gray-200' : 'bg-slate-700'}`}>
                            <div className="h-full rounded-full bg-green-500" style={{ width: `${rec.workloadScore}%` }} />
                          </div>
                          <p className={`text-sm mt-1 ${isLight ? 'text-gray-600' : 'text-slate-300'}`}>{rec.workloadScore}%</p>
                        </div>
                        <div>
                          <p className={`text-xs ${isLight ? 'text-gray-500' : 'text-slate-500'}`}>Deadline Fit</p>
                          <div className={`h-1.5 rounded-full mt-1 ${isLight ? 'bg-gray-200' : 'bg-slate-700'}`}>
                            <div className="h-full rounded-full bg-purple-500" style={{ width: `${rec.deadlineScore}%` }} />
                          </div>
                          <p className={`text-sm mt-1 ${isLight ? 'text-gray-600' : 'text-slate-300'}`}>{rec.deadlineScore}%</p>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => assignTask(selectedTask.id, rec.employee.id)}
                        className={`w-full mt-4 py-2 rounded-lg font-medium transition-colors ${
                          idx === 0 
                            ? 'bg-purple-500 text-white hover:bg-purple-600'
                            : isLight 
                              ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              : 'bg-slate-700 text-white hover:bg-slate-600'
                        }`}
                      >
                        Assign to {rec.employee.name}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Task Modal */}
      {showCreateTask && (
        <CreateTaskModal 
          isOpen={showCreateTask} 
          onClose={() => setShowCreateTask(false)}
          onSubmit={(task) => {
            setTasks([...tasks, { ...task, id: tasks.length + 1, status: 'pending', assigned_to: null }]);
            setShowCreateTask(false);
          }}
          isLight={isLight}
        />
      )}

      {/* RAG Chatbot Placeholder */}
      <div className={`p-4 rounded-xl ${isLight ? 'bg-blue-50 border border-blue-200' : 'bg-blue-500/10 border border-blue-500/30'}`}>
        <div className="flex items-center gap-3">
          <MessageSquare className="w-5 h-5 text-blue-500" />
          <div>
            <p className={`font-medium ${isLight ? 'text-blue-800' : 'text-blue-400'}`}>
              RAG-Based Assistant Available
            </p>
            <p className={`text-sm ${isLight ? 'text-blue-600' : 'text-blue-400/70'}`}>
              Ask questions about tasks, employees, or get recommendations. Use the AI Assistant button in the bottom right.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Create Task Modal Component
function CreateTaskModal({ isOpen, onClose, onSubmit, isLight }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    required_skills: '',
    deadline: '',
    priority: 'medium',
    estimated_hours: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      required_skills: formData.required_skills.split(',').map(s => s.trim()).filter(s => s),
      estimated_hours: parseInt(formData.estimated_hours) || 8,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className={`w-full max-w-lg rounded-2xl ${isLight ? 'bg-white' : 'bg-slate-900'}`}>
        <div className={`p-6 border-b ${isLight ? 'border-gray-200' : 'border-slate-700'}`}>
          <div className="flex items-center justify-between">
            <h2 className={`text-xl font-semibold ${isLight ? 'text-gray-800' : 'text-white'}`}>
              Create New Task
            </h2>
            <button onClick={onClose} className={isLight ? 'text-gray-500' : 'text-slate-400'}>
              <X className="w-5 h-5" />
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
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-1 ${isLight ? 'text-gray-700' : 'text-slate-300'}`}>
                Deadline *
              </label>
              <input
                type="date"
                required
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                className={`w-full px-3 py-2 rounded-lg border ${
                  isLight ? 'bg-white border-gray-200' : 'bg-slate-800 border-slate-700 text-white'
                }`}
              />
            </div>
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
              className="flex-1 py-2 rounded-lg font-medium bg-primary-500 text-white hover:bg-primary-600"
            >
              Create Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
