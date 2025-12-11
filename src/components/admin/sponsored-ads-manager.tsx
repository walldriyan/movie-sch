'use client';

import { useState, useTransition, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Loader2, Check, X, RefreshCw, CreditCard, Ticket, AlertCircle, Copy, Trash2, Edit, ChevronsUpDown } from 'lucide-react';
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
    const [requests, setRequests] = useState<any[]>([]);
    const [payments, setPayments] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isActionPending, startActionTransition] = useTransition();
    const { toast } = useToast();

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

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [adsData, paymentsData, usersData] = await Promise.all([
                getAdminSponsoredPosts(),
                getAdminPayments(),
                getUsers()
            ]);
            setRequests(adsData);
            setPayments(paymentsData);
            setUsers(usersData);
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
            // Pass undefined if empty string
            const res = await generatePaymentCode(Number(genAmount), Number(genDuration), genUserId || undefined);
            if (res.success && res.payment) {
                setGeneratedCode(res.payment.code);
                fetchData();
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
                fetchData();
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
                fetchData();
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
                                        <TableHead className="text-white/50">Code</TableHead>
                                        <TableHead className="text-white/50">Amount</TableHead>
                                        <TableHead className="text-white/50">Duration</TableHead>
                                        <TableHead className="text-white/50">Assigned To</TableHead>
                                        <TableHead className="text-white/50">Status</TableHead>
                                        <TableHead className="text-right text-white/50">Created</TableHead>
                                        <TableHead className="text-right text-white/50 w-[100px]">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {payments.map((p) => (
                                        <TableRow key={p.id} className="border-white/5 hover:bg-white/[0.02]">
                                            <TableCell className="font-mono font-medium text-white/90">{p.code}</TableCell>
                                            <TableCell>{p.amount} {p.currency}</TableCell>
                                            <TableCell>{p.durationDays} Days</TableCell>
                                            <TableCell>
                                                {p.assignedToUser ? (
                                                    <span className="text-xs text-blue-400 font-medium">{p.assignedToUser.name}</span>
                                                ) : <span className="text-muted-foreground text-xs">-</span>}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-1">
                                                    <Badge variant={p.isUsed ? 'secondary' : 'default'} className={
                                                        cn("w-fit", p.isUsed ? 'bg-white/10 text-muted-foreground' : 'bg-green-500/10 text-green-500 border-green-500/20')
                                                    }>
                                                        {p.isUsed ? 'Used' : 'Active'}
                                                    </Badge>
                                                    {p.usedByUser && <span className="text-[10px] text-muted-foreground">by {p.usedByUser.name}</span>}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right text-muted-foreground text-xs">
                                                {format(new Date(p.createdAt), 'MMM d')}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {!p.isUsed && (
                                                    <div className="flex justify-end gap-1">
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/10" onClick={() => handleEditPaymentOpen(p)}>
                                                            <Edit className="h-4 w-4 text-muted-foreground" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-red-500/10 hover:text-red-400" onClick={() => handleDeletePayment(p.id)}>
                                                            <Trash2 className="h-4 w-4 text-muted-foreground" />
                                                        </Button>
                                                    </div>
                                                )}
                                                {p.isUsed && (
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-red-500/10 hover:text-red-400" onClick={() => handleDeletePayment(p.id)}>
                                                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                                                    </Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

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
                                    value={user.name || user.username || user.id} // Search value
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
