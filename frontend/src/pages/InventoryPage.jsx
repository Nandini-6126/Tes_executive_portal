import { useState, useEffect } from 'react';
import { 
  Package, Upload, Plus, Search, AlertTriangle, Truck, 
  FileText, Sparkles, CheckCircle, Clock, X, ChevronRight,
  Building2, Cpu, Database, Settings, ShoppingCart, BarChart3, RefreshCw
} from 'lucide-react';
import { inventoryAPI, servicesAPI } from '../api/client';
import { useSettings } from '../context/SettingsContext';

export default function InventoryPage() {
  const { isLightTheme } = useSettings();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Dashboard data
  const [dashboardData, setDashboardData] = useState(null);
  
  // Components
  const [components, setComponents] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [requests, setRequests] = useState([]);
  const [services, setServices] = useState([]);
  const [servicesLoading, setServicesLoading] = useState(false);
  
  // Modals
  const [showAIAnalysis, setShowAIAnalysis] = useState(false);
  const [showNewRequest, setShowNewRequest] = useState(false);
  
  // Smart Analysis
  const [selectedService, setSelectedService] = useState('');
  const [additionalRequirements, setAdditionalRequirements] = useState('');
  const [analysisResult, setAnalysisResult] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    loadDashboard();
    loadServices();
  }, []);

  useEffect(() => {
    if (activeTab === 'components') loadComponents();
    if (activeTab === 'vendors') loadVendors();
    if (activeTab === 'requests') loadRequests();
  }, [activeTab]);

  // Reload services when modals open to get latest data
  useEffect(() => {
    if (showAIAnalysis || showNewRequest) {
      loadServices();
    }
  }, [showAIAnalysis, showNewRequest]);

  const loadDashboard = async () => {
    try {
      const response = await inventoryAPI.getDashboard();
      setDashboardData(response.data);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
      // Set default data if API fails
      setDashboardData({
        total_components: 0,
        low_stock_alerts: 0,
        total_vendors: 0,
        pending_requests: 0
      });
    }
  };

  const loadComponents = async () => {
    setLoading(true);
    try {
      const response = await inventoryAPI.getComponents();
      setComponents(response.data || []);
    } catch (err) {
      setError('Failed to load components');
      setComponents([]);
    } finally {
      setLoading(false);
    }
  };

  const loadVendors = async () => {
    setLoading(true);
    try {
      const response = await inventoryAPI.getVendors();
      setVendors(response.data || []);
    } catch (err) {
      setError('Failed to load vendors');
      setVendors([]);
    } finally {
      setLoading(false);
    }
  };

  const loadRequests = async () => {
    setLoading(true);
    try {
      const response = await inventoryAPI.getRequests();
      setRequests(response.data || []);
    } catch (err) {
      setError('Failed to load requests');
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const loadServices = async () => {
    setServicesLoading(true);
    console.log('Loading services...');
    
    // Try both endpoints and use whichever works
    let servicesData = [];
    
    // First try the /filter endpoint (POST) which we know works
    try {
      const response = await servicesAPI.filter({ page: 1, page_size: 1000 });
      console.log('Services from /filter:', response);
      if (response.data?.data && Array.isArray(response.data.data)) {
        servicesData = response.data.data;
        console.log('Got services from filter:', servicesData.length);
      }
    } catch (err) {
      console.error('Filter endpoint failed:', err.message);
    }
    
    // If filter didn't work, try /list endpoint
    if (servicesData.length === 0) {
      try {
        const response = await servicesAPI.getList();
        console.log('Services from /list:', response);
        if (response.data && Array.isArray(response.data)) {
          servicesData = response.data;
          console.log('Got services from list:', servicesData.length);
        }
      } catch (err) {
        console.error('List endpoint failed:', err.message);
      }
    }
    
    setServices(servicesData);
    setServicesLoading(false);
    console.log('Final services state:', servicesData.length, 'services');
  };

  const handleAIAnalysis = async () => {
    if (!selectedService) {
      setError('Please select a service');
      return;
    }
    
    setAnalyzing(true);
    setError('');
    setAnalysisResult(null);
    
    try {
      const response = await inventoryAPI.analyzeService({
        service_id: parseInt(selectedService),
        requirements: additionalRequirements
      });
      
      if (response.data.success) {
        setAnalysisResult(response.data.analysis);
      } else {
        setError('Analysis failed');
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'AI analysis failed. Make sure ANTHROPIC_API_KEY is configured.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleGenerateBOM = async () => {
    if (!selectedService) return;
    
    setAnalyzing(true);
    try {
      const response = await inventoryAPI.generateBOM(
        parseInt(selectedService),
        additionalRequirements
      );
      
      if (response.data.success) {
        alert(`BOM created successfully! ${response.data.items_created} items added.`);
        setShowAIAnalysis(false);
        setAnalysisResult(null);
      }
    } catch (err) {
      setError('Failed to generate BOM');
    } finally {
      setAnalyzing(false);
    }
  };

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'components', label: 'Components', icon: Cpu },
    { id: 'vendors', label: 'Vendors', icon: Building2 },
    { id: 'requests', label: 'Requests', icon: ShoppingCart },
  ];

  const getStatusColor = (status) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-700',
      pending_approval: 'bg-yellow-100 text-yellow-700',
      manager_approved: 'bg-blue-100 text-blue-700',
      dept_head_approved: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-700',
      ordered: 'bg-purple-100 text-purple-700',
      delivered: 'bg-green-100 text-green-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-2xl font-bold ${isLightTheme ? 'text-gray-800' : 'text-white'}`}>
            Inventory Management
          </h1>
          <p className={`mt-1 ${isLightTheme ? 'text-gray-600' : 'text-gray-400'}`}>
            Manage components, vendors, and procurement with AI assistance
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowAIAnalysis(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:opacity-90"
          >
            <Sparkles className="w-4 h-4" />
            Smart Analysis
          </button>
          <button
            onClick={() => setShowNewRequest(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            New Request
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className={`flex gap-1 p-1 rounded-lg ${isLightTheme ? 'bg-gray-100' : 'bg-gray-800'}`}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              activeTab === tab.id
                ? 'bg-white dark:bg-gray-700 shadow text-blue-600 dark:text-blue-400'
                : isLightTheme ? 'text-gray-600 hover:text-gray-900' : 'text-gray-400 hover:text-white'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className={`p-6 rounded-xl ${isLightTheme ? 'bg-white shadow' : 'bg-gray-800'}`}>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className={`text-sm ${isLightTheme ? 'text-gray-600' : 'text-gray-400'}`}>Total Components</p>
                <p className={`text-2xl font-bold ${isLightTheme ? 'text-gray-800' : 'text-white'}`}>
                  {dashboardData?.total_components || 0}
                </p>
              </div>
            </div>
          </div>

          <div className={`p-6 rounded-xl ${isLightTheme ? 'bg-white shadow' : 'bg-gray-800'}`}>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className={`text-sm ${isLightTheme ? 'text-gray-600' : 'text-gray-400'}`}>Low Stock Alerts</p>
                <p className={`text-2xl font-bold ${isLightTheme ? 'text-gray-800' : 'text-white'}`}>
                  {dashboardData?.low_stock_alerts || 0}
                </p>
              </div>
            </div>
          </div>

          <div className={`p-6 rounded-xl ${isLightTheme ? 'bg-white shadow' : 'bg-gray-800'}`}>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <Building2 className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className={`text-sm ${isLightTheme ? 'text-gray-600' : 'text-gray-400'}`}>Active Vendors</p>
                <p className={`text-2xl font-bold ${isLightTheme ? 'text-gray-800' : 'text-white'}`}>
                  {dashboardData?.total_vendors || 0}
                </p>
              </div>
            </div>
          </div>

          <div className={`p-6 rounded-xl ${isLightTheme ? 'bg-white shadow' : 'bg-gray-800'}`}>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Clock className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className={`text-sm ${isLightTheme ? 'text-gray-600' : 'text-gray-400'}`}>Pending Requests</p>
                <p className={`text-2xl font-bold ${isLightTheme ? 'text-gray-800' : 'text-white'}`}>
                  {dashboardData?.pending_requests || 0}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className={`col-span-full p-6 rounded-xl ${isLightTheme ? 'bg-white shadow' : 'bg-gray-800'}`}>
            <h3 className={`font-semibold mb-4 ${isLightTheme ? 'text-gray-800' : 'text-white'}`}>
              Quick Actions
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button
                onClick={() => setShowAIAnalysis(true)}
                className={`p-4 rounded-lg text-left transition-colors ${
                  isLightTheme ? 'bg-purple-50 hover:bg-purple-100' : 'bg-purple-900/20 hover:bg-purple-900/30'
                }`}
              >
                <Sparkles className="w-6 h-6 text-purple-600 mb-2" />
                <p className={`font-medium ${isLightTheme ? 'text-gray-800' : 'text-white'}`}>Smart Analysis</p>
                <p className={`text-sm ${isLightTheme ? 'text-gray-600' : 'text-gray-400'}`}>Analyze service requirements</p>
              </button>
              <button
                onClick={() => setShowNewRequest(true)}
                className={`p-4 rounded-lg text-left transition-colors ${
                  isLightTheme ? 'bg-blue-50 hover:bg-blue-100' : 'bg-blue-900/20 hover:bg-blue-900/30'
                }`}
              >
                <ShoppingCart className="w-6 h-6 text-blue-600 mb-2" />
                <p className={`font-medium ${isLightTheme ? 'text-gray-800' : 'text-white'}`}>New Request</p>
                <p className={`text-sm ${isLightTheme ? 'text-gray-600' : 'text-gray-400'}`}>Create procurement request</p>
              </button>
              <button
                onClick={() => setActiveTab('components')}
                className={`p-4 rounded-lg text-left transition-colors ${
                  isLightTheme ? 'bg-green-50 hover:bg-green-100' : 'bg-green-900/20 hover:bg-green-900/30'
                }`}
              >
                <Package className="w-6 h-6 text-green-600 mb-2" />
                <p className={`font-medium ${isLightTheme ? 'text-gray-800' : 'text-white'}`}>View Inventory</p>
                <p className={`text-sm ${isLightTheme ? 'text-gray-600' : 'text-gray-400'}`}>Check stock levels</p>
              </button>
              <button
                onClick={() => setActiveTab('vendors')}
                className={`p-4 rounded-lg text-left transition-colors ${
                  isLightTheme ? 'bg-orange-50 hover:bg-orange-100' : 'bg-orange-900/20 hover:bg-orange-900/30'
                }`}
              >
                <Building2 className="w-6 h-6 text-orange-600 mb-2" />
                <p className={`font-medium ${isLightTheme ? 'text-gray-800' : 'text-white'}`}>Manage Vendors</p>
                <p className={`text-sm ${isLightTheme ? 'text-gray-600' : 'text-gray-400'}`}>View supplier info</p>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Components Tab */}
      {activeTab === 'components' && (
        <div className={`rounded-xl overflow-hidden ${isLightTheme ? 'bg-white shadow' : 'bg-gray-800'}`}>
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search components..."
                  className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
                    isLightTheme 
                      ? 'border-gray-300 bg-white' 
                      : 'border-gray-600 bg-gray-700 text-white'
                  }`}
                />
              </div>
            </div>
          </div>
          
          <div className="p-8 text-center">
            <Package className={`w-12 h-12 mx-auto mb-4 ${isLightTheme ? 'text-gray-400' : 'text-gray-600'}`} />
            <p className={`font-medium ${isLightTheme ? 'text-gray-800' : 'text-white'}`}>No Components Yet</p>
            <p className={`text-sm mt-1 ${isLightTheme ? 'text-gray-600' : 'text-gray-400'}`}>
              Components will be added when you create inventory requests or import BOMs.
            </p>
            <button
              onClick={() => setShowAIAnalysis(true)}
              className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              <Sparkles className="w-4 h-4 inline mr-2" />
              Use AI to Analyze Requirements
            </button>
          </div>
        </div>
      )}

      {/* Vendors Tab */}
      {activeTab === 'vendors' && (
        <div className={`rounded-xl p-8 text-center ${isLightTheme ? 'bg-white shadow' : 'bg-gray-800'}`}>
          <Building2 className={`w-12 h-12 mx-auto mb-4 ${isLightTheme ? 'text-gray-400' : 'text-gray-600'}`} />
          <p className={`font-medium ${isLightTheme ? 'text-gray-800' : 'text-white'}`}>No Vendors Yet</p>
          <p className={`text-sm mt-1 ${isLightTheme ? 'text-gray-600' : 'text-gray-400'}`}>
            Add vendors to start managing your supplier relationships.
          </p>
          <p className={`text-xs mt-4 ${isLightTheme ? 'text-gray-500' : 'text-gray-500'}`}>
            AI will suggest vendors when analyzing service requirements.
          </p>
        </div>
      )}

      {/* Requests Tab */}
      {activeTab === 'requests' && (
        <div className="space-y-4">
          {requests.length === 0 ? (
            <div className={`text-center py-12 rounded-xl ${isLightTheme ? 'bg-white shadow' : 'bg-gray-800'}`}>
              <ShoppingCart className={`w-12 h-12 mx-auto mb-4 ${isLightTheme ? 'text-gray-400' : 'text-gray-600'}`} />
              <p className={`font-medium ${isLightTheme ? 'text-gray-800' : 'text-white'}`}>No Inventory Requests Yet</p>
              <p className={`text-sm mt-1 ${isLightTheme ? 'text-gray-600' : 'text-gray-400'}`}>
                Create a new request to start the procurement process.
              </p>
              <button
                onClick={() => setShowNewRequest(true)}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 inline mr-2" />
                Create First Request
              </button>
            </div>
          ) : (
            requests.map((request) => (
              <div key={request.id} className={`p-6 rounded-xl ${isLightTheme ? 'bg-white shadow' : 'bg-gray-800'}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className={`font-semibold ${isLightTheme ? 'text-gray-800' : 'text-white'}`}>
                        {request.title}
                      </h3>
                      <span className={`px-2 py-1 rounded text-xs ${getStatusColor(request.status)}`}>
                        {request.status?.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <p className={`text-sm mt-1 ${isLightTheme ? 'text-gray-500' : 'text-gray-400'}`}>
                      {request.request_number} • Requested by {request.requested_by_name}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${isLightTheme ? 'text-gray-800' : 'text-white'}`}>
                      ${request.total_amount?.toFixed(2) || '0.00'}
                    </p>
                    <p className={`text-sm ${isLightTheme ? 'text-gray-500' : 'text-gray-400'}`}>
                      {request.items?.length || 0} items
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Smart Analysis Modal */}
      {showAIAnalysis && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl ${
            isLightTheme ? 'bg-white' : 'bg-gray-800'
          }`}>
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className={`text-xl font-semibold ${isLightTheme ? 'text-gray-800' : 'text-white'}`}>
                    Smart Requirements Analysis
                  </h2>
                  <p className={`text-sm ${isLightTheme ? 'text-gray-500' : 'text-gray-400'}`}>
                    Analyze service requirements and generate component recommendations
                  </p>
                </div>
              </div>
              <button onClick={() => { setShowAIAnalysis(false); setAnalysisResult(null); }}>
                <X className={`w-5 h-5 ${isLightTheme ? 'text-gray-500' : 'text-gray-400'}`} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Service Selection */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className={`text-sm font-medium ${isLightTheme ? 'text-gray-700' : 'text-gray-300'}`}>
                    Select Service *
                  </label>
                  <button
                    type="button"
                    onClick={loadServices}
                    disabled={servicesLoading}
                    className={`text-sm flex items-center gap-1 ${isLightTheme ? 'text-blue-600 hover:text-blue-700' : 'text-blue-400 hover:text-blue-300'}`}
                  >
                    <RefreshCw className={`w-3 h-3 ${servicesLoading ? 'animate-spin' : ''}`} />
                    Refresh
                  </button>
                </div>
                <select
                  value={selectedService}
                  onChange={(e) => setSelectedService(e.target.value)}
                  disabled={servicesLoading}
                  className={`w-full px-4 py-2 rounded-lg border ${
                    isLightTheme 
                      ? 'border-gray-300 bg-white text-gray-800' 
                      : 'border-gray-600 bg-gray-700 text-white'
                  } ${servicesLoading ? 'opacity-50' : ''}`}
                >
                  <option value="">
                    {servicesLoading ? 'Loading services...' : 'Choose a service...'}
                  </option>
                  {!servicesLoading && services && services.length > 0 && (
                    services.map((svc) => (
                      <option key={svc.id} value={svc.id}>
                        {svc.name} {svc.customer_name ? `- ${svc.customer_name}` : ''} {svc.status ? `(${svc.status})` : ''}
                      </option>
                    ))
                  )}
                </select>
                {!servicesLoading && services && services.length === 0 && (
                  <p className="text-sm text-orange-500 mt-2">
                    No services found. Please go to the Services page and add a service first, then come back here.
                  </p>
                )}
                {!servicesLoading && services && services.length > 0 && (
                  <p className={`text-xs mt-1 ${isLightTheme ? 'text-gray-500' : 'text-gray-400'}`}>
                    {services.length} service(s) available
                  </p>
                )}
              </div>

              {/* Additional Requirements */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isLightTheme ? 'text-gray-700' : 'text-gray-300'}`}>
                  Additional Requirements (Optional)
                </label>
                <textarea
                  value={additionalRequirements}
                  onChange={(e) => setAdditionalRequirements(e.target.value)}
                  rows={4}
                  placeholder="Describe any specific requirements, constraints, or preferences. For example: 'Need 5 developer workstations with high RAM for Java development, 2 test servers, and IDE licenses for the team...'"
                  className={`w-full px-4 py-2 rounded-lg border ${
                    isLightTheme 
                      ? 'border-gray-300 bg-white text-gray-800' 
                      : 'border-gray-600 bg-gray-700 text-white'
                  }`}
                />
              </div>

              {/* Analyze Button */}
              <button
                onClick={handleAIAnalysis}
                disabled={analyzing || !selectedService}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-medium hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {analyzing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Analyzing with AI...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Analyze Requirements
                  </>
                )}
              </button>

              {/* Analysis Results */}
              {analysisResult && (
                <div className="space-y-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className={`p-4 rounded-lg ${isLightTheme ? 'bg-blue-50' : 'bg-blue-900/20'}`}>
                    <h3 className={`font-medium mb-2 ${isLightTheme ? 'text-blue-800' : 'text-blue-300'}`}>
                      Analysis Summary
                    </h3>
                    <p className={`text-sm ${isLightTheme ? 'text-blue-700' : 'text-blue-200'}`}>
                      {analysisResult.analysis_summary}
                    </p>
                  </div>

                  {/* Hardware Components */}
                  {analysisResult.hardware_components?.length > 0 && (
                    <div>
                      <h3 className={`font-medium mb-3 flex items-center gap-2 ${isLightTheme ? 'text-gray-800' : 'text-white'}`}>
                        <Cpu className="w-5 h-5 text-blue-500" />
                        Hardware Components ({analysisResult.hardware_components.length})
                      </h3>
                      <div className="space-y-2">
                        {analysisResult.hardware_components.map((item, idx) => (
                          <div key={idx} className={`p-3 rounded-lg ${isLightTheme ? 'bg-gray-50' : 'bg-gray-700'}`}>
                            <div className="flex items-start justify-between">
                              <div>
                                <p className={`font-medium ${isLightTheme ? 'text-gray-800' : 'text-white'}`}>
                                  {item.name}
                                </p>
                                <p className={`text-sm ${isLightTheme ? 'text-gray-600' : 'text-gray-400'}`}>
                                  {item.description}
                                </p>
                              </div>
                              <div className="text-right">
                                <span className={`px-2 py-1 rounded text-xs ${
                                  item.priority === 'critical' ? 'bg-red-100 text-red-700' :
                                  item.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                                  'bg-gray-100 text-gray-700'
                                }`}>
                                  {item.priority}
                                </span>
                                <p className={`text-sm mt-1 ${isLightTheme ? 'text-gray-600' : 'text-gray-400'}`}>
                                  Qty: {item.quantity} | ~${item.estimated_unit_price || 'N/A'}
                                </p>
                              </div>
                            </div>
                            {item.suggested_vendors?.length > 0 && (
                              <p className={`text-xs mt-2 ${isLightTheme ? 'text-gray-500' : 'text-gray-500'}`}>
                                💡 Suggested vendors: {item.suggested_vendors.join(', ')}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Software Components */}
                  {analysisResult.software_components?.length > 0 && (
                    <div>
                      <h3 className={`font-medium mb-3 flex items-center gap-2 ${isLightTheme ? 'text-gray-800' : 'text-white'}`}>
                        <Database className="w-5 h-5 text-purple-500" />
                        Software Components ({analysisResult.software_components.length})
                      </h3>
                      <div className="space-y-2">
                        {analysisResult.software_components.map((item, idx) => (
                          <div key={idx} className={`p-3 rounded-lg ${isLightTheme ? 'bg-gray-50' : 'bg-gray-700'}`}>
                            <div className="flex items-start justify-between">
                              <div>
                                <p className={`font-medium ${isLightTheme ? 'text-gray-800' : 'text-white'}`}>
                                  {item.name}
                                </p>
                                <p className={`text-sm ${isLightTheme ? 'text-gray-600' : 'text-gray-400'}`}>
                                  {item.description}
                                </p>
                                {item.license_type && (
                                  <span className="text-xs text-purple-600">License: {item.license_type}</span>
                                )}
                              </div>
                              <div className="text-right">
                                <span className={`px-2 py-1 rounded text-xs ${
                                  item.priority === 'critical' ? 'bg-red-100 text-red-700' :
                                  item.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                                  'bg-gray-100 text-gray-700'
                                }`}>
                                  {item.priority}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Cost Summary */}
                  <div className={`p-4 rounded-lg ${isLightTheme ? 'bg-green-50' : 'bg-green-900/20'}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`font-medium ${isLightTheme ? 'text-green-800' : 'text-green-300'}`}>
                          Estimated Total Cost
                        </p>
                        <p className={`text-2xl font-bold ${isLightTheme ? 'text-green-700' : 'text-green-200'}`}>
                          ${analysisResult.total_estimated_cost?.toLocaleString() || 'N/A'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`font-medium ${isLightTheme ? 'text-green-800' : 'text-green-300'}`}>
                          Procurement Time
                        </p>
                        <p className={`text-2xl font-bold ${isLightTheme ? 'text-green-700' : 'text-green-200'}`}>
                          ~{analysisResult.estimated_procurement_time_days || 'N/A'} days
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Recommendations */}
                  {analysisResult.recommendations?.length > 0 && (
                    <div>
                      <h3 className={`font-medium mb-2 ${isLightTheme ? 'text-gray-800' : 'text-white'}`}>
                        💡 Recommendations
                      </h3>
                      <ul className="space-y-1">
                        {analysisResult.recommendations.map((rec, idx) => (
                          <li key={idx} className={`text-sm flex items-start gap-2 ${isLightTheme ? 'text-gray-600' : 'text-gray-400'}`}>
                            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Risks */}
                  {analysisResult.risks?.length > 0 && (
                    <div>
                      <h3 className={`font-medium mb-2 ${isLightTheme ? 'text-gray-800' : 'text-white'}`}>
                        ⚠️ Potential Risks
                      </h3>
                      <ul className="space-y-1">
                        {analysisResult.risks.map((risk, idx) => (
                          <li key={idx} className={`text-sm flex items-start gap-2 ${isLightTheme ? 'text-gray-600' : 'text-gray-400'}`}>
                            <AlertTriangle className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                            {risk}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Generate BOM Button */}
                  <button
                    onClick={handleGenerateBOM}
                    disabled={analyzing}
                    className="w-full py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <FileText className="w-5 h-5" />
                    Generate BOM & Create Request
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* New Request Modal */}
      {showNewRequest && (
        <NewRequestModal
          isOpen={showNewRequest}
          onClose={() => setShowNewRequest(false)}
          services={services}
          onSuccess={() => {
            setShowNewRequest(false);
            loadRequests();
            setActiveTab('requests');
          }}
          isLightTheme={isLightTheme}
        />
      )}
    </div>
  );
}

// New Request Modal Component
function NewRequestModal({ isOpen, onClose, services, onSuccess, isLightTheme }) {
  const [formData, setFormData] = useState({
    service_id: '',
    title: '',
    description: '',
    justification: '',
    priority: 'normal',
    required_by_date: '',
    items: [{ name: '', description: '', quantity: 1, unit_price: '', component_type: 'hardware', category: 'other' }]
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Debug: Log services when they change
  useEffect(() => {
    console.log('NewRequestModal - services prop:', services);
  }, [services]);

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { name: '', description: '', quantity: 1, unit_price: '', component_type: 'hardware', category: 'other' }]
    });
  };

  const updateItem = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;
    setFormData({ ...formData, items: newItems });
  };

  const removeItem = (index) => {
    if (formData.items.length > 1) {
      const newItems = formData.items.filter((_, i) => i !== index);
      setFormData({ ...formData, items: newItems });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const submitData = {
        ...formData,
        service_id: formData.service_id ? parseInt(formData.service_id) : null,
        items: formData.items.filter(item => item.name.trim()).map(item => ({
          ...item,
          quantity: parseInt(item.quantity) || 1,
          unit_price: item.unit_price ? parseFloat(item.unit_price) : null
        }))
      };

      await inventoryAPI.createRequest(submitData);
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create request');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className={`w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl ${
        isLightTheme ? 'bg-white' : 'bg-gray-800'
      }`}>
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className={`text-xl font-semibold ${isLightTheme ? 'text-gray-800' : 'text-white'}`}>
            New Inventory Request
          </h2>
          <button onClick={onClose}>
            <X className={`w-5 h-5 ${isLightTheme ? 'text-gray-500' : 'text-gray-400'}`} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${isLightTheme ? 'text-gray-700' : 'text-gray-300'}`}>
                Title *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Developer Workstations for Project Alpha"
                className={`w-full px-4 py-2 rounded-lg border ${
                  isLightTheme ? 'border-gray-300 bg-white' : 'border-gray-600 bg-gray-700 text-white'
                }`}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-2 ${isLightTheme ? 'text-gray-700' : 'text-gray-300'}`}>
                Related Service
              </label>
              <select
                value={formData.service_id}
                onChange={(e) => setFormData({ ...formData, service_id: e.target.value })}
                className={`w-full px-4 py-2 rounded-lg border ${
                  isLightTheme ? 'border-gray-300 bg-white' : 'border-gray-600 bg-gray-700 text-white'
                }`}
              >
                <option value="">Select a service...</option>
                {services && services.length > 0 ? (
                  services.map((svc) => (
                    <option key={svc.id} value={svc.id}>
                      {svc.name} {svc.customer_name ? `- ${svc.customer_name}` : ''} {svc.status ? `(${svc.status})` : ''}
                    </option>
                  ))
                ) : (
                  <option value="" disabled>No services available</option>
                )}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${isLightTheme ? 'text-gray-700' : 'text-gray-300'}`}>
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className={`w-full px-4 py-2 rounded-lg border ${
                  isLightTheme ? 'border-gray-300 bg-white' : 'border-gray-600 bg-gray-700 text-white'
                }`}
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div>
              <label className={`block text-sm font-medium mb-2 ${isLightTheme ? 'text-gray-700' : 'text-gray-300'}`}>
                Required By Date
              </label>
              <input
                type="date"
                value={formData.required_by_date}
                onChange={(e) => setFormData({ ...formData, required_by_date: e.target.value })}
                className={`w-full px-4 py-2 rounded-lg border ${
                  isLightTheme ? 'border-gray-300 bg-white' : 'border-gray-600 bg-gray-700 text-white'
                }`}
              />
            </div>
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${isLightTheme ? 'text-gray-700' : 'text-gray-300'}`}>
              Justification
            </label>
            <textarea
              value={formData.justification}
              onChange={(e) => setFormData({ ...formData, justification: e.target.value })}
              rows={2}
              placeholder="Why is this request needed?"
              className={`w-full px-4 py-2 rounded-lg border ${
                isLightTheme ? 'border-gray-300 bg-white' : 'border-gray-600 bg-gray-700 text-white'
              }`}
            />
          </div>

          {/* Items */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className={`text-sm font-medium ${isLightTheme ? 'text-gray-700' : 'text-gray-300'}`}>
                Items
              </label>
              <button
                type="button"
                onClick={addItem}
                className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <Plus className="w-4 h-4" /> Add Item
              </button>
            </div>
            <div className="space-y-3">
              {formData.items.map((item, index) => (
                <div key={index} className={`p-4 rounded-lg ${isLightTheme ? 'bg-gray-50' : 'bg-gray-700'}`}>
                  <div className="grid grid-cols-12 gap-3">
                    <div className="col-span-4">
                      <input
                        type="text"
                        placeholder="Item name *"
                        value={item.name}
                        onChange={(e) => updateItem(index, 'name', e.target.value)}
                        className={`w-full px-3 py-2 rounded border text-sm ${
                          isLightTheme ? 'border-gray-300 bg-white' : 'border-gray-600 bg-gray-800 text-white'
                        }`}
                      />
                    </div>
                    <div className="col-span-2">
                      <select
                        value={item.component_type}
                        onChange={(e) => updateItem(index, 'component_type', e.target.value)}
                        className={`w-full px-3 py-2 rounded border text-sm ${
                          isLightTheme ? 'border-gray-300 bg-white' : 'border-gray-600 bg-gray-800 text-white'
                        }`}
                      >
                        <option value="hardware">Hardware</option>
                        <option value="software">Software</option>
                        <option value="license">License</option>
                      </select>
                    </div>
                    <div className="col-span-2">
                      <input
                        type="number"
                        placeholder="Qty"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                        className={`w-full px-3 py-2 rounded border text-sm ${
                          isLightTheme ? 'border-gray-300 bg-white' : 'border-gray-600 bg-gray-800 text-white'
                        }`}
                      />
                    </div>
                    <div className="col-span-3">
                      <input
                        type="number"
                        placeholder="Unit price ($)"
                        step="0.01"
                        value={item.unit_price}
                        onChange={(e) => updateItem(index, 'unit_price', e.target.value)}
                        className={`w-full px-3 py-2 rounded border text-sm ${
                          isLightTheme ? 'border-gray-300 bg-white' : 'border-gray-600 bg-gray-800 text-white'
                        }`}
                      />
                    </div>
                    <div className="col-span-1 flex items-center justify-center">
                      {formData.items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="text-red-500 hover:text-red-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 py-2 rounded-lg border ${
                isLightTheme ? 'border-gray-300 text-gray-700 hover:bg-gray-50' : 'border-gray-600 text-gray-300 hover:bg-gray-700'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? 'Creating...' : 'Create Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
