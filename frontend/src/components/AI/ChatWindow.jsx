'use client';

import { useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';

export default function ChatWindow({ messages = [], loading = false }) {
  const messagesEndRef = useRef(null);
  const isFirstRender = useRef(true);

  useEffect(() => {
    // Only scroll to bottom when new messages are added after initial render
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    
    // Scroll to the latest message with preventScroll to avoid jumping
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [messages]);

  return (
    <div className={`flex-1 p-4 space-y-4 bg-slate-50 dark:bg-slate-900 ${messages.length > 0 ? 'overflow-y-auto' : 'overflow-hidden'}`}>
      {messages.length === 0 ? (
        <div className="flex items-center justify-center h-full text-center">
          <div>
            <h3 className="text-lg font-semibold text-slate-600 dark:text-slate-300 mb-2">
              Inventory Assistant
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              Ask questions about your medicines, batches, sales, or purchases
            </p>
          </div>
        </div>
      ) : (
        <>
          {messages.map((msg, idx) => (
            <MessageBubble
              key={idx}
              message={msg.content}
              isUser={msg.type === 'user'}
            />
          ))}
          
          {loading && (
            <div className="flex justify-start">
              <div className="bg-slate-800 px-4 py-3 rounded-lg rounded-bl-none">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
}
