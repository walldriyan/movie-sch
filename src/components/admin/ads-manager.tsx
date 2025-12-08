'use client';

import { useState, useTransition } from 'react';
import Image from 'next/image';
import { updateAdsConfig, type AdUnit } from '@/lib/actions/ads';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Loader2, Plus, Trash2, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AdsManagerProps {
    initialAds: AdUnit[];
}

export default function AdsManagerInternal({ initialAds }: AdsManagerProps) {
    const [ads, setAds] = useState<AdUnit[]>(initialAds);
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();

    const handleUpdate = (id: string, field: keyof AdUnit, value: any) => {
        setAds(prev => prev.map(ad => ad.id === id ? { ...ad, [field]: value } : ad));
    };

    const handleSave = () => {
        startTransition(async () => {
            try {
                await updateAdsConfig(ads);
                toast({
                    title: 'Ads Updated',
                    description: 'Advertisement settings have been saved.',
                });
            } catch (error) {
                toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: 'Failed to save settings.',
                });
            }
        });
    };

    const addNewSlot = () => {
        const newId = `custom_slot_${Date.now()}`;
        setAds([...ads, {
            id: newId,
            name: 'New Ad Slot',
            imageUrl: '',
            linkUrl: '',
            width: 300,
            height: 250,
            active: false
        }]);
    };

    const removeSlot = (id: string) => {
        setAds(prev => prev.filter(ad => ad.id !== id));
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-medium">Advertisement Management</h3>
                    <p className="text-sm text-muted-foreground">Manage ad slots, images, and links across the site.</p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={addNewSlot} variant="outline" size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Slot
                    </Button>
                    <Button onClick={handleSave} disabled={isPending}>
                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                    </Button>
                </div>
            </div>

            <div className="grid gap-4">
                {ads.map((ad, index) => (
                    <Card key={ad.id} className="overflow-hidden">
                        <CardHeader className="p-4 bg-muted/50 pb-2">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Switch
                                        checked={ad.active}
                                        onCheckedChange={(checked) => handleUpdate(ad.id, 'active', checked)}
                                    />
                                    <CardTitle className="text-base">
                                        {ad.name} <span className="text-xs text-muted-foreground font-mono ml-2">({ad.id})</span>
                                    </CardTitle>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                    onClick={() => removeSlot(ad.id)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-4 pt-4 grid md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div className="grid gap-2">
                                    <Label>Slot Name</Label>
                                    <Input
                                        value={ad.name}
                                        onChange={(e) => handleUpdate(ad.id, 'name', e.target.value)}
                                        placeholder="e.g. Home Page Banner"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Image URL</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            value={ad.imageUrl}
                                            onChange={(e) => handleUpdate(ad.id, 'imageUrl', e.target.value)}
                                            placeholder="https://example.com/ad-image.jpg"
                                            className="font-mono text-xs"
                                        />
                                    </div>
                                    <p className="text-[10px] text-muted-foreground">Paste the direct link to your ad image here.</p>
                                </div>
                                <div className="grid gap-2">
                                    <Label>Destination Link</Label>
                                    <Input
                                        value={ad.linkUrl}
                                        onChange={(e) => handleUpdate(ad.id, 'linkUrl', e.target.value)}
                                        placeholder="https://target-site.com"
                                        className="font-mono text-xs"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label>Width (px)</Label>
                                        <Input
                                            type="number"
                                            value={ad.width}
                                            onChange={(e) => handleUpdate(ad.id, 'width', parseInt(e.target.value) || 0)}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Height (px)</Label>
                                        <Input
                                            type="number"
                                            value={ad.height}
                                            onChange={(e) => handleUpdate(ad.id, 'height', parseInt(e.target.value) || 0)}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col items-center justify-center border rounded-lg bg-muted/20 min-h-[200px] p-4">
                                {ad.imageUrl ? (
                                    <div className="relative group overflow-hidden rounded border bg-background" style={{ maxWidth: '100%', maxHeight: '300px' }}>
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={ad.imageUrl}
                                            alt="Preview"
                                            className="max-w-full h-auto object-contain"
                                            style={{ maxHeight: '250px' }}
                                        />
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity p-2 text-center">
                                            <p className="text-white text-xs">Preview<br />{ad.width}x{ad.height}</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center text-muted-foreground text-sm">
                                        <div className="w-16 h-16 rounded bg-muted mx-auto mb-2 flex items-center justify-center">
                                            <span className="text-2xl">IMG</span>
                                        </div>
                                        No Image URL Set
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
