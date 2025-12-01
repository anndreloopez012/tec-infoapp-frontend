import { Button } from '@/components/ui/button';
import { Download, CheckCircle2 } from 'lucide-react';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

export const PWAInstallButton = () => {
  const { isInstallable, isInstalled, installPWA } = usePWAInstall();

  const handleInstall = async () => {
    const success = await installPWA();
    if (success) {
      toast.success('¡App instalada correctamente!', {
        description: 'Ahora puedes acceder desde tu pantalla de inicio',
      });
    } else {
      toast.error('No se pudo instalar la app', {
        description: 'Por favor, intenta de nuevo más tarde',
      });
    }
  };

  // Don't show button if already installed
  if (isInstalled) {
    return null;
  }

  // Don't show button if not installable
  if (!isInstallable) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.3 }}
      >
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-primary via-secondary to-primary rounded-2xl blur-lg opacity-75 group-hover:opacity-100 animate-gradient transition duration-500"></div>
          <Button
            onClick={handleInstall}
            size="lg"
            className="relative text-lg px-8 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 border-0 shadow-2xl hover-scale"
          >
            <Download className="mr-2 h-5 w-5" />
            Instalar App
          </Button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
