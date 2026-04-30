import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { generateImage, type ModelType } from '@/lib/fal-api';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Zap, Copy, Upload, X } from 'lucide-react';

export const CreateMode = () => {
  const [prompt, setPrompt] = useState('');
  const [model, setModel] = useState<ModelType>('nano-banana');
  const [loading, setLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({ title: "Prompt required", description: "Please enter a description for your image", variant: "destructive" });
      return;
    }
    if (model === 'gpt-image-2-edit' && uploadedImages.length === 0) {
      toast({ title: "Image required", description: "Please upload at least one reference image", variant: "destructive" });
      return;
    }
    setLoading(true);
    setGeneratedImage(null);
    try {
      const imageUrl = await generateImage({ prompt, model, images: uploadedImages });
      setGeneratedImage(imageUrl);
      toast({ title: "Image generated!", description: "Your image has been created successfully" });
    } catch (error) {
      toast({ title: "Generation failed", description: error instanceof Error ? error.message : "Failed to generate image", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const readers = Array.from(files).filter(file => file.type.startsWith('image/')).map(file =>
      new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      })
    );
    Promise.all(readers).then(setUploadedImages);
  };

  return (
    <div className="space-y-6">
      <div className="border border-border bg-card p-6 space-y-5">
        <div className="space-y-2">
          <Label htmlFor="prompt" className="font-mono uppercase text-xs tracking-wider text-muted-foreground">Prompt</Label>
          <Textarea
            id="prompt"
            placeholder="Describe the image you want to create..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={4}
            className="resize-none rounded-none bg-muted border-border font-mono text-sm"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="model" className="font-mono uppercase text-xs tracking-wider text-muted-foreground">Model</Label>
          <Select value={model} onValueChange={(value) => setModel(value as ModelType)}>
            <SelectTrigger id="model" className="rounded-none bg-muted border-border font-mono text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-none bg-card border-border">
              <SelectItem value="nano-banana">Nano Banana</SelectItem>
              <SelectItem value="nano-banana-pro">Nano Banana Pro</SelectItem>
              <SelectItem value="seedream">Seedream v4.5</SelectItem>
              <SelectItem value="nano-banana-2">Nano Banana 2</SelectItem>
              <SelectItem value="gpt-image-2-edit">GPT Image 2 Edit</SelectItem>
              <SelectItem value="z-image">Z-Image Turbo</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {model === 'gpt-image-2-edit' && (
          <div className="space-y-2">
            <Label className="font-mono uppercase text-xs tracking-wider text-muted-foreground">Reference Images</Label>
            {uploadedImages.length > 0 ? (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  {uploadedImages.map((image, index) => (
                    <div key={index} className="relative border border-border">
                      <img src={image} alt={`Reference ${index + 1}`} className="w-full h-32 object-cover" />
                      <Button size="icon" variant="destructive" className="absolute top-2 right-2 rounded-none" onClick={() => setUploadedImages(prev => prev.filter((_, i) => i !== index))}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                <Button variant="outline" className="w-full rounded-none font-mono uppercase text-xs" onClick={() => setUploadedImages([])}>Clear All</Button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-border hover:border-muted-foreground cursor-pointer transition-colors">
                <Upload className="h-7 w-7 mb-2 text-muted-foreground" />
                <span className="text-sm text-muted-foreground font-mono">Upload reference images</span>
                <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
              </label>
            )}
          </div>
        )}

        <Button
          onClick={handleGenerate}
          disabled={loading || !prompt.trim() || (model === 'gpt-image-2-edit' && uploadedImages.length === 0)}
          className="w-full rounded-none font-mono uppercase tracking-wider h-12"
          size="lg"
        >
          {loading ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Generating...</>
          ) : (
            <><Zap className="mr-2 h-4 w-4" />Generate</>
          )}
        </Button>
      </div>

      {generatedImage && (
        <div className="border border-border bg-card overflow-hidden">
          <img src={generatedImage} alt="Generated" className="w-full h-auto" />
          <div className="p-4 border-t border-border">
            <Button
              variant="outline"
              className="w-full rounded-none font-mono uppercase text-xs tracking-wider"
              onClick={() => {
                navigator.clipboard.writeText(generatedImage);
                toast({ title: "Copied!", description: "Image URL copied to clipboard" });
              }}
            >
              <Copy className="mr-2 h-4 w-4" />Copy URL
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
