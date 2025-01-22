'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { api } from '@/api';
import { useToast } from '@/hooks/use-toast';

export default function NewChat() {
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const createChat = async () => {
      try {
        const { id } = await api.createChat(`Chat ${new Date().toLocaleString()}`);
        router.push(`/chat/${id}`);
      } catch (error) {
        console.error('Failed to create chat:', error);
        toast({
          title: "Error",
          description: "Failed to create new chat",
          variant: "destructive",
        });
        router.push('/');
      }
    };

    createChat();
  }, [router, toast]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-pulse">Creating new chat...</div>
    </div>
  );
} 