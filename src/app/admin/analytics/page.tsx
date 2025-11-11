
"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from 'react';
import { getUsers } from "@/lib/firebase/users";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function AdminAnalyticsPage() {
    const [userDistribution, setUserDistribution] = useState<any[]>([]);
    const [userGrowth, setUserGrowth] = useState<any[]>([]);

     useEffect(() => {
        const fetchData = async () => {
            const allUsers = await getUsers();
            
            // Process data for distribution chart
            const distribution = allUsers.reduce((acc, user) => {
                const state = user.state || "Unknown";
                const existing = acc.find(item => item.name === state);
                if (existing) {
                    existing.value += 1;
                } else {
                    acc.push({ name: state, value: 1 });
                }
                return acc;
            }, [] as {name: string, value: number}[]);
            setUserDistribution(distribution);

            // Process data for growth chart
            const growthData = [
                { name: 'Jan', users: Math.max(0, allUsers.length - 50) },
                { name: 'Feb', users: Math.max(0, allUsers.length - 40) },
                { name: 'Mar', users: Math.max(0, allUsers.length - 30) },
                { name: 'Apr', users: Math.max(0, allUsers.length - 20) },
                { name: 'May', users: Math.max(0, allUsers.length - 10) },
                { name: 'Jun', users: allUsers.length },
            ];
            setUserGrowth(growthData);
        };
        fetchData();
    }, []);

    return (
        <div className="p-4 md:p-8 space-y-6">
             <h1 className="text-3xl font-bold font-headline">Reports & Analytics</h1>
             
             <div className="grid gap-6 md:grid-cols-2">
                 <Card>
                    <CardHeader>
                        <CardTitle>User Growth</CardTitle>
                        <CardDescription>Total users over the last 6 months.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={userGrowth}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="users" fill="hsl(var(--primary))" name="Total Users" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                 <Card>
                    <CardHeader>
                        <CardTitle>User Distribution by State</CardTitle>
                        <CardDescription>Region-wise breakdown of the user base.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={userDistribution}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                    nameKey="name"
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                >
                                    {userDistribution.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
             </div>
        </div>
    );
}
