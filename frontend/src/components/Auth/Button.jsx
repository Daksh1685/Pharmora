'use client';

const Button = ({
  children,
  type = 'button',
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  onClick,
  className = '',
}) => {
  const baseStyles =
    'font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-800';

  const variants = {
    primary: 'bg-slate-700 text-white hover:bg-slate-800 focus:ring-slate-700 dark:bg-slate-600 dark:hover:bg-slate-500 dark:focus:ring-slate-500 disabled:bg-gray-400 dark:disabled:bg-slate-700',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500 dark:bg-slate-700 dark:text-white dark:hover:bg-slate-600 dark:focus:ring-slate-500 disabled:bg-gray-400 dark:disabled:bg-slate-700',
    outline: 'border-2 border-blue-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:bg-slate-800 focus:ring-slate-700 dark:focus:ring-slate-500 dark:border-slate-700 dark:border-slate-500 dark:text-blue-400 dark:hover:bg-blue-950 dark:focus:ring-slate-700 dark:focus:ring-slate-500 disabled:border-gray-400 disabled:text-gray-400 dark:disabled:border-slate-600 dark:disabled:text-slate-500',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className} disabled:cursor-not-allowed`}
    >
      {isLoading ? 'Loading...' : children}
    </button>
  );
};

export default Button;
