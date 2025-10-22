import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Wrench } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="space-y-4">
      <h1 className="font-semibold text-lg md:text-2xl">Settings</h1>
      <Card>
        <CardHeader>
          <CardTitle>Under Construction</CardTitle>
          <CardDescription>This page is currently being developed.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-16 border-2 border-dashed rounded-lg">
             <Wrench className="h-16 w-16 mb-4" />
            <p>Please check back later for updates.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
