import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CreateMode } from './CreateMode';
import { EditMode } from './EditMode';
import { Gallery } from './Gallery';
import { logout, getCurrentUser } from '@/lib/auth';
import { LogOut, Sparkles } from 'lucide-react';

interface MainAppProps {
  onLogout: () => void;
}

export const MainApp = ({ onLogout }: MainAppProps) => {
  const [galleryRefresh, setGalleryRefresh] = useState(0);
  const username = getCurrentUser();

  const handleLogout = () => {
    logout();
    onLogout();
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <Card className="glass">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <CardTitle className="text-2xl">AI Image Studio</CardTitle>
                  <p className="text-sm text-muted-foreground">Welcome, {username}</p>
                </div>
              </div>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          </CardHeader>
        </Card>

        <Tabs defaultValue="create" className="w-full">
          <TabsList className="grid w-full grid-cols-3 glass">
            <TabsTrigger value="create">Create</TabsTrigger>
            <TabsTrigger value="edit">Edit</TabsTrigger>
            <TabsTrigger value="gallery">Gallery</TabsTrigger>
          </TabsList>

          <TabsContent value="create" className="mt-6">
            <CreateMode onImageGenerated={() => setGalleryRefresh(prev => prev + 1)} />
          </TabsContent>

          <TabsContent value="edit" className="mt-6">
            <EditMode onImageGenerated={() => setGalleryRefresh(prev => prev + 1)} />
          </TabsContent>

          <TabsContent value="gallery" className="mt-6">
            <Gallery refreshKey={galleryRefresh} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
