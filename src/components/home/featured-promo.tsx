'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import ReactPlayer from 'react-player/lazy';
import { Edit2, Save, Trash2, Video, Image as ImageIcon, Link as LinkIcon, AlertCircle, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { updatePromoData, PromoData } from '@/lib/actions/promo';
import { cn } from '@/lib/utils';
import type { User } from '@prisma/client';

interface FeaturedPromoProps {
    data: PromoData;
    currentUser: User | null;
}

export default function FeaturedPromo({ data, currentUser }: FeaturedPromoProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [isOpen, setIsOpen] = useState(false);
    const isAdmin = currentUser?.role === 'SUPER_ADMIN';

    // Form state
    const [formData, setFormData] = useState<PromoData>(data);

    // Update form when data prop changes
    const handleSubmit = async () => {
        startTransition(async () => {
            const res = await updatePromoData(formData);
            if (res.success) {
                toast.success("Promo section updated successfully");
                setIsOpen(false);
                router.refresh();
            } else {
                toast.error("Failed to update promo section");
            }
        });
    };

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to clear/reset this section?")) return;
        const emptyData: PromoData = {
            active: false,
            type: 'image',
            mediaUrl: '',
            title: '',
            description: '',
            linkUrl: ''
        };
        startTransition(async () => {
            const res = await updatePromoData(emptyData);
            if (res.success) {
                toast.success("Promo section cleared");
                setFormData(emptyData);
                router.refresh();
            }
        });
    };

    const isGradientFallback = !data.active || (!data.mediaUrl && !data.title);

    // If it's inactive and user is NOT admin, show nothing? 
    // User said: "default mokut set krala nattan... gradent wenna one e card eka"
    // And "eka alluser lata pennana one" (Show to all users)
    // So even if "inactive" in terms of data, we might show the gradient placeholder.
    // But usually "active: false" means hide. 
    // I will stick to: Always show. If no data, show gradient.

    return (
        <section className="container max-w-7xl mx-auto px-4 md:px-8 mb-12 relative group/promo">
            <div className={cn(
                "relative w-full rounded-3xl overflow-hidden shadow-2xl transition-all duration-500",
                "aspect-video md:aspect-[21/9] lg:aspect-[24/9] max-h-[500px]", // Aspect ratio as requested
                isGradientFallback ? "bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900" : "bg-[#0a0a0a]"
            )}>

                {/* Media Content */}
                {!isGradientFallback && (
                    <>
                        {data.type === 'video' ? (
                            <div className="absolute inset-0 w-full h-full">
                                <ReactPlayer
                                    url={data.mediaUrl}
                                    width="100%"
                                    height="100%"
                                    playing={true}
                                    muted={true}
                                    loop={true}
                                    controls={false}
                                    style={{ pointerEvents: 'none' }} // Prevent interaction with BG video
                                    config={{
                                        youtube: {
                                            playerVars: { showinfo: 0, controls: 0, modestbranding: 1 }
                                        }
                                    }}
                                />
                                <div className="absolute inset-0 bg-black/40 pointer-events-none" /> {/* Overlay */}
                            </div>
                        ) : (
                            <div className="relative w-full h-full">
                                {data.mediaUrl && (
                                    <Image
                                        src={data.mediaUrl}
                                        alt={data.title}
                                        fill
                                        className="object-cover"
                                    />
                                )}
                                <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
                            </div>
                        )}
                    </>
                )}

                {/* Content Overlay */}
                <div className="absolute inset-0 flex flex-col justify-center px-8 md:px-16 z-20 pointer-events-none">
                    <div className="max-w-3xl space-y-4 pointer-events-auto">
                        {data.title ? (
                            <h2 className="text-3xl md:text-5xl font-bold text-white drop-shadow-lg leading-tight">
                                {data.title}
                            </h2>
                        ) : (
                            isGradientFallback && <h2 className="text-3xl md:text-4xl font-bold text-white/50">Featured Content</h2>
                        )}

                        {data.description && (
                            <p className="text-lg md:text-xl text-white/90 drop-shadow-md max-w-2xl leading-relaxed">
                                {data.description}
                            </p>
                        )}

                        {data.linkUrl && (
                            <div className="pt-4">
                                <Button
                                    className="rounded-full bg-white text-black hover:bg-white/90 font-semibold px-8"
                                    onClick={() => window.open(data.linkUrl, '_blank')}
                                >
                                    Learn More
                                </Button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Edit Controls (Admin Only) */}
                {isAdmin && (
                    <div className="absolute top-4 right-4 z-50 opacity-0 group-hover/promo:opacity-100 transition-opacity duration-300 flex gap-2">
                        <Dialog open={isOpen} onOpenChange={setIsOpen}>
                            <DialogTrigger asChild>
                                <Button size="sm" variant="secondary" className="backdrop-blur-md bg-black/50 text-white hover:bg-black/70 border border-white/10">
                                    <Edit2 className="w-4 h-4 mr-2" />
                                    Edit Section
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl bg-[#0a0a0a] border-white/10 text-white">
                                <DialogHeader>
                                    <DialogTitle>Edit Featured Layout</DialogTitle>
                                    <DialogDescription>
                                        Configure the large featured section above the footer.
                                    </DialogDescription>
                                </DialogHeader>

                                {/* Settings Form */}
                                <div className="grid gap-6 py-4">
                                    <div className="flex items-center space-x-2">
                                        <Switch
                                            id="active"
                                            checked={formData.active}
                                            onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
                                        />
                                        <Label htmlFor="active">Show Content (If off, shows gradient)</Label>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <Label>Type</Label>
                                            <Select
                                                value={formData.type}
                                                onValueChange={(val: any) => setFormData({ ...formData, type: val })}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select type" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="video">Video (YouTube/Direct)</SelectItem>
                                                    <SelectItem value="image">Image</SelectItem>
                                                    {/* <SelectItem value="post">Post (Coming Soon)</SelectItem> */}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="grid gap-2">
                                            <Label>Media URL</Label>
                                            <Input
                                                value={formData.mediaUrl}
                                                onChange={(e) => setFormData({ ...formData, mediaUrl: e.target.value })}
                                                placeholder={formData.type === 'video' ? 'https://youtube.com/...' : 'https://image.url...'}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid gap-2">
                                        <Label>Title</Label>
                                        <Input
                                            value={formData.title}
                                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                            placeholder="Enter a catchy title"
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label>Description</Label>
                                        <Textarea
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            placeholder="Short description or message"
                                            rows={3}
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label>Call to Action Link (Optional)</Label>
                                        <Input
                                            value={formData.linkUrl || ''}
                                            onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
                                            placeholder="https://example.com"
                                        />
                                    </div>
                                </div>

                                <DialogFooter className="flex justify-between sm:justify-between items-center w-full">
                                    <Button variant="ghost" onClick={handleDelete} className="text-red-400 hover:text-red-300 hover:bg-red-900/20">
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Reset to Default
                                    </Button>
                                    <div className="flex gap-2">
                                        <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                                        <Button onClick={handleSubmit} disabled={isPending}>
                                            {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                            Save Changes
                                        </Button>
                                    </div>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                )}
            </div>
        </section>
    );
}
