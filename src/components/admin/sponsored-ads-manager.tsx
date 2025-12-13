'use client';

import { useState, useTransition, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Loader2, Check, X, RefreshCw, CreditCard, Ticket, AlertCircle, Copy, Trash2, Edit, ChevronsUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
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
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import {
    getAdminSponsoredPosts,
    getAdminPayments,
    updateSponsoredPostStatus,
    generatePaymentCode,
    deleteSponsoredPost,
    deletePaymentCode,
    updatePaymentCode
} from '@/lib/actions/ads';
import { getUsers } from '@/lib/actions/users';
import { format } from 'date-fns';

export default function SponsoredAdsManager() {
    const [activeTab, setActiveTab] = useState('requests');
    const [isLoading, setIsLoading] = useState(true);
    const [isActionPending, startActionTransition] = useTransition();
    const { toast } = useToast();

    // Data State
    const [requests, setRequests] = useState<any[]>([]);
    const [requestsMeta, setRequestsMeta] = useState({ page: 1, totalPages: 1 });

    const [activeAds, setActiveAds] = useState<any[]>([]);
    const [activeMeta, setActiveMeta] = useState({ page: 1, totalPages: 1 });

    const [payments, setPayments] = useState<any[]>([]);
    const [paymentsMeta, setPaymentsMeta] = useState({ page: 1, totalPages: 1 });

    const [users, setUsers] = useState<any[]>([]);

    // Generation State
    const [genAmount, setGenAmount] = useState('1000');
    const [genDuration, setGenDuration] = useState('30');
    const [genUserId, setGenUserId] = useState<string>('');
    const [showGenDialog, setShowGenDialog] = useState(false);
    const [generatedCode, setGeneratedCode] = useState<string | null>(null);

    // Edit State
    const [editingPayment, setEditingPayment] = useState<any>(null);
    const [editAmount, setEditAmount] = useState('');
    const [editDuration, setEditDuration] = useState('');

    const fetchRequests = async (page = 1) => {
        const res: any = await getAdminSponsoredPosts('PENDING', page, 10);
        setRequests(res.data || []);
        setRequestsMeta({ page: res.currentPage || 1, totalPages: res.totalPages || 1 });
    };

    const fetchActiveAds = async (page = 1) => {
        // Fetch APPROVED and REJECTED mixed? Or just all non-pending?
        // The previous implementation fetched 'APPROVED' and 'REJECTED' separately but here we can't easily mix paged results.
        // I'll prioritize 'APPROVED' for now, or fetch standard active list. 
        // Re-reading actions: getAdminSponsoredPosts takes single status.
        // User wants pagination "everywhere". Mixing 2 paged lists is hard.
        // I will assume "Active Ads" means APPROVED. I'll fetch APPROVED.
        const res: any = await getAdminSponsoredPosts('APPROVED', page, 10);
        setActiveAds(res.data || []);
        setActiveMeta({ page: res.currentPage || 1, totalPages: res.totalPages || 1 });
    };

    const fetchPayments = async (page = 1) => {
        const res: any = await getAdminPayments(page, 10);
        setPayments(res.data || []);
        setPaymentsMeta({ page: res.currentPage || 1, totalPages: res.totalPages || 1 });
    };

    const fetchAll = async () => {
        setIsLoading(true);
        try {
            await Promise.all([
                fetchRequests(1),
                fetchActiveAds(1),
                fetchPayments(1),
                getUsers().then(u => setUsers(u))
            ]);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch data.' });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchAll();
    }, []);

    const handleStatusUpdate = (id: string, status: 'APPROVED' | 'REJECTED') => {
        startActionTransition(async () => {
            const res = await updateSponsoredPostStatus(id, status);
            if (res.success) {
                toast({ title: `Ad ${status}`, description: `Advertisement has been ${status.toLowerCase()}.` });
                fetchRequests(requestsMeta.page);
                fetchActiveAds(activeMeta.page);
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
                fetchActiveAds(activeMeta.page);
            } else {
                toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete ad.' });
            }
        });
    };

    const handleGenerateCode = async () => {
        startActionTransition(async () => {
            const res = await generatePaymentCode(Number(genAmount), Number(genDuration), genUserId || undefined);
            if (res.success && res.payment) {
                setGeneratedCode(res.payment.code);
                fetchPayments(1); // Refresh page 1 to see new code
                toast({ title: 'Code Generated', description: 'New payment code created.' });
            } else {
                toast({ variant: 'destructive', title: 'Error', description: 'Failed to generate code.' });
            }
        });
    };

    const handleDeletePayment = (id: string) => {
        if (!confirm('Delete this payment code?')) return;
        startActionTransition(async () => {
            const res = await deletePaymentCode(id);
            if (res.success) {
                fetchPayments(paymentsMeta.page);
                toast({ title: 'Deleted', description: 'Payment code deleted.' });
            } else {
                toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete code.' });
            }
        });
    };

    const handleEditPaymentOpen = (p: any) => {
        setEditingPayment(p);
        setEditAmount(p.amount.toString());
        setEditDuration(p.durationDays.toString());
    };

    const handleEditPaymentSave = () => {
        if (!editingPayment) return;
        startActionTransition(async () => {
            const res = await updatePaymentCode(editingPayment.id, Number(editAmount), Number(editDuration));
            if (res.success) {
                setEditingPayment(null);
                fetchPayments(paymentsMeta.page);
                toast({ title: 'Updated', description: 'Payment code updated.' });
            } else {
                toast({ variant: 'destructive', title: 'Error', description: 'Failed to update code.' });
            }
        });
    };

    const handleCopyCode = (code: string) => {
        navigator.clipboard.writeText(code);
        toast({ title: 'Copied', description: 'Code copied to clipboard.' });
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Sponsored Ads & Payments</h2>
                    <p className="text-muted-foreground">Manage ad requests and generate payment codes.</p>
                </div>
                <Button variant="outline" size="icon" onClick={fetchAll} disabled={isLoading}>
                    <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList className="bg-white/5 border border-white/10 p-1 rounded-xl h-auto">
                    <TabsTrigger value="requests" className="rounded-lg data-[state=active]:bg-primary/20 data-[state=active]:text-primary font-medium transition-all">Requests</TabsTrigger>
                    <TabsTrigger value="active" className="rounded-lg data-[state=active]:bg-primary/20 data-[state=active]:text-primary font-medium transition-all">Active Ads</TabsTrigger>
                    <TabsTrigger value="payments" className="rounded-lg data-[state=active]:bg-primary/20 data-[state=active]:text-primary font-medium transition-all">Payment Codes</TabsTrigger>
                </TabsList>

                {/* AD REQUESTS TAB */}
                <TabsContent value="requests" className="space-y-4">
                    {requests.length === 0 ? (
                        <Card className="bg-[#111112] border-white/5 p-8 text-center text-muted-foreground">
                            <Check className="h-12 w-12 mx-auto mb-4 opacity-20" />
                            <p>No pending ad requests.</p>
                        </Card>
                    ) : (
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {requests.map((ad) => (
                                    <CompactAdCard
                                        key={ad.id}
                                        ad={ad}
                                        onConvert={(status) => handleStatusUpdate(ad.id, status)}
                                        isPending={isActionPending}
                                    />
                                ))}
                            </div>
                            <PaginationControls
                                page={requestsMeta.page}
                                totalPages={requestsMeta.totalPages}
                                onPageChange={fetchRequests}
                                disabled={isLoading}
                            />
                        </div>
                    )}
                </TabsContent>

                {/* ACTIVE ADS TAB */}
                <TabsContent value="active" className="space-y-4">
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {activeAds.map((ad) => (
                                <CompactAdCard
                                    key={ad.id}
                                    ad={ad}
                                    onDelete={() => handleDelete(ad.id)}
                                    isPending={isActionPending}
                                    showDelete
                                />
                            ))}
                            {activeAds.length === 0 && (
                                <p className="text-muted-foreground col-span-2 text-center py-8">No active ads.</p>
                            )}
                        </div>
                        {activeAds.length > 0 && <PaginationControls
                            page={activeMeta.page}
                            totalPages={activeMeta.totalPages}
                            onPageChange={fetchActiveAds}
                            disabled={isLoading}
                        />}
                    </div>
                </TabsContent>

                {/* PAYMENTS TAB */}
                <TabsContent value="payments" className="space-y-4">
                    <Card className="bg-card/40 backdrop-blur-xl border-white/10 shadow-xl rounded-2xl">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <div>
                                <CardTitle>Payment Codes</CardTitle>
                                <CardDescription>Generate and convert codes to credits.</CardDescription>
                            </div>
                            <Dialog open={showGenDialog} onOpenChange={setShowGenDialog}>
                                <DialogTrigger asChild>
                                    <Button className="bg-purple-600 hover:bg-purple-700 h-8 text-xs">
                                        <Ticket className="mr-2 h-3 w-3" />
                                        Generate Code
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="bg-[#111112] border-white/10 text-white sm:max-w-md">
                                    <DialogHeader>
                                        <DialogTitle>Generate Payment Code</DialogTitle>
                                        <DialogDescription>Create a code for a user to pay for an ad.</DialogDescription>
                                    </DialogHeader>
                                    {!generatedCode ? (
                                        <div className="grid gap-4 py-4">
                                            <div className="grid grid-cols-4 items-center gap-4">
                                                <Label className="text-right">Assign User</Label>
                                                <div className="col-span-3">
                                                    <UserSelect users={users} value={genUserId} onChange={setGenUserId} />
                                                    <p className='text-[10px] text-muted-foreground mt-1'>Optional: Lock code to specific user.</p>
                                                </div>
                                            </div>
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
                                                <Button className="flex-1" onClick={() => { setGeneratedCode(null); setShowGenDialog(false); setGenUserId(''); }}>
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
                                        <TableHead className="text-white/50 h-8">Code</TableHead>
                                        <TableHead className="text-white/50 h-8">Details</TableHead>
                                        <TableHead className="text-white/50 h-8">Assigned</TableHead>
                                        <TableHead className="text-white/50 h-8">Status</TableHead>
                                        <TableHead className="text-right text-white/50 h-8">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {payments.map((p) => (
                                        <TableRow key={p.id} className="border-white/5 hover:bg-white/[0.02]">
                                            <TableCell className="font-mono font-medium text-white/90 py-2">{p.code}</TableCell>
                                            <TableCell className="py-2">
                                                <div className="flex flex-col">
                                                    <span className="text-sm">{p.amount} {p.currency}</span>
                                                    <span className="text-xs text-muted-foreground">{p.durationDays} Days</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-2">
                                                {p.assignedToUser ? (
                                                    <span className="text-xs text-blue-400 font-medium">{p.assignedToUser.name}</span>
                                                ) : <span className="text-muted-foreground text-xs text-center block w-4">-</span>}
                                            </TableCell>
                                            <TableCell className="py-2">
                                                <div className="flex flex-col gap-1">
                                                    <Badge variant={p.isUsed ? 'secondary' : 'default'} className={
                                                        cn("w-fit text-[10px] px-1 py-0", p.isUsed ? 'bg-white/10 text-muted-foreground' : 'bg-green-500/10 text-green-500 border-green-500/20')
                                                    }>
                                                        {p.isUsed ? 'Used' : 'Active'}
                                                    </Badge>
                                                    {p.usedByUser && <span className="text-[10px] text-muted-foreground">by {p.usedByUser.name}</span>}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right py-2">
                                                {!p.isUsed && (
                                                    <div className="flex justify-end gap-1">
                                                        <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-white/10" onClick={() => handleEditPaymentOpen(p)}>
                                                            <Edit className="h-3 w-3 text-muted-foreground" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-red-500/10 hover:text-red-400" onClick={() => handleDeletePayment(p.id)}>
                                                            <Trash2 className="h-3 w-3 text-muted-foreground" />
                                                        </Button>
                                                    </div>
                                                )}
                                                {p.isUsed && (
                                                    <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-red-500/10 hover:text-red-400" onClick={() => handleDeletePayment(p.id)}>
                                                        <Trash2 className="h-3 w-3 text-muted-foreground" />
                                                    </Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                            <PaginationControls
                                page={paymentsMeta.page}
                                totalPages={paymentsMeta.totalPages}
                                onPageChange={fetchPayments}
                                disabled={isLoading}
                                className="mt-4"
                            />
                        </CardContent>
                    </Card>

                    {/* Edit Dialog (Existing) */}
                    <Dialog open={!!editingPayment} onOpenChange={(open) => !open && setEditingPayment(null)}>
                        <DialogContent className="bg-[#111112] border-white/10 text-white">
                            <DialogHeader>
                                <DialogTitle>Edit Payment Code</DialogTitle>
                                <DialogDescription>Update amount and duration for {editingPayment?.code}</DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label className="text-right">Amount (LKR)</Label>
                                    <Input
                                        value={editAmount}
                                        onChange={e => setEditAmount(e.target.value)}
                                        className="col-span-3 bg-white/5 border-white/10"
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label className="text-right">Days</Label>
                                    <Input
                                        value={editDuration}
                                        onChange={e => setEditDuration(e.target.value)}
                                        className="col-span-3 bg-white/5 border-white/10"
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button onClick={handleEditPaymentSave} disabled={isActionPending}>
                                    {isActionPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Save Changes
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </TabsContent>
            </Tabs>
        </div>
    );
}

// Compact Ad Card Component
function CompactAdCard({ ad, onConvert, onDelete, isPending, showDelete }: { ad: any, onConvert?: (s: any) => void, onDelete?: () => void, isPending: boolean, showDelete?: boolean }) {
    return (
        <Card className="bg-card/40 backdrop-blur-md border-white/10 overflow-hidden flex flex-row h-[140px] group transition-all hover:border-white/20 hover:bg-white/5 hover:shadow-lg hover:scale-[1.01] rounded-2xl">
            <div className="w-[180px] h-full relative bg-black/50 shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={ad.imageUrl} alt={ad.title} className="w-full h-full object-cover" />
                <div className="absolute top-2 left-2">
                    <Badge variant="outline" className="bg-black/60 border-none text-white text-[10px] backdrop-blur-sm">
                        {ad.status}
                    </Badge>
                </div>
            </div>
            <div className="flex-1 p-3 flex flex-col justify-between min-w-0">
                <div>
                    <div className="flex justify-between items-start gap-2">
                        <h3 className="font-semibold text-sm truncate pr-2" title={ad.title}>{ad.title}</h3>
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                            {format(new Date(ad.createdAt), 'MMM d')}
                        </span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{ad.description}</p>
                </div>

                <div className="space-y-2 mt-1">
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                        <div className="flex items-center gap-1 truncate max-w-[120px]">
                            <span className="w-4 h-4 rounded-full bg-white/10 flex items-center justify-center text-[8px] font-bold">
                                {ad.user?.name?.[0] || 'U'}
                            </span>
                            <span className="truncate">{ad.user?.name}</span>
                        </div>
                        {ad.payment && (
                            <div className="flex items-center gap-1 text-green-500/80">
                                <Ticket className="w-3 h-3" />
                                <span className="font-mono">{ad.payment.code}</span>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-2">
                        {onConvert && (
                            <>
                                <Button className="flex-1 h-7 text-xs bg-green-600/20 hover:bg-green-600/30 text-green-500 border border-green-600/20" size="sm" onClick={() => onConvert('APPROVED')} disabled={isPending}>
                                    <Check className="w-3 h-3 mr-1" /> Approve
                                </Button>
                                <Button className="flex-1 h-7 text-xs bg-red-600/20 hover:bg-red-600/30 text-red-500 border border-red-600/20" size="sm" onClick={() => onConvert('REJECTED')} disabled={isPending}>
                                    <X className="w-3 h-3 mr-1" /> Reject
                                </Button>
                            </>
                        )}
                        {showDelete && onDelete && (
                            <Button variant="ghost" size="sm" className="w-full h-7 text-xs hover:bg-red-500/10 hover:text-red-400 text-muted-foreground" onClick={onDelete} disabled={isPending}>
                                <Trash2 className="w-3 h-3 mr-2" /> Delete Ad
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </Card>
    );
}

// User Select Component (Same as before)
function UserSelect({ users, value, onChange }: { users: any[], value: string, onChange: (val: string) => void }) {
    const [open, setOpen] = useState(false);
    const selectedUser = users.find(u => u.id === value);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between bg-white/5 border-white/10 hover:bg-white/10 hover:text-white"
                >
                    {value
                        ? selectedUser?.name || "User not found"
                        : "Select user (Optional)..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0 bg-[#111112] border-white/10">
                <Command className="bg-[#111112]">
                    <CommandInput placeholder="Search user..." className="h-9" />
                    <CommandList>
                        <CommandEmpty>No user found.</CommandEmpty>
                        <CommandGroup>
                            <CommandItem
                                value="none"
                                onSelect={() => {
                                    onChange("");
                                    setOpen(false);
                                }}
                                className="text-muted-foreground"
                            >
                                <Check
                                    className={cn(
                                        "mr-2 h-4 w-4",
                                        value === "" ? "opacity-100" : "opacity-0"
                                    )}
                                />
                                No Specific User
                            </CommandItem>
                            {users.map((user) => (
                                <CommandItem
                                    key={user.id}
                                    value={user.name || user.username || user.id}
                                    onSelect={() => {
                                        onChange(user.id);
                                        setOpen(false);
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            value === user.id ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    {user.name} <span className="ml-2 text-xs text-muted-foreground truncate max-w-[100px]">{user.email}</span>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}

function PaginationControls({ page, totalPages, onPageChange, disabled, className }: { page: number, totalPages: number, onPageChange: (p: number) => void, disabled?: boolean, className?: string }) {
    return (
        <div className={cn("flex items-center justify-end gap-2", className)}>
            <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 bg-white/5 border-white/10"
                onClick={() => onPageChange(page - 1)}
                disabled={page <= 1 || disabled}
            >
                <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
            </span>
            <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 bg-white/5 border-white/10"
                onClick={() => onPageChange(page + 1)}
                disabled={page >= totalPages || disabled}
            >
                <ChevronRight className="h-4 w-4" />
            </Button>
        </div>
    )
}
