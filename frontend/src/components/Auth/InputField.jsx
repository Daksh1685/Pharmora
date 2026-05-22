'use client';

const InputField = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  error,
  placeholder,
  required = false,
}) => {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={name} className="text-sm font-medium text-gray-700 dark:text-white">
        {label}
        {required && <span className="text-red-500 dark:text-red-400 ml-1">*</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-400 ${
          error
            ? 'border-red-500 dark:border-red-500 focus:ring-red-500'
            : 'border-gray-300 dark:border-slate-600 focus:ring-slate-700 dark:focus:ring-slate-500'
        }`}
        aria-invalid={!!error}
        aria-describedby={error ? `${name}-error` : undefined}
      />
      {error && (
        <span id={`${name}-error`} className="text-sm text-red-500 dark:text-red-400">
          {error}
        </span>
      )}
    </div>
  );
};

export default InputField;
