import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { galleryService, contentInfoService } from "@/services/catalogServices";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface GalleryData {
  id?: number;
  documentId?: string;
  name: string;
  description?: string;
  images?: any[];
  content_info?: any;
}

const Gallery = () => {
  const [data, setData] = useState<GalleryData[]>([]);
  const [filteredData, setFilteredData] = useState<GalleryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<GalleryData | null>(null);
  const [deletingItem, setDeleteingItem] = useState<GalleryData | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [contentInfos, setContentInfos] = useState<any[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<any[]>([]);
  const [selectedGallery, setSelectedGallery] = useState<GalleryData | null>(null);
  const pageSize = 12;

  const [formData, setFormData] = useState<GalleryData>({
    name: "",
    description: "",
    content_info: "",
  });

  const { toast } = useToast();

  useEffect(() => {
    loadData();
    loadContentInfos();
  }, [currentPage]);

  useEffect(() => {
    handleSearch();
  }, [searchQuery, data]);

  const loadContentInfos = async () => {
    const result = await contentInfoService.getAll({ pageSize: 100 });
    if (result.success) {
      setContentInfos(result.data);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await galleryService.getAll({
        page: currentPage,
        pageSize: pageSize,
        populate: "content_info,images",
        searchFields: ["name", "description"],
        search: searchQuery,
      });

      if (result.success) {
        setData(result.data);
        setFilteredData(result.data);
        if (result.pagination) {
          setTotalPages(result.pagination.pageCount || 1);
        }
      }
    } catch (error) {
      console.error("Error loading gallery:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron cargar los datos",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setFilteredData(data);
      return;
    }

    const filtered = data.filter((item) =>
      item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredData(filtered);
  };

  const handleCreate = () => {
    setEditingItem(null);
    setFormData({
      name: "",
      description: "",
      content_info: "",
    });
    setUploadedFiles([]);
    setExistingImages([]);
    setIsDialogOpen(true);
  };

  const handleEdit = (item: GalleryData) => {
    setEditingItem(item);
    
    const contentInfoId = item.content_info?.documentId || item.content_info?.id || "";
    
    setFormData({
      name: item.name || "",
      description: item.description || "",
      content_info: contentInfoId,
    });
    setUploadedFiles([]);
    setExistingImages(item.images || []);
    setIsDialogOpen(true);
  };

  const handleDeleteConfirm = (item: GalleryData) => {
    setDeleteingItem(item);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingItem?.documentId) return;

    try {
      const result = await galleryService.delete(deletingItem.documentId);

      if (result.success) {
        toast({
          title: "Éxito",
          description: "Galería eliminada correctamente",
        });
        loadData();
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo eliminar la galería",
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setDeleteingItem(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setUploadedFiles(Array.from(e.target.files));
    }
  };

  const handleRemoveExistingImage = (imageId: number) => {
    setExistingImages(prev => prev.filter(img => img.id !== imageId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name?.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "El nombre es requerido",
      });
      return;
    }

    try {
      const payload: any = {
        name: formData.name,
        description: formData.description,
      };

      if (formData.content_info) {
        payload.content_info = formData.content_info;
      }

      if (existingImages.length > 0) {
        payload.images = existingImages.map(img => img.id);
      }

      let result = editingItem
        ? await galleryService.update(editingItem.documentId!, payload)
        : await galleryService.create(payload);

      if (result.success && uploadedFiles.length > 0) {
        const formDataUpload = new FormData();
        uploadedFiles.forEach(file => {
          formDataUpload.append('files', file);
        });
        formDataUpload.append('ref', 'api::gallery.gallery');
        formDataUpload.append('refId', result.data.id || result.data.documentId);
        formDataUpload.append('field', 'images');

        try {
          await fetch(`${import.meta.env.VITE_API_URL || 'https://tec-adm.server-softplus.plus'}/api/upload`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
            body: formDataUpload,
          });
        } catch (uploadError) {
          console.error('Error uploading files:', uploadError);
        }
      }

      if (result.success) {
        toast({
          title: "Éxito",
          description: editingItem
            ? "Galería actualizada correctamente"
            : "Galería creada correctamente",
        });
        setIsDialogOpen(false);
        loadData();
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo guardar la galería",
      });
    }
  };

  const handleViewGallery = (item: GalleryData) => {
    setSelectedGallery(item);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Galería</h1>
          <p className="text-muted-foreground">
            Gestiona las galerías de imágenes
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Galería
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar galerías..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-lg" />
          ))}
        </div>
      ) : filteredData.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No se encontraron galerías</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredData.map((item) => (
              <div
                key={item.id}
                className="group relative overflow-hidden rounded-lg border bg-card hover:shadow-lg transition-all duration-300 cursor-pointer"
                onClick={() => handleViewGallery(item)}
              >
                <div className="aspect-square overflow-hidden bg-muted">
                  {item.images && item.images.length > 0 ? (
                    <img
                      src={`${import.meta.env.VITE_API_URL || 'https://tec-adm.server-softplus.plus'}${item.images[0].url}`}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      Sin imagen
                    </div>
                  )}
                </div>
                
                <div className="p-4">
                  <h3 className="font-semibold truncate">{item.name}</h3>
                  {item.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                      {item.description}
                    </p>
                  )}
                  {item.images && item.images.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-2">
                      {item.images.length} {item.images.length === 1 ? 'imagen' : 'imágenes'}
                    </p>
                  )}
                </div>

                <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    size="icon"
                    variant="secondary"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(item);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteConfirm(item);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <PaginationItem key={page}>
                    <PaginationLink
                      onClick={() => handlePageChange(page)}
                      isActive={currentPage === page}
                      className="cursor-pointer"
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext
                    onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)}
                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? "Editar Galería" : "Nueva Galería"}
            </DialogTitle>
            <DialogDescription>
              {editingItem
                ? "Modifica los datos de la galería"
                : "Completa los datos para crear una nueva galería"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={formData.description || ""}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content_info">Contenido Relacionado</Label>
              <Select
                value={formData.content_info || ""}
                onValueChange={(value) =>
                  setFormData({ ...formData, content_info: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar contenido" />
                </SelectTrigger>
                <SelectContent>
                  {contentInfos.map((info) => (
                    <SelectItem key={info.documentId} value={info.documentId}>
                      {info.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="images">Imágenes</Label>
              <Input
                id="images"
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileChange}
              />
              {uploadedFiles.length > 0 && (
                <div className="text-sm text-muted-foreground">
                  {uploadedFiles.length} archivo(s) seleccionado(s)
                </div>
              )}
              
              {existingImages.length > 0 && (
                <div className="space-y-2">
                  <Label>Imágenes actuales:</Label>
                  <div className="grid grid-cols-4 gap-2">
                    {existingImages.map((img) => (
                      <div key={img.id} className="relative group">
                        <img
                          src={`${import.meta.env.VITE_API_URL || 'https://tec-adm.server-softplus.plus'}${img.url}`}
                          alt={img.name}
                          className="w-full h-24 object-cover rounded"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveExistingImage(img.id)}
                          className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit">
                {editingItem ? "Actualizar" : "Crear"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedGallery} onOpenChange={() => setSelectedGallery(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedGallery?.name}</DialogTitle>
            {selectedGallery?.description && (
              <DialogDescription>{selectedGallery.description}</DialogDescription>
            )}
          </DialogHeader>
          
          {selectedGallery?.images && selectedGallery.images.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {selectedGallery.images.map((img) => (
                <div key={img.id} className="aspect-square overflow-hidden rounded-lg">
                  <img
                    src={`${import.meta.env.VITE_API_URL || 'https://tec-adm.server-softplus.plus'}${img.url}`}
                    alt={img.name}
                    className="w-full h-full object-cover hover:scale-110 transition-transform duration-300 cursor-pointer"
                    onClick={() => window.open(`${import.meta.env.VITE_API_URL || 'https://tec-adm.server-softplus.plus'}${img.url}`, '_blank')}
                  />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              Esta galería no tiene imágenes
            </p>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente la
              galería "{deletingItem?.name}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Gallery;
