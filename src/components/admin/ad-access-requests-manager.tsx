'use client';

import { useState, useTransition } from 'react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { approveAdAccessRequest, rejectAdAccessRequest } from '@/lib/actions/ads';
import { Check, X, Clock, Key, Loader2, Copy, RefreshCw, Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface AdAccessRequestData {
    id: string;
    userId: string;
    packageId: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    adminNote?: string | null;
    assignedKeyId?: string | null;
    createdAt: string;
    updatedAt: string;
    user: {
        id: string;
        name: string | null;
        email: string | null;
        image: string | null;
    };
    package: {
        id: string;
        name: string;
        pricePerDay: number;
        minDays: number;
        maxDays: number;
    };
    assignedKey?: {
        id: string;
        code: string;
        amount: number;
        durationDays: number;
        isUsed: boolean;
    } | null;
}

interface Props {
    initialRequests: AdAccessRequestData[];
}

export default function AdAccessRequestsManager({ initialRequests }: Props) {
    const [requests, setRequests] = useState(initialRequests);
    const [selectedRequest, setSelectedRequest] = useState<AdAccessRequestData | null>(null);
    const [approveDialogOpen, setApproveDialogOpen] = useState(false);
    const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
    const [durationDays, setDurationDays] = useState(30);
    const [customAmount, setCustomAmount] = useState<number | undefined>(undefined);
    const [rejectReason, setRejectReason] = useState('');
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();
    const router = useRouter();

    const pendingCount = requests.filter(r => r.status === 'PENDING').length;
    const approvedCount = requests.filter(r => r.status === 'APPROVED').length;

    const handleApprove = () => {
        if (!selectedRequest) return;

        startTransition(async () => {
            const result = await approveAdAccessRequest(selectedRequest.id, durationDays, customAmount);
            if (result.success) {
                toast({
                    title: '✅ Request Approved!',
                    description: `Code: ${result.code} | Duration: ${result.durationDays} days | Amount: LKR ${result.amount}`,
                });
                setApproveDialogOpen(false);
                setSelectedRequest(null);
                router.refresh();
            } else {
                toast({ variant: 'destructive', title: 'Error', description: result.error });
            }
        });
    };

    const handleReject = () => {
        if (!selectedRequest) return;

        startTransition(async () => {
            const result = await rejectAdAccessRequest(selectedRequest.id, rejectReason);
            if (result.success) {
                toast({ title: '❌ Request Rejected' });
                setRejectDialogOpen(false);
                setSelectedRequest(null);
                router.refresh();
            } else {
                toast({ variant: 'destructive', title: 'Error', description: result.error });
            }
        });
    };

    const copyCode = (code: string) => {
        navigator.clipboard.writeText(code);
        toast({ title: 'Copied!', description: code });
    };

    const openApproveDialog = (request: AdAccessRequestData) => {
        setSelectedRequest(request);
        setDurationDays(request.package.minDays);
        setCustomAmount(undefined);
        setApproveDialogOpen(true);
    };

    const openRejectDialog = (request: AdAccessRequestData) => {
        setSelectedRequest(request);
        setRejectReason('');
        setRejectDialogOpen(true);
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'PENDING':
                return <Badge variant="outline" className="border-yellow-500/50 text-yellow-500 bg-yellow-500/10"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
            case 'APPROVED':
                return <Badge variant="outline" className="border-green-500/50 text-green-500 bg-green-500/10"><Check className="w-3 h-3 mr-1" /> Approved</Badge>;
            case 'REJECTED':
                return <Badge variant="outline" className="border-red-500/50 text-red-500 bg-red-500/10"><X className="w-3 h-3 mr-1" /> Rejected</Badge>;
            default:
                return <Badge>{status}</Badge>;
        }
    };

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="bg-gradient-to-br from-yellow-500/10 via-yellow-500/5 to-transparent border-yellow-500/20 backdrop-blur-xl shadow-lg rounded-2xl">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-yellow-500">Pending Requests</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-yellow-500">{pendingCount}</div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-green-500/10 via-green-500/5 to-transparent border-green-500/20 backdrop-blur-xl shadow-lg rounded-2xl">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-green-500">Approved</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-green-500">{approvedCount}</div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20 backdrop-blur-xl shadow-lg rounded-2xl">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-primary">Total Requests</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-primary">{requests.length}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Requests Table */}
            <Card className="bg-card/40 backdrop-blur-xl border-white/10 shadow-xl rounded-2xl overflow-hidden">
                <CardHeader className="border-b border-white/5">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Key className="h-5 w-5 text-primary" />
                                Ad Access Requests
                            </CardTitle>
                            <CardDescription>Review and approve user requests for ad keys</CardDescription>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => router.refresh()}>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Refresh
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-white/[0.02]">
                            <TableRow className="border-white/5 hover:bg-transparent">
                                <TableHead className="pl-6">User</TableHead>
                                <TableHead>Package</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Key Code</TableHead>
                                <TableHead>Requested</TableHead>
                                <TableHead className="text-right pr-6">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {requests.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                                        No requests found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                requests.map((request) => (
                                    <TableRow key={request.id} className="border-white/5 hover:bg-white/[0.02]">
                                        <TableCell className="pl-6">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-8 w-8 border border-white/10">
                                                    <AvatarImage src={request.user.image || undefined} />
                                                    <AvatarFallback>{request.user.name?.slice(0, 2).toUpperCase()}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="font-medium text-sm">{request.user.name}</p>
                                                    <p className="text-xs text-muted-foreground">{request.user.email}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Package className="h-4 w-4 text-primary" />
                                                <div>
                                                    <p className="font-medium text-sm">{request.package.name}</p>
                                                    <p className="text-xs text-muted-foreground">LKR {request.package.pricePerDay}/day</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>{getStatusBadge(request.status)}</TableCell>
                                        <TableCell>
                                            {request.assignedKey ? (
                                                <div className="flex items-center gap-2">
                                                    <code className="text-xs bg-white/5 px-2 py-1 rounded font-mono">
                                                        {request.assignedKey.code}
                                                    </code>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-6 w-6"
                                                        onClick={() => copyCode(request.assignedKey!.code)}
                                                    >
                                                        <Copy className="h-3 w-3" />
                                                    </Button>
                                                    {request.assignedKey.isUsed && (
                                                        <Badge variant="secondary" className="text-xs">Used</Badge>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground text-sm">—</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {format(new Date(request.createdAt), 'MMM d, yyyy')}
                                        </TableCell>
                                        <TableCell className="text-right pr-6">
                                            {request.status === 'PENDING' && (
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="border-green-500/30 text-green-500 hover:bg-green-500/10"
                                                        onClick={() => openApproveDialog(request)}
                                                    >
                                                        <Check className="h-4 w-4 mr-1" />
                                                        Approve
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="border-red-500/30 text-red-500 hover:bg-red-500/10"
                                                        onClick={() => openRejectDialog(request)}
                                                    >
                                                        <X className="h-4 w-4 mr-1" />
                                                        Reject
                                                    </Button>
                                                </div>
                                            )}
                                            {request.status !== 'PENDING' && request.adminNote && (
                                                <p className="text-xs text-muted-foreground max-w-[200px] truncate" title={request.adminNote}>
                                                    {request.adminNote}
                                                </p>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Approve Dialog */}
            <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
                <DialogContent className="bg-[#0a0a0b]/95 backdrop-blur-2xl border-white/10 text-white shadow-2xl rounded-2xl p-6">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Check className="h-5 w-5 text-green-500" />
                            Approve Ad Access Request
                        </DialogTitle>
                        <DialogDescription>
                            Generate an ad payment code for {selectedRequest?.user.name}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="bg-white/5 rounded-lg p-4">
                            <p className="text-sm font-medium">Package: {selectedRequest?.package.name}</p>
                            <p className="text-xs text-muted-foreground">
                                Price: LKR {selectedRequest?.package.pricePerDay}/day
                                (Min: {selectedRequest?.package.minDays} days, Max: {selectedRequest?.package.maxDays} days)
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label>Duration (Days)</Label>
                            <Input
                                type="number"
                                value={durationDays}
                                onChange={(e) => setDurationDays(Number(e.target.value))}
                                min={selectedRequest?.package.minDays || 1}
                                max={selectedRequest?.package.maxDays || 365}
                                className="bg-white/5 border-white/10"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Custom Amount (Optional, leave empty for auto-calculate)</Label>
                            <Input
                                type="number"
                                value={customAmount ?? ''}
                                onChange={(e) => setCustomAmount(e.target.value ? Number(e.target.value) : undefined)}
                                placeholder={`Auto: LKR ${(selectedRequest?.package.pricePerDay || 0) * durationDays}`}
                                className="bg-white/5 border-white/10"
                            />
                        </div>

                        <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
                            <p className="text-sm font-medium text-primary">
                                Total Value: LKR {customAmount || ((selectedRequest?.package.pricePerDay || 0) * durationDays)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                This will generate a payment code valid for {durationDays} days
                            </p>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setApproveDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleApprove} disabled={isPending} className="bg-green-600 hover:bg-green-700">
                            {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Approve & Generate Code
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Reject Dialog */}
            <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
                <DialogContent className="bg-[#0a0a0b]/95 backdrop-blur-2xl border-white/10 text-white shadow-2xl rounded-2xl p-6">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-500">
                            <X className="h-5 w-5" />
                            Reject Request
                        </DialogTitle>
                        <DialogDescription>
                            Reject the request from {selectedRequest?.user.name}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Reason (Optional)</Label>
                            <Textarea
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                placeholder="Enter a reason for rejection..."
                                className="bg-white/5 border-white/10"
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleReject} disabled={isPending} variant="destructive">
                            {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Reject Request
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
