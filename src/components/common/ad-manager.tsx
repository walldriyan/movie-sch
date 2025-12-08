'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Film, Edit, ExternalLink, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { saveAdConfig, type AdConfig } from '@/lib/actions/ads';
import { useToast } from "@/hooks/use-toast"

interface AdManagerProps {
    initialConfig: AdConfig;
    userRole?: string;
}

export default function AdManager({ initialConfig, userRole }: AdManagerProps) {
    const [config, setConfig] = useState<AdConfig>(initialConfig);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [tempConfig, setTempConfig] = useState<AdConfig>(initialConfig);
    const router = useRouter();
    const { toast } = useToast()

    const isSuperAdmin = userRole === 'SUPER_ADMIN';

    const handleSave = async () => {
        setIsLoading(true);
        try {
            await saveAdConfig(tempConfig);
            setConfig(tempConfig);
            setIsOpen(false);
            toast({
                title: "Ad configuration saved",
                description: "The advertisement settings have been updated globally.",
            })
            router.refresh(); // Refresh to update any server-side nuances if needed
        } catch (error) {
            toast({
                title: "Failed to save configuration",
                description: "Please try again later.",
                variant: "destructive",
            })
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleEditClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setTempConfig(config);
        setIsOpen(true);
    };

    // If disabled and not admin, show nothing? Or show placeholder?
    // User said "alluser lata add visible wenna one", implies enabled.
    // If not enabled and not admin, maybe hide it? 
    if (!config.enabled && !isSuperAdmin) {
        return null;
    }

    return (
        <>
            <div className={cn(
                "group relative h-full w-full rounded-2xl bg-muted/30 overflow-hidden flex flex-col items-center justify-center text-center p-6 transition-all",
                // Add specific height full to match parent flex stretch
            )}>
                {/* Content */}
                {config.imageUrl ? (
                    <a
                        href={config.linkUrl || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="relative w-full h-full flex items-center justify-center"
                        onClick={(e) => {
                            // If user is admin and clicks specifically to edit? 
                            // Actually user said "mouse move krama... popup model one".
                            // Let's rely on the edit button overlay for editing.
                        }}
                    >
                        <div className="relative w-full h-full min-h-[200px]">
                            <Image
                                src={config.imageUrl}
                                alt="Advertisement"
                                fill
                                className="object-contain rounded-xl"
                            />
                        </div>
                    </a>
                ) : (
                    // Placeholder State
                    <div className="flex flex-col items-center justify-center text-center">
                        <span className="text-muted-foreground/50 text-xs font-bold uppercase tracking-widest mb-4">Advertisement</span>
                        <div className="w-full aspect-[3/4] max-w-[200px] bg-gradient-to-br from-white/5 to-transparent rounded-xl flex items-center justify-center border border-white/5 mb-4 group-hover:border-primary/30 transition-colors">
                            <div className="text-center">
                                <Film className="w-8 h-8 text-white/20 mx-auto mb-2" />
                                <span className="text-xs text-muted-foreground/40 font-medium">Ad Space</span>
                            </div>
                        </div>
                        <p className="text-[10px] text-muted-foreground/30 max-w-[200px]">
                            {config.enabled ? "Support our platform by viewing our sponsors." : "Ad space currently disabled."}
                        </p>
                    </div>
                )}

                {/* Super Admin Edit Overlay */}
                {isSuperAdmin && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3 z-20">
                        <Button
                            variant="default"
                            size="sm"
                            onClick={handleEditClick}
                            className="bg-white text-black hover:bg-white/90 font-bold"
                        >
                            <Edit className="w-4 h-4 mr-2" />
                            Manage Ad
                        </Button>
                    </div>
                )}
            </div>

            {/* Edit Dialog */}
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="sm:max-w-md bg-zinc-950 border-white/10 text-white">
                    <DialogHeader>
                        <DialogTitle>Manage Advertisement</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6 py-4">
                        <div className="flex items-center justify-between space-x-2 bg-white/5 p-4 rounded-lg">
                            <Label htmlFor="ad-active" className="flex flex-col space-y-1">
                                <span>Active Status</span>
                                <span className="font-normal text-xs text-muted-foreground">Toggle ad visibility for all users</span>
                            </Label>
                            <Switch
                                id="ad-active"
                                checked={tempConfig.enabled}
                                onCheckedChange={(checked) => setTempConfig({ ...tempConfig, enabled: checked })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="image-url">Image URL</Label>
                            <Input
                                id="image-url"
                                placeholder="https://example.com/banner.jpg"
                                value={tempConfig.imageUrl}
                                onChange={(e) => setTempConfig({ ...tempConfig, imageUrl: e.target.value })}
                                className="bg-white/5 border-white/10"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="link-url">Target Link URL</Label>
                            <Input
                                id="link-url"
                                placeholder="https://sponsor-site.com"
                                value={tempConfig.linkUrl}
                                onChange={(e) => setTempConfig({ ...tempConfig, linkUrl: e.target.value })}
                                className="bg-white/5 border-white/10"
                            />
                        </div>

                        <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-200 text-xs">
                            <p>Note: This advertisement will appear on all unified watch pages (movies and series).</p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsOpen(false)} className="hover:bg-white/10 hover:text-white">Cancel</Button>
                        <Button onClick={handleSave} disabled={isLoading} className="bg-white text-black hover:bg-white/90">
                            {isLoading ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
