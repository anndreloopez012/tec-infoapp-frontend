import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Moon, Sun, LogIn, Menu, X, Calendar, Users, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from 'next-themes';
import { publicCategoryService } from '@/services/publicApiService';
import { cn } from '@/lib/utils';

interface Category {
  id: number;
  documentId: string;
  name: string;
  color?: string;
}

export const PublicHeader = () => {
  const { theme, setTheme } = useTheme();
  const [categories, setCategories] = useState<Category[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    const result = await publicCategoryService.getAll({
      pageSize: 100,
      sort: 'name:asc',
    });

    if (result.success) {
      setCategories(result.data);
    }
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur-xl supports-[backdrop-filter]:bg-background/80 shadow-sm">
      <div className="container flex h-20 items-center justify-between">
        <Link to="/" className="flex items-center space-x-3 group">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary via-primary/80 to-secondary flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
            <span className="text-primary-foreground font-bold text-xl">T</span>
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-xl bg-gradient-to-r from-primary via-primary/80 to-secondary bg-clip-text text-transparent leading-none">
              TEC Portal
            </span>
            <span className="text-xs text-muted-foreground">Innovación & Tecnología</span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-3">
          <Button
            variant={isActive('/public/calendar') ? 'default' : 'ghost'}
            size="sm"
            onClick={() => navigate('/public/calendar')}
            className="rounded-full px-4 hover-scale"
          >
            <Calendar className="h-4 w-4 mr-2" />
            Calendario
          </Button>
          <Button
            variant={isActive('/public/events') ? 'default' : 'ghost'}
            size="sm"
            onClick={() => navigate('/public/events')}
            className="rounded-full px-4 hover-scale"
          >
            <Users className="h-4 w-4 mr-2" />
            Eventos
          </Button>
          
          <div className="h-6 w-px bg-border mx-2" />
          
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={isActive(`/public/category/${category.documentId}`) ? 'default' : 'ghost'}
              size="sm"
              onClick={() => navigate(`/public/category/${category.documentId}`)}
              className={cn(
                "rounded-full px-4 hover-scale transition-all duration-300",
                category.color && `hover:bg-[${category.color}]/10`
              )}
            >
              <BookOpen className="h-4 w-4 mr-2" />
              {category.name}
            </Button>
          ))}
        </nav>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="h-10 w-10 rounded-full hover-scale"
          >
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={() => navigate('/login')}
            className="rounded-full px-6 hover-scale shadow-lg"
          >
            <LogIn className="h-4 w-4 mr-2" />
            Iniciar Sesión
          </Button>
        </div>

        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t bg-background p-4 space-y-2 animate-fade-in">
          <Button
            variant={isActive('/public/calendar') ? 'default' : 'ghost'}
            size="sm"
            className="w-full justify-start"
            onClick={() => {
              navigate('/public/calendar');
              setMobileMenuOpen(false);
            }}
          >
            Calendario
          </Button>
          <Button
            variant={isActive('/public/events') ? 'default' : 'ghost'}
            size="sm"
            className="w-full justify-start"
            onClick={() => {
              navigate('/public/events');
              setMobileMenuOpen(false);
            }}
          >
            Eventos
          </Button>
          
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={isActive(`/public/category/${category.documentId}`) ? 'default' : 'ghost'}
              size="sm"
              className="w-full justify-start"
              onClick={() => {
                navigate(`/public/category/${category.documentId}`);
                setMobileMenuOpen(false);
              }}
            >
              {category.name}
            </Button>
          ))}

          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="flex-1"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4 mr-2" /> : <Moon className="h-4 w-4 mr-2" />}
              {theme === 'dark' ? 'Claro' : 'Oscuro'}
            </Button>
            <Button
              variant="default"
              size="sm"
              className="flex-1"
              onClick={() => {
                navigate('/login');
                setMobileMenuOpen(false);
              }}
            >
              <LogIn className="h-4 w-4 mr-2" />
              Iniciar Sesión
            </Button>
          </div>
        </div>
      )}
    </header>
  );
};
