import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Moon, Sun, LogIn, Menu, X } from 'lucide-react';
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

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    const result = await publicCategoryService.getAll({
      pageSize: 100,
      sort: 'name:asc',
      additionalFilters: {
        'filters[active][$eq]': true,
      },
    });

    if (result.success) {
      setCategories(result.data);
    }
  };

  const handleNavigation = (path: string) => {
    if (document.startViewTransition) {
      document.startViewTransition(() => {
        window.location.href = path;
      });
    } else {
      window.location.href = path;
    }
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-lg">T</span>
          </div>
          <span className="font-bold text-xl bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            TEC
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-2">
          <Button
            variant={isActive('/public/calendar') ? 'default' : 'ghost'}
            size="sm"
            onClick={() => handleNavigation('/public/calendar')}
          >
            Calendario
          </Button>
          <Button
            variant={isActive('/public/events') ? 'default' : 'ghost'}
            size="sm"
            onClick={() => handleNavigation('/public/events')}
          >
            Eventos
          </Button>
          
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={isActive(`/public/category/${category.documentId}`) ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleNavigation(`/public/category/${category.documentId}`)}
              className={cn(
                "transition-all duration-200",
                category.color && `hover:bg-[${category.color}]/10`
              )}
            >
              {category.name}
            </Button>
          ))}
        </nav>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="h-9 w-9"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={() => handleNavigation('/login')}
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
              handleNavigation('/public/calendar');
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
              handleNavigation('/public/events');
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
                handleNavigation(`/public/category/${category.documentId}`);
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
                handleNavigation('/login');
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
