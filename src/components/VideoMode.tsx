import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { generateVideo, VideoModelType } from '@/lib/fal-api';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, X, Video, Copy } from 'lucide-react';

export const VideoMode = () => {
  const [prompt, setPrompt] = useState('');
  const [duration, setDuration] = useState<number>(5);
  const [videoModel, setVideoModel] = useState<VideoModelType>('wan-25');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [loading, setLoading] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const { toast } = useToast();

  const processFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onloadend = () => setUploadedImage(reader.result as string);
    reader.readAsDataURL(file);
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (file) processFile(file); };
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); const file = e.dataTransfer.files?.[0]; if (file) processFile(file); };

  const handleGenerate = async () => {
    if (!prompt.trim()) { toast({ title: "Prompt required", description: "Please describe the video animation", variant: "destructive" }); return; }
    if (!uploadedImage) { toast({ title: "Image required", description: "Please upload an image to animate", variant: "destructive" }); return; }
    setLoading(true); setGeneratedVideo(null);
    try {
      const videoUrl = await generateVideo({ prompt, image: uploadedImage, duration, videoModel, aspectRatio: (videoModel === "seedance" || videoModel === "wan-26") ? aspectRatio : undefined });
      setGeneratedVideo(videoUrl);
      toast({ title: "Video generated!", description: "Your animated video is ready" });
    } catch (error) {
      toast({ title: "Generation failed", description: error instanceof Error ? error.message : "Failed to generate video", variant: "destructive" });
    } finally { setLoading(false); }
  };

  return (
    <div className="space-y-6">
      <div className="border border-border bg-card p-6 space-y-5">
        <div className="space-y-2">
          <Label className="font-mono uppercase text-xs tracking-wider text-muted-foreground">Upload Image</Label>
          {uploadedImage ? (
            <div className="relative border border-border">
              <img src={uploadedImage} alt="Upload preview" className="w-full h-64 object-cover" />
              <Button size="icon" variant="destructive" className="absolute top-2 right-2 rounded-none" onClick={() => setUploadedImage(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <label
              className={`flex flex-col items-center justify-center h-64 border-2 border-dashed cursor-pointer transition-colors ${isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground'}`}
              onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
            >
              <Upload className="h-8 w-8 mb-2 text-muted-foreground" />
              <span className="text-sm text-muted-foreground font-mono">Drop an image here</span>
              <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            </label>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="video-prompt" className="font-mono uppercase text-xs tracking-wider text-muted-foreground">Animation Prompt</Label>
          <Textarea id="video-prompt" placeholder="Describe how you want to animate the image..." value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={4} className="resize-none rounded-none bg-muted border-border font-mono text-sm" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="video-model" className="font-mono uppercase text-xs tracking-wider text-muted-foreground">Model</Label>
            <Select value={videoModel} onValueChange={(value) => setVideoModel(value as VideoModelType)}>
              <SelectTrigger id="video-model" className="rounded-none bg-muted border-border font-mono text-sm"><SelectValue /></SelectTrigger>
              <SelectContent className="rounded-none bg-card border-border">
                <SelectItem value="wan-25">Wan 2.5</SelectItem>
                <SelectItem value="wan-26">Wan 2.6</SelectItem>
                <SelectItem value="seedance">Seedance 1.5</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration" className="font-mono uppercase text-xs tracking-wider text-muted-foreground">Duration</Label>
            <Select value={duration.toString()} onValueChange={(value) => setDuration(parseInt(value))}>
              <SelectTrigger id="duration" className="rounded-none bg-muted border-border font-mono text-sm"><SelectValue /></SelectTrigger>
              <SelectContent className="rounded-none bg-card border-border">
                {videoModel === "seedance" ? (
                  [4,5,6,7,8,9,10,11,12].map(d => <SelectItem key={d} value={d.toString()}>{d}s</SelectItem>)
                ) : (
                  <><SelectItem value="5">5s</SelectItem><SelectItem value="10">10s</SelectItem></>
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        {(videoModel === "seedance" || videoModel === "wan-26") && (
          <div className="space-y-2">
            <Label htmlFor="aspect-ratio" className="font-mono uppercase text-xs tracking-wider text-muted-foreground">Aspect Ratio</Label>
            <Select value={aspectRatio} onValueChange={setAspectRatio}>
              <SelectTrigger id="aspect-ratio" className="rounded-none bg-muted border-border font-mono text-sm"><SelectValue /></SelectTrigger>
              <SelectContent className="rounded-none bg-card border-border">
                {["21:9","16:9","4:3","1:1","3:4","9:16"].map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}

        <Button onClick={handleGenerate} disabled={loading || !prompt.trim() || !uploadedImage} className="w-full rounded-none font-mono uppercase tracking-wider h-12" size="lg">
          {loading ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Generating...</>) : (<><Video className="mr-2 h-4 w-4" />Generate Video</>)}
        </Button>
      </div>

      {generatedVideo && (
        <div className="border border-border bg-card overflow-hidden">
          <video src={generatedVideo} controls className="w-full h-auto" />
          <div className="p-4 border-t border-border">
            <Button variant="outline" className="w-full rounded-none font-mono uppercase text-xs tracking-wider" onClick={() => { navigator.clipboard.writeText(generatedVideo); toast({ title: "Copied!", description: "Video URL copied to clipboard" }); }}>
              <Copy className="mr-2 h-4 w-4" />Copy URL
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
