import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { generateImage, type ModelType } from '@/lib/fal-api';
import { saveImage } from '@/lib/storage';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Sparkles } from 'lucide-react';

interface CreateModeProps {
  onImageGenerated: () => void;
}

export const CreateMode = ({ onImageGenerated }: CreateModeProps) => {
  const [prompt, setPrompt] = useState('');
  const [model, setModel] = useState<ModelType>('nano-banana');
  const [loading, setLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Prompt required",
        description: "Please enter a description for your image",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setGeneratedImage(null);

    try {
      const imageUrl = await generateImage({ prompt, model });
      setGeneratedImage(imageUrl);
      saveImage({ url: imageUrl, prompt, model });
      onImageGenerated();
      
      toast({
        title: "Image generated!",
        description: "Your image has been created successfully",
      });
    } catch (error) {
      toast({
        title: "Generation failed",
        description: error instanceof Error ? error.message : "Failed to generate image",
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
            <Label htmlFor="prompt">Prompt</Label>
            <Textarea
              id="prompt"
              placeholder="Describe the image you want to create..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="model">Model</Label>
            <Select value={model} onValueChange={(value) => setModel(value as ModelType)}>
              <SelectTrigger id="model">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="nano-banana">Nano Banana</SelectItem>
                <SelectItem value="seedream">Seedream v4</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button 
            onClick={handleGenerate} 
            disabled={loading || !prompt.trim()}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Image
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {generatedImage && (
        <Card className="glass overflow-hidden">
          <CardContent className="p-0">
            <img 
              src={generatedImage} 
              alt="Generated" 
              className="w-full h-auto"
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
};
