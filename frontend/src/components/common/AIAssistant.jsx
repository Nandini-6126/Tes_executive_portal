import { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, X, Sparkles, Loader2, AlertCircle, Lightbulb, BarChart3 } from 'lucide-react';
import { aiAPI } from '../../api/client';

export default function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hi! I'm your AI assistant for the Tessolve Executive Portal. I can help you understand your services data, provide insights, and answer questions. Try asking me things like:\n\n• \"What's the total value of all services?\"\n• \"Which services are at risk?\"\n• \"Summarize our active services\"\n• \"What actions should I take?\""
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [aiConfigured, setAiConfigured] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Check if AI is configured
    checkAIStatus();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const checkAIStatus = async () => {
    try {
      const response = await aiAPI.status();
      setAiConfigured(response.data.configured);
    } catch (err) {
      setAiConfigured(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setError('');

    // Add user message
    const newMessages = [...messages, { role: 'user', content: userMessage }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const response = await aiAPI.chat({
        message: userMessage,
        conversation_history: newMessages.slice(-10) // Send last 10 messages for context
      });

      if (response.data.success) {
        setMessages([...newMessages, { role: 'assistant', content: response.data.response }]);
      } else {
        setError('Failed to get response');
      }
    } catch (err) {
      console.error('AI chat error:', err);
      setError(err.response?.data?.detail || 'Failed to connect to AI service');
      setMessages([
        ...newMessages,
        { role: 'assistant', content: 'Sorry, I encountered an error. Please make sure the AI service is configured with a valid API key.' }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuickAction = async (action) => {
    setIsLoading(true);
    setError('');

    try {
      let response;
      let actionMessage = '';

      if (action === 'risks') {
        actionMessage = 'Analyze risks in my services';
        response = await aiAPI.riskAnalysis();
      } else if (action === 'suggestions') {
        actionMessage = 'What actions should I take?';
        response = await aiAPI.suggestions();
      }

      const newMessages = [...messages, { role: 'user', content: actionMessage }];
      
      if (response.data.success) {
        setMessages([...newMessages, { role: 'assistant', content: response.data.insight }]);
      }
    } catch (err) {
      setError('Failed to get insights');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 z-50"
        title="AI Assistant"
      >
        <Sparkles className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 h-[500px] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl flex flex-col z-50 border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-4 rounded-t-2xl flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          <span className="font-semibold">AI Assistant</span>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="hover:bg-white/20 p-1 rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Quick Actions */}
      <div className="p-2 border-b border-gray-200 dark:border-gray-700 flex gap-2">
        <button
          onClick={() => handleQuickAction('risks')}
          disabled={isLoading}
          className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-lg hover:bg-orange-200 dark:hover:bg-orange-900/50 transition-colors"
        >
          <AlertCircle className="w-3 h-3" />
          Risk Analysis
        </button>
        <button
          onClick={() => handleQuickAction('suggestions')}
          disabled={isLoading}
          className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
        >
          <Lightbulb className="w-3 h-3" />
          Suggestions
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {!aiConfigured && (
          <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 text-sm text-yellow-800 dark:text-yellow-200">
            <strong>AI Not Configured:</strong> Please add your Anthropic API key to the backend .env file (ANTHROPIC_API_KEY).
          </div>
        )}

        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] p-3 rounded-2xl ${
                msg.role === 'user'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-br-md'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-md'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-2xl rounded-bl-md">
              <Loader2 className="w-5 h-5 animate-spin text-purple-600" />
            </div>
          </div>
        )}

        {error && (
          <div className="text-red-500 text-sm text-center">{error}</div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything about your services..."
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-full bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-2 rounded-full hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
