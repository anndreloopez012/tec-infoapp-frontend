import { Link } from 'react-router-dom';
import { useGlobal } from '@/context/GlobalContext';

export const PublicFooter = () => {
  const { getBranding } = useGlobal();
  const branding = getBranding();
  const logoUrl = branding.logo || branding.logoAlt || branding.logoMobile;

  return (
    <footer className="border-t bg-gradient-to-br from-muted/30 to-muted/10">
      <div className="container py-10">
        <div className="grid gap-8 md:grid-cols-3">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center overflow-hidden shadow-sm">
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt={branding.siteName || 'Tec Community'}
                    className="h-full w-full object-contain bg-background/90"
                    loading="lazy"
                  />
                ) : (
                  <span className="text-primary-foreground font-bold text-lg">T</span>
                )}
              </div>
              <div>
                <p className="font-semibold text-foreground">{branding.siteName || 'Tec Community'}</p>
                <p className="text-sm text-muted-foreground">
                  {branding.tagline || 'Conecta a la comunidad con información útil y actualizada.'}
                </p>
              </div>
            </div>
            <p className="text-sm leading-6 text-muted-foreground">
              Tec Community centraliza la información más importante para que cada Tec member viva una experiencia
              más cercana, dinámica e informada dentro de la comunidad.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-foreground">Acceso Público</h3>
            <div className="flex flex-col gap-2 text-sm">
              <Link to="/public/calendar" className="text-muted-foreground transition-colors hover:text-primary">
                Calendario
              </Link>
              <Link to="/public/events" className="text-muted-foreground transition-colors hover:text-primary">
                Eventos
              </Link>
              <Link to="/politicas-seguridad" className="text-muted-foreground transition-colors hover:text-primary">
                Políticas de Seguridad
              </Link>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-foreground">Legal y Cuenta</h3>
            <div className="flex flex-col gap-2 text-sm">
              <Link to="/terminos-y-condiciones" className="text-muted-foreground transition-colors hover:text-primary">
                Términos y Condiciones
              </Link>
              <Link to="/eliminar-cuenta" className="text-muted-foreground transition-colors hover:text-primary">
                Cómo Eliminar Mi Cuenta
              </Link>
              <Link to="/login" className="text-muted-foreground transition-colors hover:text-primary">
                Iniciar Sesión
              </Link>
            </div>
            <div className="pt-3 space-y-3">
              <a
                href="https://softplusgt.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                <span className="font-mono text-xs">{'</>'}</span>
                <span className="font-medium">SoftPlus - GT</span>
              </a>
              <a
                href="https://alcore-gt.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                <span className="font-mono text-xs">{'</>'}</span>
                <span className="font-medium">ALCORE</span>
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-border/60 pt-6 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} {branding.siteName || 'Tec Community'}. Todos los derechos reservados.
        </div>
      </div>
    </footer>
  );
};
