import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { login } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { Sparkles } from 'lucide-react';

interface LoginProps {
  onLogin: () => void;
}

export const Login = ({ onLogin }: LoginProps) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (login(username, password)) {
      toast({
        title: "Welcome back!",
        description: `Logged in as ${username}`,
      });
      onLogin();
    } else {
      toast({
        title: "Login failed",
        description: "Invalid username or password",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md glass">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center mb-4">
            <Sparkles className="w-6 h-6 text-primary-foreground" />
          </div>
          <CardTitle className="text-3xl font-bold">AI Image Studio</CardTitle>
          <CardDescription>Sign in to create and edit images</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full">
              Sign In
            </Button>
          </form>
          <p className="text-xs text-muted-foreground text-center mt-4">
            Try: Albin, Cora, Umi, or Leo (password: pass123)
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
