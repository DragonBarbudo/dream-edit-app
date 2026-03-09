import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CreateMode } from './CreateMode';
import { EditMode } from './EditMode';
import { VideoMode } from './VideoMode';
import { Zap } from 'lucide-react';

export const MainApp = () => {
  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="flex items-center gap-4 py-4">
          <div className="w-10 h-10 border-2 border-primary flex items-center justify-center">
            <Zap className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight uppercase font-mono">
              AI Studio
            </h1>
            <p className="text-xs text-muted-foreground font-mono tracking-widest uppercase">
              Generate · Edit · Animate
            </p>
          </div>
        </header>

        <Tabs defaultValue="create" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-muted border border-border rounded-none h-12">
            <TabsTrigger value="create" className="rounded-none font-mono uppercase text-xs tracking-wider data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Create
            </TabsTrigger>
            <TabsTrigger value="edit" className="rounded-none font-mono uppercase text-xs tracking-wider data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Edit
            </TabsTrigger>
            <TabsTrigger value="video" className="rounded-none font-mono uppercase text-xs tracking-wider data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Video
            </TabsTrigger>
          </TabsList>

          <TabsContent value="create" className="mt-6">
            <CreateMode />
          </TabsContent>

          <TabsContent value="edit" className="mt-6">
            <EditMode />
          </TabsContent>

          <TabsContent value="video" className="mt-6">
            <VideoMode />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
