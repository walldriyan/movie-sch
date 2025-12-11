
"use client";

import { useState, useTransition } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { generateAccessKeys } from '@/lib/actions/admin-payment-actions';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { format } from "date-fns";
import { Loader2, Key, Users, CreditCard, DollarSign } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AdminPaymentDashboard({ plans, recentPayments, recentSubs, stats }: any) {
    const [isGenerating, startTransition] = useTransition();
    const router = useRouter();

    // Gen Key State
    const [keyCount, setKeyCount] = useState(1);
    const [keyType, setKeyType] = useState("SUBSCRIPTION");
    const [selectedPlan, setSelectedPlan] = useState(plans[0]?.id || "");
    const [creditAmount, setCreditAmount] = useState(1000);

    const handleGenerate = () => {
        startTransition(async () => {
            const res = await generateAccessKeys(
                keyCount,
                keyType as any,
                keyType === 'SUBSCRIPTION' ? selectedPlan : undefined,
                keyType === 'AD_CAMPAIGN' ? creditAmount : undefined
            );

            if (res.success) {
                toast.success(`Generated ${res.count} keys successfully.`);
                // In a real app, show the keys to download. For now, they go to DB.
                // You might want to implement a "Recent Keys" view.
                router.refresh();
            } else {
                toast.error(res.error);
            }
        });
    };

    return (
        <div className="space-y-8">
            {/* Stats Overview */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">LKR {stats.totalRevenue.toLocaleString()}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Unused Keys</CardTitle>
                        <Key className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.activeKeysCount}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Subs</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{recentSubs.filter((s: any) => s.status === 'ACTIVE').length} (Recent)</div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                {/* Key Generator */}
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Generate Access Keys</CardTitle>
                        <CardDescription>Create single or bulk keys for manual distribution.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Key Type</Label>
                            <Select value={keyType} onValueChange={setKeyType}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="SUBSCRIPTION">Subscription Plan</SelectItem>
                                    <SelectItem value="AD_CAMPAIGN">Ad Credit</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {keyType === 'SUBSCRIPTION' && (
                            <div className="space-y-2">
                                <Label>Plan</Label>
                                <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {plans.map((p: any) => (
                                            <SelectItem key={p.id} value={p.id}>{p.name} ({p.price} LKR)</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        {keyType === 'AD_CAMPAIGN' && (
                            <div className="space-y-2">
                                <Label>Credit Amount (LKR)</Label>
                                <Input
                                    type="number"
                                    value={creditAmount}
                                    onChange={(e) => setCreditAmount(Number(e.target.value))}
                                />
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label>Quantity</Label>
                            <Input
                                type="number"
                                min={1}
                                max={100}
                                value={keyCount}
                                onChange={(e) => setKeyCount(Number(e.target.value))}
                            />
                        </div>

                        <Button
                            className="w-full"
                            onClick={handleGenerate}
                            disabled={isGenerating || (keyType === 'SUBSCRIPTION' && !selectedPlan)}
                        >
                            {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Generate Keys
                        </Button>
                    </CardContent>
                </Card>

                {/* Lists Tabs */}
                <Card className="col-span-4">
                    <Tabs defaultValue="transactions" className="w-full">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>Recent Activity</CardTitle>
                                <TabsList>
                                    <TabsTrigger value="transactions">Transactions</TabsTrigger>
                                    <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
                                </TabsList>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <TabsContent value="transactions" className="space-y-4">
                                {recentPayments.length === 0 ? <p className="text-muted-foreground text-sm">No transactions yet.</p> : (
                                    <div className="space-y-4">
                                        {recentPayments.map((p: any) => (
                                            <div key={p.id} className="flex items-center justify-between p-3 border rounded-lg">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-green-500/10 rounded-full text-green-500">
                                                        <CreditCard className="w-4 h-4" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium">{p.user?.name || 'Unknown User'}</p>
                                                        <p className="text-xs text-muted-foreground">{format(new Date(p.createdAt), "MMM d, yyyy")}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-bold">{p.currency} {p.amount}</p>
                                                    <Badge variant="outline" className="text-[10px]">{p.method}</Badge>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </TabsContent>

                            <TabsContent value="subscriptions" className="space-y-4">
                                {recentSubs.length === 0 ? <p className="text-muted-foreground text-sm">No subscriptions yet.</p> : (
                                    <div className="space-y-4">
                                        {recentSubs.map((s: any) => (
                                            <div key={s.id} className="flex items-center justify-between p-3 border rounded-lg">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-purple-500/10 rounded-full text-purple-500">
                                                        <Users className="w-4 h-4" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium">{s.user?.name || 'Unknown User'}</p>
                                                        <p className="text-xs text-muted-foreground">{s.plan?.name}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <Badge className={s.status === 'ACTIVE' ? 'bg-green-500' : 'bg-gray-500'}>{s.status}</Badge>
                                                    {s.endDate && (
                                                        <p className="text-[10px] text-muted-foreground mt-1">
                                                            Ends: {format(new Date(s.endDate), "MMM d")}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </TabsContent>
                        </CardContent>
                    </Tabs>
                </Card>
            </div>
        </div>
    );
}
