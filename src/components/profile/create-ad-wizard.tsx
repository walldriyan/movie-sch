'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { ChevronRight, ChevronLeft, Upload, CheckCircle2, CreditCard, LayoutTemplate, Loader2, AlertCircle } from 'lucide-react';
import { submitAd, verifyPaymentCode } from '@/lib/actions/ads';
import { uploadAdImage } from '@/lib/actions/upload-ad-image';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface CreateAdWizardProps {
    onCancel: () => void;
    onSuccess: () => void;
}

export default function CreateAdWizard({ onCancel, onSuccess }: CreateAdWizardProps) {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();
    const router = useRouter();

    // Form Data
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        imageUrl: '',
        link: '',
        paymentCode: ''
    });

    // Verification State
    const [isCodeVerified, setIsCodeVerified] = useState(false);
    const [paymentDetails, setPaymentDetails] = useState<any>(null);
    const [uploadingImage, setUploadingImage] = useState(false);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleVerifyCode = async () => {
        if (!formData.paymentCode) return;
        setLoading(true);
        try {
            const res = await verifyPaymentCode(formData.paymentCode);
            if (res.success) {
                setIsCodeVerified(true);
                setPaymentDetails(res.payment);
                toast({ title: "Code Verified", description: "Payment code is valid." });
            } else {
                setIsCodeVerified(false);
                setPaymentDetails(null);
                toast({ title: "Invalid Code", description: res.error as string, variant: "destructive" });
            }
        } catch (error) {
            toast({ title: "Error", description: "Verification failed.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
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
        if (!formData.title || !formData.imageUrl || !formData.link) {
            toast({ title: "Missing Fields", description: "Please fill in all required fields.", variant: "destructive" });
            return;
        }

        // Validate Step 2 if not skipped (assuming implementation requires code unless privileged, but we'll stick to basic flow)
        if (step === 2 && !isCodeVerified) {
            toast({ title: "Payment Required", description: "Please verify a valid payment code.", variant: "destructive" });
            return;
        }

        setLoading(true);
        try {
            const res = await submitAd({
                title: formData.title,
                description: formData.description,
                imageUrl: formData.imageUrl,
                link: formData.link,
                paymentCode: formData.paymentCode
            });

            if (res.success) {
                toast({ title: "Success!", description: "Your ad has been submitted for approval." });
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

    return (
        <Card className="bg-[#1a1a1a] border-white/10 overflow-hidden relative">
            {/* Progress Bar */}
            <div className="absolute top-0 left-0 w-full h-1 bg-white/5">
                <div
                    className="h-full bg-purple-500 transition-all duration-300"
                    style={{ width: `${(step / 3) * 100}%` }}
                />
            </div>

            <div className="p-6 md:p-8">
                {/* Header */}
                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-white mb-2">Create New Advertisement</h2>
                    <p className="text-white/60">Follow the steps to launch your campaign.</p>
                </div>

                {/* Steps */}
                <div className="flex items-center gap-4 mb-8 text-sm">
                    <div className={cn("flex items-center gap-2", step >= 1 ? "text-purple-400 font-bold" : "text-white/40")}>
                        <div className={cn("w-6 h-6 rounded-full flex items-center justify-center border", step >= 1 ? "border-purple-400 bg-purple-400/20" : "border-white/20")}>1</div>
                        Ad Details
                    </div>
                    <div className="h-[1px] w-8 bg-white/10" />
                    <div className={cn("flex items-center gap-2", step >= 2 ? "text-purple-400 font-bold" : "text-white/40")}>
                        <div className={cn("w-6 h-6 rounded-full flex items-center justify-center border", step >= 2 ? "border-purple-400 bg-purple-400/20" : "border-white/20")}>2</div>
                        Payment & Duration
                    </div>
                    <div className="h-[1px] w-8 bg-white/10" />
                    <div className={cn("flex items-center gap-2", step >= 3 ? "text-purple-400 font-bold" : "text-white/40")}>
                        <div className={cn("w-6 h-6 rounded-full flex items-center justify-center border", step >= 3 ? "border-purple-400 bg-purple-400/20" : "border-white/20")}>3</div>
                        Review
                    </div>
                </div>

                {/* Content */}
                <div className="min-h-[400px]">
                    {step === 1 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="grid gap-6 md:grid-cols-2">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label className="text-white">Headline <span className="text-red-400">*</span></Label>
                                        <Input
                                            name="title"
                                            placeholder="e.g. Best Coffee in Town"
                                            value={formData.title}
                                            onChange={handleInputChange}
                                            className="bg-white/5 border-white/10 focus:border-purple-500/50"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-white">Description</Label>
                                        <Textarea
                                            name="description"
                                            placeholder="Tell people about your product..."
                                            value={formData.description}
                                            onChange={handleInputChange}
                                            className="bg-white/5 border-white/10 focus:border-purple-500/50 min-h-[100px]"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-white">Target Link <span className="text-red-400">*</span></Label>
                                        <Input
                                            name="link"
                                            placeholder="https://yourwebsite.com"
                                            value={formData.link}
                                            onChange={handleInputChange}
                                            className="bg-white/5 border-white/10 focus:border-purple-500/50"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label className="text-white">Image URL <span className="text-red-400">*</span></Label>
                                        <div className="flex gap-2">
                                            <Input
                                                name="imageUrl"
                                                placeholder="https://... or upload"
                                                value={formData.imageUrl}
                                                onChange={handleInputChange}
                                                className="bg-white/5 border-white/10 focus:border-purple-500/50 flex-1"
                                            />
                                            <Button
                                                type="button"
                                                variant="outline"
                                                disabled={uploadingImage}
                                                className="bg-white/5 border-white/10 text-white hover:bg-white/10 relative overflow-hidden min-w-[44px]"
                                            >
                                                {uploadingImage ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <Upload className="w-4 h-4" />
                                                )}
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                                    onChange={handleImageUpload}
                                                    disabled={uploadingImage}
                                                />
                                            </Button>
                                        </div>
                                        <p className="text-xs text-white/40">Recommended size: 600x400 or larger.</p>
                                    </div>

                                    {/* Preview */}
                                    <div className="rounded-xl border border-dashed border-white/20 bg-black/20 overflow-hidden aspect-video flex items-center justify-center relative group">
                                        {formData.imageUrl ? (
                                            <>
                                                <Image
                                                    src={formData.imageUrl}
                                                    alt="Preview"
                                                    fill
                                                    className="object-cover"
                                                    onError={(e) => {
                                                        // Fallback handled by parent usually but here we just show error visual if broken
                                                        (e.target as HTMLImageElement).style.display = 'none';
                                                    }}
                                                />
                                                <div className="hidden group-hover:flex absolute inset-0 bg-black/50 items-center justify-center text-white">
                                                    Preview
                                                </div>
                                            </>
                                        ) : (
                                            <div className="flex flex-col items-center text-white/30">
                                                <LayoutTemplate className="w-8 h-8 mb-2" />
                                                <span className="text-sm">Image Preview</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300 max-w-xl mx-auto">
                            <Alert className="bg-purple-500/10 border-purple-500/20 mb-6">
                                <AlertCircle className="h-4 w-4 text-purple-400" />
                                <AlertTitle className="text-purple-400">Payment Required</AlertTitle>
                                <AlertDescription className="text-purple-400/80">
                                    You need a valid payment code to publish ads. Contact support to purchase credits.
                                </AlertDescription>
                            </Alert>

                            <div className="space-y-4">
                                <Label className="text-white">Enter Payment Code</Label>
                                <div className="flex gap-2">
                                    <Input
                                        name="paymentCode"
                                        placeholder="P-XXXX-XXXX"
                                        value={formData.paymentCode}
                                        onChange={handleInputChange}
                                        className="bg-white/5 border-white/10 tracking-widest uppercase font-mono"
                                    />
                                    <Button
                                        onClick={handleVerifyCode}
                                        disabled={loading || !formData.paymentCode}
                                        className="bg-purple-600 hover:bg-purple-700"
                                    >
                                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verify'}
                                    </Button>
                                </div>
                            </div>

                            {isCodeVerified && paymentDetails && (
                                <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 flex items-center gap-4 animate-in fade-in zoom-in-95">
                                    <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-400">
                                        <CheckCircle2 className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 className="text-green-400 font-bold">Code Verified</h4>
                                        <p className="text-green-400/70 text-sm">
                                            Valid for <span className="font-bold text-white">{paymentDetails.durationDays} Days</span> campaign.
                                            <br />
                                            Amount: {paymentDetails.currency} {paymentDetails.amount}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300 text-center max-w-2xl mx-auto">
                            <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                                <div className="aspect-[2/1] relative w-full rounded-xl overflow-hidden mb-4 bg-black">
                                    {formData.imageUrl && <Image src={formData.imageUrl} alt="Ad" fill className="object-cover" />}
                                    <div className="absolute top-3 left-3 bg-purple-600 text-white text-xs font-bold px-2 py-1 rounded">SPONSORED</div>
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">{formData.title}</h3>
                                <p className="text-white/60 text-sm mb-4">{formData.description}</p>
                                <Button className="w-full bg-white/10 border border-white/10 text-white hover:bg-white/20">
                                    Visit Website
                                </Button>
                            </div>

                            <div className="text-left bg-white/5 rounded-xl p-4 border border-white/5 text-sm space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-white/50">Duration:</span>
                                    <span className="text-white">{paymentDetails?.durationDays || 0} Days</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-white/50">Target URL:</span>
                                    <span className="text-white truncate max-w-[200px]">{formData.link}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Controls */}
                <div className="flex justify-between mt-8 pt-6 border-t border-white/10">
                    <Button
                        variant="ghost"
                        onClick={step === 1 ? onCancel : prevStep}
                        className="text-white/60 hover:text-white"
                    >
                        {step === 1 ? 'Cancel' : 'Back'}
                    </Button>

                    <Button
                        onClick={step === 3 ? handleSubmit : nextStep}
                        disabled={loading || (step === 2 && !isCodeVerified)}
                        className="bg-white text-black hover:bg-white/90"
                    >
                        {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        {step === 3 ? 'Publish Ad' : 'Next Step'}
                        {step !== 3 && <ChevronRight className="w-4 h-4 ml-2" />}
                    </Button>
                </div>
            </div>
        </Card>
    );
}
