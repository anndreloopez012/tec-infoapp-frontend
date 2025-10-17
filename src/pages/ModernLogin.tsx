import React, { useState, useEffect } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Loader2, Mail, Lock, Shield, Sparkles } from 'lucide-react';

import { useAuth } from '@/context/AuthContext';
import { useGlobal } from '@/context/GlobalContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

const ModernLogin = () => {
  const { login, isAuthenticated, isLoading, error } = useAuth();
  const { getBranding } = useGlobal();
  
  const [formData, setFormData] = useState({
    identifier: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const branding = getBranding();

  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.identifier || !formData.password) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await login(formData.identifier, formData.password);
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, scale: 0.9, y: 50 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: "easeOut" as any,
        staggerChildren: 0.15
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    visible: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: { 
        duration: 0.6,
        ease: "easeOut" as any
      }
    }
  };

  const floatingVariants = {
    y: [0, -15, 0],
    x: [0, 5, 0],
    rotate: [0, 2, 0],
    transition: { 
      duration: 4, 
      repeat: Infinity, 
      ease: "easeInOut" as any
    }
  };

  const submitVariants = {
    idle: { scale: 1 },
    loading: { 
      scale: [1, 1.02, 1],
      transition: { 
        duration: 0.6,
        repeat: Infinity,
        ease: "easeInOut" as any
      }
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background */}
      <motion.div 
        className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-secondary/20"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2 }}
      >
        <motion.div 
          className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-secondary/5"
          animate={{ 
            background: [
              'linear-gradient(45deg, hsl(var(--primary) / 0.05) 0%, transparent 50%, hsl(var(--secondary) / 0.05) 100%)',
              'linear-gradient(45deg, hsl(var(--secondary) / 0.05) 0%, transparent 50%, hsl(var(--accent) / 0.05) 100%)',
              'linear-gradient(45deg, hsl(var(--accent) / 0.05) 0%, transparent 50%, hsl(var(--primary) / 0.05) 100%)'
            ]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        />
        
        {/* Enhanced Floating Elements */}
        <motion.div
          animate={floatingVariants}
          className="absolute top-20 left-20 w-24 h-24 bg-gradient-primary rounded-full blur-2xl opacity-40"
          style={{ animationDelay: '0s' }}
        />
        <motion.div
          animate={{
            ...floatingVariants,
            y: [0, -20, 0],
            x: [0, 10, 0]
          }}
          className="absolute top-40 right-32 w-32 h-32 bg-gradient-secondary rounded-full blur-2xl opacity-30"
          style={{ animationDelay: '1.5s' }}
        />
        <motion.div
          animate={{
            ...floatingVariants,
            y: [0, -12, 0],
            x: [0, -8, 0]
          }}
          className="absolute bottom-32 left-1/4 w-28 h-28 bg-gradient-accent rounded-full blur-2xl opacity-35"
          style={{ animationDelay: '3s' }}
        />
        <motion.div
          animate={floatingVariants}
          className="absolute top-1/2 right-20 w-16 h-16 bg-primary/30 rounded-full blur-xl opacity-50"
          style={{ animationDelay: '2.5s' }}
        />
        <motion.div
          animate={{
            ...floatingVariants,
            scale: [1, 1.1, 1],
            opacity: [0.2, 0.4, 0.2]
          }}
          className="absolute bottom-20 right-1/3 w-20 h-20 bg-secondary/25 rounded-full blur-xl"
          style={{ animationDelay: '4s' }}
        />
      </motion.div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="w-full max-w-md"
        >
          {/* Login Card */}
          <Card className="backdrop-blur-xl bg-card/80 border-border/50 shadow-2xl">
            <CardHeader className="space-y-6 text-center pb-8">
              <motion.div variants={itemVariants} className="flex justify-center">
                {branding.logo ? (
                  <div className="relative">
                    <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse"></div>
                    <img
                      src={branding.logo}
                      alt={branding.siteName}
                      className="relative w-20 h-20 object-contain rounded-2xl"
                    />
                  </div>
                ) : (
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-primary rounded-full blur-xl opacity-20 animate-pulse"></div>
                    <div className="relative w-20 h-20 bg-gradient-primary rounded-2xl flex items-center justify-center">
                      <Shield className="w-10 h-10 text-white" />
                    </div>
                  </div>
                )}
              </motion.div>
              
              <motion.div variants={itemVariants} className="space-y-2">
                <CardTitle className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                  {branding.siteName || 'Admin Panel'}
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Bienvenido de vuelta. Ingresa tus credenciales para continuar.
                </CardDescription>
              </motion.div>
            </CardHeader>

            <CardContent className="space-y-6">
              <motion.form variants={itemVariants} onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="space-y-2"
                  >
                    <Alert variant="destructive" className="border-destructive/50 bg-destructive/5">
                      <AlertDescription className="text-sm">
                        {error}
                      </AlertDescription>
                    </Alert>
                  </motion.div>
                )}

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="identifier" className="text-sm font-medium">
                      Email o Usuario
                    </Label>
                    <div className="relative group">
                      <Mail className="absolute left-3 top-3 h-5 w-5 text-muted-foreground transition-colors group-focus-within:text-primary" />
                      <Input
                        id="identifier"
                        name="identifier"
                        type="text"
                        placeholder="tu@email.com"
                        value={formData.identifier}
                        onChange={handleInputChange}
                        className="pl-10 h-12 bg-background/50 border-border/50 focus:border-primary/50 focus:bg-background transition-all duration-200"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium">
                      Contraseña
                    </Label>
                    <div className="relative group">
                      <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground transition-colors group-focus-within:text-primary" />
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={handleInputChange}
                        className="pl-10 pr-12 h-12 bg-background/50 border-border/50 focus:border-primary/50 focus:bg-background transition-all duration-200"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-muted-foreground hover:text-primary transition-colors p-1"
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <motion.div
                  variants={submitVariants}
                  animate={isSubmitting || isLoading ? 'loading' : 'idle'}
                  className="w-full"
                >
                  <Button
                    type="submit"
                    className="w-full h-12 bg-gradient-primary hover:opacity-90 text-white font-medium text-base shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden group btn-glow"
                    disabled={isSubmitting || isLoading}
                  >
                    <motion.div 
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                      animate={{
                        x: isSubmitting || isLoading ? ['-100%', '100%'] : '-100%'
                      }}
                      transition={{
                        duration: isSubmitting || isLoading ? 1.5 : 0,
                        repeat: isSubmitting || isLoading ? Infinity : 0,
                        ease: "linear"
                      }}
                    />
                    
                    <motion.div 
                      className="flex items-center justify-center relative z-10"
                      animate={{
                        scale: isSubmitting || isLoading ? [1, 1.02, 1] : 1
                      }}
                      transition={{
                        duration: 0.8,
                        repeat: isSubmitting || isLoading ? Infinity : 0,
                        ease: "easeInOut"
                      }}
                    >
                      {isSubmitting || isLoading ? (
                        <>
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          >
                            <Loader2 className="mr-2 h-5 w-5" />
                          </motion.div>
                          <motion.span
                            animate={{ opacity: [1, 0.7, 1] }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                          >
                            Iniciando sesión...
                          </motion.span>
                        </>
                      ) : (
                        <>
                          <motion.div
                            animate={{ 
                              rotate: [0, 5, -5, 0], 
                              scale: [1, 1.1, 1] 
                            }}
                            transition={{ 
                              duration: 2, 
                              repeat: Infinity, 
                              ease: "easeInOut",
                              delay: Math.random() * 2
                            }}
                          >
                            <Sparkles className="mr-2 h-5 w-5" />
                          </motion.div>
                          Iniciar Sesión
                        </>
                      )}
                    </motion.div>
                  </Button>
                </motion.div>

                  <div className="text-center">
                    <Link
                      to="/forgot-password"
                      className="text-sm text-primary hover:text-primary/80 transition-colors"
                    >
                      ¿Olvidaste tu contraseña?
                    </Link>
                  </div>
                </motion.form>
              </CardContent>
            </Card>

            {/* Footer */}
            <motion.div
              variants={itemVariants}
              className="mt-8 text-center"
            >
              <p className="text-sm text-muted-foreground/80">
                © 2024 {branding.siteName || 'Admin Panel'}. Todos los derechos reservados.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </div>
    );
  };

  export default ModernLogin;