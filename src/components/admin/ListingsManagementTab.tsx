import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useToast } from '../../hooks/use-toast';
import { useAuth } from '../../contexts/AuthContext';
import { Loader2, CheckCircle, XCircle, Search, RefreshCw, Check, ShieldCheck, ClipboardCheck, MoreHorizontal, X, Clipboard as ClipboardIcon, User, ExternalLink, ShieldOff, Gavel, ShieldAlert, List } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { format } from 'date-fns';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { AnimatePresence, motion } from 'framer-motion';
import { useDebounce } from '../../hooks/use-debounce';

type ListingAdmin = {
    id: string;
    title: string;
    status: 'pending' | 'approved' | 'rejected';
    is_verified: boolean;
    created_at: string;
    owner_full_name: string;
    owner_id: string;
    rejection_reason?: string;
    is_reported: boolean;
};

const getStatusVariant = (status: string, isReported: boolean) => {
    if (isReported) return 'warning';
    switch (status) {
        case 'approved': return 'success';
        case 'pending': return 'secondary';
        case 'rejected': return 'destructive';
        default: return 'outline';
    }
}

export const ListingsManagementTab = () => {
    const { user: adminUser } = useAuth();
    const [listings, setListings] = useState<ListingAdmin[]>([]);
    const [loading, setLoading] = useState(true);
    const [updatingStatus, setUpdatingStatus] = useState<Record<string, boolean>>({});
    const [activeFilter, setActiveFilter] = useState('all');
    const { toast } = useToast();
    const [actionListing, setActionListing] = useState<{listing: ListingAdmin, action: 'reject' | 'takedown'} | null>(null);
    const [reason, setReason] = useState('');
    const [verifyId, setVerifyId] = useState('');
    const [isVerifyingById, setIsVerifyingById] = useState(false);
    const [selectedListing, setSelectedListing] = useState<ListingAdmin | null>(null);
    const [listingHistory, setListingHistory] = useState<any[]>([]);
    const [modalLoading, setModalLoading] = useState(false);

    const fetchListings = useCallback(async (filter = activeFilter) => {
        setLoading(true);
        const { data, error } = await supabase.rpc('get_all_listings_admin', { p_status_filter: filter });

        if (error) {
            toast({
                variant: 'destructive',
                title: 'Failed to fetch listings',
                description: error.message,
            });
        } else {
            setListings(data || []);
        }
        setLoading(false);
    }, [activeFilter, toast]);

    useEffect(() => {
        fetchListings();
    }, [fetchListings]);
    
    const handleListingAction = useCallback(async (
        listingId: string, 
        action: 'approve' | 'reject' | 'verify' | 'unverify' | 'dismiss'
    ) => {
        if (!adminUser) {
            toast({ title: "Authentication Error", description: "Could not identify administrator.", variant: "destructive" });
            return;
        }

        const originalListings = [...listings];
        const optimisticUpdate = (field: 'status' | 'is_verified', value: any) => {
            setListings(prev => prev.map(l => l.id === listingId ? { ...l, [field]: value } : l));
        };

        try {
            let rpcName = '';
            let params: any = { p_listing_id: listingId, p_admin_id: adminUser.id };
            let field: 'status' | 'is_verified' = 'status';
            let value: any;

            switch (action) {
                case 'approve':
                    rpcName = 'set_listing_status';
                    params.p_new_status = 'active';
                    value = 'active';
                    break;
                case 'reject':
                    rpcName = 'set_listing_status';
                    params.p_new_status = 'rejected';
                    value = 'rejected';
                    break;
                case 'verify':
                    rpcName = 'set_listing_verification';
                    params.p_is_verified = true;
                    field = 'is_verified';
                    value = true;
                    break;
                case 'unverify':
                    rpcName = 'set_listing_verification';
                    params.p_is_verified = false;
                    field = 'is_verified';
                    value = false;
                    break;
                case 'dismiss':
                    rpcName = 'dismiss_listing_report';
                    // Optimistically remove the report reason
                    setListings(prev => prev.map(l => l.id === listingId ? { ...l, is_reported: false, rejection_reason: null } : l));
                    break;
            }
            
            if (action !== 'dismiss') {
                optimisticUpdate(field, value);
            }

            const { error } = await supabase.rpc(rpcName, params);
            if (error) throw error;

            toast({ title: 'Success', description: `Listing successfully ${action}ed.` });
            if (action === 'dismiss') {
                fetchListings(); // Refetch to get the updated report status
            }
        } catch (error: any) {
            setListings(originalListings);
            toast({ title: `Error ${action}ing listing`, description: error.message, variant: 'destructive' });
        }
    }, [listings, toast, adminUser, fetchListings]);

    const openDetailsModal = async (listing: ListingAdmin) => {
        setSelectedListing(listing);
        setModalLoading(true);
        const { data, error } = await supabase
            .from('admin_activity_log')
            .select('*, actor:profiles(full_name)')
            .eq('target_id', listing.id)
            .order('created_at', { ascending: false });

        if (error) {
            toast({ title: 'Error fetching history', description: error.message, variant: 'destructive' });
        }
        setListingHistory(data || []);
        setModalLoading(false);
    };

    const handleCopyId = (id: string) => {
        navigator.clipboard.writeText(id.toString());
        toast({ title: 'Copied to clipboard!' });
    };

    const handleTakedownClick = (listing: ListingAdmin) => {
        setActionListing({ listing, action: 'takedown' });
    }

    return (
        <AnimatePresence>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
            <Card className="bg-card/50 backdrop-blur-xl border-border/10 shadow-2xl shadow-black/20">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><ClipboardCheck /> Verify by ID</CardTitle>
                    <CardDescription>Manually verify a listing by entering its unique ID.</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center gap-2">
                    <Input 
                        placeholder="Paste Listing ID here..."
                        value={verifyId}
                        onChange={(e) => setVerifyId(e.target.value)}
                    />
                    <Button onClick={() => handleListingAction(verifyId, 'verify')} disabled={isVerifyingById || !verifyId}>
                        {isVerifyingById && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                        Verify
                    </Button>
                </CardContent>
            </Card>

            <Card className="bg-card/70 backdrop-blur-2xl border border-border/10 shadow-xl rounded-2xl">
                <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-primary/10 to-transparent rounded-t-2xl">
                    <div>
                        <CardTitle className="flex items-center gap-2 text-primary">
                            <List className="h-5 w-5" /> Listings Queue
                        </CardTitle>
                        <CardDescription>Review and manage all user-submitted listings.</CardDescription>
                    </div>
                    <Button onClick={() => fetchListings()} variant="ghost" size="icon" disabled={loading} className="rounded-full hover:bg-primary/20">
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                </CardHeader>
                <CardContent>
                    <Tabs value={activeFilter} onValueChange={setActiveFilter} className="mb-4">
                        <TabsList className="grid w-full grid-cols-5">
                            <TabsTrigger value="all">All</TabsTrigger>
                            <TabsTrigger value="pending">Pending</TabsTrigger>
                            <TabsTrigger value="approved">Approved</TabsTrigger>
                            <TabsTrigger value="rejected">Rejected</TabsTrigger>
                            <TabsTrigger value="reported" className="text-amber-500 focus:text-amber-600 data-[state=active]:bg-amber-100 data-[state=active]:text-amber-700 dark:data-[state=active]:bg-amber-900/50 dark:data-[state=active]:text-amber-400">
                                <ShieldAlert className="mr-2 h-4 w-4"/>
                                Reported
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>
                    {loading ? (
                        <div className="border rounded-lg">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Listing</TableHead>
                                        <TableHead>Owner</TableHead>
                                        <TableHead>Submitted</TableHead>
                                        <TableHead className="text-center">Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {[...Array(5)].map((_, i) => (
                                        <TableRow key={i}>
                                            <TableCell><div className="h-5 w-32 bg-muted/50 rounded animate-pulse"></div></TableCell>
                                            <TableCell><div className="h-5 w-24 bg-muted/50 rounded animate-pulse"></div></TableCell>
                                            <TableCell><div className="h-5 w-20 bg-muted/50 rounded animate-pulse"></div></TableCell>
                                            <TableCell className="text-center"><div className="h-6 w-16 mx-auto bg-muted/50 rounded-full animate-pulse"></div></TableCell>
                                            <TableCell><div className="h-8 w-8 ml-auto bg-muted/50 rounded animate-pulse"></div></TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    ) : listings.length > 0 ? (
                        <div className="border rounded-lg overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Listing</TableHead>
                                    <TableHead>Owner</TableHead>
                                    <TableHead>Submitted</TableHead>
                                    <TableHead className="text-center">Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {listings.map((listing: ListingAdmin) => (
                                    <motion.tr 
                                        key={listing.id}
                                        layout
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="hover:bg-primary/5 transition-colors"
                                    >
                                        <TableCell className="font-medium">{listing.title}</TableCell>
                                        <TableCell>
                                            <Link to={`/profile/${listing.owner_id}`} className="hover:underline flex items-center gap-2" onClick={e => e.stopPropagation()}>
                                                {listing.owner_full_name} <ExternalLink className="h-3 w-3 text-muted-foreground" />
                                            </Link>
                                        </TableCell>
                                        <TableCell>{format(new Date(listing.created_at), 'MMM dd, yyyy')}</TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant={getStatusVariant(listing.status, listing.is_reported)} className="capitalize">
                                                {listing.is_reported ? 'Reported' : listing.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                             <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0" onClick={(e) => e.stopPropagation()}>
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                    <DropdownMenuItem onSelect={() => openDetailsModal(listing)}><Eye className="mr-2 h-4 w-4" /> View Details</DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem onClick={() => handleListingAction(listing.id, 'approve')} disabled={listing.status === 'active'}>
                                                        <CheckCircle className="mr-2 h-4 w-4 text-green-500" /> Approve
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleListingAction(listing.id, 'reject')} disabled={listing.status === 'rejected'}>
                                                        <XCircle className="mr-2 h-4 w-4 text-destructive" /> Reject
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleListingAction(listing.id, listing.is_verified ? 'unverify' : 'verify')}>
                                                        {listing.is_verified ? <ShieldOff className="mr-2 h-4 w-4" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                                                        {listing.is_verified ? 'Un-verify' : 'Verify'}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem 
                                                        onClick={() => handleListingAction(listing.id, 'dismiss')}
                                                        disabled={!listing.is_reported}
                                                        className="text-amber-600 focus:text-amber-700"
                                                    >
                                                        <Gavel className="mr-2 h-4 w-4" /> Dismiss Report
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem onClick={() => handleCopyId(listing.id)}>
                                                        <ClipboardIcon className="mr-2 h-4 w-4" /> Copy ID
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </motion.tr>
                                ))}
                            </TableBody>
                        </Table>
                        </div>
                    ) : (
                        <div className="text-center py-20 bg-card/20 rounded-lg border-2 border-dashed border-border/20">
                            <List className="mx-auto h-12 w-12 text-muted-foreground" />
                            <h3 className="mt-2 text-lg font-medium">No listings found</h3>
                            <p className="mt-1 text-sm text-muted-foreground">
                                There are no listings that match the current filter.
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>
            
            <AlertDialog open={!!actionListing} onOpenChange={(open) => !open && setActionListing(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Reason for {actionListing?.action === 'takedown' ? 'Takedown' : 'Rejection'}</AlertDialogTitle>
                        <AlertDialogDescription>
                            Please provide a reason for this action on "{actionListing?.listing.title}". This will be logged.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="py-4">
                         <Input 
                            placeholder="e.g., Inappropriate content, violation of terms..."
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                        />
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setActionListing(null)}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={actionListing?.action === 'takedown' ? () => handleListingAction(actionListing.listing.id, 'reject') : () => handleListingAction(actionListing!.listing.id, 'reject')}>Confirm</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <Dialog open={!!selectedListing} onOpenChange={(open) => { if (!open) setSelectedListing(null); }}>
                <DialogContent className="max-w-3xl bg-card/80 backdrop-blur-xl border-border/20">
                    {selectedListing && (
                        <>
                            <DialogHeader>
                                <DialogTitle className="flex items-center justify-between text-2xl">
                                    {selectedListing.title}
                                </DialogTitle>
                                <DialogDescription className="flex items-center gap-4">
                                    <span>ID: {selectedListing.id}</span>
                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleCopyId(selectedListing.id)}><ClipboardIcon className="h-4 w-4" /></Button>
                                </DialogDescription>
                            </DialogHeader>
                            <div className="py-4 space-y-6 max-h-[70vh] overflow-y-auto">
                                <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
                                    <div className="space-y-1">
                                        <p className="font-medium text-muted-foreground">Owner</p>
                                        <Link to={`/profile/${selectedListing.owner_id}`} className="flex items-center gap-2 hover:underline text-primary">
                                            {selectedListing.owner_full_name} <ExternalLink className="h-3 w-3" />
                                        </Link>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="font-medium text-muted-foreground">Submitted</p>
                                        <p>{format(new Date(selectedListing.created_at), 'PPP p')}</p>
                                    </div>
                                     <div className="space-y-1">
                                        <p className="font-medium text-muted-foreground">Status</p>
                                        <p><Badge variant={getStatusVariant(selectedListing.status, selectedListing.is_reported)} className="capitalize">{selectedListing.is_reported ? 'Reported' : selectedListing.status}</Badge></p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="font-medium text-muted-foreground">Verified</p>
                                        <p className={selectedListing.is_verified ? "text-green-600 flex items-center gap-1.5" : "text-muted-foreground"}>
                                            {selectedListing.is_verified ? <><ShieldCheck className="h-4 w-4"/> Yes</> : 'No'}
                                        </p>
                                    </div>
                                    {selectedListing.is_reported && (
                                        <div className="space-y-1 col-span-2">
                                            <p className="font-medium text-amber-600">Report Reason</p>
                                            <p className="p-3 bg-amber-50 rounded-md border border-amber-200">{selectedListing.rejection_reason || 'N/A'}</p>
                                        </div>
                                    )}
                                    {selectedListing.status === 'rejected' && !selectedListing.is_reported && (
                                         <div className="space-y-1 col-span-2">
                                            <p className="font-medium text-destructive">Rejection Reason</p>
                                            <p className="p-3 bg-destructive/10 rounded-md border border-destructive/20">{selectedListing.rejection_reason || 'N/A'}</p>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <h4 className="font-semibold mb-2">Admin Action History</h4>
                                    {modalLoading ? <Loader2 className="h-5 w-5 animate-spin"/> : (
                                        <div className="max-h-60 overflow-y-auto pr-2 border rounded-md">
                                            {listingHistory.length > 0 ? (
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow>
                                                            <TableHead>Action</TableHead>
                                                            <TableHead>Admin</TableHead>
                                                            <TableHead>Details</TableHead>
                                                            <TableHead>Timestamp</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {listingHistory.map(entry => (
                                                            <TableRow key={entry.id}>
                                                                <TableCell className="capitalize">{entry.action.replace(/_/g, ' ')}</TableCell>
                                                                <TableCell>{entry.actor.full_name}</TableCell>
                                                                <TableCell className="text-xs">{entry.details ? JSON.stringify(entry.details) : 'N/A'}</TableCell>
                                                                <TableCell>{format(new Date(entry.created_at), 'Pp')}</TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            ) : (
                                                <p className="text-muted-foreground text-sm p-4 text-center">No history found for this listing.</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                             <DialogFooter>
                                <Button variant="secondary" onClick={() => setSelectedListing(null)}>Close</Button>
                                <Button asChild>
                                    <Link to={`/listings/${selectedListing.id}`} target="_blank">
                                        View Listing Page <ExternalLink className="ml-2 h-4 w-4"/>
                                    </Link>
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </motion.div>
        </AnimatePresence>
    );
}; 