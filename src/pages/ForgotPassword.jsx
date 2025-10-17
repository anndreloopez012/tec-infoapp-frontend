import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Mail, Loader2 } from 'lucide-react';

import { useAuth } from '@/context/AuthContext';
import { useGlobal } from '@/context/GlobalContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const ForgotPassword = () => {
  const { forgotPassword, isLoading, error } = useAuth();
  const { getBranding } = useGlobal();
  
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const branding = getBranding();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) return;
    
    setIsSubmitting(true);
    
    try {
      const result = await forgotPassword(email);
      
      if (result.success) {
        setEmailSent(true);
      }
    } catch (error) {
      console.error('Forgot password error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut",
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-primary p-4">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="w-full max-w-md"
        >
          <Card className="shadow-2xl border-0 backdrop-blur-sm bg-card/95">
            <CardHeader className="text-center space-y-4">
              <motion.div variants={itemVariants}>
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <Mail className="h-8 w-8 text-green-600" />
                </div>
                
                <CardTitle className="text-2xl font-bold text-foreground">
                  Email Enviado
                </CardTitle>
                
                <CardDescription>
                  Te hemos enviado las instrucciones para restablecer tu contraseña a <strong>{email}</strong>
                </CardDescription>
              </motion.div>
            </CardHeader>

            <CardContent>
              <motion.div variants={itemVariants} className="space-y-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-sm text-green-800">
                    Revisa tu bandeja de entrada y sigue las instrucciones en el correo para restablecer tu contraseña.
                  </p>
                </div>
                
                <div className="text-center space-y-2">
                  <p className="text-sm text-muted-foreground">
                    ¿No recibiste el correo? Revisa tu carpeta de spam o
                  </p>
                  <Button
                    variant="link"
                    onClick={() => setEmailSent(false)}
                    className="p-0 h-auto text-primary"
                  >
                    intentar de nuevo
                  </Button>
                </div>

                <Button
                  variant="outline"
                  className="w-full"
                  asChild
                >
                  <Link to="/login">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Volver al Login
                  </Link>
                </Button>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-primary p-4">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-md"
      >
        <Card className="shadow-2xl border-0 backdrop-blur-sm bg-card/95">
          <CardHeader className="space-y-4 text-center">
            <motion.div variants={itemVariants}>
              {branding.logo && (
                <div className="mx-auto w-16 h-16 mb-4">
                  <img
                    src={branding.logo}
                    alt={branding.siteName}
                    className="w-full h-full object-contain"
                  />
                </div>
              )}
              
              <CardTitle className="text-2xl font-bold text-foreground">
                Recuperar Contraseña
              </CardTitle>
              
              <CardDescription>
                Ingresa tu email y te enviaremos las instrucciones para restablecer tu contraseña
              </CardDescription>
            </motion.div>
          </CardHeader>

          <CardContent>
            <motion.form variants={itemVariants} onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm"
                >
                  {error}
                </motion.div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="tu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-primary hover:opacity-90 transition-opacity"
                disabled={isSubmitting || isLoading || !email}
              >
                {isSubmitting || isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  'Enviar Instrucciones'
                )}
              </Button>

              <div className="text-center">
                <Link
                  to="/login"
                  className="text-sm text-primary hover:underline flex items-center justify-center"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Volver al Login
                </Link>
              </div>
            </motion.form>
          </CardContent>
        </Card>

        <motion.div
          variants={itemVariants}
          className="mt-8 text-center text-sm text-muted-foreground"
        >
          <p>© 2024 {branding.siteName}. Todos los derechos reservados.</p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;