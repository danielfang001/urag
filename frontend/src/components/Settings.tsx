'use client';

import { useState, useEffect } from 'react';
import { Settings as SettingsIcon } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

const MODEL_OPTIONS = [
  { value: 'gpt-4-turbo-2024-04-09', label: 'GPT-4 Turbo' },
  { value: 'gpt-4o-mini-2024-07-18', label: 'GPT-4o Mini' },
  { value: 'gpt-4o-2024-08-06', label: 'GPT-4o' },
  { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
];

export function Settings() {
  const [isOpen, setIsOpen] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [exaKey, setExaKey] = useState('');
  const [selectedModel, setSelectedModel] = useState('gpt-3.5-turbo');
  const [enableWebSearch, setEnableWebSearch] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const storedKey = localStorage.getItem('openai_api_key');
    const storedExaKey = localStorage.getItem('exa_api_key');
    const storedModel = localStorage.getItem('openai_model');
    const storedWebSearch = localStorage.getItem('enable_web_search');
    
    if (storedKey) setApiKey(storedKey);
    if (storedExaKey) setExaKey(storedExaKey);
    if (storedModel) setSelectedModel(storedModel);
    if (storedWebSearch) setEnableWebSearch(storedWebSearch === 'true');
  }, []);

  const handleSave = () => {
    if (!apiKey.trim()) {
      toast({
        title: "Error",
        description: "OpenAI API key cannot be empty",
        variant: "destructive",
      });
      return;
    }

    if (enableWebSearch && !exaKey.trim()) {
      toast({
        title: "Error",
        description: "Exa.ai API key is required for web search",
        variant: "destructive",
      });
      return;
    }

    localStorage.setItem('openai_api_key', apiKey.trim());
    localStorage.setItem('openai_model', selectedModel);
    localStorage.setItem('exa_api_key', exaKey.trim());
    localStorage.setItem('enable_web_search', enableWebSearch.toString());
    
    setIsOpen(false);
    toast({
      title: "Success",
      description: "Settings saved successfully",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <SettingsIcon className="h-5 w-5" />
          <span>Settings</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">OpenAI API Key</label>
            <Input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-..."
            />
            <p className="text-xs text-gray-500">
              Your API key will be stored locally in your browser
            </p>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Model</label>
            <Select value={selectedModel} onValueChange={setSelectedModel}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MODEL_OPTIONS.map((model) => (
                  <SelectItem key={model.value} value={model.value}>
                    {model.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Enable Web Search</label>
              <Switch
                checked={enableWebSearch}
                onCheckedChange={setEnableWebSearch}
              />
            </div>
            <p className="text-xs text-gray-500">
              Allow the assistant to search the web for additional context, this will increase search latency but for greater goods
            </p>
          </div>

          {enableWebSearch && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Exa.ai API Key</label>
              <Input
                type="password"
                value={exaKey}
                onChange={(e) => setExaKey(e.target.value)}
                placeholder="..."
              />
              <p className="text-xs text-gray-500">
                Required for web search functionality
              </p>
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 