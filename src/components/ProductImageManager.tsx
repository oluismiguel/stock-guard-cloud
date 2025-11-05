import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Upload, Trash2, X } from "lucide-react";
import { toast } from "sonner";

interface ProductImage {
  id: string;
  image_url: string;
  display_order: number;
}

interface ProductImageManagerProps {
  productId: string;
  productName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImagesUpdated?: () => void;
}

export const ProductImageManager = ({ 
  productId, 
  productName, 
  open, 
  onOpenChange,
  onImagesUpdated 
}: ProductImageManagerProps) => {
  const [images, setImages] = useState<ProductImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (open && productId) {
      fetchImages();
    }
  }, [open, productId]);

  const fetchImages = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('product_images')
        .select('*')
        .eq('product_id', productId)
        .order('display_order');

      if (error) throw error;
      setImages(data || []);
    } catch (error) {
      console.error('Error fetching images:', error);
      toast.error('Erro ao carregar imagens');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    
    try {
      const uploadPromises = Array.from(files).map(async (file, index) => {
        // Convert file to base64
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        
        const base64 = await base64Promise;
        
        // Insert into database with base64 URL
        const { error } = await supabase
          .from('product_images')
          .insert({
            product_id: productId,
            image_url: base64,
            display_order: images.length + index
          });

        if (error) throw error;
      });

      await Promise.all(uploadPromises);
      
      toast.success('Imagens adicionadas com sucesso!');
      await fetchImages();
      onImagesUpdated?.();
    } catch (error) {
      console.error('Error uploading images:', error);
      toast.error('Erro ao fazer upload das imagens');
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    try {
      const { error } = await supabase
        .from('product_images')
        .delete()
        .eq('id', imageId);

      if (error) throw error;

      toast.success('Imagem removida com sucesso!');
      await fetchImages();
      onImagesUpdated?.();
    } catch (error) {
      console.error('Error deleting image:', error);
      toast.error('Erro ao remover imagem');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Gerenciar Imagens - {productName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileUpload}
              className="hidden"
              id={`file-upload-${productId}`}
              disabled={uploading}
            />
            <label htmlFor={`file-upload-${productId}`}>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={uploading}
                asChild
              >
                <span>
                  <Upload className="w-4 h-4 mr-2" />
                  {uploading ? 'Enviando...' : 'Adicionar Imagens'}
                </span>
              </Button>
            </label>
          </div>

          {loading ? (
            <div className="text-center py-4 text-muted-foreground">
              Carregando imagens...
            </div>
          ) : images.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              Nenhuma imagem cadastrada
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {images.map((image) => (
                <div key={image.id} className="relative group">
                  <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                    <img
                      src={image.image_url}
                      alt={`Produto ${productName}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <Button
                    size="icon"
                    variant="destructive"
                    className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleDeleteImage(image.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
