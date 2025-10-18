
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { X, MessageSquare, Circle } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { ScrollArea } from './ui/scroll-area';
import { AnimatePresence, motion } from 'framer-motion';
import { PlaceHolderImages } from '@/lib/placeholder-images';

// Placeholder data
const onlineUsers = [
  { id: 1, name: 'John Doe', image: PlaceHolderImages.find(p => p.id === 'avatar-1')?.imageUrl },
  { id: 2, name: 'Jane Smith', image: PlaceHolderImages.find(p => p.id === 'avatar-2')?.imageUrl },
  { id: 3, name: 'Sam Wilson', image: PlaceHolderImages.find(p => p.id === 'avatar-3')?.imageUrl },
  { id: 4, name: 'Alice Johnson', image: PlaceHolderImages.find(p => p.id === 'avatar-4')?.imageUrl },
  { id: 5, name: 'Michael Brown', image: null },
  { id: 6, name: 'Emily Davis', image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop' },
  { id: 7, name: 'David Garcia', image: 'https://images.unsplash.com/photo-1552058544-f2b08422138a?w=400&h=400&fit=crop' },
  { id: 8, name: 'Maria Rodriguez', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop' },
  { id: 9, name: 'James Martinez', image: null },
  { id: 10, name: 'Linda Hernandez', image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=400&fit=crop' },
];

export default function OnlineUsersWidget() {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="widget-card"
            initial={{ opacity: 0, y: 50, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.9, transition: { duration: 0.2 } }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            <Card className="w-[300px] max-h-[500px] flex flex-col bg-background/80 backdrop-blur-lg border-primary/20 shadow-lg shadow-primary/10">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Online Now</CardTitle>
                  <CardDescription>{onlineUsers.length} users online</CardDescription>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="flex-grow overflow-hidden p-0">
                <ScrollArea className="h-full">
                  <div className="p-6 pt-0 space-y-4">
                    {onlineUsers.map((user) => (
                      <div key={user.id} className="flex items-center gap-3">
                        <Avatar className="relative h-9 w-9">
                          <AvatarImage src={user.image || ''} alt={user.name || ''} />
                          <AvatarFallback>{user.name?.charAt(0)}</AvatarFallback>
                          <Circle className="absolute bottom-0 right-0 h-3 w-3 fill-green-500 stroke-green-500 border-2 border-background" />
                        </Avatar>
                        <p className="font-medium text-sm">{user.name}</p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
      
      {!isOpen && (
        <Button
          className="rounded-full w-14 h-14 bg-primary/80 backdrop-blur-lg shadow-lg"
          onClick={() => setIsOpen(true)}
        >
          <MessageSquare className="h-6 w-6" />
        </Button>
      )}
    </div>
  );
}
