import { PublicHeader } from '@/components/public/PublicHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Users, BookOpen, Zap, Globe, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function PublicLanding() {
  const navigate = useNavigate();

  const handleNavigation = (path: string) => {
    if (document.startViewTransition) {
      document.startViewTransition(() => {
        navigate(path);
      });
    } else {
      navigate(path);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 md:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-secondary/10" />
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-primary/20 blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-secondary/20 blur-3xl animate-pulse delay-1000" />
        </div>
        
        <div className="container relative z-10">
          <div className="mx-auto max-w-4xl text-center space-y-8 animate-fade-in">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm text-primary animate-scale-in">
              <Sparkles className="h-4 w-4" />
              <span>Bienvenido al Portal TEC</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight">
              <span className="bg-gradient-to-r from-primary via-primary/80 to-secondary bg-clip-text text-transparent">
                Descubre Eventos
              </span>
              <br />
              <span className="text-foreground">y Contenido del TEC</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
              Mantente al día con todos los eventos, actividades y contenido relacionado con el Tecnológico
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button
                size="lg"
                onClick={() => handleNavigation('/public/events')}
                className="text-lg px-8 hover-scale"
              >
                <Calendar className="mr-2 h-5 w-5" />
                Ver Eventos
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => handleNavigation('/public/calendar')}
                className="text-lg px-8 hover-scale"
              >
                <Globe className="mr-2 h-5 w-5" />
                Explorar Calendario
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 border-t">
        <div className="container">
          <div className="text-center space-y-4 mb-12 animate-fade-in">
            <h2 className="text-3xl md:text-4xl font-bold">¿Qué puedes hacer aquí?</h2>
            <p className="text-xl text-muted-foreground">
              Todo lo que necesitas en un solo lugar
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-primary/20 hover:border-primary/40 transition-all duration-300 hover-scale group">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Calendar className="h-6 w-6 text-primary-foreground" />
                </div>
                <CardTitle>Calendario Interactivo</CardTitle>
                <CardDescription>
                  Visualiza todos los eventos en un calendario interactivo y agrégalos a tu Google Calendar
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-secondary/20 hover:border-secondary/40 transition-all duration-300 hover-scale group">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-secondary to-secondary/60 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Users className="h-6 w-6 text-secondary-foreground" />
                </div>
                <CardTitle>Eventos y Actividades</CardTitle>
                <CardDescription>
                  Descubre todos los eventos organizados por el TEC con información detallada
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-accent/20 hover:border-accent/40 transition-all duration-300 hover-scale group">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-accent to-accent/60 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <BookOpen className="h-6 w-6 text-accent-foreground" />
                </div>
                <CardTitle>Contenido por Categorías</CardTitle>
                <CardDescription>
                  Explora contenido organizado por categorías según tus intereses
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 border-t">
        <div className="container">
          <Card className="relative overflow-hidden border-primary/20">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-secondary/10" />
            <CardContent className="relative z-10 p-12">
              <div className="max-w-2xl mx-auto text-center space-y-6">
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm text-primary">
                  <Zap className="h-4 w-4" />
                  <span>Acceso completo</span>
                </div>
                <h2 className="text-3xl md:text-4xl font-bold">
                  ¿Quieres más funcionalidades?
                </h2>
                <p className="text-lg text-muted-foreground">
                  Inicia sesión para acceder a funcionalidades exclusivas y gestionar contenido
                </p>
                <Button
                  size="lg"
                  onClick={() => handleNavigation('/login')}
                  className="text-lg px-8 hover-scale"
                >
                  Iniciar Sesión
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 bg-muted/30">
        <div className="container text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} TEC. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
