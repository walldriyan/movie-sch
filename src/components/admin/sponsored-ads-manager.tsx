'use client';

import { useState, useTransition, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Loader2, Check, X, RefreshCw, CreditCard, Ticket, Clock, AlertCircle, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
    getAdminSponsoredPosts,
    getAdminPayments,
    updateSponsoredPostStatus,
    generatePaymentCode,
    deleteSponsoredPost
} from '@/lib/actions/ads';
import { format } from 'date-fns';

export default function SponsoredAdsManager() {
    const [activeTab, setActiveTab] = useState('requests');
    const [requests, setRequests] = useState<any[]>([]);
    const [payments, setPayments] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isActionPending, startActionTransition] = useTransition();
    const { toast } = useToast();

    // Generation State
    const [genAmount, setGenAmount] = useState('1000');
    const [genDuration, setGenDuration] = useState('30');
    const [showGenDialog, setShowGenDialog] = useState(false);
    const [generatedCode, setGeneratedCode] = useState<string | null>(null);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [adsData, paymentsData] = await Promise.all([
                getAdminSponsoredPosts(),
                getAdminPayments()
            ]);
            setRequests(adsData);
            setPayments(paymentsData);
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to fetch data.',
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleStatusUpdate = (id: string, status: 'APPROVED' | 'REJECTED') => {
        startActionTransition(async () => {
            const res = await updateSponsoredPostStatus(id, status);
            if (res.success) {
                toast({ title: `Ad ${status}`, description: `Advertisement has been ${status.toLowerCase()}.` });
                fetchData();
            } else {
                toast({ variant: 'destructive', title: 'Error', description: 'Failed to update status.' });
            }
        });
    };

    const handleDelete = (id: string) => {
        if (!confirm('Are you sure you want to delete this ad?')) return;
        startActionTransition(async () => {
            const res = await deleteSponsoredPost(id);
            if (res.success) {
                toast({ title: 'Ad Deleted', description: 'Advertisement removed.' });
                fetchData();
            } else {
                toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete ad.' });
            }
        });
    };

    const handleGenerateCode = async () => {
        startActionTransition(async () => {
            const res = await generatePaymentCode(Number(genAmount), Number(genDuration));
            if (res.success && res.payment) {
                setGeneratedCode(res.payment.code);
                fetchData();
                toast({ title: 'Code Generated', description: 'New payment code created.' });
            } else {
                toast({ variant: 'destructive', title: 'Error', description: 'Failed to generate code.' });
            }
        });
    };

    const handleCopyCode = (code: string) => {
        navigator.clipboard.writeText(code);
        toast({ title: 'Copied', description: 'Code copied to clipboard.' });
    };

    const pendingAds = requests.filter(r => r.status === 'PENDING');
    const activeAds = requests.filter(r => r.status === 'APPROVED');
    const rejectedAds = requests.filter(r => r.status === 'REJECTED');

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Sponsored Ads & Payments</h2>
                    <p className="text-muted-foreground">Manage ad requests and generate payment codes.</p>
                </div>
                <Button variant="outline" size="icon" onClick={fetchData} disabled={isLoading}>
                    <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList className="bg-white/5 border border-white/10">
                    <TabsTrigger value="requests">Ad Requests ({pendingAds.length})</TabsTrigger>
                    <TabsTrigger value="active">Active Ads ({activeAds.length})</TabsTrigger>
                    <TabsTrigger value="payments">Payment Codes</TabsTrigger>
                </TabsList>

                {/* AD REQUESTS TAB */}
                <TabsContent value="requests" className="space-y-4">
                    {pendingAds.length === 0 ? (
                        <Card className="bg-[#111112] border-white/5 p-8 text-center text-muted-foreground">
                            <Check className="h-12 w-12 mx-auto mb-4 opacity-20" />
                            <p>No pending ad requests.</p>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {pendingAds.map((ad) => (
                                <AdRequestCard
                                    key={ad.id}
                                    ad={ad}
                                    onConvert={(status) => handleStatusUpdate(ad.id, status)}
                                    isPending={isActionPending}
                                />
                            ))}
                        </div>
                    )}
                </TabsContent>

                {/* ACTIVE ADS TAB */}
                <TabsContent value="active" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {activeAds.concat(rejectedAds).map((ad) => (
                            <AdRequestCard
                                key={ad.id}
                                ad={ad}
                                onDelete={() => handleDelete(ad.id)}
                                isPending={isActionPending}
                                showDelete
                            />
                        ))}
                        {activeAds.length === 0 && rejectedAds.length === 0 && (
                            <p className="text-muted-foreground">No active or history ads.</p>
                        )}
                    </div>
                </TabsContent>

                {/* PAYMENTS TAB */}
                <TabsContent value="payments" className="space-y-4">
                    <Card className="bg-[#111112] border-white/5">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Payment Codes</CardTitle>
                                <CardDescription>Generate and convert codes to credits.</CardDescription>
                            </div>
                            <Dialog open={showGenDialog} onOpenChange={setShowGenDialog}>
                                <DialogTrigger asChild>
                                    <Button className="bg-purple-600 hover:bg-purple-700">
                                        <Ticket className="mr-2 h-4 w-4" />
                                        Generate Code
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="bg-[#111112] border-white/10 text-white">
                                    <DialogHeader>
                                        <DialogTitle>Generate Payment Code</DialogTitle>
                                        <DialogDescription>Create a code for a user to pay for an ad.</DialogDescription>
                                    </DialogHeader>
                                    {!generatedCode ? (
                                        <div className="grid gap-4 py-4">
                                            <div className="grid grid-cols-4 items-center gap-4">
                                                <Label className="text-right">Amount (LKR)</Label>
                                                <Input
                                                    value={genAmount}
                                                    onChange={e => setGenAmount(e.target.value)}
                                                    className="col-span-3 bg-white/5 border-white/10"
                                                />
                                            </div>
                                            <div className="grid grid-cols-4 items-center gap-4">
                                                <Label className="text-right">Days</Label>
                                                <Input
                                                    value={genDuration}
                                                    onChange={e => setGenDuration(e.target.value)}
                                                    className="col-span-3 bg-white/5 border-white/10"
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="py-6 text-center space-y-4">
                                            <div className="bg-green-500/10 text-green-500 p-4 rounded-lg border border-green-500/20">
                                                <p className="text-sm uppercase tracking-wider mb-1">Generated Code</p>
                                                <p className="text-3xl font-mono font-bold tracking-widest">{generatedCode}</p>
                                            </div>
                                            <p className="text-sm text-muted-foreground">Copy and send this to the user.</p>
                                        </div>
                                    )}
                                    <DialogFooter>
                                        {!generatedCode ? (
                                            <Button onClick={handleGenerateCode} disabled={isActionPending}>
                                                {isActionPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                Generate
                                            </Button>
                                        ) : (
                                            <div className="flex gap-2 w-full">
                                                <Button variant="outline" className="flex-1" onClick={() => handleCopyCode(generatedCode)}>
                                                    <Copy className="mr-2 h-4 w-4" /> Copy
                                                </Button>
                                                <Button className="flex-1" onClick={() => { setGeneratedCode(null); setShowGenDialog(false); }}>
                                                    Done
                                                </Button>
                                            </div>
                                        )}
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-white/5 hover:bg-transparent">
                                        <TableHead className="text-white/50">Code</TableHead>
                                        <TableHead className="text-white/50">Amount</TableHead>
                                        <TableHead className="text-white/50">Duration</TableHead>
                                        <TableHead className="text-white/50">Status</TableHead>
                                        <TableHead className="text-white/50">Used By</TableHead>
                                        <TableHead className="text-right text-white/50">Created</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {payments.map((p) => (
                                        <TableRow key={p.id} className="border-white/5 hover:bg-white/[0.02]">
                                            <TableCell className="font-mono font-medium text-white/90">{p.code}</TableCell>
                                            <TableCell>{p.amount} {p.currency}</TableCell>
                                            <TableCell>{p.durationDays} Days</TableCell>
                                            <TableCell>
                                                <Badge variant={p.isUsed ? 'secondary' : 'default'} className={p.isUsed ? 'bg-white/10 text-muted-foreground' : 'bg-green-500/10 text-green-500 border-green-500/20'}>
                                                    {p.isUsed ? 'Used' : 'Active'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {p.usedByUser ? (
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs">{p.usedByUser.name}</span>
                                                    </div>
                                                ) : '-'}
                                            </TableCell>
                                            <TableCell className="text-right text-muted-foreground text-xs">
                                                {format(new Date(p.createdAt), 'MMM d')}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}

function AdRequestCard({ ad, onConvert, onDelete, isPending, showDelete }: { ad: any, onConvert?: (s: any) => void, onDelete?: () => void, isPending: boolean, showDelete?: boolean }) {
    return (
        <Card className="bg-[#111112] border-white/5 overflow-hidden flex flex-col">
            <div className="aspect-video relative bg-black/50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={ad.imageUrl} alt={ad.title} className="w-full h-full object-contain" />
                <div className="absolute top-2 right-2">
                    <Badge variant={
                        ad.status === 'APPROVED' ? 'default' :
                            ad.status === 'REJECTED' ? 'destructive' : 'secondary'
                    }>
                        {ad.status}
                    </Badge>
                </div>
            </div>
            <CardHeader className="pb-2">
                <CardTitle className="line-clamp-1 text-lg">{ad.title}</CardTitle>
                <CardDescription className="line-clamp-2">{ad.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 text-sm space-y-2">
                <div className="flex justify-between">
                    <span className="text-muted-foreground">User:</span>
                    <span>{ad.user?.name || 'Unknown'}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Target:</span>
                    <a href={ad.link} target="_blank" className="text-blue-400 hover:underline truncate max-w-[150px]">{ad.link}</a>
                </div>
                {ad.payment && (
                    <div className="flex justify-between items-center bg-white/5 p-2 rounded">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <CreditCard className="w-3 h-3" /> Paid via Code
                        </span>
                        <span className="font-mono text-xs">{ad.payment.code}</span>
                    </div>
                )}
            </CardContent>
            <CardFooter className="pt-2 gap-2 border-t border-white/5">
                {onConvert && (
                    <>
                        <Button className="flex-1 bg-green-600 hover:bg-green-700" size="sm" onClick={() => onConvert('APPROVED')} disabled={isPending}>
                            <Check className="w-4 h-4 mr-1" /> Approve
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => onConvert('REJECTED')} disabled={isPending}>
                            <X className="w-4 h-4" />
                        </Button>
                    </>
                )}
                {showDelete && onDelete && (
                    <Button variant="destructive" size="sm" className="w-full" onClick={onDelete} disabled={isPending}>
                        Delete Ad
                    </Button>
                )}
            </CardFooter>
        </Card>
    );
}
