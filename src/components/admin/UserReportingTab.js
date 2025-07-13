import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useToast } from '../../hooks/use-toast';
import { Loader2, CheckCircle, XCircle, RefreshCw, Check, AlertCircle, UserX, Shield, Clock, User, MoreHorizontal, MessageSquare, Ban } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { format, formatDistanceToNow } from 'date-fns';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, } from '../ui/dropdown-menu';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, } from '../ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/Avatar';
const getStatusVariant = (status) => {
    switch (status) {
        case 'pending': return 'warning';
        case 'dismissed': return 'secondary';
        case 'actioned': return 'success';
        default: return 'default';
    }
};
export const UserReportingTab = () => {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processingAction, setProcessingAction] = useState({});
    const [selectedReport, setSelectedReport] = useState(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [activeFilter, setActiveFilter] = useState('pending');
    const [banDialogOpen, setBanDialogOpen] = useState(false);
    const [banReason, setBanReason] = useState('');
    const [banDuration, setBanDuration] = useState('7');
    const [adminNote, setAdminNote] = useState('');
    const { toast } = useToast();
    const fetchReports = async (filter = activeFilter) => {
        setLoading(true);
        try {
            const { data, error } = await supabase.rpc('get_user_reports', {
                p_status_filter: filter === 'all' ? null : filter
            });
            if (error)
                throw error;
            setReports(data || []);
        }
        catch (error) {
            toast({
                variant: 'destructive',
                title: 'Failed to fetch reports',
                description: error.message,
            });
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchReports();
    }, [activeFilter]);
    const handleViewDetails = (report) => {
        setSelectedReport(report);
        setIsDetailModalOpen(true);
    };
    const handleDismissReport = async (reportId) => {
        setProcessingAction(prev => ({ ...prev, [reportId]: true }));
        try {
            const { error } = await supabase.rpc('update_user_report_status', {
                p_report_id: reportId,
                p_status: 'dismissed',
                p_admin_note: adminNote
            });
            if (error)
                throw error;
            toast({ title: 'Report dismissed' });
            fetchReports();
            setIsDetailModalOpen(false);
            setSelectedReport(null);
            setAdminNote('');
        }
        catch (error) {
            toast({
                variant: 'destructive',
                title: 'Action failed',
                description: error.message
            });
        }
        finally {
            setProcessingAction(prev => ({ ...prev, [reportId]: false }));
        }
    };
    const handleActionReport = async (reportId) => {
        setProcessingAction(prev => ({ ...prev, [reportId]: true }));
        try {
            const { error } = await supabase.rpc('update_user_report_status', {
                p_report_id: reportId,
                p_status: 'actioned',
                p_admin_note: adminNote
            });
            if (error)
                throw error;
            toast({ title: 'Report marked as actioned' });
            fetchReports();
            setIsDetailModalOpen(false);
            setSelectedReport(null);
            setAdminNote('');
        }
        catch (error) {
            toast({
                variant: 'destructive',
                title: 'Action failed',
                description: error.message
            });
        }
        finally {
            setProcessingAction(prev => ({ ...prev, [reportId]: false }));
        }
    };
    const handleBanUser = async () => {
        if (!selectedReport)
            return;
        setProcessingAction(prev => ({ ...prev, [selectedReport.id]: true }));
        try {
            // Ban the user
            const { error: banError } = await supabase.rpc('set_user_ban_status', {
                p_user_id: selectedReport.reported_user_id,
                p_is_banned: true,
                p_reason: banReason,
                p_duration_days: parseInt(banDuration)
            });
            if (banError)
                throw banError;
            // Update report status
            const { error: reportError } = await supabase.rpc('update_user_report_status', {
                p_report_id: selectedReport.id,
                p_status: 'actioned',
                p_admin_note: `User banned for ${banDuration} days. Reason: ${banReason}`
            });
            if (reportError)
                throw reportError;
            toast({ title: 'User banned successfully' });
            fetchReports();
            setBanDialogOpen(false);
            setIsDetailModalOpen(false);
            setSelectedReport(null);
            setBanReason('');
            setBanDuration('7');
        }
        catch (error) {
            toast({
                variant: 'destructive',
                title: 'Ban failed',
                description: error.message
            });
        }
        finally {
            setProcessingAction(prev => ({ ...prev, [selectedReport.id]: false }));
        }
    };
    const handleContactUser = (userId) => {
        // Implement contact user functionality
        toast({ title: 'Contact feature', description: 'This would open a message dialog to contact the user.' });
    };
    return (_jsxs(_Fragment, { children: [_jsxs(Card, { className: "bg-card/50 backdrop-blur-xl border-border/10 shadow-2xl shadow-black/20", children: [_jsxs(CardHeader, { className: "flex flex-row items-center justify-between", children: [_jsxs("div", { children: [_jsx(CardTitle, { children: "User Reports" }), _jsx(CardDescription, { children: "Review and manage user reports submitted by the community" })] }), _jsx(Button, { onClick: () => fetchReports(activeFilter), variant: "ghost", size: "icon", disabled: loading, children: _jsx(RefreshCw, { className: `h-4 w-4 ${loading ? 'animate-spin' : ''}` }) })] }), _jsxs(CardContent, { children: [_jsx(Tabs, { value: activeFilter, onValueChange: setActiveFilter, className: "mb-4", children: _jsxs(TabsList, { className: "grid w-full grid-cols-4", children: [_jsx(TabsTrigger, { value: "pending", className: "text-amber-500 focus:text-amber-600 focus:bg-amber-100 data-[state=active]:bg-amber-100 data-[state=active]:text-amber-700", children: "Pending" }), _jsx(TabsTrigger, { value: "actioned", children: "Actioned" }), _jsx(TabsTrigger, { value: "dismissed", children: "Dismissed" }), _jsx(TabsTrigger, { value: "all", children: "All Reports" })] }) }), loading ? (_jsx("div", { className: "flex justify-center items-center py-20", children: _jsx(Loader2, { className: "h-8 w-8 animate-spin" }) })) : (_jsxs(Table, { children: [_jsx(TableHeader, { children: _jsxs(TableRow, { children: [_jsx(TableHead, { children: "Reported User" }), _jsx(TableHead, { children: "Reported By" }), _jsx(TableHead, { children: "Reason" }), _jsx(TableHead, { children: "Date" }), _jsx(TableHead, { className: "text-center", children: "Status" }), _jsx(TableHead, { className: "text-right", children: "Actions" })] }) }), _jsx(TableBody, { children: reports.length > 0 ? (reports.map((report) => (_jsxs(TableRow, { className: "cursor-pointer hover:bg-primary/5", onClick: () => handleViewDetails(report), children: [_jsx(TableCell, { children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsxs(Avatar, { className: "h-8 w-8", children: [_jsx(AvatarImage, { src: report.reported_user.avatar_url }), _jsx(AvatarFallback, { children: report.reported_user.full_name.charAt(0) })] }), _jsxs("div", { children: [_jsx("div", { className: "font-medium", children: report.reported_user.full_name }), _jsx("div", { className: "text-xs text-muted-foreground", children: report.reported_user.email })] })] }) }), _jsx(TableCell, { children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsxs(Avatar, { className: "h-6 w-6", children: [_jsx(AvatarImage, { src: report.reporter.avatar_url }), _jsx(AvatarFallback, { children: report.reporter.full_name.charAt(0) })] }), _jsx("span", { children: report.reporter.full_name })] }) }), _jsx(TableCell, { className: "max-w-[200px] truncate", children: report.reason }), _jsx(TableCell, { children: formatDistanceToNow(new Date(report.created_at), { addSuffix: true }) }), _jsx(TableCell, { className: "text-center", children: _jsx(Badge, { variant: getStatusVariant(report.status), className: "capitalize", children: report.status }) }), _jsx(TableCell, { className: "text-right", children: _jsxs(DropdownMenu, { children: [_jsx(DropdownMenuTrigger, { asChild: true, onClick: (e) => e.stopPropagation(), children: _jsxs(Button, { variant: "ghost", className: "h-8 w-8 p-0", children: [_jsx("span", { className: "sr-only", children: "Open menu" }), _jsx(MoreHorizontal, { className: "h-4 w-4" })] }) }), _jsxs(DropdownMenuContent, { align: "end", onClick: (e) => e.stopPropagation(), children: [_jsx(DropdownMenuLabel, { children: "Actions" }), _jsxs(DropdownMenuItem, { onClick: () => handleViewDetails(report), children: [_jsx(AlertCircle, { className: "mr-2 h-4 w-4" }), " View Details"] }), report.status === 'pending' && (_jsxs(_Fragment, { children: [_jsx(DropdownMenuSeparator, {}), _jsxs(DropdownMenuItem, { onClick: () => {
                                                                                    setSelectedReport(report);
                                                                                    setBanDialogOpen(true);
                                                                                }, className: "text-destructive focus:text-destructive", children: [_jsx(Ban, { className: "mr-2 h-4 w-4" }), " Ban User"] }), _jsxs(DropdownMenuItem, { onClick: () => {
                                                                                    setSelectedReport(report);
                                                                                    setIsDetailModalOpen(true);
                                                                                }, children: [_jsx(Check, { className: "mr-2 h-4 w-4" }), " Take Action"] }), _jsxs(DropdownMenuItem, { onClick: () => {
                                                                                    setSelectedReport(report);
                                                                                    setIsDetailModalOpen(true);
                                                                                }, children: [_jsx(XCircle, { className: "mr-2 h-4 w-4" }), " Dismiss"] })] }))] })] }) })] }, report.id)))) : (_jsx(TableRow, { children: _jsx(TableCell, { colSpan: 6, className: "text-center py-8 text-muted-foreground", children: "No reports found for this filter." }) })) })] }))] })] }), _jsx(Dialog, { open: isDetailModalOpen, onOpenChange: setIsDetailModalOpen, children: _jsx(DialogContent, { className: "max-w-3xl", children: selectedReport && (_jsxs(_Fragment, { children: [_jsxs(DialogHeader, { children: [_jsxs(DialogTitle, { className: "flex items-center gap-2", children: [_jsx(Shield, { className: "h-5 w-5 text-destructive" }), "User Report Details"] }), _jsx(DialogDescription, { children: "Review report details and take appropriate action" })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6 py-4", children: [_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "bg-muted/40 p-4 rounded-lg", children: [_jsx("h3", { className: "font-medium text-sm text-muted-foreground mb-2", children: "Reported User" }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsxs(Avatar, { className: "h-12 w-12", children: [_jsx(AvatarImage, { src: selectedReport.reported_user.avatar_url }), _jsx(AvatarFallback, { children: selectedReport.reported_user.full_name.charAt(0) })] }), _jsxs("div", { children: [_jsx("p", { className: "font-medium", children: selectedReport.reported_user.full_name }), _jsx("p", { className: "text-sm text-muted-foreground", children: selectedReport.reported_user.email }), _jsxs("div", { className: "flex gap-2 mt-1", children: [selectedReport.reported_user.is_banned && (_jsx(Badge, { variant: "destructive", className: "text-xs", children: "Banned" })), selectedReport.reported_user.is_verified && (_jsx(Badge, { variant: "success", className: "text-xs", children: "Verified" }))] })] })] })] }), _jsxs("div", { className: "bg-muted/40 p-4 rounded-lg", children: [_jsx("h3", { className: "font-medium text-sm text-muted-foreground mb-2", children: "Report Information" }), _jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-sm text-muted-foreground", children: "Status:" }), _jsx(Badge, { variant: getStatusVariant(selectedReport.status), className: "capitalize", children: selectedReport.status })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-sm text-muted-foreground", children: "Submitted:" }), _jsx("span", { children: format(new Date(selectedReport.created_at), 'PPP p') })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-sm text-muted-foreground", children: "Report ID:" }), _jsx("span", { className: "font-mono text-xs", children: selectedReport.id })] })] })] })] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "bg-muted/40 p-4 rounded-lg", children: [_jsx("h3", { className: "font-medium text-sm text-muted-foreground mb-2", children: "Reported By" }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsxs(Avatar, { className: "h-10 w-10", children: [_jsx(AvatarImage, { src: selectedReport.reporter.avatar_url }), _jsx(AvatarFallback, { children: selectedReport.reporter.full_name.charAt(0) })] }), _jsxs("div", { children: [_jsx("p", { className: "font-medium", children: selectedReport.reporter.full_name }), _jsx("p", { className: "text-sm text-muted-foreground", children: selectedReport.reporter.email })] })] }), _jsxs(Button, { variant: "outline", size: "sm", className: "mt-2 w-full", onClick: () => handleContactUser(selectedReport.reporter_id), children: [_jsx(MessageSquare, { className: "h-4 w-4 mr-2" }), " Contact Reporter"] })] }), _jsxs("div", { className: "bg-muted/40 p-4 rounded-lg", children: [_jsx("h3", { className: "font-medium text-sm text-muted-foreground mb-2", children: "Report Reason" }), _jsx("p", { className: "text-sm p-3 bg-background/80 rounded border", children: selectedReport.reason })] })] })] }), selectedReport.status === 'pending' && (_jsxs(_Fragment, { children: [_jsxs("div", { className: "space-y-2 mt-2", children: [_jsx("label", { htmlFor: "admin-note", className: "text-sm font-medium", children: "Admin Notes" }), _jsx(Textarea, { id: "admin-note", placeholder: "Add notes about this report and the actions taken...", value: adminNote, onChange: (e) => setAdminNote(e.target.value), className: "min-h-[100px]" })] }), _jsxs(DialogFooter, { className: "flex gap-2 mt-4", children: [_jsxs(Button, { variant: "outline", onClick: () => handleDismissReport(selectedReport.id), disabled: processingAction[selectedReport.id], children: [processingAction[selectedReport.id] ? _jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }) : _jsx(XCircle, { className: "mr-2 h-4 w-4" }), "Dismiss Report"] }), _jsxs(Button, { variant: "default", onClick: () => handleActionReport(selectedReport.id), disabled: processingAction[selectedReport.id], children: [processingAction[selectedReport.id] ? _jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }) : _jsx(Check, { className: "mr-2 h-4 w-4" }), "Mark as Actioned"] }), _jsxs(Button, { variant: "destructive", onClick: () => setBanDialogOpen(true), disabled: processingAction[selectedReport.id], children: [_jsx(Ban, { className: "mr-2 h-4 w-4" }), "Ban User"] })] })] }))] })) }) }), _jsx(AlertDialog, { open: banDialogOpen, onOpenChange: setBanDialogOpen, children: _jsxs(AlertDialogContent, { children: [_jsxs(AlertDialogHeader, { children: [_jsx(AlertDialogTitle, { children: "Ban User" }), _jsxs(AlertDialogDescription, { children: ["You are about to ban ", selectedReport?.reported_user.full_name, ". Please provide a reason and duration for the ban."] })] }), _jsxs("div", { className: "py-4 space-y-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx("label", { htmlFor: "reason", className: "text-sm font-medium", children: "Reason for ban" }), _jsx(Input, { id: "reason", placeholder: "Violation of terms, inappropriate behavior, etc.", value: banReason, onChange: (e) => setBanReason(e.target.value) })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { htmlFor: "duration", className: "text-sm font-medium", children: "Ban Duration" }), _jsxs(Select, { value: banDuration, onValueChange: setBanDuration, children: [_jsx(SelectTrigger, { className: "bg-background", children: _jsx(SelectValue, { placeholder: "Select duration" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "1", children: "1 day" }), _jsx(SelectItem, { value: "3", children: "3 days" }), _jsx(SelectItem, { value: "7", children: "7 days" }), _jsx(SelectItem, { value: "14", children: "14 days" }), _jsx(SelectItem, { value: "30", children: "30 days" }), _jsx(SelectItem, { value: "90", children: "90 days" }), _jsx(SelectItem, { value: "365", children: "1 year" }), _jsx(SelectItem, { value: "999999", children: "Permanent" })] })] })] })] }), _jsxs(AlertDialogFooter, { children: [_jsx(AlertDialogCancel, { children: "Cancel" }), _jsxs(AlertDialogAction, { onClick: handleBanUser, disabled: !banReason || processingAction[selectedReport?.id || ''], className: "bg-destructive text-destructive-foreground hover:bg-destructive/90", children: [processingAction[selectedReport?.id || ''] ? _jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }) : null, "Ban User"] })] })] }) })] }));
};
