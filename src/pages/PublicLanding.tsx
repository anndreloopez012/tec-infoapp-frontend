import { PublicHeader } from "@/components/public/PublicHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Calendar,
  Users,
  BookOpen,
  Zap,
  Globe,
  Sparkles,
  Cpu,
  Code2,
  Database,
  Rocket,
  Cloud,
  Network,
  Layers,
  Terminal,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

export default function PublicLanding() {
  const navigate = useNavigate();
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleNavigation = (path: string) => {
    if (document.startViewTransition) {
      document.startViewTransition(() => {
        navigate(path);
      });
    } else {
      navigate(path);
    }
  };

  const techIcons = [
    { Icon: Cpu, delay: "0s" },
    { Icon: Code2, delay: "0.5s" },
    { Icon: Database, delay: "1s" },
    { Icon: Cloud, delay: "1.5s" },
    { Icon: Network, delay: "2s" },
    { Icon: Layers, delay: "2.5s" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />

      {/* Floating Tech Icons Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {techIcons.map(({ Icon, delay }, index) => (
          <div
            key={index}
            className="absolute animate-float opacity-5"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: delay,
              transform: `translateY(${scrollY * 0.1}px)`,
            }}
          >
            <Icon className="h-24 w-24 text-primary" />
          </div>
        ))}
      </div>

      {/* Hero Section */}
      <section
        className="relative overflow-hidden py-20 md:py-32"
        style={{ transform: `translateY(${scrollY * 0.5}px)` }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-secondary/10" />
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-primary/20 blur-3xl animate-pulse" />
          <div
            className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-secondary/20 blur-3xl animate-pulse"
            style={{ animationDelay: "1s" }}
          />
        </div>

        {/* Grid Pattern Overlay */}
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />

        <div className="container relative z-10">
          <div className="mx-auto max-w-4xl text-center space-y-8 animate-fade-in">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm text-primary animate-scale-in">
              <Sparkles className="h-4 w-4" />
              <span>Bienvenido al Portal TEC</span>
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight animate-fade-in">
              <span className="bg-gradient-to-r from-primary via-primary/80 to-secondary bg-clip-text text-transparent animate-gradient">
                Descubre Eventos
              </span>
              <br />
              <span className="text-foreground">y Contenido Empresarial</span>
            </h1>

            <p
              className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto animate-fade-in"
              style={{ animationDelay: "0.2s" }}
            >
              Mantente al día con todos los eventos, actividades y contenido relacionado con empresas y tecnología del
              TEC
            </p>

            <div
              className="flex items-center justify-center gap-4 text-sm text-muted-foreground animate-fade-in"
              style={{ animationDelay: "0.3s" }}
            >
              <div className="flex items-center gap-2">
                <Terminal className="h-4 w-4 text-primary animate-pulse" />
                <span>Tecnología</span>
              </div>
              <div className="h-4 w-px bg-border" />
              <div className="flex items-center gap-2">
                <Rocket className="h-4 w-4 text-secondary animate-bounce" />
                <span>Innovación</span>
              </div>
              <div className="h-4 w-px bg-border" />
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-accent animate-pulse" />
                <span>Comunidad</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button size="lg" onClick={() => handleNavigation("/public/events")} className="text-lg px-8 hover-scale">
                <Calendar className="mr-2 h-5 w-5" />
                Ver Eventos
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => handleNavigation("/public/calendar")}
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
      <section className="py-20 border-t relative" style={{ transform: `translateY(${scrollY * 0.3}px)` }}>
        <div className="container relative z-10">
          <div className="text-center space-y-4 mb-16 animate-fade-in">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm text-primary mb-4">
              <Rocket className="h-4 w-4 animate-bounce" />
              <span>Plataforma Integral</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent">
              ¿Qué puedes hacer aquí?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Todo lo que necesitas para estar conectado con el ecosistema tecnológico y empresarial
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <Card className="border-primary/20 hover:border-primary/40 transition-all duration-500 hover-scale group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardHeader className="relative">
                <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-3 transition-all shadow-lg">
                  <Calendar className="h-8 w-8 text-primary-foreground" />
                </div>
                <CardTitle className="text-xl">Calendario Interactivo</CardTitle>
                <CardDescription className="text-base">
                  Visualiza todos los eventos en un calendario interactivo y agrégalos a tu Google Calendar con un solo
                  clic
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-secondary/20 hover:border-secondary/40 transition-all duration-500 hover-scale group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardHeader className="relative">
                <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-secondary to-secondary/60 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-3 transition-all shadow-lg">
                  <Users className="h-8 w-8 text-secondary-foreground" />
                </div>
                <CardTitle className="text-xl">Eventos y Actividades</CardTitle>
                <CardDescription className="text-base">
                  Descubre todos los eventos organizados por el TEC con información detallada, ubicaciones y fechas
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-accent/20 hover:border-accent/40 transition-all duration-500 hover-scale group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardHeader className="relative">
                <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-accent to-accent/60 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-3 transition-all shadow-lg">
                  <BookOpen className="h-8 w-8 text-accent-foreground" />
                </div>
                <CardTitle className="text-xl">Contenido Empresarial y Tecnológico</CardTitle>
                <CardDescription className="text-base">
                  Explora contenido organizado por categorías sobre empresas, tecnología e innovación
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          {/* Additional Tech Stats Section */}
          <div className="grid md:grid-cols-4 gap-6 mt-16">
            {[
              { icon: Cpu, label: "Tecnología", value: "Innovación", color: "primary" },
              { icon: Database, label: "Datos", value: "En tiempo real", color: "secondary" },
              { icon: Cloud, label: "Cloud", value: "Escalable", color: "accent" },
              { icon: Network, label: "Conectividad", value: "24/7", color: "primary" },
            ].map((stat, index) => (
              <div
                key={index}
                className="text-center p-6 rounded-xl border bg-card/50 backdrop-blur-sm hover-scale transition-all duration-300 group"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <stat.icon
                  className={`h-10 w-10 mx-auto mb-3 text-${stat.color} group-hover:scale-110 transition-transform`}
                />
                <div className="text-2xl font-bold mb-1">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
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
                <h2 className="text-3xl md:text-4xl font-bold">¿Quieres más funcionalidades?</h2>
                <p className="text-lg text-muted-foreground">
                  Inicia sesión para acceder a funcionalidades exclusivas y gestionar contenido
                </p>
                <Button size="lg" onClick={() => handleNavigation("/login")} className="text-lg px-8 hover-scale">
                  Iniciar Sesión
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 bg-gradient-to-br from-muted/30 to-muted/10 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <div className="container relative z-10">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-xl">T</span>
                </div>
                <span className="font-bold text-xl bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  TEC Portal
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Plataforma integral para eventos, contenido empresarial y tecnológico del Tecnológico
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-sm uppercase tracking-wider">Enlaces Rápidos</h3>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => handleNavigation("/public/calendar")}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors text-left"
                >
                  Calendario
                </button>
                <button
                  onClick={() => handleNavigation("/public/events")}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors text-left"
                >
                  Eventos
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-sm uppercase tracking-wider">Desarrollado por</h3>
              <div className="flex flex-col gap-3">
                <a
                  href="https://softplusgt.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors group"
                >
                  <Code2 className="h-4 w-4 group-hover:scale-110 transition-transform" />
                  <span className="font-medium">SoftPlus - GT</span>
                </a>
                <a
                  href="https://alcore-gt.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors group"
                >
                  <Layers className="h-4 w-4 group-hover:scale-110 transition-transform" />
                  <span className="font-medium">ALCORE - GT</span>
                </a>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-border/50 text-center">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} TEC Portal. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
