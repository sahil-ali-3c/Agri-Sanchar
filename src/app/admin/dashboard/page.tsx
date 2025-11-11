
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AreaChart, BarChart, Bell, FileText, Users, TrendingUp } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from 'next/link';
import { useEffect, useState } from "react";
import { getUsers, UserProfile } from "@/lib/firebase/users";
import { getStoredPosts } from "@/lib/firebase/posts";
import { Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function AdminDashboardPage() {
    const [stats, setStats] = useState({ users: 0, posts: 0 });
    const [userGrowthData, setUserGrowthData] = useState<any[]>([]);

    useEffect(() => {
        const fetchStats = async () => {
            const allUsers = await getUsers();
            const allPosts = getStoredPosts();
            setStats({ users: allUsers.length, posts: allPosts.length });

            // Simulate user growth data
             const growthData = [
                { name: 'Jan', users: 120 },
                { name: 'Feb', users: 150 },
                { name: 'Mar', users: 210 },
                { name: 'Apr', users: 250 },
                { name: 'May', users: 310 },
                { name: 'Jun', users: allUsers.length },
            ];
            setUserGrowthData(growthData);
        };
        fetchStats();
    }, []);

    const overviewCards = [
        {
            title: "Manage Users",
            href: "/admin/users",
            icon: Users,
            description: "View, verify, or suspend users.",
            value: `${stats.users} Total Users`
        },
        {
            title: "Analytics",
            href: "/admin/analytics",
            icon: AreaChart,
            description: "See user growth and content trends.",
            value: "View Reports"
        },
        {
            title: "Content Management",
            href: "/community",
            icon: FileText,
            description: "Moderate community posts and queries.",
            value: `${stats.posts} Total Posts`
        },
        {
            title: "Send Notification",
            href: "/admin/notifications",
            icon: Bell,
            description: "Broadcast alerts to all users.",
            value: "New Alert"
        }
    ];

    return (
        <div className="p-4 md:p-8">
            <h1 className="text-3xl font-bold font-headline mb-6">Admin Dashboard</h1>
            
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
                {overviewCards.map((card) => (
                    <Card key={card.title} className="hover:shadow-lg transition-shadow">
                        <Link href={card.href}>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                                <card.icon className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{card.value}</div>
                                <p className="text-xs text-muted-foreground">{card.description}</p>
                            </CardContent>
                        </Link>
                    </Card>
                ))}
            </div>

            <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
                 <Card>
                    <CardHeader>
                        <CardTitle>User Growth</CardTitle>
                        <CardDescription>Total users over the last 6 months.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={userGrowthData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="users" fill="hsl(var(--primary))" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Quick Actions</CardTitle>
                        <CardDescription>Common administrative tasks.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4">
                        <Button asChild variant="outline">
                            <Link href="/admin/users">View All Users</Link>
                        </Button>
                         <Button asChild variant="outline">
                            <Link href="/admin/notifications">Send Global Alert</Link>
                        </Button>
                         <Button asChild variant="outline">
                            <Link href="/admin/analytics">Full Analytics</Link>
                        </Button>
                         <Button asChild variant="outline">
                            <Link href="/profile">My Admin Profile</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
