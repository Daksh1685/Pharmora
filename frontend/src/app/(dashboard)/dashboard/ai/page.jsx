'use client';

import { useState, useEffect } from 'react';
import useMedicineStore from '@/store/medicineStore';
import apiClient from '@/utils/apiClient';
import { Card } from '@/components/Common';
import ChatWindow from '@/components/AI/ChatWindow';
import ChatInput from '@/components/AI/ChatInput';
import { IconSparkles } from '@tabler/icons-react';
import useAuthStore from '@/store/authStore';

const CHAT_HISTORY_BASE_KEY = 'pharmacy_ai_chat_history';

export default function AIPage() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const medicines = useMedicineStore((state) => state.medicines);
  const user = useAuthStore((state) => state.user);
  const userId = user?.id || user?._id || 'guest';
  const chatHistoryKey = `${CHAT_HISTORY_BASE_KEY}_${userId}`;

  // Prevent auto-scroll on mount - Override ChatWindow scroll when messages exist
  useEffect(() => {
    // Force scroll to top even if messages exist
    const scrollToTop = () => {
      window.scrollTo({top: 0, left: 0, behavior: 'auto'});
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    };
    
    // Scroll to top immediately
    scrollToTop();
    
    // Also scroll after a small delay to override any auto-scroll from ChatWindow
    const timer = setTimeout(() => {
      scrollToTop();
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  // Load chat history from localStorage on mount when userId is available
  useEffect(() => {
    if (userId !== 'guest') {
      const savedMessages = localStorage.getItem(chatHistoryKey);
      if (savedMessages) {
        try {
          setMessages(JSON.parse(savedMessages));
        } catch (error) {
          console.error('Failed to load chat history:', error);
          setMessages([]);
        }
      } else {
        setMessages([]); // Start fresh for new user
      }
    }
  }, [chatHistoryKey, userId]);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (messages.length > 0 && userId !== 'guest') {
      localStorage.setItem(chatHistoryKey, JSON.stringify(messages));
    }
  }, [messages, chatHistoryKey, userId]);

  // Clear chat history (called from ChatInput delete button)
  const handleClearHistory = () => {
    setMessages([]);
    localStorage.removeItem(chatHistoryKey);
  };

  // Quick action buttons
  const quickActions = [
    { id: 'stock', label: 'Check Stock?', query: 'Give me a complete overview of current stock levels and identify any critical issues.' },
    { id: 'low-stock', label: 'Low Stock?', query: 'Which medicines have low stock (less than 20 units)? List them with current quantities.' },
    { id: 'near-expiry', label: 'Near Expiry?', query: 'Show medicines expiring in the next 30 days with batch numbers and quantities.' },
    { id: 'expired', label: 'Expired Items?', query: 'List all medicines that have already expired or are expiring within 7 days.' },
    { id: 'reorder', label: 'Reorder Now?', query: 'Analyze sales trends and suggest optimal reorder quantities for all medicines with low stock.' },
    { id: 'fast-moving', label: 'Best Sellers?', query: 'Which medicines are selling the fastest? Show top 10 with sales trends.' },
    { id: 'dead-stock', label: 'Dead Stock?', query: 'Identify medicines with no sales in the last 30 days. What should we do with them?' },
    { id: 'substitute', label: 'Alternatives?', query: 'Help me find substitute medicines. Which generic medicines can replace branded ones?' },
    { id: 'batch', label: 'Batch Info?', query: 'Show batch information for all medicines. Which batches are expiring soon?' },
    { id: 'summary', label: 'Today Summary?', query: 'Give me a summary of today\'s sales, stock levels, and any critical alerts.' },
    { id: 'stockout', label: 'Stockout Risk?', query: 'Predict which medicines might go out of stock soon. When should we reorder?' },
    { id: 'purchase', label: 'Buy List?', query: 'Create a smart purchase list based on low stock, expiry dates, and sales trends.' }
  ];

  const handleQuickAction = (query) => {
    handleSendMessage(query);
  };

  const handleSendMessage = async (userMessage) => {
    // Add user message to chat
    setMessages((prev) => [
      ...prev,
      { type: 'user', content: userMessage },
    ]);

    setLoading(true);

    try {
      // Call backend AI API with Groq
      const response = await apiClient.post('/ai/chat', {
        message: userMessage,
      });

      const aiResponse = response.data?.data?.response || response.data?.response || 'I encountered an error processing your message.';

      setMessages((prev) => [
        ...prev,
        { type: 'assistant', content: aiResponse },
      ]);
    } catch (error) {
      console.error('Failed to send message:', error);
      
      // Fallback to local response based on medicines data
      let fallbackResponse = '';
      const lowerMessage = userMessage.toLowerCase();

      const lowStockMedicines = Array.isArray(medicines) ? medicines.filter((m) => m.quantity < 20) : [];
      const totalMedicines = Array.isArray(medicines) ? medicines.length : 0;
      const totalStock = Array.isArray(medicines) ? medicines.reduce((sum, m) => sum + m.quantity, 0) : 0;

      if (lowerMessage.includes('stock')) {
        fallbackResponse = `Your pharmora has ${totalMedicines} medicines in total with a combined stock of ${totalStock} units. ${
          lowStockMedicines.length > 0
            ? `You have ${lowStockMedicines.length} medicines running low on stock. Try connecting to Groq API for detailed analysis.`
            : 'All medicines have good stock levels.'
        }`;
      } else if (lowerMessage.includes('expire') || lowerMessage.includes('expiry')) {
        fallbackResponse = 'Check the Notifications section to see expiry alerts for medicines expiring within 30 days. Groq API will provide detailed analysis.';
      } else if (lowerMessage.includes('sales')) {
        fallbackResponse = 'You can track your sales in the Sales section. Connect Groq API for AI-powered sales analysis.';
      } else {
        fallbackResponse = 'Groq API is not connected. Please check your API key or try the quick actions for pre-defined queries!';
      }

      setMessages((prev) => [
        ...prev,
        { type: 'assistant', content: fallbackResponse },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">AI Assistant</h1>
              <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm mt-0.5">
                Get instant insights and recommendations using AI
              </p>
            </div>
          </div>
          
        </div>
      </div>

      {/* Chat Container */}
      <Card className="flex flex-col min-h-[500px] sm:min-h-[600px] md:h-[750px] overflow-hidden border-2 border-slate-300 bg-slate-900">
        <ChatWindow messages={messages} loading={loading} />
        <div className="p-4 border-t border-slate-700 bg-slate-800">
          <ChatInput onSendMessage={handleSendMessage} onDeleteChat={handleClearHistory} disabled={loading} quickActions={quickActions} />
        </div>
      </Card>
    </div>
  );
}
