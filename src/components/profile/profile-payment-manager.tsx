
"use client";

import { useTransition, useState } from 'react';
import { useRouter } from 'next/navigation';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    CreditCard,
    Gift,
    Check,
    AlertCircle,
    Loader2,
    Zap,
    Crown,
    History,
    Calendar,
    ShieldCheck
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

// Server action imports
import { redeemKeyAction, requestSubscription, cancelSubscriptionRequest } from "@/lib/actions/payment-actions";

type Plan = {
    id: string;
    name: string;
    description: string | null;
    price: number;
    interval: string;
    discountPercent: number;
    features: string[];
    isFeatured: boolean;
};

type PaymentHistoryItem = {
    id: string;
    amount: number;
    currency: string;
    status: string;
    createdAt: Date;
    method: string;
    type: string;
    accessKey?: {
        code: string;
    } | null;
};

type Subscription = {
    id: string;
    status: string;
    startDate: Date;
    endDate: Date | null;
    plan?: {
        name: string;
    } | null;
} | null;

interface PaymentManagerProps {
    plans: Plan[];
    history: PaymentHistoryItem[];
    currentSubscription: Subscription;
}

export default function PaymentManager({ plans, history, currentSubscription }: PaymentManagerProps) {
    const [requestingPlanId, setRequestingPlanId] = useState<string | null>(null);

    const [redeemCode, setRedeemCode] = useState("");
    const [isRedeeming, startRedeemTransition] = useTransition();
    const router = useRouter();

    async function handleRedeem() {
        startRedeemTransition(async () => {
            const res = await redeemKeyAction(redeemCode);
            if (res.success) {
                toast.success("Code Redeemed!", { description: res.message });
                setRedeemCode("");
                router.refresh();
            } else {
                toast.error("Redemption Failed", { description: res.error });
            }
        });
    }

    async function handleRequestPlan(planId: string) {
        setRequestingPlanId(planId);
        try {
            const res = await requestSubscription(planId);
            if (res.success) {
                toast.success(res.message);
            } else {
                toast.error(res.error);
            }
        } catch (e) {
            toast.error("Something went wrong");
        } finally {
            setRequestingPlanId(null);
        }
    }

    async function handleCancelRequest() {
        startRedeemTransition(async () => {
            const res = await cancelSubscriptionRequest();
            if (res.success) {
                toast.success(res.message);
            } else {
                toast.error(res.error);
            }
        });
    }

    const isPro = currentSubscription?.status === 'ACTIVE';
    const isPending = currentSubscription?.status === 'PENDING';

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* 1. STATUS HEADER */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="rounded-sm md:col-span-2 bg-[#111112] border border-white/[0.02] bg-gradient-to-br from-indigo-500/5 to-purple-500/5">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Crown className={`h-5 w-5 ${isPro ? "text-yellow-400" : isPending ? "text-orange-400" : "text-muted-foreground"}`} />
                            Subscription Status
                        </CardTitle>
                        <CardDescription>Your current membership level</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-4">
                            <div className="text-3xl font-bold">
                                {isPro
                                    ? <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">PRO MEMBER</span>
                                    : isPending
                                        ? <span className="text-orange-400">PENDING APPROVAL</span>
                                        : "FREE PLAN"}
                            </div>
                            {isPro && (
                                <Badge variant="outline" className="border-green-500 text-green-400 bg-green-950/30">
                                    ACTIVE
                                </Badge>
                            )}
                            {isPending && (
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="border-orange-500 text-orange-400 bg-orange-950/30">
                                        WAITING
                                    </Badge>
                                    <Button variant="ghost" size="sm" onClick={handleCancelRequest} disabled={isRedeeming} className="h-6 text-xs text-red-400 hover:text-red-300 hover:bg-red-950/30">
                                        Cancel Request
                                    </Button>
                                </div>
                            )}
                        </div>
                        {isPro && currentSubscription?.endDate && (
                            <p className="text-sm text-muted-foreground mt-2">
                                Expires on {format(new Date(currentSubscription.endDate), "PP")}
                            </p>
                        )}
                        {!isPro && !isPending && (
                            <p className="text-sm text-muted-foreground mt-2">
                                Upgrade to unlock premium features and support creators.
                            </p>
                        )}
                        {isPending && (
                            <p className="text-sm text-muted-foreground mt-2">
                                Your request has been sent to the admin. You will be notified once approved.
                            </p>
                        )}
                    </CardContent>
                </Card>

                <Card className="rounded-sm md:col-span-2 lg:col-span-2 bg-[#111112] border border-white/[0.02]">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Gift className="h-5 w-5 text-pink-400" />
                            Redeem Code
                        </CardTitle>
                        <CardDescription>Have a gift card or promo key?</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div className="flex gap-2">
                            <Input
                                placeholder="XXXX-YYYY-ZZZZ"
                                className="uppercase font-mono tracking-wider"
                                value={redeemCode}
                                onChange={(e) => setRedeemCode(e.target.value.toUpperCase())}
                            />
                            <Button
                                onClick={handleRedeem}
                                disabled={isRedeeming || !redeemCode}
                                className="bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white"
                            >
                                {isRedeeming ? <Loader2 className="h-4 w-4 animate-spin" /> : "Redeem"}
                            </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Enter your code to instantly unlock subscriptions or ad credits.
                        </p>
                        {/* Demo Hint */}
                        <div className="text-[10px] text-yellow-500/50 pt-1">
                            (Tip: Ask admin for a key if manual payment was made)
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* 2. PLANS */}
            {!isPro && !isPending && (
                <div className="space-y-4">
                    <h3 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        <Zap className="h-6 w-6 text-yellow-500" /> Available Plans
                    </h3>
                    <div className="grid gap-6 md:grid-cols-3">
                        {plans.map((plan) => (
                            <Card key={plan.id} className={`rounded-sm relative flex flex-col bg-[#111112] border-white/[0.02] ${plan.isFeatured ? 'border-primary/30 shadow-lg shadow-primary/5 bg-primary/5' : 'border'}`}>
                                {plan.isFeatured && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 ">
                                        <Badge className="bg-gradient-to-r from-yellow-600 to-orange-600 border-none text-white px-3">MOST POPULAR</Badge>
                                    </div>
                                )}
                                <CardHeader>
                                    <CardTitle className="flex justify-between items-start">
                                        <span>{plan.name}</span>
                                    </CardTitle>
                                    <div className="mt-2">
                                        <span className="text-3xl font-bold">LKR {plan.price}</span>
                                        <span className="text-sm text-muted-foreground"> / {plan.interval.toLowerCase()}</span>
                                    </div>
                                    <CardDescription>{plan.description}</CardDescription>
                                </CardHeader>
                                <CardContent className="flex-1">
                                    <ul className="space-y-2 text-sm">
                                        {plan.features.map((feature, i) => (
                                            <li key={i} className="flex items-center gap-2">
                                                <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                                                <span className="text-muted-foreground">{feature}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                                <CardFooter>
                                    <Button
                                        className="w-full"
                                        variant={plan.isFeatured ? "default" : "outline"}
                                        onClick={() => handleRequestPlan(plan.id)}
                                        disabled={!!requestingPlanId}
                                    >
                                        {requestingPlanId === plan.id ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                        {requestingPlanId === plan.id ? "Requesting..." : "Select Plan"}
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            {/* 3. HISTORY */}
            <div className="space-y-4">
                <h3 className="text-xl font-bold tracking-tight flex items-center gap-2">
                    <History className="h-5 w-5 text-muted-foreground" /> Payment History
                </h3>
                <Card className="rounded-sm bg-[#111112] border border-white/[0.02]">
                    {!history || history.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground">
                            No payment history found.
                        </div>
                    ) : (
                        <div className="divide-y divide-border">
                            {history.map((record) => (
                                <div key={record.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="flex items-start gap-4">
                                        <div className={`p-2 rounded-full ${record.status === 'COMPLETED' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
                                            {record.type === 'SUBSCRIPTION' ? <Crown className="h-4 w-4" /> : <CreditCard className="h-4 w-4" />}
                                        </div>
                                        <div>
                                            <p className="font-medium text-sm">
                                                {record.type === 'SUBSCRIPTION' ? 'Subscription Payment' : 'Ad Campaign Payment'}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {format(new Date(record.createdAt), "PPP p")}
                                            </p>
                                            {record.accessKey && (
                                                <Badge variant="secondary" className="mt-1 text-[10px] h-5">
                                                    KEY: {record.accessKey.code}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <Badge variant={record.status === 'COMPLETED' ? "default" : "secondary"} className={record.status === 'COMPLETED' ? "bg-green-600 hover:bg-green-700" : ""}>
                                            {record.status}
                                        </Badge>
                                        <div className="text-right">
                                            <p className="font-bold">{record.currency} {record.amount.toFixed(2)}</p>
                                            <p className="text-xs text-muted-foreground uppercase">{record.method.replace('_', ' ')}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
}
