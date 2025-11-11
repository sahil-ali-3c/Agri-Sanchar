
"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export default function AdminSettingsPage() {
    return (
        <div className="p-4 md:p-8 space-y-6">
            <h1 className="text-3xl font-bold font-headline">Settings</h1>
            <Card>
                <CardHeader>
                    <CardTitle>Platform Configuration</CardTitle>
                    <CardDescription>Manage general settings for the application.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                            <Label htmlFor="maintenance-mode" className="text-base">Maintenance Mode</Label>
                            <p className="text-sm text-muted-foreground">
                                Temporarily disable access to the app for non-admin users.
                            </p>
                        </div>
                        <Switch id="maintenance-mode" />
                    </div>
                     <div className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                            <Label htmlFor="new-registrations" className="text-base">Enable New Registrations</Label>
                            <p className="text-sm text-muted-foreground">
                                Allow or prevent new users from signing up.
                            </p>
                        </div>
                        <Switch id="new-registrations" defaultChecked />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
