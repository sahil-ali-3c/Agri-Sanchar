
"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Send } from "lucide-react";
import { Spinner } from '@/components/ui/spinner';

export default function AdminNotificationsPage() {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [isSending, setIsSending] = useState(false);
    const { toast } = useToast();

    const handleSendNotification = () => {
        if (!title || !description) {
            toast({
                variant: "destructive",
                title: "Incomplete Message",
                description: "Please provide both a title and a description for the notification.",
            });
            return;
        }

        setIsSending(true);

        // Simulate sending a notification
        setTimeout(() => {
            const newNotification = {
                id: Date.now().toString(),
                title: `Admin Alert: ${title}`,
                description: description,
                read: false,
                timestamp: Date.now(),
            };

            try {
                // In a real app, this would be a push notification service.
                // Here, we'll just add it to the local storage of the current user (admin).
                const storedNotifications = localStorage.getItem("notifications");
                const notifications = storedNotifications ? JSON.parse(storedNotifications) : [];
                localStorage.setItem("notifications", JSON.stringify([newNotification, ...notifications]));

                toast({
                    title: "Notification Sent",
                    description: "Your alert has been broadcast to all users.",
                });
                
                setTitle('');
                setDescription('');

            } catch (error) {
                console.error("Failed to send notification:", error);
                toast({
                    variant: "destructive",
                    title: "Send Failed",
                    description: "Could not send the notification.",
                });
            } finally {
                setIsSending(false);
            }
        }, 1500);
    };

    return (
        <div className="p-4 md:p-8">
            <h1 className="text-3xl font-bold font-headline mb-6">Send Notification</h1>

            <Card className="max-w-2xl mx-auto">
                <CardHeader>
                    <CardTitle>Broadcast a Message</CardTitle>
                    <CardDescription>
                        This will send a push notification to all users of the application. Use it for important announcements.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">Title</Label>
                        <Input 
                            id="title" 
                            placeholder="e.g., System Maintenance" 
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            disabled={isSending}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea 
                            id="description" 
                            placeholder="e.g., The app will be down for maintenance..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={5}
                            disabled={isSending}
                        />
                    </div>
                </CardContent>
                <CardFooter>
                    <Button onClick={handleSendNotification} disabled={isSending || !title || !description} className="w-full">
                        {isSending ? <Spinner className="mr-2 h-4 w-4" /> : <Send className="mr-2 h-4 w-4" />}
                        {isSending ? "Sending..." : "Send to All Users"}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
