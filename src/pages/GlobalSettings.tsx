import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion } from 'framer-motion';
import { 
  Settings, 
  Save, 
  Upload, 
  Eye, 
  Palette, 
  Globe, 
  Mail,
  Phone,
  MapPin,
  Image as ImageIcon,
  Monitor,
  Smartphone,
  Tablet,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Youtube,
  Search,
  Hash,
  FileText
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

import GlobalConfigService from '@/services/globalConfigService';

// Schema de validación
const globalConfigSchema = z.object({
  siteName: z.string().min(1, 'El nombre del sitio es requerido'),
  tagline: z.string().optional(),
  contactEmail: z.string().email('Email inválido').optional().or(z.literal('')),
  contactPhone: z.string().optional(),
  address: z.string().optional(),
  contentMenuMode: z.enum(['global', 'categories']).optional(),
  colors: z.object({
    primaryColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Color primario inválido'),
    secondaryColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Color secundario inválido'),
    accentColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Color de acento inválido'),
    backgroundColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Color de fondo inválido'),
    textColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Color de texto inválido'),
  }).optional(),
  seo: z.object({
    metaTitle: z.string().optional(),
    metaDescription: z.string().optional(),
    twitterHandle: z.string().optional(),
    keywords: z.string().optional(),
  }).optional(),
  socials: z.object({
    facebookUrl: z.string().optional(),
    twitterUrl: z.string().optional(),
    instagramUrl: z.string().optional(),
    linkedinUrl: z.string().optional(),
    youtubeUrl: z.string().optional(),
  }).optional(),
});

type GlobalConfigFormData = z.infer<typeof globalConfigSchema>;

const GlobalSettings = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [globalConfig, setGlobalConfig] = useState<any>(null);
  const [imageUploading, setImageUploading] = useState<string | null>(null);

  const form = useForm<GlobalConfigFormData>({
    resolver: zodResolver(globalConfigSchema),
    defaultValues: {
      siteName: '',
      tagline: '',
      contactEmail: '',
      contactPhone: '',
      address: '',
      contentMenuMode: 'global',
      colors: {
        primaryColor: '#2881E7',
        secondaryColor: '#36D2F1',
        accentColor: '#2777F6',
        backgroundColor: '#FFFFFF',
        textColor: '#000000',
      },
      seo: {
        metaTitle: '',
        metaDescription: '',
        twitterHandle: '',
        keywords: '',
      },
      socials: {
        facebookUrl: '',
        twitterUrl: '',
        instagramUrl: '',
        linkedinUrl: '',
        youtubeUrl: '',
      },
    },
  });

  // Cargar configuración global
  useEffect(() => {
    loadGlobalConfig();
  }, []);

  const loadGlobalConfig = async () => {
    try {
      setLoading(true);
      const result = await GlobalConfigService.getGlobalConfig();
      
      if (result.success && result.data) {
        setGlobalConfig(result.data);
        
        // Actualizar formulario con datos existentes
        form.reset({
          siteName: result.data.siteName || '',
          tagline: result.data.tagline || '',
          contactEmail: result.data.contactEmail || '',
          contactPhone: result.data.contactPhone || '',
          address: result.data.address || '',
          contentMenuMode: result.data.contentMenuMode || 'global',
          colors: {
            primaryColor: result.data.colors?.primaryColor || '#2881E7',
            secondaryColor: result.data.colors?.secondaryColor || '#36D2F1',
            accentColor: result.data.colors?.accentColor || '#2777F6',
            backgroundColor: result.data.colors?.backgroundColor || '#FFFFFF',
            textColor: result.data.colors?.textColor || '#FFFFFF',
          },
          seo: {
            metaTitle: result.data.seo?.metaTitle || '',
            metaDescription: result.data.seo?.metaDescription || '',
            twitterHandle: result.data.seo?.twitterHandle || '',
            keywords: result.data.seo?.keywords || '',
          },
          socials: {
            facebookUrl: result.data.socials?.facebookUrl || '',
            twitterUrl: result.data.socials?.twitterUrl || '',
            instagramUrl: result.data.socials?.instagramUrl || '',
            linkedinUrl: result.data.socials?.linkedinUrl || '',
            youtubeUrl: result.data.socials?.youtubeUrl || '',
          },
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo cargar la configuración global",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: GlobalConfigFormData) => {
    console.log('🚀 Iniciando actualización de configuración global:', data);
    
    try {
      setSaving(true);
      
      // Limpiar datos undefined y preparar para envío
      const cleanData = {
        siteName: data.siteName,
        tagline: data.tagline || '',
        contactEmail: data.contactEmail || '',
        contactPhone: data.contactPhone || '',
        address: data.address || '',
        contentMenuMode: data.contentMenuMode || 'global',
        ...(data.colors && { colors: data.colors }),
        ...(data.seo && { seo: data.seo }),
        ...(data.socials && { socials: data.socials }),
      };
      
      console.log('📤 Datos limpiados para envío:', cleanData);
      
      const result = await GlobalConfigService.updateGlobalConfig(cleanData);
      console.log('📡 Resultado de actualización:', result);
      
      if (result.success) {
        toast({
          title: "Éxito",
          description: "Configuración global actualizada correctamente",
        });
        
        // Recargar configuración actualizada
        await loadGlobalConfig();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('❌ Error en onSubmit:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al actualizar configuración",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (file: File, imageType: string) => {
    try {
      setImageUploading(imageType);
      const result = await GlobalConfigService.uploadImage(file);
      
      if (result.success && result.data) {
        // Mapear el tipo a la propiedad del API
        const fieldMap: Record<string, string> = {
          'Favicon': 'favicon',
          'Logo Principal': 'logoMain',
          'Logo Alternativo': 'logoAlt',
          'Logo Móvil': 'logoMobile',
        };
        const field = fieldMap[imageType];
        
        if (field) {
          const updateRes = await GlobalConfigService.updateGlobalConfig({ [field]: result.data.id });
          if (!updateRes.success) {
            throw new Error(updateRes.error || 'No se pudo asociar la imagen');
          }
        }

        toast({
          title: 'Éxito',
          description: `${imageType} actualizado correctamente`,
        });
        
        // Recargar para ver la nueva imagen
        await loadGlobalConfig();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: `Error al subir/actualizar ${imageType}`,
        variant: 'destructive',
      });
    } finally {
      setImageUploading(null);
    }
  };

  const getImageUrl = (imageData: any) => {
    if (!imageData) return null;
    return GlobalConfigService.buildImageUrl(imageData.url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Configuración Global
            </h1>
            <p className="text-muted-foreground">
              Administra la configuración general de tu aplicación
            </p>
          </div>
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
            <Settings className="w-4 h-4 mr-2" />
            Sistema
          </Badge>
        </div>

        <Separator />

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit, (errors) => {
            console.error('❌ Errores de validación:', errors);
            toast({
              title: 'Campos inválidos',
              description: 'Revisa los mensajes de error en el formulario.',
              variant: 'destructive',
            });
          })} className="space-y-6">
            <Tabs defaultValue="general" className="space-y-6">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="general" className="flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  General
                </TabsTrigger>
                <TabsTrigger value="images" className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4" />
                  Imágenes
                </TabsTrigger>
                <TabsTrigger value="colors" className="flex items-center gap-2">
                  <Palette className="w-4 h-4" />
                  Colores
                </TabsTrigger>
                <TabsTrigger value="seo" className="flex items-center gap-2">
                  <Search className="w-4 h-4" />
                  SEO
                </TabsTrigger>
                <TabsTrigger value="social" className="flex items-center gap-2">
                  <Hash className="w-4 h-4" />
                  Redes Sociales
                </TabsTrigger>
              </TabsList>

              {/* General */}
              <TabsContent value="general" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Globe className="w-5 h-5" />
                      Información General
                    </CardTitle>
                    <CardDescription>
                      Configuración básica de tu aplicación
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="siteName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nombre del Sitio</FormLabel>
                            <FormControl>
                              <Input placeholder="Mi Aplicación CRM" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="tagline"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Eslogan</FormLabel>
                            <FormControl>
                              <Input placeholder="Tu CRM de confianza" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="contactEmail"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <Mail className="w-4 h-4" />
                              Email de Contacto
                            </FormLabel>
                            <FormControl>
                              <Input placeholder="contacto@miempresa.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="contactPhone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <Phone className="w-4 h-4" />
                              Teléfono de Contacto
                            </FormLabel>
                            <FormControl>
                              <Input placeholder="+502 1234-5678" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            Dirección
                          </FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Dirección completa de tu empresa..."
                              className="min-h-[80px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Content Menu Mode */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Modo de Menú de Contenido
                    </CardTitle>
                    <CardDescription>
                      Configura cómo se muestra el contenido en el menú lateral
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <FormField
                      control={form.control}
                      name="contentMenuMode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Modo de visualización</FormLabel>
                          <FormControl>
                            <select
                              className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                              value={field.value}
                              onChange={field.onChange}
                            >
                              <option value="global">Contenido Global (una sola opción en menú)</option>
                              <option value="categories">Por Categorías (mostrar categorías en menú)</option>
                            </select>
                          </FormControl>
                          <FormDescription>
                            "Contenido Global" muestra un solo botón que lleva a todo el contenido. 
                            "Por Categorías" muestra las categorías directamente en el menú.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Imágenes */}
              <TabsContent value="images" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Favicon */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-sm">
                        <Monitor className="w-4 h-4" />
                        Favicon
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Icono que aparece en la pestaña del navegador
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {globalConfig?.favicon && (
                        <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                          <img
                            src={getImageUrl(globalConfig.favicon)}
                            alt="Favicon actual"
                            className="w-12 h-12 rounded-lg border"
                          />
                          <div>
                            <p className="text-sm font-medium">{globalConfig.favicon.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {globalConfig.favicon.width}x{globalConfig.favicon.height}px
                            </p>
                          </div>
                        </div>
                      )}
                      <div>
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleImageUpload(file, 'Favicon');
                          }}
                          disabled={imageUploading === 'Favicon'}
                        />
                        {imageUploading === 'Favicon' && <LoadingSpinner className="mt-2" />}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Logo Principal */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-sm">
                        <Monitor className="w-4 h-4" />
                        Logo Principal
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Logo principal de la aplicación
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {globalConfig?.logoMain && (
                        <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                          <img
                            src={getImageUrl(globalConfig.logoMain)}
                            alt="Logo principal actual"
                            className="w-12 h-12 rounded-lg border"
                          />
                          <div>
                            <p className="text-sm font-medium">{globalConfig.logoMain.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {globalConfig.logoMain.width}x{globalConfig.logoMain.height}px
                            </p>
                          </div>
                        </div>
                      )}
                      <div>
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleImageUpload(file, 'Logo Principal');
                          }}
                          disabled={imageUploading === 'Logo Principal'}
                        />
                        {imageUploading === 'Logo Principal' && <LoadingSpinner className="mt-2" />}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Logo Alternativo */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-sm">
                        <Tablet className="w-4 h-4" />
                        Logo Alternativo
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Logo para temas alternativos
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {globalConfig?.logoAlt && (
                        <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                          <img
                            src={getImageUrl(globalConfig.logoAlt)}
                            alt="Logo alternativo actual"
                            className="w-12 h-12 rounded-lg border"
                          />
                          <div>
                            <p className="text-sm font-medium">{globalConfig.logoAlt.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {globalConfig.logoAlt.width}x{globalConfig.logoAlt.height}px
                            </p>
                          </div>
                        </div>
                      )}
                      <div>
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleImageUpload(file, 'Logo Alternativo');
                          }}
                          disabled={imageUploading === 'Logo Alternativo'}
                        />
                        {imageUploading === 'Logo Alternativo' && <LoadingSpinner className="mt-2" />}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Logo Móvil */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-sm">
                        <Smartphone className="w-4 h-4" />
                        Logo Móvil
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Logo optimizado para dispositivos móviles
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {globalConfig?.logoMobile && (
                        <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                          <img
                            src={getImageUrl(globalConfig.logoMobile)}
                            alt="Logo móvil actual"
                            className="w-12 h-12 rounded-lg border"
                          />
                          <div>
                            <p className="text-sm font-medium">{globalConfig.logoMobile.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {globalConfig.logoMobile.width}x{globalConfig.logoMobile.height}px
                            </p>
                          </div>
                        </div>
                      )}
                      <div>
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleImageUpload(file, 'Logo Móvil');
                          }}
                          disabled={imageUploading === 'Logo Móvil'}
                        />
                        {imageUploading === 'Logo Móvil' && <LoadingSpinner className="mt-2" />}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Colores */}
              <TabsContent value="colors" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Palette className="w-5 h-5" />
                      Esquema de Colores
                    </CardTitle>
                    <CardDescription>
                      Define los colores principales de tu aplicación
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="colors.primaryColor"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Color Primario</FormLabel>
                            <div className="flex items-center gap-2">
                              <FormControl>
                                <Input type="color" className="w-16 h-10 p-1" {...field} />
                              </FormControl>
                              <FormControl>
                                <Input placeholder="#2881E7" {...field} />
                              </FormControl>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="colors.secondaryColor"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Color Secundario</FormLabel>
                            <div className="flex items-center gap-2">
                              <FormControl>
                                <Input type="color" className="w-16 h-10 p-1" {...field} />
                              </FormControl>
                              <FormControl>
                                <Input placeholder="#36D2F1" {...field} />
                              </FormControl>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="colors.accentColor"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Color de Acento</FormLabel>
                            <div className="flex items-center gap-2">
                              <FormControl>
                                <Input type="color" className="w-16 h-10 p-1" {...field} />
                              </FormControl>
                              <FormControl>
                                <Input placeholder="#2777F6" {...field} />
                              </FormControl>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="colors.backgroundColor"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Color de Fondo</FormLabel>
                            <div className="flex items-center gap-2">
                              <FormControl>
                                <Input type="color" className="w-16 h-10 p-1" {...field} />
                              </FormControl>
                              <FormControl>
                                <Input placeholder="#FFFFFF" {...field} />
                              </FormControl>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="colors.textColor"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Color de Texto</FormLabel>
                            <div className="flex items-center gap-2">
                              <FormControl>
                                <Input type="color" className="w-16 h-10 p-1" {...field} />
                              </FormControl>
                              <FormControl>
                                <Input placeholder="#FFFFFF" {...field} />
                              </FormControl>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* SEO */}
              <TabsContent value="seo" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Search className="w-5 h-5" />
                      Configuración SEO
                    </CardTitle>
                    <CardDescription>
                      Optimiza tu aplicación para motores de búsqueda
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="seo.metaTitle"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Título Meta</FormLabel>
                            <FormControl>
                              <Input placeholder="Mi CRM - Sistema de Gestión" {...field} />
                            </FormControl>
                            <FormDescription>
                              Aparece en los resultados de búsqueda (max 60 caracteres)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="seo.twitterHandle"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Usuario de Twitter</FormLabel>
                            <FormControl>
                              <Input placeholder="@miempresa" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="seo.metaDescription"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Descripción Meta</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Descripción de tu aplicación para buscadores..."
                              className="min-h-[80px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            Descripción que aparece en buscadores (max 160 caracteres)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="seo.keywords"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Palabras Clave</FormLabel>
                          <FormControl>
                            <Input placeholder="CRM, gestión, ventas, clientes" {...field} />
                          </FormControl>
                          <FormDescription>
                            Palabras clave separadas por comas
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Redes Sociales */}
              <TabsContent value="social" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Hash className="w-5 h-5" />
                      Redes Sociales
                    </CardTitle>
                    <CardDescription>
                      Enlaces a tus perfiles en redes sociales
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="socials.facebookUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Facebook className="w-4 h-4" />
                            Facebook
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="https://facebook.com/miempresa" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="socials.twitterUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Twitter className="w-4 h-4" />
                            Twitter
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="https://twitter.com/miempresa" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="socials.instagramUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Instagram className="w-4 h-4" />
                            Instagram
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="https://instagram.com/miempresa" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="socials.linkedinUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Linkedin className="w-4 h-4" />
                            LinkedIn
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="https://linkedin.com/company/miempresa" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="socials.youtubeUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Youtube className="w-4 h-4" />
                            YouTube
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="https://youtube.com/c/miempresa" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Botones de acción */}
            <div className="flex items-center justify-end gap-4 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => loadGlobalConfig()}
                disabled={loading}
              >
                <Eye className="w-4 h-4 mr-2" />
                Recargar
              </Button>
              
              <Button
                type="submit"
                disabled={saving}
                className="bg-gradient-primary hover:opacity-90"
              >
                {saving ? (
                  <LoadingSpinner className="mr-2" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                {saving ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </div>
          </form>
        </Form>
      </motion.div>
    </div>
  );
};

export default GlobalSettings;