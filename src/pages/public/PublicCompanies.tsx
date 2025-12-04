import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Building2, Search, Grid3X3, List, LayoutGrid, X, Mail, Phone, MapPin, Navigation } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { publicCompanyService } from '@/services/publicApiService';
import { API_CONFIG } from '@/config/api.js';

interface Company {
  id: number;
  documentId: string;
  name?: string;
  acronym?: string;
  description?: string;
  phone?: number;
  address?: string;
  logo?: any;
  attributes?: {
    name?: string;
    acronym?: string;
    description?: string;
    phone?: number;
    address?: string;
    logo?: any;
  };
}

type ViewMode = 'grid' | 'list' | 'masonry';

// Helper para obtener atributos de forma segura (maneja ambos formatos de API)
const getAttr = (company: Company, key: string): any => {
  return company?.attributes?.[key as keyof typeof company.attributes] ?? (company as any)?.[key];
};

const PublicCompanies = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  useEffect(() => {
    loadCompanies();
  }, []);

  useEffect(() => {
    filterCompanies();
  }, [companies, searchQuery]);

  const loadCompanies = async () => {
    setLoading(true);
    try {
      const result = await publicCompanyService.getAll({
        pageSize: 100,
        populate: 'logo',
        sort: 'name:asc',
      });

      console.log('Companies API result:', result);
      if (result.success && result.data) {
        console.log('Companies data structure:', JSON.stringify(result.data[0], null, 2));
        setCompanies(result.data);
      }
    } catch (error) {
      console.error('Error loading companies:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterCompanies = () => {
    if (!searchQuery.trim()) {
      setFilteredCompanies(companies);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = companies.filter(company => {
      const name = (getAttr(company, 'name') || '').toLowerCase();
      const description = (getAttr(company, 'description') || '').toLowerCase();
      return name.includes(query) || description.includes(query);
    });
    setFilteredCompanies(filtered);
  };

  const getLogoUrl = (company: Company) => {
    const logo = getAttr(company, 'logo');
    if (!logo) return null;
    const logoData = Array.isArray(logo) ? logo[0] : logo;
    const url = logoData?.url || logoData?.formats?.thumbnail?.url;
    if (!url) return null;
    return url.startsWith('http') ? url : `${API_CONFIG.BASE_URL}${url}`;
  };

  // Abrir detalle de empresa
  const openCompanyDetail = (company: Company) => {
    setSelectedCompany(company);
    setDetailOpen(true);
  };

  // Abrir Google Maps con la dirección
  const openMaps = (address: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const encodedAddress = encodeURIComponent(address);
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, '_blank');
  };

  // Abrir email
  const openEmail = (email: string, e: React.MouseEvent) => {
    e.stopPropagation();
    window.location.href = `mailto:${email}`;
  };

  // Abrir teléfono
  const openPhone = (phone: string | number, e: React.MouseEvent) => {
    e.stopPropagation();
    window.location.href = `tel:${phone}`;
  };

  const CompanyCard = ({ company, index }: { company: Company; index: number }) => {
    const logoUrl = getLogoUrl(company);
    const name = getAttr(company, 'name') || 'Sin nombre';
    const description = getAttr(company, 'description');
    const acronym = getAttr(company, 'acronym');
    const phone = getAttr(company, 'phone');
    const address = getAttr(company, 'address');

    if (viewMode === 'list') {
      return (
        <div 
          className="group animate-fade-in cursor-pointer"
          onClick={() => openCompanyDetail(company)}
        >
          <Card className="overflow-hidden hover:shadow-xl transition-all duration-500 border-border/50 hover:border-primary/30 bg-card/80 backdrop-blur-sm">
            <CardContent className="p-4 flex items-center gap-6">
              <div className="relative h-20 w-20 flex-shrink-0 rounded-xl overflow-hidden bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center group-hover:scale-105 transition-transform duration-500">
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt={name}
                    className="h-full w-full object-contain p-2"
                    loading="lazy"
                  />
                ) : (
                  <Building2 className="h-10 w-10 text-primary/50" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors truncate">
                  {name}
                </h3>
                {description && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                    {description}
                  </p>
                )}
                <div className="flex flex-wrap gap-3 mt-2">
                  {acronym && (
                    <button 
                      onClick={(e) => openEmail(acronym, e)}
                      className="text-xs text-muted-foreground flex items-center gap-1 hover:text-primary transition-colors"
                    >
                      <Mail className="h-3 w-3" /> {acronym}
                    </button>
                  )}
                  {phone && (
                    <button 
                      onClick={(e) => openPhone(phone, e)}
                      className="text-xs text-muted-foreground flex items-center gap-1 hover:text-primary transition-colors"
                    >
                      <Phone className="h-3 w-3" /> {phone}
                    </button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return (
      <div 
        className="group animate-fade-in cursor-pointer"
        onClick={() => openCompanyDetail(company)}
      >
        <Card className="overflow-hidden hover:shadow-2xl transition-all duration-500 border-border/50 hover:border-primary/30 bg-card/80 backdrop-blur-sm h-full">
          <div className="relative h-48 overflow-hidden bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent z-10" />
            <div className="absolute inset-0 flex items-center justify-center hover:scale-110 transition-transform duration-500">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={name}
                  className="max-h-32 max-w-[80%] object-contain drop-shadow-xl"
                  loading="lazy"
                />
              ) : (
                <div className="h-24 w-24 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                  <Building2 className="h-12 w-12 text-primary/60" />
                </div>
              )}
            </div>
            
            {/* Animated background decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/20 to-transparent rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-secondary/20 to-transparent rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700 delay-100" />
          </div>
          
          <CardContent className="p-5 relative">
            <h3 className="font-bold text-xl text-foreground group-hover:text-primary transition-colors text-center">
              {name}
            </h3>
            
            {description && (
              <p className="text-sm text-muted-foreground text-center mt-2 line-clamp-3">
                {description}
              </p>
            )}
            
            <div className="flex flex-col gap-2 mt-4">
              {acronym && (
                <button 
                  onClick={(e) => openEmail(acronym, e)}
                  className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  <Mail className="h-4 w-4 text-primary/60" />
                  <span className="truncate">{acronym}</span>
                </button>
              )}
              {phone && (
                <button 
                  onClick={(e) => openPhone(phone, e)}
                  className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  <Phone className="h-4 w-4 text-primary/60" />
                  <span>{phone}</span>
                </button>
              )}
              {address && (
                <button 
                  onClick={(e) => openMaps(address, e)}
                  className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  <MapPin className="h-4 w-4 text-primary/60" />
                  <span className="truncate">{address}</span>
                </button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const LoadingSkeleton = () => (
    <div className={viewMode === 'list' ? 'space-y-4' : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'}>
      {[...Array(8)].map((_, i) => (
        <Card key={i} className="overflow-hidden">
          {viewMode === 'list' ? (
            <CardContent className="p-4 flex items-center gap-6">
              <Skeleton className="h-20 w-20 rounded-xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-32" />
              </div>
            </CardContent>
          ) : (
            <>
              <Skeleton className="h-48 w-full" />
              <CardContent className="p-5 space-y-3">
                <Skeleton className="h-6 w-3/4 mx-auto" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3 mx-auto" />
              </CardContent>
            </>
          )}
        </Card>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      {/* Hero Section */}
      <section className="relative py-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-secondary/5" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-secondary/10 rounded-full blur-3xl animate-pulse delay-700" />
        
        <div className="container relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            <Badge variant="outline" className="mb-4 px-4 py-1">
              <Building2 className="h-3 w-3 mr-2" />
              Directorio de Empresas
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary via-primary/80 to-secondary bg-clip-text text-transparent mb-4">
              Nuestras Empresas
            </h1>
            <p className="text-lg text-muted-foreground">
              Conoce las empresas que forman parte de nuestra comunidad de innovación y tecnología
            </p>
          </motion.div>
        </div>
      </section>

      {/* Filters Section */}
      <section className="container py-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col md:flex-row gap-4 items-center justify-between bg-card/50 backdrop-blur-sm rounded-2xl p-4 border border-border/50"
        >
          {/* Search */}
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar empresa..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-background/50"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                onClick={() => setSearchQuery('')}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-2 bg-muted/50 rounded-lg p-1">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="rounded-md"
            >
              <Grid3X3 className="h-4 w-4 mr-2" />
              Cuadrícula
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="rounded-md"
            >
              <List className="h-4 w-4 mr-2" />
              Lista
            </Button>
            <Button
              variant={viewMode === 'masonry' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('masonry')}
              className="rounded-md"
            >
              <LayoutGrid className="h-4 w-4 mr-2" />
              Mosaico
            </Button>
          </div>

          {/* Results count */}
          <Badge variant="secondary" className="whitespace-nowrap">
            {filteredCompanies.length} empresa{filteredCompanies.length !== 1 ? 's' : ''}
          </Badge>
        </motion.div>
      </section>

      {/* Companies Grid */}
      <section className="container pb-16">
        {loading ? (
          <LoadingSkeleton />
        ) : filteredCompanies.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <Building2 className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">
              No se encontraron empresas
            </h3>
            <p className="text-muted-foreground">
              {searchQuery ? 'Intenta con otros términos de búsqueda' : 'No hay empresas disponibles en este momento'}
            </p>
          </motion.div>
        ) : (
          <div
            className={
              viewMode === 'list'
                ? 'space-y-4'
                : viewMode === 'masonry'
                ? 'columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6'
                : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
            }
          >
            {filteredCompanies.map((company, index) => (
              <CompanyCard key={company.documentId || company.id || index} company={company} index={index} />
            ))}
          </div>
        )}
      </section>

      {/* Company Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg">
          {selectedCompany && (() => {
            const logoUrl = getLogoUrl(selectedCompany);
            const name = getAttr(selectedCompany, 'name') || 'Sin nombre';
            const description = getAttr(selectedCompany, 'description');
            const acronym = getAttr(selectedCompany, 'acronym');
            const phone = getAttr(selectedCompany, 'phone');
            const address = getAttr(selectedCompany, 'address');

            return (
              <>
                <DialogHeader>
                  <DialogTitle className="text-center text-2xl">{name}</DialogTitle>
                </DialogHeader>
                
                <div className="flex flex-col items-center gap-6">
                  {/* Logo grande */}
                  <div className="relative w-48 h-48 rounded-2xl overflow-hidden bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 flex items-center justify-center shadow-xl">
                    {logoUrl ? (
                      <img
                        src={logoUrl}
                        alt={name}
                        className="max-w-full max-h-full object-contain p-4"
                      />
                    ) : (
                      <Building2 className="h-24 w-24 text-primary/40" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-background/20 to-transparent" />
                  </div>

                  {/* Nombre grande */}
                  <h2 className="text-3xl font-bold text-center bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                    {name}
                  </h2>

                  {/* Descripción */}
                  {description && (
                    <p className="text-muted-foreground text-center max-w-md">
                      {description}
                    </p>
                  )}

                  {/* Botones de contacto */}
                  <div className="flex flex-col gap-3 w-full max-w-xs">
                    {acronym && (
                      <Button
                        variant="outline"
                        className="w-full justify-start gap-3 h-12"
                        onClick={(e) => openEmail(acronym, e)}
                      >
                        <Mail className="h-5 w-5 text-primary" />
                        <span className="truncate">{acronym}</span>
                      </Button>
                    )}
                    
                    {phone && (
                      <Button
                        variant="outline"
                        className="w-full justify-start gap-3 h-12"
                        onClick={(e) => openPhone(phone, e)}
                      >
                        <Phone className="h-5 w-5 text-primary" />
                        <span>{phone}</span>
                      </Button>
                    )}
                    
                    {address && (
                      <Button
                        variant="outline"
                        className="w-full justify-start gap-3 h-12"
                        onClick={(e) => openMaps(address, e)}
                      >
                        <Navigation className="h-5 w-5 text-primary" />
                        <span className="truncate">{address}</span>
                      </Button>
                    )}
                  </div>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PublicCompanies;
