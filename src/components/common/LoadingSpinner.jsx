import React from 'react';
import { motion } from 'framer-motion';

const LoadingSpinner = ({ size = 'md', text = null, fullScreen = false }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const Container = fullScreen ? 'div' : React.Fragment;
  const containerProps = fullScreen ? {
    className: 'fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50'
  } : {};

  return (
    <Container {...containerProps}>
      <div className="flex flex-col items-center space-y-4">
        <motion.div
          className={`${sizeClasses[size]} border-2 border-primary/30 border-t-primary rounded-full`}
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
        
        {text && (
          <motion.p
            className="text-sm text-muted-foreground text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {text}
          </motion.p>
        )}
      </div>
    </Container>
  );
};

export default LoadingSpinner;