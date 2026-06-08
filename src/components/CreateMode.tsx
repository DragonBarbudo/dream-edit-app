import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { generateImage, type ModelType } from '@/lib/fal-api';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Zap, Copy, X } from 'lucide-react';

interface Job {
  id: string;
  prompt: string;
  model: ModelType;
  status: 'pending' | 'done' | 'error';
  imageUrl?: string;
  error?: string;
}

export const CreateMode = () => {
  const [prompt, setPrompt] = useState('');
  const [model, setModel] = useState<ModelType>('nano-banana-2');
  const [jobs, setJobs] = useState<Job[]>([]);
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({ title: "Prompt required", description: "Please enter a description for your image", variant: "destructive" });
      return;
    }
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const job: Job = { id, prompt, model, status: 'pending' };
    setJobs(prev => [job, ...prev]);
    const currentPrompt = prompt;
    const currentModel = model;
    try {
      const imageUrl = await generateImage({ prompt: currentPrompt, model: currentModel });
      setJobs(prev => prev.map(j => j.id === id ? { ...j, status: 'done', imageUrl } : j));
      toast({ title: "Image generated!", description: "Your image has been created successfully" });
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Failed to generate image";
      setJobs(prev => prev.map(j => j.id === id ? { ...j, status: 'error', error: msg } : j));
      toast({ title: "Generation failed", description: msg, variant: "destructive" });
    }
  };

  const removeJob = (id: string) => setJobs(prev => prev.filter(j => j.id !== id));

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
              <SelectItem value="seedream">Seedream v4.5</SelectItem>
              <SelectItem value="nano-banana-2">Nano Banana 2</SelectItem>
              <SelectItem value="gpt-image-2">GPT Image 2</SelectItem>
              <SelectItem value="z-image">Z-Image Turbo</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          onClick={handleGenerate}
          disabled={!prompt.trim()}
          className="w-full rounded-none font-mono uppercase tracking-wider h-12"
          size="lg"
        >
          <Zap className="mr-2 h-4 w-4" />Generate
        </Button>
      </div>

      {jobs.map(job => (
        <div key={job.id} className="border border-border bg-card overflow-hidden">
          <div className="p-3 border-b border-border flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="font-mono text-xs text-muted-foreground uppercase tracking-wider">{job.model} · {job.status}</p>
              <p className="font-mono text-xs mt-1 truncate">{job.prompt}</p>
            </div>
            <Button size="icon" variant="ghost" className="rounded-none h-7 w-7" onClick={() => removeJob(job.id)}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {job.status === 'pending' && (
            <div className="flex items-center justify-center h-48 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span className="font-mono text-xs uppercase tracking-wider">Generating...</span>
            </div>
          )}

          {job.status === 'done' && job.imageUrl && (
            <>
              <img src={job.imageUrl} alt="Generated" className="w-full h-auto" />
              <div className="p-4 border-t border-border">
                <Button
                  variant="outline"
                  className="w-full rounded-none font-mono uppercase text-xs tracking-wider"
                  onClick={() => {
                    navigator.clipboard.writeText(job.imageUrl!);
                    toast({ title: "Copied!", description: "Image URL copied to clipboard" });
                  }}
                >
                  <Copy className="mr-2 h-4 w-4" />Copy URL
                </Button>
              </div>
              <div className="p-4 border-t border-border space-y-2">
                <p className="font-mono uppercase text-xs tracking-wider text-muted-foreground">Raw Image (right-click or drag)</p>
                <img src={job.imageUrl} alt="Generated raw" style={{ maxWidth: '100%' }} />
              </div>
            </>
          )}

          {job.status === 'error' && (
            <div className="border-t border-destructive bg-destructive/10 p-4 overflow-auto">
              <p className="font-mono text-xs text-destructive whitespace-pre-wrap break-all">{job.error}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
