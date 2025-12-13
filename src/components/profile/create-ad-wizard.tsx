'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Slider } from "@/components/ui/slider"
import { ChevronRight, ChevronLeft, Upload, CheckCircle2, DollarSign, Wallet, Loader2, AlertCircle, ShoppingCart } from 'lucide-react';
import { getUserAdCreationConfig, submitAdWithPackage } from '@/lib/actions/ads';
import { uploadAdImage } from '@/lib/actions/upload-ad-image';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface SetupConfig {
    balance: number;
    packages: any[];
}

interface CreateAdWizardProps {
    onCancel: () => void;
    onSuccess: () => void;
}

export default function CreateAdWizard({ onCancel, onSuccess }: CreateAdWizardProps) {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [config, setConfig] = useState<SetupConfig | null>(null);
    const { toast } = useToast();
    const router = useRouter();

    // Form Data
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        imageUrl: '',
        link: '',
    });

    // Package Selection
    const [selectedPkgId, setSelectedPkgId] = useState<string>('');
    const [days, setDays] = useState<number>(3);
    const [uploadingImage, setUploadingImage] = useState(false);

    useEffect(() => {
        getUserAdCreationConfig().then(res => {
            if (res) {
                setConfig(res);
                if (res.packages.length > 0) {
                    setSelectedPkgId(res.packages[0].id);
                    setDays(Math.max(res.packages[0].minDays, 3));
                }
            }
        });
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingImage(true);
        const data = new FormData();
        data.append('file', file);

        try {
            const res = await uploadAdImage(data);
            if (res.success && res.url) {
                setFormData(prev => ({ ...prev, imageUrl: res.url }));
                toast({ title: "Image Uploaded", description: "Image successfully uploaded." });
            } else {
                toast({ title: "Upload Failed", description: res.error as string, variant: "destructive" });
            }
        } catch (error) {
            toast({ title: "Error", description: "Upload failed.", variant: "destructive" });
        } finally {
            setUploadingImage(false);
        }
    };

    const handleSubmit = async () => {
        if (!selectedPkgId) return;

        setLoading(true);
        try {
            const res = await submitAdWithPackage({
                ...formData,
                packageId: selectedPkgId,
                days
            });

            if (res.success) {
                toast({ title: "Success!", description: "Ad submitted successfully." });
                router.refresh();
                onSuccess();
            } else {
                toast({ title: "Submission Failed", description: res.error as string, variant: "destructive" });
            }
        } catch (error) {
            toast({ title: "Error", description: "Something went wrong.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const nextStep = () => {
        if (step === 1) {
            if (!formData.title || !formData.imageUrl || !formData.link) {
                toast({ title: "Missing details", description: "Please fill out all required fields.", variant: "destructive" });
                return;
            }
        }
        setStep(prev => prev + 1);
    };

    const prevStep = () => setStep(prev => prev - 1);

    const checkBalance = () => {
        if (!config || !selectedPkgId) return { sufficient: false, cost: 0, remaining: 0 };
        const pkg = config.packages.find(p => p.id === selectedPkgId);
        if (!pkg) return { sufficient: false, cost: 0, remaining: 0 };

        const cost = pkg.pricePerDay * days;
        return {
            sufficient: config.balance >= cost,
            cost,
            remaining: config.balance - cost
        };
    };

    const calculation = checkBalance();
    const selectedPkg = config?.packages.find(p => p.id === selectedPkgId);

    return (
        <Card className="bg-[#1a1a1a] border-white/10 overflow-hidden relative">
            {/* Simple Header */}
            <div className="p-6 border-b border-white/5 space-y-1">
                <h2 className="text-xl font-bold text-white">Ad Campaign Wizard</h2>
                <div className="flex gap-2 text-xs">
                    <span className={cn("px-2 py-0.5 rounded-full transition-colors", step >= 1 ? "bg-purple-500/20 text-purple-300" : "bg-white/5 text-white/30")}>1. Details</span>
                    <span className={cn("px-2 py-0.5 rounded-full transition-colors", step >= 2 ? "bg-purple-500/20 text-purple-300" : "bg-white/5 text-white/30")}>2. Budget & Duration</span>
                </div>
            </div>

            <div className="p-6 md:p-8 min-h-[400px]">
                {step === 1 && (
                    <div className="grid gap-6 md:grid-cols-2 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-white">Headline <span className="text-red-400">*</span></Label>
                                <Input
                                    name="title"
                                    value={formData.title}
                                    onChange={handleInputChange}
                                    className="bg-white/5 border-white/10 focus:border-purple-500/50"
                                    placeholder="Enter ad title"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-white">Description</Label>
                                <Textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    className="bg-white/5 border-white/10 focus:border-purple-500/50 min-h-[100px]"
                                    placeholder="Ad details..."
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-white">Target URL <span className="text-red-400">*</span></Label>
                                <Input
                                    name="link"
                                    value={formData.link}
                                    onChange={handleInputChange}
                                    className="bg-white/5 border-white/10 focus:border-purple-500/50"
                                    placeholder="https://..."
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <Label className="text-white">Ad Creative <span className="text-red-400">*</span></Label>
                            <div className="aspect-video bg-black/40 rounded-xl border border-dashed border-white/20 flex flex-col items-center justify-center relative overflow-hidden group">
                                {formData.imageUrl ? (
                                    <>
                                        <Image src={formData.imageUrl} alt="Preview" fill className="object-cover" />
                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <Button variant="outline" className="text-xs" onClick={() => setFormData(p => ({ ...p, imageUrl: '' }))}>Change Image</Button>
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-center p-4">
                                        <Button
                                            disabled={uploadingImage}
                                            className="relative"
                                            variant="secondary"
                                        >
                                            {uploadingImage ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
                                            Upload Image
                                            <input type="file" onChange={handleImageUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                                        </Button>
                                        <p className="text-white/30 text-xs mt-2">1200x628 Recommended</p>
                                    </div>
                                )}
                            </div>

                            {/* Preview Card */}
                            {formData.title && (
                                <div className="bg-[#111] p-3 rounded-lg border border-white/5">
                                    <div className="flex gap-3">
                                        <div className="w-16 h-16 bg-white/10 rounded-md overflow-hidden relative flex-shrink-0">
                                            {formData.imageUrl && <Image src={formData.imageUrl} alt="T" fill className="object-cover" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-white font-medium text-sm truncate">{formData.title}</p>
                                            <p className="text-white/50 text-xs truncate">{formData.description || 'No description'}</p>
                                            <p className="text-purple-400 text-[10px] mt-1">SPONSORED</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {step === 2 && config && (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="grid gap-8 md:grid-cols-[1fr,300px]">
                            <div className="space-y-8">
                                {/* Packages */}
                                <div>
                                    <Label className="text-white mb-4 block">Select Ad Type</Label>
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        {config.packages.map((pkg) => (
                                            <div
                                                key={pkg.id}
                                                onClick={() => {
                                                    setSelectedPkgId(pkg.id);
                                                    setDays(Math.max(days, pkg.minDays));
                                                }}
                                                className={cn(
                                                    "p-4 rounded-xl border cursor-pointer transition-all relative",
                                                    selectedPkgId === pkg.id
                                                        ? "bg-purple-500/10 border-purple-500 ring-1 ring-purple-500"
                                                        : "bg-white/5 border-white/10 hover:border-white/20"
                                                )}
                                            >
                                                {selectedPkgId === pkg.id && (
                                                    <div className="absolute top-2 right-2 text-purple-400">
                                                        <CheckCircle2 className="w-5 h-5 fill-purple-500/20" />
                                                    </div>
                                                )}
                                                <h3 className="text-white font-bold">{pkg.name}</h3>
                                                <p className="text-white/60 text-sm mt-1">{pkg.description}</p>
                                                <div className="mt-4 flex items-baseline gap-1 text-purple-300">
                                                    <span className="text-lg font-bold">LKR {pkg.pricePerDay}</span>
                                                    <span className="text-xs">/Day</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Duration Slider */}
                                {selectedPkg && (
                                    <div className="bg-white/5 p-6 rounded-xl border border-white/10 space-y-6">
                                        <div className="flex justify-between items-center">
                                            <Label className="text-white">Duration</Label>
                                            <div className="flex items-center gap-2 bg-black/40 px-3 py-1 rounded-lg border border-white/10">
                                                <span className="text-xl font-bold text-white font-mono">{days}</span>
                                                <span className="text-xs text-white/40">DAYS</span>
                                            </div>
                                        </div>

                                        <Slider
                                            value={[days]}
                                            onValueChange={(v) => setDays(v[0])}
                                            min={selectedPkg.minDays}
                                            max={selectedPkg.maxDays}
                                            step={1}
                                            className="cursor-pointer"
                                        />

                                        <div className="flex justify-between text-xs text-white/40">
                                            <span>Min: {selectedPkg.minDays} Days</span>
                                            <span>Max: {selectedPkg.maxDays} Days</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Summary & Checkout */}
                            <div className="space-y-6">
                                <Card className="p-6 bg-black/40 border-white/10 space-y-6">
                                    <h3 className="text-white font-semibold flex items-center gap-2">
                                        <ShoppingCart className="w-4 h-4" /> Order Summary
                                    </h3>

                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between text-white/60">
                                            <span>Price per day</span>
                                            <span>{selectedPkg?.pricePerDay} LKR</span>
                                        </div>
                                        <div className="flex justify-between text-white/60">
                                            <span>Duration</span>
                                            <span>{days} Days</span>
                                        </div>
                                        <div className="h-px bg-white/10 my-2" />
                                        <div className="flex justify-between text-white font-bold text-lg">
                                            <span>Total Cost</span>
                                            <span>{calculation.cost.toLocaleString()} LKR</span>
                                        </div>
                                    </div>

                                    <div className={cn("rounded-lg p-3 text-sm flex items-start gap-3", calculation.sufficient ? "bg-green-500/10 text-green-300" : "bg-red-500/10 text-red-300")}>
                                        <Wallet className="w-5 h-5 shrink-0 mt-0.5" />
                                        <div>
                                            <p className="font-semibold">Wallet Balance: {config.balance.toLocaleString()} LKR</p>
                                            {!calculation.sufficient && (
                                                <p className="text-xs opacity-80 mt-1">Insufficient funds. Need {Math.abs(calculation.remaining).toLocaleString()} LKR more.</p>
                                            )}
                                            {calculation.sufficient && (
                                                <p className="text-xs opacity-80 mt-1">Balance after: {calculation.remaining.toLocaleString()} LKR</p>
                                            )}
                                        </div>
                                    </div>

                                    <Button
                                        onClick={handleSubmit}
                                        disabled={loading || !calculation.sufficient}
                                        className={cn("w-full", calculation.sufficient ? "bg-purple-600 hover:bg-purple-700" : "bg-white/10 hover:bg-white/10 text-white/40 cursor-not-allowed")}
                                    >
                                        {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                        {calculation.sufficient ? 'Pay & Create Ad' : 'Insufficient Balance'}
                                    </Button>

                                    {!calculation.sufficient && (
                                        <p className="text-xs text-center text-white/40">
                                            Please request ad credits from Admin to proceed.
                                        </p>
                                    )}
                                </Card>
                            </div>
                        </div>
                    </div>
                )}

                {/* Empty State / Loading */}
                {step === 2 && !config && (
                    <div className="flex flex-col items-center justify-center py-12 text-white/40">
                        <Loader2 className="w-8 h-8 animate-spin mb-4" />
                        <p>Loading configurations...</p>
                    </div>
                )}
            </div>

            {/* Footer */}
            {step === 1 && (
                <div className="p-6 border-t border-white/5 flex justify-between">
                    <Button variant="ghost" onClick={onCancel} className="text-white/60">Cancel</Button>
                    <Button onClick={nextStep} className="bg-white text-black hover:bg-white/90">
                        Next Step <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                </div>
            )}

            {step === 2 && (
                <div className="p-6 border-t border-white/5 flex justify-start">
                    <Button variant="ghost" onClick={prevStep} className="text-white/60">
                        <ChevronLeft className="w-4 h-4 mr-2" /> Back
                    </Button>
                </div>
            )}
        </Card>
    );
}
