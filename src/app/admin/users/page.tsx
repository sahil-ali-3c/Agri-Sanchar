
"use client";

import { useEffect, useState } from "react";
import { MoreHorizontal, UserPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getUsers, UserProfile } from "@/lib/firebase/users";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Spinner } from "@/components/ui/spinner";

export default function AdminUsersPage() {
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchUsers = async () => {
            setIsLoading(true);
            const allUsers = await getUsers();
            setUsers(allUsers);
            setIsLoading(false);
        };
        fetchUsers();
    }, []);

    const getUserTypeBadge = (userType: string) => {
        switch (userType) {
            case 'admin':
                return <Badge variant="destructive">Admin</Badge>;
            case 'expert':
                return <Badge className="bg-blue-500 text-white">Expert</Badge>;
            case 'ngo':
                return <Badge className="bg-green-500 text-white">NGO</Badge>;
            default:
                return <Badge variant="secondary">Farmer</Badge>;
        }
    }
    
    if (isLoading) {
        return <div className="flex h-full items-center justify-center"><Spinner className="h-8 w-8" /></div>
    }

    return (
        <div className="p-4 md:p-8">
             <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold font-headline">User Management</h1>
                <Button>
                    <UserPlus className="mr-2 h-4 w-4" /> Add user
                </Button>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Users</CardTitle>
                    <CardDescription>
                        A list of all the users in the application.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>User</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead className="hidden md:table-cell">Location</TableHead>
                                <TableHead className="hidden md:table-cell">Phone</TableHead>
                                <TableHead>
                                    <span className="sr-only">Actions</span>
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                           {users.map(user => (
                               <TableRow key={user.farmerId}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar className="hidden h-9 w-9 sm:flex">
                                                <AvatarImage src={user.avatar} alt="Avatar" />
                                                <AvatarFallback>{user.name.substring(0, 2)}</AvatarFallback>
                                            </Avatar>
                                            <div className="grid gap-0.5">
                                                <p className="font-medium">{user.name}</p>
                                                <p className="text-xs text-muted-foreground">{user.farmerId}</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>{getUserTypeBadge(user.userType)}</TableCell>
                                    <TableCell className="hidden md:table-cell">{user.city && user.state ? `${user.city}, ${user.state}`: 'N/A'}</TableCell>
                                    <TableCell className="hidden md:table-cell">{user.phone}</TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button aria-haspopup="true" size="icon" variant="ghost">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                    <span className="sr-only">Toggle menu</span>
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuItem>Edit</DropdownMenuItem>
                                                <DropdownMenuItem>Suspend</DropdownMenuItem>
                                                <DropdownMenuItem className="text-destructive focus:text-destructive">Delete</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                               </TableRow>
                           ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
