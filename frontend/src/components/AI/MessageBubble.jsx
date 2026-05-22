'use client';

import ReactMarkdown from 'react-markdown';

export default function MessageBubble({ message, isUser }) {
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-2xl px-4 py-3 rounded-lg ${
          isUser
            ? 'bg-slate-700 text-white rounded-br-none'
            : 'bg-slate-500 text-black rounded-bl-none'
        }`}
      >
        {isUser ? (
          <p className="text-sm leading-relaxed break-words">{message}</p>
        ) : (
          <div className="prose prose-sm max-w-none">
            <ReactMarkdown
              components={{
                p: ({ node, ...props }) => <p className="text-sm leading-relaxed m-0 mb-2 break-words text-slate-100" {...props} />,
                ul: ({ node, ...props }) => <ul className="text-sm list-disc list-inside space-y-1 m-0 mb-2 text-slate-100" {...props} />,
                ol: ({ node, ...props }) => <ol className="text-sm list-decimal list-inside space-y-1 m-0 mb-2 text-slate-100" {...props} />,
                li: ({ node, ...props }) => <li className="text-sm m-0 leading-relaxed text-slate-100" {...props} />,
                strong: ({ node, ...props }) => <strong className="font-bold text-slate-100" {...props} />,
                em: ({ node, ...props }) => <em className="italic text-slate-100" {...props} />,
                code: ({ node, inline, ...props }) =>
                  inline ? (
                    <code className="bg-slate-700 px-2 py-1 rounded text-xs text-slate-100" {...props} />
                  ) : (
                    <code className="bg-slate-700 px-2 py-1 rounded block text-xs overflow-x-auto text-slate-100" {...props} />
                  ),
              }}
            >
              {message}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}
