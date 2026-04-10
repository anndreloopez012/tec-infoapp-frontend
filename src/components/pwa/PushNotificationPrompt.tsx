import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import pushNotificationService from '@/services/pushNotificationService';
import webPushService from '@/services/webPushService';
import { globalNotificationService } from '@/services/globalNotificationService';

interface PushNotificationPromptProps {
  className?: string;
}

export const PushNotificationPrompt: React.FC<PushNotificationPromptProps> = ({ className }) => {
  const [show, setShow] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if (!webPushService.isNotificationSupported()) {
      return;
    }

    const currentPermission = webPushService.getPermissionStatus();
    setPermission(currentPermission);

    const lastAsked = localStorage.getItem('push_permission_asked');
    const dayAgo = Date.now() - 24 * 60 * 60 * 1000;

    if (currentPermission === 'default' && (!lastAsked || Number(lastAsked) < dayAgo)) {
      const timeoutId = window.setTimeout(() => setShow(true), 3000);
      return () => window.clearTimeout(timeoutId);
    }
  }, []);

  const handleAllow = async () => {
    const result = await webPushService.requestPermission();
    setPermission(result);
    setShow(false);
    localStorage.setItem('push_permission_asked', Date.now().toString());

    if (result === 'granted') {
      try {
        const sub = await pushNotificationService.subscribeToPush();
        if (sub) {
          await globalNotificationService.subscribeToPush(JSON.stringify(sub), 'web');
        }
      } catch (error) {
        console.warn('[Push] No se pudo registrar suscripción Web Push:', error);
      }
    }
  };

  const handleDismiss = () => {
    setShow(false);
    localStorage.setItem('push_permission_asked', Date.now().toString());
  };

  if (permission === 'granted' || permission === 'denied') {
    return null;
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className={cn(
            'fixed bottom-4 right-4 z-50 max-w-xs rounded-xl border border-border/50 bg-card/95 p-4 shadow-lg backdrop-blur-md',
            className
          )}
        >
          <button
            onClick={handleDismiss}
            className="absolute right-2 top-2 p-1 text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="flex items-start gap-3 pr-6">
            <div className="flex-shrink-0 rounded-lg bg-primary/10 p-2">
              <Bell className="h-5 w-5 text-primary" />
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">Activar notificaciones</p>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Recibe avisos importantes incluso cuando la app no esta activa.
              </p>

              <div className="flex gap-2 pt-1">
                <Button size="sm" onClick={handleAllow} className="h-7 px-3 text-xs">
                  Activar
                </Button>
                <Button size="sm" variant="ghost" onClick={handleDismiss} className="h-7 px-3 text-xs">
                  Ahora no
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PushNotificationPrompt;
