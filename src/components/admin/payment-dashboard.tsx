'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DollarSign, Users, CreditCard, Activity, Search, Edit2, Trash2, Plus, Calendar, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { upsertSubscriptionPlan, deleteSubscriptionPlan, upsertManualSubscription, cancelUserSubscription } from '@/lib/actions/admin/payments';
import { format } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { searchUsers } from "@/lib/actions/admin/payments";
import { approveSubscriptionRequest, rejectSubscriptionRequest } from "@/lib/actions/payment-actions";
import { AdPackagesManager } from '@/components/admin/ad-packages-manager';
import AdsManager from '@/components/admin/ads-manager';
import SponsoredAdsManager from '@/components/admin/sponsored-ads-manager';

interface PaymentDashboardProps {
    stats: any;
    initialTransactions: any;
    initialSubscriptions: any;
    initialRequests: any[];
    plans: any[];
    adsConfig: any;
}

export default function PaymentDashboard({ stats, initialTransactions, initialSubscriptions, initialRequests, plans, adsConfig }: PaymentDashboardProps) {
    const [activeTab, setActiveTab] = useState('overview');

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-white/80 to-white/60">Payment & Subscription Manager</h2>
                    <p className="text-lg text-muted-foreground/80 font-medium">Advanced control center for all financial operations.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" className="rounded-full bg-white/5 border-white/10 hover:bg-white/10 backdrop-blur-md transition-all shadow-sm" onClick={() => window.location.reload()}>
                        <Activity className="w-4 h-4 mr-2 text-primary" />
                        Refresh Data
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList className="bg-white/5 border border-white/10 p-1.5 h-auto w-full rounded-2xl backdrop-blur-xl shadow-lg flex flex-wrap gap-2">
                    <TabsTrigger value="requests" className="h-10 px-4 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all font-medium border border-transparent hover:bg-white/5 flex items-center gap-2">
                        Requests
                        {initialRequests && initialRequests.length > 0 && (
                            <Badge variant="destructive" className="h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px] shadow-sm border-white/20">
                                {initialRequests.length}
                            </Badge>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="overview" className="h-10 px-4 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all font-medium border border-transparent hover:bg-white/5">Overview</TabsTrigger>
                    <TabsTrigger value="transactions" className="h-10 px-4 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all font-medium border border-transparent hover:bg-white/5">Transactions</TabsTrigger>
                    <TabsTrigger value="subscriptions" className="h-10 px-4 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all font-medium border border-transparent hover:bg-white/5">Active Subs</TabsTrigger>
                    <TabsTrigger value="plans" className="h-10 px-4 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all font-medium border border-transparent hover:bg-white/5">Manage Plans</TabsTrigger>
                    <TabsTrigger value="ads" className="h-10 px-4 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all font-medium border border-transparent hover:bg-white/5">Ads Management</TabsTrigger>
                </TabsList>

                {/* REQUESTS TAB */}
                <TabsContent value="requests" className="space-y-4">
                    <Card className="bg-card/40 backdrop-blur-xl border-white/10 shadow-xl rounded-2xl overflow-hidden">
                        <CardHeader>
                            <CardTitle>Pending Requests</CardTitle>
                            <CardDescription>Review and approve user subscription requests.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <RequestTable requests={initialRequests} />
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* OVERVIEW TAB */}
                <TabsContent value="overview" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <StatsCard title="Total Revenue" value={`LKR ${stats.revenue.toLocaleString()}`} icon={DollarSign} desc="All time earnings" />
                        <StatsCard title="Active Subscriptions" value={stats.activeSubs} icon={Users} desc="Current paying users" />
                        <StatsCard title="Active Ads" value={stats.activeAds} icon={Activity} desc="Running ad campaigns" />
                        <StatsCard title="Recent Transactions" value={initialTransactions.transactions.length} icon={CreditCard} desc="Last 20 records fetched" />
                    </div>

                    <Card className="bg-card/40 backdrop-blur-xl border-white/10 shadow-xl rounded-2xl overflow-hidden">
                        <CardHeader>
                            <CardTitle>Recent Activity</CardTitle>
                            <CardDescription>Latest financial movements across the platform.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <TransactionTable transactions={initialTransactions.transactions.slice(0, 5)} compact />
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* TRANSACTIONS TAB */}
                <TabsContent value="transactions" className="space-y-4">
                    <Card className="bg-card/40 backdrop-blur-xl border-white/10 shadow-xl rounded-2xl overflow-hidden">
                        <CardHeader>
                            <CardTitle>All Transactions</CardTitle>
                            <CardDescription>Search and filter through payment history.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <TransactionManager initialData={initialTransactions} />
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* SUBSCRIPTIONS TAB */}
                <TabsContent value="subscriptions" className="space-y-4">
                    <Card className="bg-card/40 backdrop-blur-xl border-white/10 shadow-xl rounded-2xl overflow-hidden">
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <div>
                                    <CardTitle>User Subscriptions</CardTitle>
                                    <CardDescription>Manage active user plans and cancellations.</CardDescription>
                                </div>
                                <ManualSubDialog plans={plans} />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <SubscriptionManager initialData={initialSubscriptions} />
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* PLANS TAB */}
                <TabsContent value="plans" className="space-y-4">
                    <Card className="bg-card/40 backdrop-blur-xl border-white/10 shadow-xl rounded-2xl overflow-hidden">
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <div>
                                    <CardTitle>Subscription Plans</CardTitle>
                                    <CardDescription>Configure pricing, duration, and features.</CardDescription>
                                </div>
                                <PlanDialog />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {plans.map((plan: any) => (
                                    <PlanCard key={plan.id} plan={plan} />
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ADS TAB */}
                <TabsContent value="ads" className="space-y-4">
                    <div className="space-y-10">
                        <AdPackagesManager />

                        <div className="pt-10 border-t border-white/5">
                            <SponsoredAdsManager />
                        </div>

                        <div className="pt-10 border-t border-white/5">
                            <div className="mb-6">
                                <h3 className="text-xl font-bold">Site Ad Slots</h3>
                                <p className="text-muted-foreground text-sm">Configure static ad units for specific page locations.</p>
                            </div>
                            <AdsManager initialAds={adsConfig} />
                        </div>

                        <div className="pt-10 border-t border-white/5">
                            <Card className="bg-card/40 backdrop-blur-xl border-white/10 shadow-xl rounded-2xl overflow-hidden">
                                <CardHeader>
                                    <CardTitle>Ad Payments History</CardTitle>
                                    <CardDescription>Revenue specifically from Sponsored Ads.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <TransactionManager initialData={{
                                        ...initialTransactions,
                                        transactions: initialTransactions.transactions.filter((t: any) => t.type === 'AD_CAMPAIGN')
                                    }} />
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}

// --- SUB-COMPONENTS ---

function StatsCard({ title, value, icon: Icon, desc }: any) {
    return (
        <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20 backdrop-blur-xl shadow-lg rounded-2xl overflow-hidden transition-all hover:scale-[1.02]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                <p className="text-xs text-muted-foreground">{desc}</p>
            </CardContent>
        </Card>
    );
}

function TransactionManager({ initialData }: any) {
    // Implementing basic table for now, can expand with search/pagination logic
    return (
        <div>
            {/* Search Bar Placeholder */}
            {/* <div className="flex items-center py-4">
                <Input placeholder="Search emails..." className="max-w-sm" />
            </div> */}
            <TransactionTable transactions={initialData.transactions} />
        </div>
    )
}

function TransactionTable({ transactions, compact }: { transactions: any[], compact?: boolean }) {
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Date</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {transactions.map((tx) => (
                    <TableRow key={tx.id} className="border-white/5 hover:bg-white/5 transition-colors">
                        <TableCell>
                            <div className="flex items-center gap-3">
                                <Avatar className="w-8 h-8">
                                    <AvatarImage src={tx.user.image} />
                                    <AvatarFallback>{tx.user.name?.[0]}</AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col">
                                    <span className="font-medium text-sm">{tx.user.name}</span>
                                    <span className="text-xs text-muted-foreground">{tx.user.email}</span>
                                </div>
                            </div>
                        </TableCell>
                        <TableCell>
                            <Badge variant="outline">{tx.type}</Badge>
                            {tx.subscription && <div className="text-xs text-muted-foreground mt-1">{tx.subscription.plan.name}</div>}
                        </TableCell>
                        <TableCell className="font-bold">
                            {tx.currency} {tx.amount.toLocaleString()}
                        </TableCell>
                        <TableCell>
                            <Badge className={tx.status === 'COMPLETED' ? 'bg-green-500/10 text-green-500 hover:bg-green-500/20' : 'bg-yellow-500/10 text-yellow-500'}>
                                {tx.status}
                            </Badge>
                        </TableCell>
                        <TableCell className="text-right text-sm text-muted-foreground">
                            {compact ? format(new Date(tx.createdAt), 'MMM d') : format(new Date(tx.createdAt), 'MMM d, yyyy')}
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}

function SubscriptionManager({ initialData }: any) {
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Renews/Expires</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {initialData.subscriptions.map((sub: any) => (
                    <TableRow key={sub.id} className="border-white/5 hover:bg-white/5 transition-colors">
                        <TableCell>
                            <div className="flex items-center gap-3">
                                <Avatar className="w-8 h-8">
                                    <AvatarImage src={sub.user.image} />
                                    <AvatarFallback>{sub.user.name?.[0]}</AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col">
                                    <span className="font-medium text-sm">{sub.user.name}</span>
                                    <span className="text-xs text-muted-foreground">{sub.user.email}</span>
                                </div>
                            </div>
                        </TableCell>
                        <TableCell>
                            <Badge>{sub.plan?.name || "Unknown Plan"}</Badge>
                        </TableCell>
                        <TableCell>
                            {sub.endDate ? format(new Date(sub.endDate), 'PP') : 'Lifetime'}
                        </TableCell>
                        <TableCell className="text-right">
                            <Button variant="ghost" size="sm" className="text-red-500 hover:bg-red-500/10" onClick={async () => {
                                const res = await cancelUserSubscription(sub.id);
                                if (res.success) toast.success("Subscription Cancelled");
                            }}>
                                Cancel
                            </Button>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    )
}

function PlanCard({ plan }: any) {
    return (
        <Card className="relative group bg-card/40 backdrop-blur-xl border-white/10 shadow-xl rounded-2xl overflow-hidden hover:border-white/20 transition-all hover:scale-[1.01]">
            <CardHeader>
                <CardTitle className="flex justify-between items-center">
                    {plan.name}
                    <Badge variant="secondary">{plan.interval}</Badge>
                </CardTitle>
                <CardDescription>{plan.durationDays} Days Duration</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="text-3xl font-bold mb-4">LKR {plan.price}</div>
                <div className="space-y-2">
                    {plan.features.map((f: string, i: number) => (
                        <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                            <CheckCircle className="w-4 h-4 text-green-500" /> {f}
                        </div>
                    ))}
                </div>
            </CardContent>
            <CardFooter className="flex justify-between">
                <PlanDialog plan={plan} trigger={<Button variant="outline" size="sm" className="w-full mr-2"><Edit2 className="w-4 h-4 mr-2" /> Edit</Button>} />
                <Button variant="destructive" size="icon" onClick={async () => {
                    if (confirm("Are you sure?")) {
                        await deleteSubscriptionPlan(plan.id);
                        toast.success("Plan archived");
                    }
                }}><Trash2 className="w-4 h-4" /></Button>
            </CardFooter>
        </Card>
    )
}

function PlanDialog({ plan, trigger }: { plan?: any, trigger?: any }) {
    // Form state handling would go here, simplistic for demo
    const [open, setOpen] = useState(false);

    // Default values if editing vs creating
    const isEditing = !!plan;

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || <Button><Plus className="w-4 h-4 mr-2" /> Create Plan</Button>}
            </DialogTrigger>
            <DialogContent className="bg-[#0a0a0b]/95 backdrop-blur-2xl border-white/10 text-white sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{isEditing ? 'Edit Plan' : 'Create New Plan'}</DialogTitle>
                    <DialogDescription>Configure the subscription tier details.</DialogDescription>
                </DialogHeader>
                <form action={async (formData) => {
                    const data = {
                        id: plan?.id,
                        name: formData.get('name') as string,
                        price: Number(formData.get('price')),
                        durationDays: Number(formData.get('durationDays')),
                        interval: formData.get('interval') as string,
                        features: (formData.get('features') as string).split(',').map(s => s.trim())
                    };
                    await upsertSubscriptionPlan(data);
                    toast.success(isEditing ? "Plan Updated" : "Plan Created");
                    setOpen(false);
                }} className="space-y-4">
                    <div className="space-y-2">
                        <Label>Plan Name</Label>
                        <Input name="name" defaultValue={plan?.name} required placeholder="e.g. Pro Weekly" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Price (LKR)</Label>
                            <Input name="price" type="number" defaultValue={plan?.price} required />
                        </div>
                        <div className="space-y-2">
                            <Label>Duration (Days)</Label>
                            <Input name="durationDays" type="number" defaultValue={plan?.durationDays} required />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Interval</Label>
                        <Select name="interval" defaultValue={plan?.interval || "MONTHLY"}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="WEEKLY">Weekly</SelectItem>
                                <SelectItem value="MONTHLY">Monthly</SelectItem>
                                <SelectItem value="YEARLY">Yearly</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Features (Comma separated)</Label>
                        <Input name="features" defaultValue={plan?.features?.join(', ')} placeholder="Access to movies, No ads, etc." />
                    </div>
                    <DialogFooter>
                        <Button type="submit">{isEditing ? 'Save Changes' : 'Create Plan'}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

function ManualSubDialog({ plans }: { plans: any[] }) {
    const [open, setOpen] = useState(false);

    // User Search State
    const [userOpen, setUserOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Debounced search effect
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (searchQuery.length > 0) {
                setLoading(true);
                try {
                    const results = await searchUsers(searchQuery);
                    setUsers(results);
                } finally {
                    setLoading(false);
                }
            } else {
                setUsers([]); // Clear if query too short
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline"><Plus className="w-4 h-4 mr-2" /> Add Manual Sub</Button>
            </DialogTrigger>
            <DialogContent className="bg-[#0a0a0b]/95 backdrop-blur-2xl border-white/10 text-white overflow-visible sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Grant Subscription</DialogTitle>
                    <DialogDescription>Manually give a user a subscription (bypassing payment).</DialogDescription>
                </DialogHeader>
                <form action={async (formData) => {
                    const userId = selectedUser?.id;
                    const planId = formData.get('planId') as string;

                    if (!userId) {
                        toast.error("Please select a user");
                        return;
                    }

                    await upsertManualSubscription(userId, planId);
                    toast.success("Subscription Granted");
                    setOpen(false);
                    setSelectedUser(null);
                }} className="space-y-6 pt-4">

                    <div className="flex flex-col space-y-2">
                        <Label>Select User</Label>
                        <Popover open={userOpen} onOpenChange={setUserOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={userOpen}
                                    className="w-full justify-between"
                                >
                                    {selectedUser ? (
                                        <div className="flex items-center gap-2">
                                            <Avatar className="w-6 h-6">
                                                <AvatarImage src={selectedUser.image} />
                                                <AvatarFallback>{selectedUser.name?.[0]}</AvatarFallback>
                                            </Avatar>
                                            <span>{selectedUser.name}</span>
                                            <span className="text-muted-foreground text-xs">({selectedUser.email})</span>
                                        </div>
                                    ) : (
                                        "Search user by name or email..."
                                    )}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[--radix-popover-trigger-width] p-0 z-[9999]" align="start">
                                <Command shouldFilter={false}>
                                    <CommandInput
                                        placeholder="Type to search..."
                                        value={searchQuery}
                                        onValueChange={setSearchQuery}
                                    />
                                    <CommandList>
                                        {loading && <div className="p-4 text-center text-sm text-muted-foreground flex justify-center items-center"><Loader2 className="w-4 h-4 animate-spin mr-2" />Searching...</div>}
                                        {!loading && users.length === 0 && searchQuery.length > 0 && (
                                            <CommandEmpty>No users found.</CommandEmpty>
                                        )}
                                        {users.map((user) => (
                                            <CommandItem
                                                key={user.id}
                                                value={user.id}
                                                onSelect={() => {
                                                    setSelectedUser(user);
                                                    setUserOpen(false);
                                                }}
                                                className="flex items-center gap-2 cursor-pointer"
                                            >
                                                <div className="flex items-center gap-2 w-full">
                                                    <Avatar className="w-8 h-8">
                                                        <AvatarImage src={user.image} />
                                                        <AvatarFallback>{user.name?.[0]}</AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex flex-col text-left">
                                                        <span className="font-medium">{user.name}</span>
                                                        <span className="text-xs text-muted-foreground">{user.email}</span>
                                                    </div>
                                                </div>
                                                <Check
                                                    className={cn(
                                                        "mr-2 h-4 w-4",
                                                        selectedUser?.id === user.id ? "opacity-100" : "opacity-0"
                                                    )}
                                                />
                                            </CommandItem>
                                        ))}
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </div>

                    <div className="space-y-2">
                        <Label>Select Plan</Label>
                        <Select name="planId" required>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a plan" />
                            </SelectTrigger>
                            <SelectContent className="z-[9999]">
                                {plans.map(p => (
                                    <SelectItem key={p.id} value={p.id}>{p.name} ({p.durationDays} days)</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <DialogFooter>
                        <Button type="submit">Grant Access</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

function RequestTable({ requests }: { requests: any[] }) {
    if (!requests || requests.length === 0) {
        return <div className="text-center py-8 text-muted-foreground">No pending requests.</div>;
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Requested Plan</TableHead>
                    <TableHead>Requested On</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {requests.map((req) => (
                    <TableRow key={req.id} className="border-white/5 hover:bg-white/5 transition-colors">
                        <TableCell>
                            <div className="flex items-center gap-3">
                                <Avatar className="w-8 h-8">
                                    <AvatarImage src={req.user.image} />
                                    <AvatarFallback>{req.user.name?.[0]}</AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col">
                                    <span className="font-medium text-sm">{req.user.name}</span>
                                    <span className="text-xs text-muted-foreground">{req.user.email}</span>
                                </div>
                            </div>
                        </TableCell>
                        <TableCell>
                            <div className="flex flex-col">
                                <Badge variant="outline">{req.plan?.name || "Unknown Plan"}</Badge>
                                <span className="text-xs text-muted-foreground mt-1">LKR {req.plan?.price}</span>
                            </div>
                        </TableCell>
                        <TableCell>
                            {format(new Date(req.createdAt), 'PPP')}
                        </TableCell>
                        <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                                <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={async () => {
                                    const res = await approveSubscriptionRequest(req.id);
                                    if (res.success) toast.success("Request Approved");
                                    else toast.error("Failed");
                                }}>
                                    Approve
                                </Button>
                                <Button size="sm" variant="destructive" onClick={async () => {
                                    if (confirm("Reject this request?")) {
                                        const res = await rejectSubscriptionRequest(req.id);
                                        if (res.success) toast.success("Request Rejected");
                                        else toast.error("Failed");
                                    }
                                }}>
                                    Reject
                                </Button>
                            </div>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    )
}
