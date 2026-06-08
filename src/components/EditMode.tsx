import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { editImage, type ModelType } from '@/lib/fal-api';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, X, Wand2, Copy } from 'lucide-react';
import { ImageCompare } from './ImageCompare';

interface Job {
  id: string;
  prompt: string;
  model: ModelType;
  inputImages: string[];
  status: 'pending' | 'done' | 'error';
  imageUrl?: string;
  error?: string;
}

export const EditMode = () => {
  const [prompt, setPrompt] = useState('');
  const [model, setModel] = useState<ModelType>('nano-banana-2');
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const { toast } = useToast();

  const processFiles = useCallback((files: FileList | File[]) => {
    const fileArray = Array.from(files).filter(file => file.type.startsWith('image/'));
    if (fileArray.length === 0) return;
    const readers: Promise<string>[] = fileArray.map(file =>
      new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      })
    );
    Promise.all(readers).then((images) => setUploadedImages(images));
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) processFiles(files);
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files) processFiles(files);
  };

  const handleEdit = async () => {
    if (!prompt.trim()) { toast({ title: "Prompt required", description: "Please describe how to edit the image", variant: "destructive" }); return; }
    if (uploadedImages.length === 0) { toast({ title: "Image required", description: "Please upload at least one image to edit", variant: "destructive" }); return; }
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const job: Job = { id, prompt, model, inputImages: uploadedImages, status: 'pending' };
    setJobs(prev => [job, ...prev]);
    const currentPrompt = prompt;
    const currentModel = model;
    const currentImages = uploadedImages;
    try {
      const imageUrl = await editImage({ prompt: currentPrompt, images: currentImages, model: currentModel });
      setJobs(prev => prev.map(j => j.id === id ? { ...j, status: 'done', imageUrl } : j));
      toast({ title: "Image edited!", description: "Your edited image is ready" });
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Failed to edit image";
      setJobs(prev => prev.map(j => j.id === id ? { ...j, status: 'error', error: msg } : j));
      toast({ title: "Edit failed", description: msg, variant: "destructive" });
    }
  };

  const removeJob = (id: string) => setJobs(prev => prev.filter(j => j.id !== id));

  return (
    <div className="space-y-6">
      <div className="border border-border bg-card p-6 space-y-5">
        <div className="space-y-2">
          <Label className="font-mono uppercase text-xs tracking-wider text-muted-foreground">Upload Images</Label>
          {uploadedImages.length > 0 ? (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                {uploadedImages.map((image, index) => (
                  <div key={index} className="relative border border-border">
                    <img src={image} alt={`Upload ${index + 1}`} className="w-full h-32 object-cover" />
                    <Button size="icon" variant="destructive" className="absolute top-2 right-2 rounded-none" onClick={() => setUploadedImages(prev => prev.filter((_, i) => i !== index))}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <Button variant="outline" className="w-full rounded-none font-mono uppercase text-xs" onClick={() => setUploadedImages([])}>Clear All</Button>
            </div>
          ) : (
            <label
              className={`flex flex-col items-center justify-center h-48 border-2 border-dashed cursor-pointer transition-colors ${isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground'}`}
              onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
            >
              <Upload className="h-8 w-8 mb-2 text-muted-foreground" />
              <span className="text-sm text-muted-foreground font-mono">Drop images here</span>
              <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
            </label>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="edit-prompt" className="font-mono uppercase text-xs tracking-wider text-muted-foreground">Edit Instructions</Label>
          <Textarea id="edit-prompt" placeholder="Describe how you want to edit the image..." value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={4} className="resize-none rounded-none bg-muted border-border font-mono text-sm" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="edit-model" className="font-mono uppercase text-xs tracking-wider text-muted-foreground">Model</Label>
          <Select value={model} onValueChange={(value) => setModel(value as ModelType)}>
            <SelectTrigger id="edit-model" className="rounded-none bg-muted border-border font-mono text-sm"><SelectValue /></SelectTrigger>
            <SelectContent className="rounded-none bg-card border-border">
              <SelectItem value="nano-banana-2">Nano Banana 2</SelectItem>
              <SelectItem value="seedream">Seedream v4.5</SelectItem>
              <SelectItem value="seedream-v5-lite-edit">Seedream v5 Lite Edit</SelectItem>
              <SelectItem value="gpt-image-2-edit">GPT Image 2 Edit</SelectItem>
              <SelectItem value="z-image">Z-Image Turbo</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button onClick={handleEdit} disabled={!prompt.trim() || uploadedImages.length === 0} className="w-full rounded-none font-mono uppercase tracking-wider h-12" size="lg">
          <Wand2 className="mr-2 h-4 w-4" />Edit Image
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
              <span className="font-mono text-xs uppercase tracking-wider">Editing...</span>
            </div>
          )}

          {job.status === 'done' && job.imageUrl && (
            <>
              <div className="p-4">
                <ImageCompare beforeImage={job.inputImages[0]} afterImage={job.imageUrl} beforeLabel="Original" afterLabel="Edited" />
              </div>
              <div className="p-4 border-t border-border">
                <Button variant="outline" className="w-full rounded-none font-mono uppercase text-xs tracking-wider" onClick={() => { navigator.clipboard.writeText(job.imageUrl!); toast({ title: "Copied!", description: "Image URL copied to clipboard" }); }}>
                  <Copy className="mr-2 h-4 w-4" />Copy URL
                </Button>
              </div>
              <div className="p-4 border-t border-border space-y-2">
                <p className="font-mono uppercase text-xs tracking-wider text-muted-foreground">Raw Image (right-click or drag)</p>
                <img src={job.imageUrl} alt="Edited raw" style={{ maxWidth: '100%' }} />
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
