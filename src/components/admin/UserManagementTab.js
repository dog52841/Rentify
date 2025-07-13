import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useToast } from '../../hooks/use-toast';
import { Loader2, CheckCircle, XCircle, Search, RefreshCw, Check, ShieldCheck, UserX, Clipboard, X, Calendar, MoreHorizontal, Shield, UserCog, Ban } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { format, formatDistanceToNow } from 'date-fns';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, } from '../ui/dropdown-menu';
import { Input } from '../ui/input';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, } from '../ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
const getRoleVariant = (role) => {
    return role === 'admin' ? 'destructive' : 'secondary';
};
const getVerifiedVariant = (isVerified) => {
    return isVerified ? 'success' : 'outline';
};
export const UserManagementTab = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updatingUser, setUpdatingUser] = useState({});
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');
    const [actionUser, setActionUser] = useState(null);
    const [banReason, setBanReason] = useState('');
    const [banDuration, setBanDuration] = useState('7');
    const [newRole, setNewRole] = useState('user');
    const [selectedUser, setSelectedUser] = useState(null);
    const [userHistory, setUserHistory] = useState([]);
    const [modalLoading, setModalLoading] = useState(false);
    const fetchUsers = async () => {
        setLoading(true);
        const { data, error } = await supabase.rpc('search_users', { search_term: searchTerm || '' });
        if (error) {
            toast({
                variant: 'destructive',
                title: 'Failed to fetch users',
                description: error.message,
            });
        }
        else {
            setUsers(data || []);
        }
        setLoading(false);
    };
    const handleSearch = (e) => {
        e.preventDefault();
        fetchUsers();
    };
    useEffect(() => {
        fetchUsers();
    }, []);
    const handleSetRole = async (userId, role) => {
        setUpdatingUser(prev => ({ ...prev, [userId]: true }));
        const { error } = await supabase.rpc('set_user_role', { p_user_id: userId, p_role: role });
        if (error) {
            toast({ variant: 'destructive', title: 'Update Failed', description: error.message });
        }
        else {
            toast({ title: 'User Role Updated' });
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u));
        }
        setUpdatingUser(prev => ({ ...prev, [userId]: false }));
    };
    const handleSetVerification = async (userId, verify) => {
        setUpdatingUser(prev => ({ ...prev, [userId]: true }));
        const { error } = await supabase.rpc('set_user_verification', { p_user_id: userId, p_is_verified: verify });
        if (error) {
            toast({ variant: 'destructive', title: 'Update Failed', description: error.message });
        }
        else {
            toast({ title: verify ? 'User Verified' : 'User Unverified' });
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_verified: verify } : u));
        }
        setUpdatingUser(prev => ({ ...prev, [userId]: false }));
    };
    const handleSetBanStatus = async (userId, ban, reason, duration) => {
        setUpdatingUser(prev => ({ ...prev, [userId]: true }));
        const { error } = await supabase.rpc('set_user_ban_status', {
            p_user_id: userId,
            p_is_banned: ban,
            p_reason: reason,
            p_duration_days: duration
        });
        if (error) {
            toast({ variant: 'destructive', title: 'Update Failed', description: error.message });
        }
        else {
            toast({ title: ban ? 'User Banned' : 'User Unbanned' });
            fetchUsers(); // Refresh to show updated data with ban expiration
        }
        setUpdatingUser(prev => ({ ...prev, [userId]: false }));
    };
    const performAction = () => {
        if (!actionUser)
            return;
        if (actionUser.action === 'ban') {
            handleSetBanStatus(actionUser.user.id, true, banReason, parseInt(banDuration));
        }
        else if (actionUser.action === 'role') {
            handleSetRole(actionUser.user.id, newRole);
        }
        else if (actionUser.action === 'verify') {
            handleSetVerification(actionUser.user.id, !actionUser.user.is_verified);
        }
        setActionUser(null);
        setBanReason('');
        setBanDuration('7');
    };
    const openDetailsModal = async (user) => {
        setSelectedUser(user);
        setModalLoading(true);
        const { data, error } = await supabase
            .from('admin_activity_log')
            .select('*')
            .eq('target_id', user.id)
            .order('created_at', { ascending: false });
        if (error) {
            toast({ title: 'Error fetching history', description: error.message, variant: 'destructive' });
        }
        setUserHistory(data || []);
        setModalLoading(false);
    };
    const handleCopyId = (id) => {
        navigator.clipboard.writeText(id);
        toast({ title: 'Copied to clipboard!' });
    };
    const getDialogContent = () => {
        if (!actionUser)
            return null;
        if (actionUser.action === 'ban') {
            return (_jsxs(_Fragment, { children: [_jsxs(AlertDialogHeader, { children: [_jsx(AlertDialogTitle, { children: "Ban User" }), _jsxs(AlertDialogDescription, { children: ["You are about to ban ", actionUser.user.full_name, " (", actionUser.user.email, "). Please provide a reason and duration."] })] }), _jsxs("div", { className: "py-4 space-y-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx("label", { htmlFor: "reason", className: "text-sm font-medium", children: "Reason for ban" }), _jsx(Input, { id: "reason", placeholder: "Violation of terms, inappropriate content, etc.", value: banReason, onChange: (e) => setBanReason(e.target.value) })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { htmlFor: "duration", className: "text-sm font-medium", children: "Ban Duration" }), _jsxs(Select, { value: banDuration, onValueChange: setBanDuration, children: [_jsx(SelectTrigger, { className: "bg-background", children: _jsx(SelectValue, { placeholder: "Select duration" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "1", children: "1 day" }), _jsx(SelectItem, { value: "3", children: "3 days" }), _jsx(SelectItem, { value: "7", children: "7 days" }), _jsx(SelectItem, { value: "14", children: "14 days" }), _jsx(SelectItem, { value: "30", children: "30 days" }), _jsx(SelectItem, { value: "90", children: "90 days" }), _jsx(SelectItem, { value: "365", children: "1 year" })] })] })] })] })] }));
        }
        if (actionUser.action === 'role') {
            return (_jsxs(_Fragment, { children: [_jsxs(AlertDialogHeader, { children: [_jsx(AlertDialogTitle, { children: "Change User Role" }), _jsxs(AlertDialogDescription, { children: ["Change the role for ", _jsx("span", { className: "font-bold text-foreground", children: actionUser.user.full_name }), ". Admins have rights to manage the site."] })] }), _jsx("div", { className: "py-4", children: _jsxs(Select, { value: newRole, onValueChange: (value) => setNewRole(value), children: [_jsx(SelectTrigger, { className: "bg-background", children: _jsx(SelectValue, { placeholder: "Select role" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "user", children: "User" }), _jsx(SelectItem, { value: "admin", children: "Admin" })] })] }) })] }));
        }
        if (actionUser.action === 'verify') {
            return (_jsx(_Fragment, { children: _jsxs(AlertDialogHeader, { children: [_jsxs(AlertDialogTitle, { children: [actionUser.user.is_verified ? 'Unverify' : 'Verify', " User"] }), _jsxs(AlertDialogDescription, { children: ["Are you sure you want to ", actionUser.user.is_verified ? 'remove verification from' : 'verify', " ", _jsx("span", { className: "font-bold text-foreground", children: actionUser.user.full_name }), "? Verified users get a badge on their profile and listings."] })] }) }));
        }
        return null;
    };
    return (_jsxs(_Fragment, { children: [_jsxs(Card, { className: "bg-card/50 backdrop-blur-xl border-border/10 shadow-2xl shadow-black/20 mb-6", children: [_jsxs(CardHeader, { children: [_jsxs(CardTitle, { className: "flex items-center gap-2", children: [_jsx(Search, {}), " Search Users"] }), _jsx(CardDescription, { children: "Search for users by name, email, or ID." })] }), _jsx(CardContent, { children: _jsxs("form", { onSubmit: handleSearch, className: "flex items-center gap-2", children: [_jsx(Input, { placeholder: "Search by name or email...", value: searchTerm, onChange: (e) => setSearchTerm(e.target.value), className: "bg-background focus:ring-primary/50" }), _jsx(Button, { type: "submit", disabled: loading, className: "group", children: loading ? _jsx(Loader2, { className: "h-4 w-4 animate-spin" }) : _jsx(Search, { className: "h-4 w-4 group-hover:scale-110 transition-transform" }) }), _jsx(Button, { variant: "ghost", onClick: () => { setSearchTerm(''); fetchUsers(); }, disabled: loading, className: "group", children: _jsx(RefreshCw, { className: "h-4 w-4 group-hover:rotate-180 transition-transform" }) })] }) })] }), _jsxs(Card, { className: "bg-card/50 backdrop-blur-xl border-border/10 shadow-2xl shadow-black/20", children: [_jsxs(CardHeader, { className: "flex flex-row items-center justify-between", children: [_jsxs("div", { children: [_jsx(CardTitle, { children: "User Management" }), _jsx(CardDescription, { children: "Manage user accounts, roles, and bans." })] }), _jsx(Button, { onClick: () => { setSearchTerm(''); fetchUsers(); }, variant: "ghost", size: "icon", disabled: loading, children: _jsx(RefreshCw, { className: `h-4 w-4 ${loading ? 'animate-spin' : ''}` }) })] }), _jsx(CardContent, { children: loading ? (_jsx("div", { className: "flex justify-center items-center py-20", children: _jsx(Loader2, { className: "h-8 w-8 animate-spin" }) })) : (_jsxs(Table, { children: [_jsx(TableHeader, { children: _jsxs(TableRow, { children: [_jsx(TableHead, { children: "User" }), _jsx(TableHead, { children: "Email" }), _jsx(TableHead, { children: "Joined" }), _jsx(TableHead, { className: "text-center", children: "Role" }), _jsx(TableHead, { className: "text-center", children: "Verified" }), _jsx(TableHead, { className: "text-center", children: "Status" }), _jsx(TableHead, { className: "text-right", children: "Actions" })] }) }), _jsx(TableBody, { children: users.map((user) => (_jsxs(TableRow, { onClick: () => openDetailsModal(user), className: "cursor-pointer hover:bg-primary/10 transition-all", children: [_jsx(TableCell, { className: "font-medium", children: user.full_name || 'N/A' }), _jsx(TableCell, { children: user.email }), _jsx(TableCell, { children: format(new Date(user.created_at), 'MMM dd, yyyy') }), _jsx(TableCell, { className: "text-center", children: _jsx(Badge, { variant: getRoleVariant(user.role), className: "capitalize", children: user.role }) }), _jsx(TableCell, { className: "text-center", children: _jsxs(Badge, { variant: getVerifiedVariant(user.is_verified), children: [user.is_verified ? _jsx(CheckCircle, { className: "mr-1 h-3 w-3" }) : _jsx(XCircle, { className: "mr-1 h-3 w-3" }), user.is_verified ? 'Verified' : 'Not Verified'] }) }), _jsx(TableCell, { className: "text-center", children: user.is_banned && _jsx(Ban, { className: "h-5 w-5 text-destructive mx-auto" }) }), _jsx(TableCell, { className: "text-right", children: updatingUser[user.id] ? (_jsx(Loader2, { className: "h-4 w-4 animate-spin ml-auto" })) : (_jsxs(DropdownMenu, { children: [_jsx(DropdownMenuTrigger, { asChild: true, children: _jsxs(Button, { variant: "ghost", className: "h-8 w-8 p-0", onClick: (e) => e.stopPropagation(), children: [_jsx("span", { className: "sr-only", children: "Open menu" }), _jsx(MoreHorizontal, { className: "h-4 w-4" })] }) }), _jsxs(DropdownMenuContent, { align: "end", onClick: (e) => e.stopPropagation(), children: [_jsx(DropdownMenuLabel, { children: "User Actions" }), _jsxs(DropdownMenuItem, { onClick: () => { setNewRole(user.role === 'admin' ? 'user' : 'admin'); setActionUser({ user, action: 'role' }); }, children: [_jsx(UserCog, { className: "mr-2 h-4 w-4" }), "Change Role"] }), _jsxs(DropdownMenuItem, { onClick: () => handleCopyId(user.id), children: [_jsx(Clipboard, { className: "mr-2 h-4 w-4" }), "Copy User ID"] }), _jsxs(DropdownMenuItem, { onClick: () => openDetailsModal(user), children: [_jsx(Calendar, { className: "mr-2 h-4 w-4" }), "View History"] }), _jsx(DropdownMenuSeparator, {}), _jsx(DropdownMenuItem, { onClick: () => setActionUser({ user, action: 'verify' }), children: user.is_verified ?
                                                                        _jsxs(_Fragment, { children: [_jsx(ShieldCheck, { className: "mr-2 h-4 w-4 text-green-500" }), "Unverify User"] }) :
                                                                        _jsxs(_Fragment, { children: [_jsx(Shield, { className: "mr-2 h-4 w-4" }), "Verify User"] }) }), _jsx(DropdownMenuSeparator, {}), user.is_banned ? (_jsxs(DropdownMenuItem, { onClick: () => handleSetBanStatus(user.id, false), children: [_jsx(CheckCircle, { className: "mr-2 h-4 w-4 text-green-500" }), "Unban User"] })) : (_jsxs(DropdownMenuItem, { onClick: () => setActionUser({ user, action: 'ban' }), children: [_jsx(Ban, { className: "mr-2 h-4 w-4 text-red-500" }), "Ban User"] }))] })] })) })] }, user.id))) })] })) })] }), _jsx(AlertDialog, { open: !!actionUser, onOpenChange: (open) => !open && setActionUser(null), children: _jsxs(AlertDialogContent, { children: [getDialogContent(), _jsxs(AlertDialogFooter, { children: [_jsx(AlertDialogCancel, { onClick: () => setActionUser(null), children: "Cancel" }), _jsx(AlertDialogAction, { onClick: performAction, children: "Confirm" })] })] }) }), _jsx(Dialog, { open: !!selectedUser, onOpenChange: (open) => !open && setSelectedUser(null), children: _jsx(DialogContent, { className: "max-w-3xl glassmorphic", children: selectedUser && (_jsxs(_Fragment, { children: [_jsxs(DialogHeader, { children: [_jsxs(DialogTitle, { className: "flex items-center justify-between", children: [selectedUser.full_name || 'User Details', _jsx(Button, { variant: "ghost", size: "icon", onClick: () => setSelectedUser(null), children: _jsx(X, { className: "h-4 w-4" }) })] }), _jsxs(DialogDescription, { children: ["Details for ", selectedUser.email, _jsx(Button, { variant: "ghost", size: "icon", className: "ml-2 h-6 w-6", onClick: () => handleCopyId(selectedUser.id), children: _jsx(Clipboard, { className: "h-4 w-4" }) })] })] }), _jsxs("div", { className: "py-4 space-y-6", children: [_jsxs("div", { className: "text-sm space-y-2", children: [_jsxs("p", { children: [_jsx("strong", { children: "User ID:" }), " ", _jsx("span", { className: "font-mono", children: selectedUser.id })] }), _jsxs("p", { children: [_jsx("strong", { children: "Role:" }), " ", _jsx(Badge, { variant: getRoleVariant(selectedUser.role), children: selectedUser.role })] }), _jsxs("p", { children: [_jsx("strong", { children: "Joined:" }), " ", format(new Date(selectedUser.created_at), 'PPP p')] }), _jsxs("p", { children: [_jsx("strong", { children: "Status:" }), " ", selectedUser.is_banned ? _jsx("span", { className: "text-destructive font-semibold", children: "Banned" }) : _jsx("span", { className: "text-green-500 font-semibold", children: "Active" })] }), selectedUser.is_banned && (_jsxs(_Fragment, { children: [_jsxs("p", { children: [_jsx("strong", { children: "Ban Reason:" }), " ", selectedUser.ban_reason || 'N/A'] }), _jsxs("p", { children: [_jsx("strong", { children: "Ban Expires:" }), " ", selectedUser.ban_expires_at ? formatDistanceToNow(new Date(selectedUser.ban_expires_at), { addSuffix: true }) : 'Permanent'] })] }))] }), _jsxs("div", { children: [_jsx("h4", { className: "font-semibold mb-2", children: "Admin Action History" }), modalLoading ? _jsx(Loader2, { className: "h-5 w-5 animate-spin" }) : (_jsx("div", { className: "max-h-60 overflow-y-auto pr-2", children: userHistory.length > 0 ? (_jsxs(Table, { children: [_jsx(TableHeader, { children: _jsxs(TableRow, { children: [_jsx(TableHead, { children: "Action" }), _jsx(TableHead, { children: "Details" }), _jsx(TableHead, { children: "Timestamp" })] }) }), _jsx(TableBody, { children: userHistory.map((entry) => (_jsxs(TableRow, { children: [_jsx(TableCell, { className: "capitalize", children: entry.action.replace('_', ' ') }), _jsx(TableCell, { className: "text-xs", children: entry.details ? JSON.stringify(entry.details) : 'N/A' }), _jsx(TableCell, { children: format(new Date(entry.created_at), 'Pp') })] }, entry.id))) })] })) : (_jsx("p", { className: "text-muted-foreground text-sm", children: "No history found for this user." })) }))] })] })] })) }) })] }));
};
