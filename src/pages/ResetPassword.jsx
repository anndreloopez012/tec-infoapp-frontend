import React, { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Eye, EyeOff, Loader2, Lock, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useGlobal } from '@/context/GlobalContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SeoHead } from '@/components/seo/SeoHead';

const ResetPassword = () => {
  const { resetPassword, isLoading, error } = useAuth();
  const { getBranding } = useGlobal();
  const branding = getBranding();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const code = searchParams.get('code') || '';

  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const validationError = useMemo(() => {
    if (!code) return 'El enlace de recuperación no es válido o está incompleto.';
    if (formData.password && formData.password.length < 6) {
      return 'La contraseña debe tener al menos 6 caracteres.';
    }
    if (formData.confirmPassword && formData.password !== formData.confirmPassword) {
      return 'Las contraseñas no coinciden.';
    }
    return '';
  }, [code, formData.confirmPassword, formData.password]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (validationError || !formData.password || !formData.confirmPassword) return;

    setIsSubmitting(true);
    const result = await resetPassword(code, formData.password, formData.confirmPassword);
    setIsSubmitting(false);

    if (result.success) {
      setIsDone(true);
      setTimeout(() => navigate('/login', { replace: true }), 1800);
    }
  };

  if (isDone) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-primary p-4">
        <SeoHead
          title="Contraseña actualizada"
          description="Tu contraseña fue actualizada correctamente."
          path="/reset-password"
          noindex
        />
        <Card className="w-full max-w-md shadow-2xl border-0 backdrop-blur-sm bg-card/95">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <ShieldCheck className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-bold">Contraseña actualizada</CardTitle>
            <CardDescription>
              Tu acceso fue restablecido correctamente. Te llevaremos al login para que ingreses con tu nueva contraseña.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-primary p-4">
      <SeoHead
        title="Restablecer contraseña"
        description="Crea una nueva contraseña para tu cuenta de Tec Community."
        path="/reset-password"
        noindex
      />
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Card className="shadow-2xl border-0 backdrop-blur-sm bg-card/95">
          <CardHeader className="space-y-4 text-center">
            {branding.logo && (
              <div className="mx-auto w-16 h-16">
                <img src={branding.logo} alt={branding.siteName} className="w-full h-full object-contain" />
              </div>
            )}
            <CardTitle className="text-2xl font-bold">Restablecer contraseña</CardTitle>
            <CardDescription>
              Define una nueva contraseña segura para tu cuenta de {branding.siteName || 'Tec Community'}.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {(validationError || error) && (
                <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                  {validationError || error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="password">Nueva contraseña</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Nueva contraseña"
                    value={formData.password}
                    onChange={handleChange}
                    className="pl-10 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-3 text-muted-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirma tu nueva contraseña"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="pl-10 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="absolute right-3 top-3 text-muted-foreground"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-primary hover:opacity-90 transition-opacity"
                disabled={
                  isSubmitting ||
                  isLoading ||
                  !code ||
                  !formData.password ||
                  !formData.confirmPassword ||
                  Boolean(validationError)
                }
              >
                {isSubmitting || isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Actualizando...
                  </>
                ) : (
                  'Guardar nueva contraseña'
                )}
              </Button>

              <div className="text-center">
                <Link to="/login" className="text-sm text-primary hover:underline flex items-center justify-center">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Volver al login
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default ResetPassword;
