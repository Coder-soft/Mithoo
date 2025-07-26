import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Settings, Key, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export const UserPreferences = () => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [customGeminiKey, setCustomGeminiKey] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && open) {
      loadPreferences();
    }
  }, [user, open]);

  const loadPreferences = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('custom_gemini_key')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // Not found error is ok
        throw error;
      }

      if (data?.custom_gemini_key) {
        setCustomGeminiKey('••••••••••••••••'); // Show masked key
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  };

  const savePreferences = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Only save if the key is not masked (user actually entered a new key)
      if (customGeminiKey && !customGeminiKey.includes('••••')) {
        const { error } = await supabase
          .from('user_preferences')
          .upsert({
            user_id: user.id,
            custom_gemini_key: customGeminiKey,
          });

        if (error) throw error;

        toast.success('Preferences saved successfully');
        setOpen(false);
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast.error('Failed to save preferences');
    } finally {
      setLoading(false);
    }
  };

  const clearCustomKey = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          custom_gemini_key: null,
        });

      if (error) throw error;

      setCustomGeminiKey('');
      toast.success('Custom API key removed');
    } catch (error) {
      console.error('Error clearing custom key:', error);
      toast.error('Failed to clear custom key');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Settings className="w-4 h-4 mr-2" />
          Settings
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>User Preferences</DialogTitle>
          <DialogDescription>
            Manage your user preferences. You can provide your own Gemini API key to use for all AI features.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="gemini-key" className="flex items-center gap-2">
              <Key className="w-4 h-4" />
              Custom Gemini API Key
            </Label>
            <Input
              id="gemini-key"
              type="password"
              placeholder="Enter your Gemini API key (optional)"
              value={customGeminiKey}
              onChange={(e) => setCustomGeminiKey(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              If provided, your custom key will be used instead of the app's default key.
              Get your key from{' '}
              <a 
                href="https://makersuite.google.com/app/apikey" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                Google AI Studio
              </a>
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button onClick={savePreferences} disabled={loading} className="flex-1">
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
            {customGeminiKey && (
              <Button 
                variant="outline" 
                onClick={clearCustomKey} 
                disabled={loading}
              >
                Clear Key
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};