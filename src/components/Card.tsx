import React, { memo } from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  action?: React.ReactNode;
  variant?: 'default' | 'gradient' | 'glass';
}

const Card = memo(({ 
  children, 
  className = '', 
  title, 
  action,
  variant = 'default'
}: CardProps) => {
  const baseClasses = 'rounded-xl shadow-sm border transition-all duration-200 hover:shadow-md';
  
  const variantClasses = {
    default: 'bg-white border-gray-200',
    gradient: 'bg-gradient-to-br from-white to-blue-50 border-blue-200',
    glass: 'bg-white/80 backdrop-blur-sm border-white/20 shadow-xl'
  };

  return (
    <div className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
      {title && (
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            {title}
          </h3>
          {action}
        </div>
      )}
      <div className={title ? 'p-6' : 'p-6'}>
        {children}
      </div>
    </div>
  );
});

Card.displayName = 'Card';

export default Card;