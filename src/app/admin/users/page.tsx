
"use client";

import { useEffect, useState } from "react";
import { MoreHorizontal, UserPlus, Trash2, Edit, XCircle, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getUsers, updateUserProfile, deleteUserProfile, type UserProfile } from "@/lib/firebase/users";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


function EditUserDialog({ user, onSave, onClose }: { user: UserProfile | null; onSave: (id: string, data: Partial<UserProfile>) => void; onClose: () => void; }) {
    const [userData, setUserData] = useState<Partial<UserProfile> | null>(null);

    useEffect(() => {
        if (user) {
            setUserData({ name: user.name, userType: user.userType });
        }
    }, [user]);

    if (!user || !userData) return null;

    const handleSave = () => {
        onSave(user.farmerId, userData);
    };

    return (
        <Dialog open={!!user} onOpenChange={(isOpen) => !isOpen && onClose()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit User</DialogTitle>
                    <DialogDescription>Modify details for {user.name}.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="edit-name">Name</Label>
                        <Input id="edit-name" value={userData.name || ''} onChange={(e) => setUserData(d => ({ ...d, name: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="edit-userType">User Type</Label>
                        <Select value={userData.userType} onValueChange={(v) => setUserData(d => ({ ...d, userType: v as UserProfile['userType'] }))}>
                            <SelectTrigger id="edit-userType">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="farmer">Farmer</SelectItem>
                                <SelectItem value="expert">Expert</SelectItem>
                                <SelectItem value="ngo">NGO</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSave}>Save Changes</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default function AdminUsersPage() {
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [userToEdit, setUserToEdit] = useState<UserProfile | null>(null);
    const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);
    const { toast } = useToast();

    const fetchUsers = async () => {
        setIsLoading(true);
        const allUsers = await getUsers();
        setUsers(allUsers.sort((a, b) => a.name.localeCompare(b.name)));
        setIsLoading(false);
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleUpdateUser = async (farmerId: string, data: Partial<UserProfile>) => {
        try {
            await updateUserProfile(farmerId, data);
            toast({ title: "User Updated", description: "The user's details have been saved." });
            fetchUsers(); // Re-fetch users to update the list
        } catch (error: any) {
            toast({ variant: "destructive", title: "Update Failed", description: error.message });
        } finally {
            setUserToEdit(null);
        }
    };

    const handleDeleteUser = async (farmerId: string) => {
        if (!farmerId) return;
        try {
            await deleteUserProfile(farmerId);
            toast({ title: "User Deleted", description: "The user has been permanently removed." });
            fetchUsers();
        } catch (error: any) {
            toast({ variant: "destructive", title: "Deletion Failed", description: error.message });
        } finally {
            setUserToDelete(null);
        }
    };

    const handleToggleSuspend = async (user: UserProfile) => {
        const newStatus = user.status === 'suspended' ? 'active' : 'suspended';
        try {
            await updateUserProfile(user.farmerId, { status: newStatus });
            toast({ title: "Status Updated", description: `${user.name} has been ${newStatus}.` });
            fetchUsers();
        } catch (error: any) {
            toast({ variant: "destructive", title: "Update Failed", description: error.message });
        }
    };

    const getUserTypeBadge = (userType?: string) => {
        switch (userType) {
            case 'admin': return <Badge variant="destructive">Admin</Badge>;
            case 'expert': return <Badge className="bg-blue-500 text-white hover:bg-blue-500/80">Expert</Badge>;
            case 'ngo': return <Badge className="bg-green-500 text-white hover:bg-green-500/80">NGO</Badge>;
            default: return <Badge variant="secondary">Farmer</Badge>;
        }
    };
    
    const getStatusBadge = (status?: string) => {
        switch (status) {
            case 'suspended':
                return <Badge variant="outline" className="text-destructive border-destructive">Suspended</Badge>;
            default:
                return <Badge variant="outline" className="text-green-600 border-green-600">Active</Badge>;
        }
    }

    if (isLoading) {
        return <div className="flex h-full items-center justify-center"><Spinner className="h-8 w-8" /></div>;
    }

    return (
        <div className="p-4 md:p-8">
            <EditUserDialog user={userToEdit} onSave={handleUpdateUser} onClose={() => setUserToEdit(null)} />
            
            <AlertDialog open={!!userToDelete} onOpenChange={(isOpen) => !isOpen && setUserToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the user account for <span className="font-bold">{userToDelete?.name}</span>.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeleteUser(userToDelete!.farmerId)} className="bg-destructive hover:bg-destructive/90">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold font-headline">User Management</h1>
                <Button>
                    <UserPlus className="mr-2 h-4 w-4" /> Add user
                </Button>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Users</CardTitle>
                    <CardDescription>A list of all users in the application. Found {users.length} users.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>User</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="hidden md:table-cell">Location</TableHead>
                                <TableHead>
                                    <span className="sr-only">Actions</span>
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                           {users.map(user => (
                               <TableRow key={user.farmerId} className={user.status === 'suspended' ? 'bg-muted/50' : ''}>
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
                                    <TableCell>{getStatusBadge(user.status)}</TableCell>
                                    <TableCell className="hidden md:table-cell">{user.city && user.state ? `${user.city}, ${user.state}`: 'N/A'}</TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button aria-haspopup="true" size="icon" variant="ghost" disabled={user.userType === 'admin'}>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                    <span className="sr-only">Toggle menu</span>
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => setUserToEdit(user)}>
                                                    <Edit className="mr-2 h-4 w-4" /> Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleToggleSuspend(user)}>
                                                    {user.status === 'suspended' ? (
                                                        <><CheckCircle className="mr-2 h-4 w-4" /> Unsuspend</>
                                                    ) : (
                                                        <><XCircle className="mr-2 h-4 w-4" /> Suspend</>
                                                    )}
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setUserToDelete(user)}>
                                                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                                                </DropdownMenuItem>
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
