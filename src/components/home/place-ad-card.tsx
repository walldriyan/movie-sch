'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Megaphone, Plus, Sparkles } from 'lucide-react';
import { submitAd } from '@/lib/actions/ads';
import { cn } from '@/lib/utils'; // Assuming utils exists

export function PlaceAdCard({ className }: { className?: string }) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <div
                className={cn(
                    "relative overflow-hidden cursor-pointer group border border-dashed border-white/20 bg-white/[0.02] hover:bg-white/[0.05] hover:border-primary/50 transition-all duration-300 h-full flex flex-col items-center justify-center text-center p-6 rounded-xl min-h-[300px]",
                    className
                )}
                onClick={() => setIsOpen(true)}
            >
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 border border-primary/20">
                    <Megaphone className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Promote Your Content</h3>
                <p className="text-sm text-muted-foreground mb-6 max-w-[200px]">
                    Reach thousands of users by placing your ad here.
                </p>
                <Button variant="outline" className="rounded-full border-primary/30 hover:bg-primary hover:text-white group-hover:border-primary">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Ad
                </Button>
            </div>

            <AdSubmissionDialog open={isOpen} onOpenChange={setIsOpen} />
        </>
    );
}

function AdSubmissionDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        link: '',
        imageUrl: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const res = await submitAd(formData);
            if (res.success) {
                toast({
                    title: "Ad Submitted!",
                    description: "Your ad has been submitted for approval.",
                });
                onOpenChange(false);
                setFormData({ title: '', description: '', link: '', imageUrl: '' });
            } else {
                toast({
                    title: "Submission Failed",
                    description: res.error || "Something went wrong.",
                    variant: "destructive"
                });
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to connect to server.",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px] bg-[#1a1a1a] border-white/10 text-white">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-primary" />
                        Create Advertisement
                    </DialogTitle>
                    <DialogDescription className="text-white/60">
                        Fill in the details for your ad. It will be reviewed by an admin before going live.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="title">Title</Label>
                        <Input
                            id="title"
                            value={formData.title}
                            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                            placeholder="Ad Headline"
                            className="bg-white/5 border-white/10"
                            required
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="desc">Description</Label>
                        <Textarea
                            id="desc"
                            value={formData.description}
                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Short description..."
                            className="bg-white/5 border-white/10 resize-none"
                            rows={3}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="link">Target URL</Label>
                        <Input
                            id="link"
                            type="url"
                            value={formData.link}
                            onChange={(e) => setFormData(prev => ({ ...prev, link: e.target.value }))}
                            placeholder="https://example.com"
                            className="bg-white/5 border-white/10"
                            required
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="image">Image URL</Label>
                        <Input
                            id="image"
                            type="url"
                            value={formData.imageUrl}
                            onChange={(e) => setFormData(prev => ({ ...prev, imageUrl: e.target.value }))}
                            placeholder="https://example.com/image.jpg"
                            className="bg-white/5 border-white/10"
                            required
                        />
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={isLoading} className="w-full">
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Submit for Review
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
