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
  TrendingUp,
  Building2,
  Lightbulb,
  Target,
  Award,
  ArrowRight,
  CheckCircle2,
  Server,
  Wifi,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { PWAInstallButton } from "@/components/PWAInstallButton";
import { useGlobal } from "@/context/GlobalContext";

export default function PublicLanding() {
  const navigate = useNavigate();
  const { getBranding } = useGlobal();
  const branding = getBranding();
  const logoUrl = branding.logo || branding.logoAlt || branding.logoMobile;


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
    <>
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
            }}
          >
            <Icon className="h-24 w-24 text-primary" />
          </div>
        ))}
      </div>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 md:py-32">
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
              <span>¡Bienvenidos!</span>
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight animate-fade-in">
              <span className="bg-gradient-to-r from-[hsl(var(--success))] via-[hsl(142,76%,46%)] to-[hsl(var(--success))] bg-clip-text text-transparent animate-gradient">
                Fortaleciendo el{' '}
              </span>
              <br />
              <span className="bg-gradient-to-r from-[hsl(var(--success))] via-[hsl(142,76%,46%)] to-[hsl(var(--success))] bg-clip-text text-transparent animate-gradient">
                Ecosistema Tec
              </span>
            </h1>

            <p
              className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto animate-fade-in"
              style={{ animationDelay: "0.2s" }}
            >
              Donde impulsamos la innovación, creamos oportunidades y conectamos ideas.
            </p>

            <div
              className="flex items-center justify-center gap-4 text-sm text-muted-foreground animate-fade-in"
              style={{ animationDelay: "0.3s" }}
            >
              <div className="flex items-center gap-2">
                <Terminal className="h-4 w-4 text-secondary animate-bounce" />
                <span>Tecnología</span>
              </div>
              <div className="h-4 w-px bg-border" />
              <div className="flex items-center gap-2">
                <Rocket className="h-4 w-4 text-secondary animate-bounce" />
                <span>Innovación</span>
              </div>
              <div className="h-4 w-px bg-border" />
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-secondary animate-bounce" />
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

            {/* PWA Install Button */}
            <div className="flex justify-center pt-6">
              <PWAInstallButton />
            </div>
          </div>
        </div>
      </section>

      {/* Tec Ecosystem Section */}
      <section className="py-20 border-t relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-secondary/5" />
        <div className="container relative z-10">
          <div className="text-center space-y-4 mb-16 animate-fade-in">
            <div className="inline-flex items-center gap-2 rounded-full border border-secondary/20 bg-secondary/10 px-4 py-2 text-sm text-secondary mb-4">
              <Building2 className="h-4 w-4 animate-pulse" />
              <span>Ecosistema de Innovación</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent">
              Silicon Valley con Frijoles
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {[
              {
                icon: Lightbulb,
                title: "Innovación",
                color: "from-yellow-500/20 to-orange-500/20",
                iconColor: "text-yellow-500",
              },
              {
                icon: Network,
                title: "Networking",
                color: "from-blue-500/20 to-cyan-500/20",
                iconColor: "text-blue-500",
              },
              {
                icon: TrendingUp,
                title: "Crecimiento",
                color: "from-green-500/20 to-emerald-500/20",
                iconColor: "text-green-500",
              },
              {
                icon: Target,
                title: "Estrategia",
                color: "from-purple-500/20 to-pink-500/20",
                iconColor: "text-purple-500",
              },
            ].map((item, index) => (
              <div
                key={index}
                className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card p-8 hover-scale transition-all duration-300 text-center"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${item.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                <div className="relative flex flex-col items-center gap-4">
                  <div className="inline-flex h-14 w-14 items-center justify-center rounded-xl bg-muted/50 backdrop-blur-sm group-hover:scale-110 transition-transform duration-300">
                    <item.icon className={`h-7 w-7 ${item.iconColor}`} />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">{item.title}</h3>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 border-t relative">
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <div className="container relative z-10">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: Building2,
                value: "200+",
                label: "Empresas",
                description: "En nuestro ecosistema",
              },
              {
                icon: Users,
                value: "3000+",
                label: "Emprendedores",
                description: "Conectados diariamente",
              },
              {
                icon: Calendar,
                value: "100+",
                label: "Eventos Anuales",
                description: "De tecnología e innovación",
              },
              {
                icon: Award,
                value: "24/7",
                label: "Acceso",
                description: "Acceso a tu lugar de trabajo",
              },
            ].map((stat, index) => (
              <div
                key={index}
                className="relative group"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="absolute -inset-1 bg-gradient-to-r from-primary to-secondary rounded-2xl blur opacity-25 group-hover:opacity-75 transition duration-500"></div>
                <div className="relative text-center p-8 rounded-2xl border bg-card backdrop-blur-sm hover-scale transition-all duration-300">
                  <stat.icon className="h-12 w-12 mx-auto mb-4 text-primary group-hover:scale-110 transition-transform" />
                  <div className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                    {stat.value}
                  </div>
                  <div className="text-lg font-semibold mb-1">{stat.label}</div>
                  <div className="text-sm text-muted-foreground">{stat.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 border-t relative">
        <div className="container relative z-10">
          <div className="text-center space-y-4 mb-16 animate-fade-in">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm text-primary mb-4">
              <Rocket className="h-4 w-4 animate-bounce" />
              <span>Plataforma Integral</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent">
              Plataforma Tec
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Explora eventos, contenidos y oportunidades que conectan innovación, tecnología y comunidad.
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
                  Descubre todos los eventos organizados por la Plataforma Tec con información detallada, ubicaciones y fechas
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

          {/* Benefits Section */}
          <div className="mt-20 grid md:grid-cols-3 gap-8">
            {[
              {
                icon: CheckCircle2,
                title: "Acceso Inmediato",
                items: ["Consulta eventos sin registro", "Información actualizada", "Calendario interactivo"],
              },
              {
                icon: Server,
                title: "Tecnología Avanzada",
                items: ["Plataforma en tiempo real", "API moderna y rápida", "Integración con Google Calendar"],
              },
              {
                icon: Wifi,
                title: "Siempre Conectado",
                items: ["Notificaciones de eventos", "Actualizaciones automáticas", "Acceso desde cualquier lugar"],
              },
            ].map((benefit, index) => (
              <div
                key={index}
                className="relative group"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/50 to-secondary/50 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-500"></div>
                <div className="relative p-6 rounded-2xl border bg-card/80 backdrop-blur-sm">
                  <benefit.icon className="h-10 w-10 text-primary mb-4 group-hover:scale-110 transition-transform" />
                  <h3 className="text-xl font-bold mb-4">{benefit.title}</h3>
                  <ul className="space-y-2">
                    {benefit.items.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <ArrowRight className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
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
                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center overflow-hidden">
                  {logoUrl ? (
                    <img src={logoUrl} alt={branding.siteName || 'Tec'} className="h-full w-full object-contain bg-background/90" loading="lazy" />
                  ) : (
                    <span className="text-primary-foreground font-bold text-xl">T</span>
                  )}
                </div>
                <span className="font-bold text-xl bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  {branding.siteName || 'Tec'}
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
              <h3 className="font-semibold text-sm uppercase tracking-wider"></h3>
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
              </div>
              <div className="flex flex-col gap-3">
                <a
                  href="https://alcore-gt.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors group"
                >
                  <Code2 className="h-4 w-4 group-hover:scale-110 transition-transform" />
                  <span className="font-medium">ALCORE</span>
                </a>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-border/50 text-center">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} {branding.siteName || 'Tec'} Portal. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}
