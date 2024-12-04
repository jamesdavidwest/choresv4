import PropTypes from 'prop-types';

// Variant types for the alert
const alertVariants = {
  default: 'bg-white text-slate-950 border-slate-200 dark:bg-slate-950 dark:text-slate-50 dark:border-slate-800',
  destructive: 'border-red-500/20 text-red-500 dark:border-red-500/20 dark:text-red-600 bg-red-500/10'
};

// Alert component with support for variants and descriptions
export const Alert = ({ 
  children, 
  variant = 'default', 
  className, 
  ...props 
}) => {
  return (
    <div
      role="alert"
      className={`relative w-full rounded-lg border p-4 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground ${alertVariants[variant]} ${className || ''}`}
      {...props}
    >
      {children}
    </div>
  );
};

Alert.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(['default', 'destructive']),
  className: PropTypes.string
};

// AlertDescription component for additional text
export const AlertDescription = ({ 
  children, 
  className, 
  ...props 
}) => {
  return (
    <div
      className={`text-sm [&_p]:leading-relaxed ${className || ''}`}
      {...props}
    >
      {children}
    </div>
  );
};

AlertDescription.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string
};
