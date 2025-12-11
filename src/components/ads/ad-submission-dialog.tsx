'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Sparkles, UploadCloud, CheckCircle2, Lock, Smartphone } from 'lucide-react';
import { submitAd, verifyPaymentCode } from '@/lib/actions/ads';
import { uploadAdImage } from '@/lib/actions/upload-ad-image';
import Image from 'next/image';

export function AdSubmissionDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
    const { data: session } = useSession();
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    // Form Data
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        link: '',
        imageUrl: ''
    });
    const [paymentCode, setPaymentCode] = useState('');
    const [isVerified, setIsVerified] = useState(false);
    const [verificationError, setVerificationError] = useState('');
    const [uploadingImage, setUploadingImage] = useState(false);

    // Permissions check
    const userRole = session?.user?.role;
    const isPremiumOrAdmin = ['SUPER_ADMIN', 'USER_ADMIN', 'PREMIUM', 'PREMIUM_USER'].includes(userRole || '');

    // Reset state on open
    useEffect(() => {
        if (open) {
            setStep(isPremiumOrAdmin ? 2 : 1);
            setPaymentCode('');
            setIsVerified(false);
            setVerificationError('');
        }
    }, [open, isPremiumOrAdmin]);

    // Handle Payment Code Verification
    const handleVerify = async () => {
        if (!paymentCode) return;
        setIsLoading(true);
        setVerificationError('');

        try {
            const res = await verifyPaymentCode(paymentCode);
            if (res.success) {
                setIsVerified(true);
                toast({ title: "Code Verified", description: "You can now proceed to create your ad." });
                setStep(2);
            } else {
                setVerificationError(res.error || "Invalid Code");
            }
        } catch (error) {
            setVerificationError("Verification failed due to network error.");
        } finally {
            setIsLoading(false);
        }
    };

    // Handle Image Upload
    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingImage(true);
        const uploadFormData = new FormData();
        uploadFormData.append('file', file);

        try {
            const res = await uploadAdImage(uploadFormData);
            if (res.success && res.url) {
                setFormData(prev => ({ ...prev, imageUrl: res.url }));
                toast({ title: "Image Uploaded", description: "Image attached successfully." });
            } else {
                toast({ title: "Upload Failed", description: res.error as string, variant: "destructive" });
            }
        } catch (error) {
            toast({ title: "Upload Failed", description: "Network error occurred", variant: "destructive" });
        }
        setUploadingImage(false);
    };

    // Handle Final Submit
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            // Pass paymentCode if not premium
            const payload = {
                ...formData,
                paymentCode: isPremiumOrAdmin ? undefined : paymentCode
            };

            const res = await submitAd(payload);
            if (res.success) {
                toast({
                    title: "Ad Submitted!",
                    description: "Your ad has been submitted for approval.",
                });
                onOpenChange(false);
                setFormData({ title: '', description: '', link: '', imageUrl: '' });
                setPaymentCode('');
                setStep(1);
            } else {
                toast({
                    title: "Submission Failed",
                    description: res.error as string || "Something went wrong.",
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
            <DialogContent className="sm:max-w-[500px] bg-[#1a1a1a] border-white/10 text-white">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        {step === 1 ? <Lock className="w-5 h-5 text-primary" /> : <Sparkles className="w-5 h-5 text-primary" />}
                        {step === 1 ? "Payment Verification" : "Create Advertisement"}
                    </DialogTitle>
                    <DialogDescription className="text-white/60">
                        {step === 1
                            ? "Verify your eligibility to post an ad."
                            : "Fill in the details. Admin approval required."}
                    </DialogDescription>
                </DialogHeader>

                {step === 1 && (
                    <div className="space-y-6 py-4">
                        <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                            <h4 className="font-semibold text-white mb-2 ml-1">Requirements</h4>
                            <ul className="text-sm text-white/70 space-y-2 ml-1">
                                <li className="flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                                    Premium Members: Free Posting
                                </li>
                                <li className="flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-yellow-500" />
                                    Standard Users: Purchase Payment Code
                                </li>
                            </ul>
                        </div>

                        <div className="space-y-4">
                            <div className="bg-primary/10 p-4 rounded-xl border border-primary/20 flex flex-col gap-2">
                                <p className="text-sm font-medium text-white flex items-center gap-2">
                                    <Smartphone className="w-4 h-4" />
                                    Buy Code via WhatsApp
                                </p>
                                <p className="text-2xl font-bold text-primary tracking-wide">076 233 82 30</p>
                                <p className="text-xs text-white/50">Contact to purchase a code instantly.</p>
                            </div>

                            <div className="space-y-2">
                                <Label>Enter Payment Code</Label>
                                <div className="flex gap-2">
                                    <Input
                                        value={paymentCode}
                                        onChange={(e) => setPaymentCode(e.target.value)}
                                        placeholder="P-XXXX-XXXX"
                                        className="bg-white/5 border-white/10 tracking-widest uppercase"
                                    />
                                    <Button onClick={handleVerify} disabled={isLoading || !paymentCode}>
                                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify"}
                                    </Button>
                                </div>
                                {verificationError && (
                                    <p className="text-red-400 text-sm">{verificationError}</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <form onSubmit={handleSubmit} className="grid gap-4 py-4 animate-in fade-in slide-in-from-right-4 duration-300">
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
                            <Label>Ad Image</Label>
                            <div className="grid gap-2">
                                {formData.imageUrl ? (
                                    <div className="relative aspect-video rounded-lg overflow-hidden border border-white/10 group">
                                        <Image src={formData.imageUrl} alt="Preview" fill className="object-cover" />
                                        <button
                                            type="button"
                                            onClick={() => setFormData(p => ({ ...p, imageUrl: '' }))}
                                            className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <span className="text-xs font-semibold">Remove</span>
                                        </button>
                                    </div>
                                ) : (
                                    <label className="flex flex-col items-center justify-center gap-2 h-32 w-full border border-dashed border-white/20 rounded-lg cursor-pointer bg-white/5 hover:bg-white/10 transition-colors">
                                        <div className="p-2 bg-white/5 rounded-full">
                                            {uploadingImage ? <Loader2 className="w-5 h-5 animate-spin" /> : <UploadCloud className="w-5 h-5 text-muted-foreground" />}
                                        </div>
                                        <span className="text-xs text-muted-foreground">Click to upload image</span>
                                        <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} disabled={uploadingImage} />
                                    </label>
                                )}
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="link">Target Link</Label>
                            <Input
                                id="link"
                                value={formData.link}
                                onChange={(e) => setFormData(prev => ({ ...prev, link: e.target.value }))}
                                placeholder="https://example.com"
                                className="bg-white/5 border-white/10"
                            />
                        </div>

                        <DialogFooter className="pt-4">
                            <Button type="button" variant="ghost" onClick={() => setStep(1)} className="mr-auto">
                                Back
                            </Button>
                            <Button type="submit" disabled={isLoading || !formData.imageUrl || !formData.title}>
                                {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Submit Ad"}
                            </Button>
                        </DialogFooter>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
}
