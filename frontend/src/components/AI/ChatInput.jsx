'use client';

import { useState, useRef, useEffect } from 'react';
import { IconSend } from '@tabler/icons-react';
import DeleteConfirmModal from './DeleteConfirmModal';

export default function ChatInput({ onSendMessage, onDeleteChat, disabled = false, quickActions = [] }) {
  const [input, setInput] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const inputRef = useRef(null);
  const isMountedRef = useRef(false);

  // Prevent auto-focus only on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.blur();
    }
    
    // Mark as mounted after blur to allow focus afterwards
    const timer = setTimeout(() => {
      isMountedRef.current = true;
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (input.trim()) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  const handleQuickAction = (query) => {
    onSendMessage(query);
  };

  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = () => {
    setShowDeleteModal(false);
    onDeleteChat();
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
  };

  return (
    <>
      <div className="w-full space-y-3">
        {/* Quick Actions */}
        {quickActions.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:flex md:flex-wrap gap-2">
            {quickActions.slice(0, 5).map((action) => (
              <button
                key={action.id}
                onClick={() => handleQuickAction(action.query)}
                disabled={disabled}
                className="px-2 sm:px-3 py-1.5 sm:py-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-500 text-white rounded-lg transition-colors disabled:cursor-not-allowed shadow-sm text-xs font-medium"
                title={action.query}
              >
                {action.label}
              </button>
            ))}
          </div>
        )}

        {/* Search Input */}
        <form
          onSubmit={handleSubmit}
          className="w-full"
        >
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 items-stretch sm:items-center">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question or make a request..."
              disabled={disabled}
              className="flex-1 px-3 sm:px-4 py-2 sm:py-3 border-2 border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-600 focus:border-slate-500 disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm transition-all bg-slate-800 text-slate-100 placeholder-slate-400"
            />
            <button
              type="submit"
              disabled={!input.trim() || disabled}
              className="px-3 sm:px-4 py-2 sm:py-3 bg-slate-600 hover:bg-slate-700 disabled:bg-slate-500 text-white rounded-lg transition-colors flex items-center justify-center gap-2 disabled:cursor-not-allowed shadow-sm text-xs sm:text-sm font-medium"
            >
              <span className="sm:hidden">Send</span>
              <IconSend size={18} className="hidden sm:block" />
            </button>
            <button
              type="button"
              onClick={handleDeleteClick}
              disabled={disabled}
              className="px-3 sm:px-4 py-2 sm:py-3 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white rounded-lg transition-colors disabled:cursor-not-allowed shadow-sm text-xs sm:text-sm font-medium whitespace-nowrap"
              title="Delete all chats"
            >
              Delete
            </button>
          </div>
        </form>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </>
  );
}
