import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { editImage, type ModelType } from '@/lib/fal-api';
import { saveImage } from '@/lib/storage';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, X, Wand2, Copy } from 'lucide-react';

interface EditModeProps {
  onImageGenerated: () => void;
}

export const EditMode = ({ onImageGenerated }: EditModeProps) => {
  const [prompt, setPrompt] = useState('');
  const [model, setModel] = useState<ModelType>('nano-banana');
  const [loading, setLoading] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const { toast } = useToast();

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const readers: Promise<string>[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      readers.push(
        new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        })
      );
    }

    Promise.all(readers).then((images) => {
      setUploadedImages(images);
    });
  };

  const handleEdit = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Prompt required",
        description: "Please describe how to edit the image",
        variant: "destructive",
      });
      return;
    }

    if (uploadedImages.length === 0) {
      toast({
        title: "Image required",
        description: "Please upload at least one image to edit",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setGeneratedImage(null);

    try {
      const imageUrl = await editImage({ 
        prompt, 
        images: uploadedImages, 
        model 
      });
      setGeneratedImage(imageUrl);
      saveImage({ url: imageUrl, prompt, model });
      onImageGenerated();
      
      toast({
        title: "Image edited!",
        description: "Your edited image is ready",
      });
    } catch (error) {
      toast({
        title: "Edit failed",
        description: error instanceof Error ? error.message : "Failed to edit image",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="glass">
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-2">
            <Label>Upload Images (Multiple)</Label>
            {uploadedImages.length > 0 ? (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  {uploadedImages.map((image, index) => (
                    <div key={index} className="relative">
                      <img 
                        src={image} 
                        alt={`Upload preview ${index + 1}`} 
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <Button
                        size="icon"
                        variant="destructive"
                        className="absolute top-2 right-2"
                        onClick={() => setUploadedImages(prev => prev.filter((_, i) => i !== index))}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setUploadedImages([])}
                >
                  Clear All
                </Button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center h-48 border-2 border-dashed rounded-lg cursor-pointer hover:bg-accent/50 transition-colors">
                <Upload className="h-8 w-8 mb-2 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Click to upload images</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-prompt">Edit Instructions</Label>
            <Textarea
              id="edit-prompt"
              placeholder="Describe how you want to edit the image..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-model">Model</Label>
            <Select value={model} onValueChange={(value) => setModel(value as ModelType)}>
              <SelectTrigger id="edit-model">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="nano-banana">Nano Banana</SelectItem>
                <SelectItem value="seedream">Seedream v4</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button 
            onClick={handleEdit} 
            disabled={loading || !prompt.trim() || uploadedImages.length === 0}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Editing...
              </>
            ) : (
              <>
                <Wand2 className="mr-2 h-4 w-4" />
                Edit Image
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {generatedImage && (
        <Card className="glass overflow-hidden">
          <CardContent className="p-4 space-y-3">
            <img 
              src={generatedImage} 
              alt="Edited result" 
              className="w-full h-auto rounded-lg"
            />
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                navigator.clipboard.writeText(generatedImage);
                toast({
                  title: "Copied!",
                  description: "Image URL copied to clipboard",
                });
              }}
            >
              <Copy className="mr-2 h-4 w-4" />
              Copy to Clipboard
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
