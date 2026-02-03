import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGlobal } from '@/context/GlobalContext';

export const SplashScreen = () => {
  const [isVisible, setIsVisible] = useState(true);
  const { getImageUrl, getBranding } = useGlobal();
  const branding = getBranding();

  // Check if running as PWA/standalone
  const isPWA = 
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true ||
    document.referrer.includes('android-app://');

  useEffect(() => {
    // Only show splash in PWA mode
    if (!isPWA) {
      setIsVisible(false);
      return;
    }

    // Hide splash screen after animation completes
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 2500);

    return () => clearTimeout(timer);
  }, [isPWA]);

  if (!isVisible || !isPWA) return null;

  const logoUrl = branding?.logo ? getImageUrl(branding.logo) : '/icon-512x512.png';
  const appName = branding?.name || 'TEC';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
        className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden"
        style={{
          background: 'var(--gradient-dark)',
        }}
      >
        {/* Animated grid background */}
        <div className="absolute inset-0 bg-grid-pattern opacity-10" />
        
        {/* Animated gradient orbs */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl"
          style={{ background: 'hsl(var(--primary) / 0.3)' }}
        />
        
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.5
          }}
          className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-3xl"
          style={{ background: 'hsl(var(--secondary) / 0.3)' }}
        />

        {/* Logo and content */}
        <div className="relative z-10 flex flex-col items-center gap-8 px-6">
          {/* Logo with glow effect */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{
              type: "spring",
              stiffness: 200,
              damping: 20,
              duration: 1
            }}
            className="relative"
          >
            <motion.div
              animate={{
                boxShadow: [
                  '0 0 20px hsl(var(--primary) / 0.5)',
                  '0 0 60px hsl(var(--primary) / 0.8)',
                  '0 0 20px hsl(var(--primary) / 0.5)',
                ]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="w-32 h-32 rounded-3xl overflow-hidden bg-card border-2"
              style={{ borderColor: 'hsl(var(--primary))' }}
            >
              <img 
                src={logoUrl} 
                alt={appName}
                className="w-full h-full object-contain p-4"
              />
            </motion.div>
          </motion.div>

          {/* App name with staggered letter animation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="text-center"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-2 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              {appName}
            </h1>
            {branding?.tagline && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1, duration: 0.8 }}
                className="text-muted-foreground text-sm md:text-base"
              >
                {branding.tagline}
              </motion.p>
            )}
          </motion.div>

          {/* Loading indicator */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.2, duration: 0.5 }}
            className="flex gap-2"
          >
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.3, 1, 0.3],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.2,
                  ease: "easeInOut"
                }}
                className="w-3 h-3 rounded-full"
                style={{ background: 'hsl(var(--primary))' }}
              />
            ))}
          </motion.div>

          {/* Tech elements floating */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.1 }}
            transition={{ delay: 0.8, duration: 1 }}
            className="absolute inset-0 overflow-hidden pointer-events-none"
          >
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                animate={{
                  y: [0, -100],
                  opacity: [0, 0.5, 0],
                }}
                transition={{
                  duration: 3 + Math.random() * 2,
                  repeat: Infinity,
                  delay: Math.random() * 2,
                  ease: "linear"
                }}
                style={{
                  position: 'absolute',
                  left: `${Math.random() * 100}%`,
                  top: `${100 + Math.random() * 20}%`,
                }}
                className="w-1 h-1 rounded-full bg-primary"
              />
            ))}
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
