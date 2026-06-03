import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { generateImage, type ModelType } from '@/lib/fal-api';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Zap, Copy } from 'lucide-react';

export const CreateMode = () => {
  const [prompt, setPrompt] = useState('');
  const [model, setModel] = useState<ModelType>('nano-banana');
  const [loading, setLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [errorResponse, setErrorResponse] = useState<string | null>(null);
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({ title: "Prompt required", description: "Please enter a description for your image", variant: "destructive" });
      return;
    }
    setLoading(true);
    setGeneratedImage(null);
    setErrorResponse(null);
    try {
      const imageUrl = await generateImage({ prompt, model });
      setGeneratedImage(imageUrl);
      toast({ title: "Image generated!", description: "Your image has been created successfully" });
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Failed to generate image";
      setErrorResponse(msg);
      toast({ title: "Generation failed", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
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
              <SelectItem value="gpt-image-2">GPT Image 2</SelectItem>
              <SelectItem value="z-image">Z-Image Turbo</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          onClick={handleGenerate}
          disabled={loading || !prompt.trim()}
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
          <div className="p-4 border-t border-border space-y-2">
            <p className="font-mono uppercase text-xs tracking-wider text-muted-foreground">Raw Image (right-click or drag)</p>
            <img src={generatedImage} alt="Generated raw" style={{ maxWidth: '100%' }} />
          </div>
        </div>
      )}

      {errorResponse && (
        <div className="border border-destructive bg-destructive/10 p-4 overflow-auto">
          <p className="font-mono text-xs text-destructive whitespace-pre-wrap break-all">{errorResponse}</p>
        </div>
      )}
    </div>
  );
};
