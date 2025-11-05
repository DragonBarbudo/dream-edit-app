import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getImages, deleteImage, type GeneratedImage } from '@/lib/storage';
import { Trash2, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface GalleryProps {
  refreshKey: number;
}

export const Gallery = ({ refreshKey }: GalleryProps) => {
  const images = getImages();
  const { toast } = useToast();

  const handleDelete = (id: string) => {
    deleteImage(id);
    toast({
      title: "Image deleted",
      description: "The image has been removed from your gallery",
    });
    window.location.reload();
  };

  const handleDownload = async (image: GeneratedImage) => {
    try {
      const response = await fetch(image.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ai-image-${image.id}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Download started",
        description: "Your image is being downloaded",
      });
    } catch (error) {
      toast({
        title: "Download failed",
        description: "Could not download the image",
        variant: "destructive",
      });
    }
  };

  if (images.length === 0) {
    return (
      <Card className="glass">
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">
            No images yet. Create or edit one to get started!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {images.map((image) => (
        <Card key={image.id} className="glass overflow-hidden group">
          <CardContent className="p-0 relative">
            <img 
              src={image.url} 
              alt={image.prompt} 
              className="w-full h-64 object-cover"
            />
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
              <div className="w-full space-y-2">
                <p className="text-white text-sm line-clamp-2">{image.prompt}</p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="flex-1"
                    onClick={() => handleDownload(image)}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(image.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
