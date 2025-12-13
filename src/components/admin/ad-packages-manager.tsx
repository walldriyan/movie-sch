'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { getAllAdPackagesInternal, createAdPackage, updateAdPackage, deleteAdPackage } from '@/lib/actions/ad-packages';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, Pencil, Trash2, X, Save } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from '@/components/ui/badge';

interface AdPackage {
    id: string;
    name: string;
    description: string | null;
    pricePerDay: number;
    minDays: number;
    maxDays: number;
    isActive: boolean;
}

export function AdPackagesManager() {
    const [packages, setPackages] = useState<AdPackage[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();
    const [isEditing, setIsEditing] = useState<AdPackage | null>(null);
    const [isCreating, setIsCreating] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        pricePerDay: '100',
        minDays: '1',
        maxDays: '30',
        isActive: true
    });

    const fetchPackages = useCallback(async (isMounted: boolean = true) => {
        setLoading(true);
        try {
            const res = await getAllAdPackagesInternal();
            if (isMounted) {
                setPackages(res);
            }
        } catch (error) {
            if (isMounted) {
                toast({ title: "Error", description: "Failed to load packages", variant: "destructive" });
            }
        } finally {
            if (isMounted) {
                setLoading(false);
            }
        }
    }, [toast]);

    useEffect(() => {
        let isMounted = true;
        fetchPackages(isMounted);
        return () => { isMounted = false; };
    }, [fetchPackages]);

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            pricePerDay: '100',
            minDays: '1',
            maxDays: '30',
            isActive: true
        });
        setIsEditing(null);
        setIsCreating(false);
    };

    const handleSave = async () => {
        if (!formData.name || !formData.pricePerDay) {
            toast({ title: "Validation Error", description: "Name and Price are required.", variant: "destructive" });
            return;
        }

        const payload = {
            name: formData.name,
            description: formData.description,
            pricePerDay: parseFloat(formData.pricePerDay),
            minDays: parseInt(formData.minDays),
            maxDays: parseInt(formData.maxDays),
            isActive: formData.isActive
        };

        try {
            if (isEditing) {
                await updateAdPackage(isEditing.id, payload);
                toast({ title: "Updated", description: "Package updated successfully." });
            } else {
                await createAdPackage(payload);
                toast({ title: "Created", description: "Package created successfully." });
            }
            await fetchPackages();
            resetForm();
        } catch (error) {
            toast({ title: "Error", description: "Operation failed.", variant: "destructive" });
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure?")) return;
        try {
            await deleteAdPackage(id);
            toast({ title: "Deleted", description: "Package deleted." });
            fetchPackages();
        } catch (e) {
            toast({ title: "Error", description: "Failed to delete.", variant: "destructive" });
        }
    };

    const openEdit = (pkg: AdPackage) => {
        setFormData({
            name: pkg.name,
            description: pkg.description || '',
            pricePerDay: String(pkg.pricePerDay),
            minDays: String(pkg.minDays),
            maxDays: String(pkg.maxDays),
            isActive: pkg.isActive
        });
        setIsEditing(pkg);
        setIsCreating(true);
    };

    return (
        <Card className="bg-black/20 border-white/5">
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Ad Packages</CardTitle>
                    <CardDescription>Configure pricing models for user ads.</CardDescription>
                </div>
                <Button onClick={() => { resetForm(); setIsCreating(true); }} size="sm" className="bg-purple-600 hover:bg-purple-700">
                    <Plus className="w-4 h-4 mr-2" /> New Package
                </Button>
            </CardHeader>
            <CardContent>
                {/* Form Dialog */}
                <Dialog open={isCreating} onOpenChange={(v) => !v && resetForm()}>
                    <DialogContent className="bg-[#1a1a1a] border-white/10 text-white">
                        <DialogHeader>
                            <DialogTitle>{isEditing ? 'Edit Package' : 'Create Package'}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Package Name</Label>
                                <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="bg-white/5 border-white/10" placeholder="e.g., Gold Banner" />
                            </div>
                            <div className="space-y-2">
                                <Label>Description</Label>
                                <Input value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="bg-white/5 border-white/10" placeholder="Short description" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Price Per Day (LKR)</Label>
                                    <Input type="number" value={formData.pricePerDay} onChange={e => setFormData({ ...formData, pricePerDay: e.target.value })} className="bg-white/5 border-white/10" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Active Status</Label>
                                    <div className="flex items-center h-10">
                                        <Switch checked={formData.isActive} onCheckedChange={c => setFormData({ ...formData, isActive: c })} />
                                        <span className="ml-2 text-sm text-white/60">{formData.isActive ? 'Active' : 'Draft'}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Min Days</Label>
                                    <Input type="number" value={formData.minDays} onChange={e => setFormData({ ...formData, minDays: e.target.value })} className="bg-white/5 border-white/10" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Max Days</Label>
                                    <Input type="number" value={formData.maxDays} onChange={e => setFormData({ ...formData, maxDays: e.target.value })} className="bg-white/5 border-white/10" />
                                </div>
                            </div>
                            <Button onClick={handleSave} className="w-full bg-purple-600 hover:bg-purple-700 mt-4">
                                <Save className="w-4 h-4 mr-2" /> Save Package
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>

                {loading ? (
                    <div className="flex justify-center py-4"><Loader2 className="animate-spin" /></div>
                ) : (
                    <div className="space-y-3">
                        {packages.length === 0 && <p className="text-white/40 text-sm text-center py-4">No packages defined.</p>}
                        {packages.map(pkg => (
                            <div key={pkg.id} className="flex items-center justify-between p-4 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-colors">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h4 className="font-bold text-white">{pkg.name}</h4>
                                        {pkg.isActive ? <Badge className="bg-green-500/20 text-green-400 border-0 text-[10px]">Active</Badge> : <Badge variant="secondary" className="text-[10px]">Inactive</Badge>}
                                    </div>
                                    <p className="text-sm text-white/60">{pkg.description} • <span className="text-purple-400 font-mono">{pkg.pricePerDay} LKR/Day</span></p>
                                    <p className="text-xs text-white/30 mt-1">Duration: {pkg.minDays} - {pkg.maxDays} days</p>
                                </div>
                                <div className="flex gap-2">
                                    <Button size="icon" variant="ghost" onClick={() => openEdit(pkg)}><Pencil className="w-4 h-4" /></Button>
                                    <Button size="icon" variant="ghost" className="text-red-400 hover:text-red-300" onClick={() => handleDelete(pkg.id)}><Trash2 className="w-4 h-4" /></Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
