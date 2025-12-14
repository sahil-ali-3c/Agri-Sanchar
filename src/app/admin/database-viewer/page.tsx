
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Database } from 'lucide-react';
import { Button } from '@/components/ui/button';

type StoredData = {
    [key: string]: any;
};

export default function DatabaseViewerPage() {
    const [data, setData] = useState<StoredData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchData = () => {
        setIsLoading(true);
        if (typeof window !== 'undefined') {
            const allData: StoredData = {
                userProfiles: JSON.parse(localStorage.getItem('userProfiles') || '{}'),
                community_posts: JSON.parse(localStorage.getItem('community_posts') || '[]'),
                groups: JSON.parse(localStorage.getItem('groups') || '[]'),
                rentals: JSON.parse(localStorage.getItem('rentals') || '[]'),
                notifications: JSON.parse(localStorage.getItem('notifications') || '[]'),
            };
            setData(allData);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    return (
        <div className="p-4 md:p-8 space-y-6">
            <div className="flex items-center justify-between">
                 <div>
                    <h1 className="text-3xl font-bold font-headline">Local Database Viewer</h1>
                    <p className="text-muted-foreground">
                        This page displays the current data stored in your browser's localStorage.
                    </p>
                </div>
                <Button onClick={fetchData} disabled={isLoading}>
                    {isLoading ? 'Loading...' : 'Refresh Data'}
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Database className="h-5 w-5"/> localStorage Data</CardTitle>
                    <CardDescription>
                        This is a read-only view of the application's data. All data will be cleared if you clear your browser cache.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <p>Loading data...</p>
                    ) : data ? (
                        <Accordion type="multiple" className="w-full">
                            {Object.keys(data).map(key => (
                                <AccordionItem value={key} key={key}>
                                    <AccordionTrigger className="font-mono text-lg">{key}</AccordionTrigger>
                                    <AccordionContent>
                                        <pre className="mt-2 w-full overflow-auto rounded-lg bg-muted p-4 text-sm">
                                            {JSON.stringify(data[key], null, 2)}
                                        </pre>
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    ) : (
                        <p>No data found in localStorage.</p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
