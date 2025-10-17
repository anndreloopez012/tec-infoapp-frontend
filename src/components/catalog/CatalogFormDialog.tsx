// ===============================================
// COMPONENTE GENÉRICO DE FORMULARIO PARA CATÁLOGOS
// ===============================================

import React from 'react';
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
import { Loader2 } from 'lucide-react';

interface FormFieldConfig {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'email' | 'date';
  placeholder?: string;
  description?: string;
  required?: boolean;
  validation?: any;
}

interface CatalogFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => Promise<void>;
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
        default:
          fieldValidator = z.string();
      }
      
      if (field.required) {
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
  }, [defaultValues]);
  const handleSubmit = async (data: any) => {
    try {
      await onSubmit(data);
      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error('Error en formulario:', error);
    }
  };

  const renderField = (field: FormFieldConfig) => {
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
