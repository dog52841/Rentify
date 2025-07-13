import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useToast } from '../../hooks/use-toast';
import { useAuth } from '../../contexts/AuthContext';
import { Loader2, CheckCircle, Search, RefreshCw, MoreHorizontal, Shield, UserCog, Ban, ShieldCheck, UserX, Clipboard, ExternalLink, Mail, Users, ShieldOff, ShieldX } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { format, formatDistanceToNowStrict } from 'date-fns';
import { Link } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Input } from '../ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { AnimatePresence, motion } from 'framer-motion';
import { useDebounce } from '../../hooks/use-debounce';

type UserAdmin = {
    id: string;
    full_name: string;
    email: string;
    role: 'user' | 'admin';
    is_banned: boolean;
    is_verified: boolean;
    created_at: string;
    ban_reason?: string;
    ban_expires_at?: string;
};

type AdminActivityLog = {
    id: string;
    created_at: string;
    actor: { full_name: string };
    action: string;
    details?: {
        reason?: string;
        duration_days?: number;
        old_role?: string;
        new_role?: string;
    };
};

const getRoleVariant = (role: string) => {
    return role === 'admin' ? 'destructive' : 'secondary';
}

export const UserManagementTab = () => {
    const { user: adminUser, profile: adminProfile } = useAuth();
    const { toast } = useToast();
    const [users, setUsers] = useState<UserAdmin[]>([]);
    const [loading, setLoading] = useState(true);
    const [updatingUser, setUpdatingUser] = useState<Record<string, boolean>>({});
    
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearchTerm = useDebounce(searchTerm, 300);
    const [roleFilter, setRoleFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');

    const [actionUser, setActionUser] = useState<{user: UserAdmin, action: 'ban' | 'unban' | 'role'} | null>(null);
    const [banReason, setBanReason] = useState('');
    const [banDuration, setBanDuration] = useState(7);
    const [newRole, setNewRole] = useState<'user' | 'admin'>('user');
    
    const [selectedUser, setSelectedUser] = useState<UserAdmin | null>(null);
    const [userHistory, setUserHistory] = useState<AdminActivityLog[]>([]);
    const [modalLoading, setModalLoading] = useState(false);

    const fetchUsers = useCallback(async () => {
        if (!adminUser) return;
        setLoading(true);
        const { data, error } = await supabase.rpc('get_all_users_admin', { 
            p_search_term: debouncedSearchTerm,
            p_filter_by_role: roleFilter,
            p_filter_by_status: statusFilter
        });

        if (error) {
            toast({
                variant: 'destructive',
                title: 'Failed to fetch users',
                description: error.message,
            });
        } else {
            setUsers(data || []);
        }
        setLoading(false);
    }, [adminUser, debouncedSearchTerm, roleFilter, statusFilter, toast]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleUserAction = useCallback(async (userId: string, action: 'toggle_ban' | 'toggle_verify' | 'make_admin' | 'make_user') => {
        if (!adminProfile) {
            toast({ title: "Authentication Error", description: "Could not identify administrator.", variant: "destructive" });
            return;
        }

        const originalUsers = [...users];
        const optimisticUpdate = (field: 'is_banned' | 'is_verified' | 'role', value: any) => {
            setUsers(prevUsers => prevUsers.map(user =>
                user.id === userId ? { ...user, [field]: value } : user
            ));
        };

        try {
            let rpcName = '';
            let params: any = { p_user_id: userId, p_admin_id: adminProfile.id };
            let field: 'is_banned' | 'is_verified' | 'role' = 'role';
            let value: any;

            switch (action) {
                case 'toggle_ban':
                    rpcName = 'set_user_ban_status';
                    const userToBan = users.find(u => u.id === userId);
                    value = !(userToBan?.is_banned ?? false);
                    params.p_is_banned = value;
                    field = 'is_banned';
                    break;
                case 'toggle_verify':
                    rpcName = 'set_user_verification';
                    const userToVerify = users.find(u => u.id === userId);
                    value = !(userToVerify?.is_verified ?? false);
                    params.p_is_verified = value;
                    field = 'is_verified';
                    break;
                case 'make_admin':
                    rpcName = 'set_user_role';
                    value = 'admin';
                    params.p_new_role = value;
                    field = 'role';
                    break;
                case 'make_user':
                    rpcName = 'set_user_role';
                    value = 'user';
                    params.p_new_role = value;
                    field = 'role';
                    break;
                default:
                    return;
            }

            optimisticUpdate(field, value);

            const { error } = await supabase.rpc(rpcName, params);

            if (error) throw error;

            toast({
                title: 'Success',
                description: `User has been successfully updated.`,
            });
            // No need to refetch, optimistic update is sufficient
        } catch (error: any) {
            setUsers(originalUsers); // Revert on error
            toast({
                title: 'Error updating user',
                description: error.message,
                variant: 'destructive',
            });
        }
    }, [users, toast, adminProfile]);

    const handleSetRole = (user: UserAdmin) => {
        setNewRole(user.role === 'admin' ? 'user' : 'admin');
        setActionUser({ user, action: 'role' });
    }

    const handleSetBan = (user: UserAdmin) => {
        setActionUser({ user, action: 'ban' });
    }

    const handleUnban = (user: UserAdmin) => {
        handleUserAction(user.id, 'toggle_ban');
    };
    
    const handleSetVerification = (user: UserAdmin) => {
        handleUserAction(user.id, 'toggle_verify');
    };

    const performAction = () => {
        if (!actionUser || !adminUser) return;
        
        const { user, action } = actionUser;
        
        if (action === 'ban') {
            handleUserAction(user.id, 'toggle_ban');
        } else if (action === 'role') {
            handleUserAction(user.id, 'make_admin');
        }
        
        setActionUser(null);
        setBanReason('');
        setBanDuration(7);
    };

    const openDetailsModal = async (user: UserAdmin) => {
        setSelectedUser(user);
        setModalLoading(true);
        const { data, error } = await supabase
            .from('admin_activity_log')
            .select('*, actor:profiles(full_name)')
            .eq('target_id', user.id)
            .order('created_at', { ascending: false });
        
        if (error) {
            toast({ title: 'Error fetching history', description: error.message, variant: 'destructive' });
        }
        setUserHistory(data || []);
        setModalLoading(false);
    };

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        toast({ title: 'Copied to clipboard!' });
    };

    if (loading) {
        return (
            <Card className="bg-card/50 backdrop-blur-xl border-border/10 shadow-lg">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Users /> User Management</CardTitle>
                    <CardDescription>Manage user roles, permissions, and access.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between gap-4 mb-4">
                        <div className="w-full max-w-sm h-10 bg-muted/50 rounded-md animate-pulse"></div>
                    </div>
                    <div className="border rounded-lg">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>User</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Joined</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {[...Array(5)].map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell><div className="h-5 w-24 bg-muted/50 rounded animate-pulse"></div></TableCell>
                                        <TableCell><div className="h-5 w-32 bg-muted/50 rounded animate-pulse"></div></TableCell>
                                        <TableCell><div className="h-5 w-12 bg-muted/50 rounded animate-pulse"></div></TableCell>
                                        <TableCell><div className="h-5 w-16 bg-muted/50 rounded animate-pulse"></div></TableCell>
                                        <TableCell><div className="h-5 w-20 bg-muted/50 rounded animate-pulse"></div></TableCell>
                                        <TableCell><div className="h-8 w-8 ml-auto bg-muted/50 rounded animate-pulse"></div></TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <AnimatePresence>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
            <Card className="bg-card/50 backdrop-blur-xl border-border/10 shadow-2xl shadow-black/20">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Search /> Filter & Search Users</CardTitle>
                    <CardDescription>Find specific users by name or email, or filter by their status.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Input 
                        placeholder="Search by name or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="md:col-span-1"
                    />
                    <Select value={roleFilter} onValueChange={setRoleFilter}>
                        <SelectTrigger><SelectValue placeholder="Filter by role..." /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Roles</SelectItem>
                            <SelectItem value="user">User</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                    </Select>
                     <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger><SelectValue placeholder="Filter by status..." /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="banned">Banned</SelectItem>
                            <SelectItem value="verified">Verified</SelectItem>
                        </SelectContent>
                    </Select>
                </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur-xl border-border/10 shadow-2xl shadow-black/20">
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>User Accounts</CardTitle>
                        <CardDescription>Manage all registered user accounts.</CardDescription>
                    </div>
                     <Button onClick={fetchUsers} variant="ghost" size="icon" disabled={loading}>
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center items-center py-20">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                        <div className="border rounded-lg overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>User</TableHead>
                                        <TableHead>Role</TableHead>
                                        <TableHead className="text-center">Status</TableHead>
                                        <TableHead>Joined</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {users.map((user: UserAdmin) => (
                                        <motion.tr
                                            layout
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
                                            transition={{ duration: 0.3, ease: "easeInOut" }}
                                            key={user.id}
                                            className="hover:bg-primary/5"
                                        >
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <div className="font-medium">{user.full_name}</div>
                                                    <div className="text-sm text-muted-foreground">{user.email}</div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={getRoleVariant(user.role)} className="capitalize">{user.role}</Badge>
                                            </TableCell>
                                            <TableCell className="text-center space-x-2">
                                                {user.is_banned && <Badge variant="destructive">Banned</Badge>}
                                                {user.is_verified && <Badge variant="success">Verified</Badge>}
                                            </TableCell>
                                            <TableCell>{format(new Date(user.created_at), 'MMM dd, yyyy')}</TableCell>
                                            <TableCell className="text-right">
                                                 {updatingUser[user.id] ? (
                                                    <Loader2 className="h-4 w-4 animate-spin ml-auto" />
                                                ) : (
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" className="h-8 w-8 p-0" onClick={(e) => e.stopPropagation()}>
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                                                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                            <DropdownMenuItem onSelect={() => openDetailsModal(user)}>View Details</DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            {user.is_verified ? (
                                                                <DropdownMenuItem onClick={() => handleUserAction(user.id, 'toggle_verify')}><ShieldOff className="mr-2 h-4 w-4" /> Un-verify</DropdownMenuItem>
                                                            ) : (
                                                                <DropdownMenuItem onClick={() => handleUserAction(user.id, 'toggle_verify')}><ShieldCheck className="mr-2 h-4 w-4" /> Verify</DropdownMenuItem>
                                                            )}
                                                            {user.role !== 'admin' ? (
                                                                <DropdownMenuItem onClick={() => handleUserAction(user.id, 'make_admin')}><UserCog className="mr-2 h-4 w-4" /> Make Admin</DropdownMenuItem>
                                                            ) : (
                                                                <DropdownMenuItem onClick={() => handleUserAction(user.id, 'make_user')}><User className="mr-2 h-4 w-4" /> Make User</DropdownMenuItem>
                                                            )}
                                                            <DropdownMenuSeparator />
                                                            {user.is_banned ? (
                                                                <DropdownMenuItem onClick={() => handleUserAction(user.id, 'toggle_ban')} className="text-green-600 focus:text-green-700"><CheckCircle className="mr-2 h-4 w-4" /> Un-ban</DropdownMenuItem>
                                                            ) : (
                                                                <DropdownMenuItem onClick={() => handleUserAction(user.id, 'toggle_ban')} className="text-destructive focus:text-destructive-foreground focus:bg-destructive"><ShieldX className="mr-2 h-4 w-4" /> Ban User</DropdownMenuItem>
                                                            )}
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem onSelect={() => handleCopy(user.id)}>
                                                                <Clipboard className="mr-2 h-4 w-4" /> Copy User ID
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                )}
                                            </TableCell>
                                        </motion.tr>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
            
            <AlertDialog open={!!actionUser} onOpenChange={(open) => !open && setActionUser(null)}>
                <AlertDialogContent>
                    {actionUser?.action === 'ban' && (
                        <>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Ban User: {actionUser.user.full_name}</AlertDialogTitle>
                                <AlertDialogDescription>Please provide a reason and duration for the ban.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <div className="py-4 space-y-4">
                                <Input 
                                    placeholder="Reason for ban (e.g., TOS violation)..."
                                    value={banReason}
                                    onChange={(e) => setBanReason(e.target.value)}
                                />
                                <Select value={banDuration.toString()} onValueChange={(v) => setBanDuration(parseInt(v))}>
                                    <SelectTrigger><SelectValue placeholder="Select duration" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="1">1 Day</SelectItem>
                                        <SelectItem value="7">7 Days</SelectItem>
                                        <SelectItem value="30">30 Days</SelectItem>
                                        <SelectItem value="90">90 Days</SelectItem>
                                        <SelectItem value="365">1 Year (Permanent)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </>
                    )}
                    {actionUser?.action === 'role' && (
                         <>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Change Role for {actionUser.user.full_name}</AlertDialogTitle>
                                <AlertDialogDescription>
                                    You are changing this user's role to <span className="font-bold capitalize text-foreground">{newRole}</span>.
                                    Admins have full access to site management tools.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                        </>
                    )}
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setActionUser(null)}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={performAction}>Confirm</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <Dialog open={!!selectedUser} onOpenChange={(open) => { if (!open) setSelectedUser(null); }}>
                <DialogContent className="max-w-3xl bg-card/80 backdrop-blur-xl border-border/20">
                    {selectedUser && (
                        <>
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-4 text-2xl">
                                    {selectedUser.full_name}
                                    <Badge variant={getRoleVariant(selectedUser.role)} className="capitalize">{selectedUser.role}</Badge>
                                </DialogTitle>
                                <DialogDescription className="flex items-center gap-4 pt-1">
                                    <span className="flex items-center gap-1.5"><Mail className="h-3 w-3" /> {selectedUser.email}</span>
                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleCopy(selectedUser.email)}><Clipboard className="h-4 w-4" /></Button>
                                </DialogDescription>
                            </DialogHeader>
                            <div className="py-4 space-y-6 max-h-[70vh] overflow-y-auto">
                                <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
                                    <div className="space-y-1">
                                        <p className="font-medium text-muted-foreground">Joined</p>
                                        <p>{format(new Date(selectedUser.created_at), 'PPP p')}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="font-medium text-muted-foreground">User ID</p>
                                        <p className="flex items-center gap-2 font-mono text-xs">{selectedUser.id} <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => handleCopy(selectedUser.id)}><Clipboard className="h-3 w-3" /></Button></p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="font-medium text-muted-foreground">Verification Status</p>
                                        <p>{selectedUser.is_verified ? 'Verified' : 'Not Verified'}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="font-medium text-muted-foreground">Ban Status</p>
                                        <p>{selectedUser.is_banned ? 'Banned' : 'Active'}</p>
                                    </div>
                                    {selectedUser.is_banned && (
                                        <div className="space-y-1 col-span-2">
                                            <p className="font-medium text-destructive">Ban Details</p>
                                            <div className="p-3 bg-destructive/10 rounded-md border border-destructive/20 space-y-1">
                                                <p><span className="font-semibold">Reason:</span> {selectedUser.ban_reason || 'N/A'}</p>
                                                {selectedUser.ban_expires_at && <p><span className="font-semibold">Expires:</span> {format(new Date(selectedUser.ban_expires_at), 'PPP p')} ({formatDistanceToNowStrict(new Date(selectedUser.ban_expires_at))} from now)</p>}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <h4 className="font-semibold mb-2">Admin Action History</h4>
                                    {modalLoading ? <Loader2 className="h-5 w-5 animate-spin"/> : (
                                        <div className="max-h-60 overflow-y-auto pr-2 border rounded-md">
                                            {userHistory.length > 0 ? (
                                                <Table>
                                                    <TableHeader><TableRow><TableHead>Action</TableHead><TableHead>Admin</TableHead><TableHead>Details</TableHead><TableHead>Timestamp</TableHead></TableRow></TableHeader>
                                                    <TableBody>
                                                        {userHistory.map(entry => (
                                                            <TableRow key={entry.id}>
                                                                <TableCell className="capitalize">{entry.action.replace(/_/g, ' ')}</TableCell>
                                                                <TableCell>{entry.actor.full_name}</TableCell>
                                                                <TableCell className="text-xs max-w-[200px] truncate">{entry.details ? JSON.stringify(entry.details) : 'N/A'}</TableCell>
                                                                <TableCell>{format(new Date(entry.created_at), 'Pp')}</TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            ) : (
                                                <p className="text-muted-foreground text-sm p-4 text-center">No history found for this user.</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                             <DialogFooter>
                                <Button variant="secondary" onClick={() => setSelectedUser(null)}>Close</Button>
                                <Button asChild>
                                    <Link to={`/profile/${selectedUser.id}`} target="_blank">
                                        View Profile <ExternalLink className="ml-2 h-4 w-4"/>
                                    </Link>
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>

            {users.length === 0 && !loading && (
                <div className="text-center py-20 bg-card/20 rounded-lg border-2 border-dashed border-border/20">
                    <Users className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-2 text-lg font-medium">No users found</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Try adjusting your search filters.
                    </p>
                </div>
            )}
        </motion.div>
        </AnimatePresence>
    );
}; 