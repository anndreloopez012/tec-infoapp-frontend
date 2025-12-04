// ===============================================
// COMPONENTE GENÉRICO DE FORMULARIO PARA CATÁLOGOS
// ===============================================

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Upload, X, Image as ImageIcon } from 'lucide-react';
import { API_CONFIG } from '@/config/api.js';

interface FormFieldConfig {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'email' | 'date' | 'color' | 'image';
  placeholder?: string;
  description?: string;
  required?: boolean;
  validation?: any;
  multiple?: boolean;
}

interface CatalogFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any, files?: { [key: string]: File[] }) => Promise<void>;
  title: string;
  description: string;
  fields: FormFieldConfig[];
  defaultValues?: any;
  isLoading?: boolean;
}

export const CatalogFormDialog: React.FC<CatalogFormDialogProps> = ({
  open,
  onOpenChange,
  onSubmit,
  title,
  description,
  fields,
  defaultValues = {},
  isLoading = false,
}) => {
  const [imageFiles, setImageFiles] = useState<{ [key: string]: File[] }>({});
  const [imagePreviews, setImagePreviews] = useState<{ [key: string]: string[] }>({});

  // Construir esquema de validación dinámicamente
  const buildValidationSchema = () => {
    const schemaObject: any = {};
    
    fields.forEach((field) => {
      let fieldValidator: any;
      
      switch (field.type) {
        case 'email':
          fieldValidator = z.string().email('Email inválido');
          break;
        case 'number':
          fieldValidator = z.coerce.number();
          break;
        case 'date':
          fieldValidator = z.string();
          break;
        case 'image':
          fieldValidator = z.any();
          break;
        default:
          fieldValidator = z.string();
      }
      
      if (field.required && field.type !== 'image') {
        fieldValidator = fieldValidator.min(1, `${field.label} es requerido`);
      } else {
        fieldValidator = fieldValidator.optional();
      }
      
      if (field.validation) {
        fieldValidator = field.validation;
      }
      
      schemaObject[field.name] = fieldValidator;
    });
    
    return z.object(schemaObject);
  };

  const formSchema = buildValidationSchema();

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: defaultValues,
  });

  // Sincronizar cuando cambian los valores por edición
  React.useEffect(() => {
    form.reset(defaultValues);
    
    // Cargar previews de imágenes existentes
    const newPreviews: { [key: string]: string[] } = {};
    fields.forEach((field) => {
      if (field.type === 'image' && defaultValues[field.name]) {
        const images = Array.isArray(defaultValues[field.name]) 
          ? defaultValues[field.name] 
          : [defaultValues[field.name]];
        newPreviews[field.name] = images.map((img: any) => {
          if (typeof img === 'string') return img;
          const url = img?.url || img?.formats?.thumbnail?.url || '';
          return url.startsWith('http') ? url : `${API_CONFIG.BASE_URL}${url}`;
        }).filter(Boolean);
      }
    });
    setImagePreviews(newPreviews);
    setImageFiles({});
  }, [defaultValues, open]);

  const handleImageChange = (fieldName: string, e: React.ChangeEvent<HTMLInputElement>, multiple?: boolean) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (multiple) {
      setImageFiles(prev => ({
        ...prev,
        [fieldName]: [...(prev[fieldName] || []), ...files]
      }));
      
      const newPreviews = files.map(file => URL.createObjectURL(file));
      setImagePreviews(prev => ({
        ...prev,
        [fieldName]: [...(prev[fieldName] || []), ...newPreviews]
      }));
    } else {
      setImageFiles(prev => ({
        ...prev,
        [fieldName]: [files[0]]
      }));
      setImagePreviews(prev => ({
        ...prev,
        [fieldName]: [URL.createObjectURL(files[0])]
      }));
    }
  };

  const removeImage = (fieldName: string, index: number) => {
    setImageFiles(prev => ({
      ...prev,
      [fieldName]: (prev[fieldName] || []).filter((_, i) => i !== index)
    }));
    setImagePreviews(prev => ({
      ...prev,
      [fieldName]: (prev[fieldName] || []).filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (data: any) => {
    try {
      // Capturar los archivos antes de resetear
      const filesToUpload = { ...imageFiles };
      console.log('Files to upload:', filesToUpload);
      await onSubmit(data, filesToUpload);
      // Solo resetear después de que onSubmit complete exitosamente
      // El componente padre maneja el cierre del dialog
    } catch (error) {
      console.error('Error en formulario:', error);
    }
  };

  const renderField = (field: FormFieldConfig) => {
    if (field.type === 'image') {
      return (
        <FormItem key={field.name}>
          <FormLabel>{field.label}</FormLabel>
          <FormControl>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  accept="image/*"
                  multiple={field.multiple}
                  onChange={(e) => handleImageChange(field.name, e, field.multiple)}
                  disabled={isLoading}
                  className="hidden"
                  id={`file-${field.name}`}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById(`file-${field.name}`)?.click()}
                  disabled={isLoading}
                  className="w-full"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {field.multiple ? 'Subir imágenes' : 'Subir imagen'}
                </Button>
              </div>
              
              {(imagePreviews[field.name]?.length > 0) && (
                <div className="grid grid-cols-3 gap-2">
                  {imagePreviews[field.name].map((preview, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-20 object-cover rounded-md border"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(field.name, index)}
                        className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              {(!imagePreviews[field.name] || imagePreviews[field.name].length === 0) && (
                <div className="border-2 border-dashed rounded-lg p-4 text-center text-muted-foreground">
                  <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No hay imágenes seleccionadas</p>
                </div>
              )}
            </div>
          </FormControl>
          {field.description && (
            <FormDescription>{field.description}</FormDescription>
          )}
          <FormMessage />
        </FormItem>
      );
    }

    return (
      <FormField
        key={field.name}
        control={form.control}
        name={field.name}
        render={({ field: formField }) => (
          <FormItem>
            <FormLabel>{field.label}</FormLabel>
            <FormControl>
              {field.type === 'textarea' ? (
                <Textarea
                  placeholder={field.placeholder}
                  {...formField}
                  disabled={isLoading}
                />
              ) : (
                <Input
                  type={field.type}
                  placeholder={field.placeholder}
                  {...formField}
                  disabled={isLoading}
                />
              )}
            </FormControl>
            {field.description && (
              <FormDescription>{field.description}</FormDescription>
            )}
            <FormMessage />
          </FormItem>
        )}
      />
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid gap-4">
              {fields.map((field) => renderField(field))}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  form.reset();
                  setImageFiles({});
                  setImagePreviews({});
                  onOpenChange(false);
                }}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Guardar
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CatalogFormDialog;
