/*
  ================================================================
  පියවර 5: නිර්මාණය කළ සියලුම Components එකම පිටුවක පරීක්ෂා කිරීම
  ================================================================
  අප විසින් 'test/components/ui' folder එක තුල නිර්මාණය කරන ලද 
  Button, Card, Input, Label, සහ Dialog යන සියලුම reusable components,
  මෙම පිටුවට import කර, ඒවායේ ක්‍රියාකාරීත්වය පෙන්වන UI එකක්
  මෙහි නිර්මාණය කර ඇත.
*/
import { Mail, Bell } from "lucide-react";
import { Button } from "./components/ui/button"; // නිවැරදි path එක
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./components/ui/card";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./components/ui/dialog";


export default function TestPage() {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center gap-8 bg-background p-10 text-foreground">
      
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="font-serif text-3xl">Reusable Component Showcase</CardTitle>
          <CardDescription>Radix UI සහ Tailwind CSS වලින් මුල සිට නිර්මාණය කරන ලදී.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">

          {/* 1. Button Components */}
          <div>
            <Label className="text-lg font-semibold">Buttons</Label>
            <div className="mt-2 flex flex-wrap items-center justify-start gap-4 rounded-lg border p-4">
              <Button variant="default" size="default">
                <Mail className="mr-2 h-4 w-4" /> Default
              </Button>
              <Button variant="destructive" size="lg">
                Destructive
              </Button>
              <Button variant="outline" size="sm">
                Outline
              </Button>
              <Button variant="ghost" size="icon">
                <Bell className="h-5 w-5" />
              </Button>
            </div>
          </div>
          
          {/* 2. Input & Label Components */}
          <div>
            <Label className="text-lg font-semibold">Input & Label</Label>
            <div className="mt-2 grid w-full max-w-sm items-center gap-2.5 rounded-lg border p-4">
                <Label htmlFor="email">Email</Label>
                <Input type="email" id="email" placeholder="Email" />
                 <p className="text-xs text-muted-foreground">This is a reusable Input and Label.</p>
            </div>
          </div>

          {/* 3. Dialog (Modal) Component */}
          <div>
            <Label className="text-lg font-semibold">Dialog (Modal)</Label>
            <div className="mt-2 rounded-lg border p-4">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline">Open Dialog</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Edit Profile</DialogTitle>
                    <DialogDescription>
                      Make changes to your profile here. Click save when you're done.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="name" className="text-right">
                        Name
                      </Label>
                      <Input id="name" value="John Doe" className="col-span-3" />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit">Save changes</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

        </CardContent>
      </Card>

    </div>
  );
}
