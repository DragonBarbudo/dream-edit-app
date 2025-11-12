import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { CreateMode } from './CreateMode';
import { EditMode } from './EditMode';
import { VideoMode } from './VideoMode';
import { Gallery } from './Gallery';
import { Sparkles } from 'lucide-react';

export const MainApp = () => {
  const [galleryRefresh, setGalleryRefresh] = useState(0);

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <Card className="glass">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary-foreground" />
              </div>
              <CardTitle className="text-2xl">AI Image Studio</CardTitle>
            </div>
          </CardHeader>
        </Card>

        <Tabs defaultValue="create" className="w-full">
          <TabsList className="grid w-full grid-cols-4 glass">
            <TabsTrigger value="create">Create</TabsTrigger>
            <TabsTrigger value="edit">Edit</TabsTrigger>
            <TabsTrigger value="video">Video</TabsTrigger>
            <TabsTrigger value="gallery">Gallery</TabsTrigger>
          </TabsList>

          <TabsContent value="create" className="mt-6">
            <CreateMode onImageGenerated={() => setGalleryRefresh(prev => prev + 1)} />
          </TabsContent>

          <TabsContent value="edit" className="mt-6">
            <EditMode onImageGenerated={() => setGalleryRefresh(prev => prev + 1)} />
          </TabsContent>

          <TabsContent value="video" className="mt-6">
            <VideoMode onVideoGenerated={() => setGalleryRefresh(prev => prev + 1)} />
          </TabsContent>

          <TabsContent value="gallery" className="mt-6">
            <Gallery refreshKey={galleryRefresh} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
