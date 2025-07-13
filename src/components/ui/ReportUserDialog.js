import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { AlertCircle, Flag, ShieldAlert } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger, } from './alert-dialog';
import { Button } from './button';
import { Textarea } from './textarea';
import { RadioGroup, RadioGroupItem } from './radio-group';
import { Label } from './label';
export const ReportUserDialog = ({ userId, userName, trigger, onReportComplete, }) => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [isOpen, setIsOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [reason, setReason] = useState('');
    const [selectedReason, setSelectedReason] = useState('');
    const [customReason, setCustomReason] = useState('');
    const reportReasons = [
        { id: 'harassment', label: 'Harassment or bullying' },
        { id: 'inappropriate', label: 'Inappropriate behavior' },
        { id: 'scam', label: 'Scam or fraud' },
        { id: 'fake', label: 'Fake profile' },
        { id: 'other', label: 'Other' },
    ];
    const handleSubmit = async () => {
        if (!user) {
            toast({
                title: 'Authentication required',
                description: 'You must be logged in to report a user',
                variant: 'destructive',
            });
            return;
        }
        if (!selectedReason) {
            toast({
                title: 'Please select a reason',
                description: 'You must select a reason for reporting this user',
                variant: 'destructive',
            });
            return;
        }
        if (selectedReason === 'other' && !customReason.trim()) {
            toast({
                title: 'Please provide details',
                description: 'You must provide details for your report',
                variant: 'destructive',
            });
            return;
        }
        const finalReason = selectedReason === 'other'
            ? customReason
            : reportReasons.find(r => r.id === selectedReason)?.label || selectedReason;
        setIsSubmitting(true);
        try {
            const { data, error } = await supabase.rpc('report_user', {
                p_reported_user_id: userId,
                p_reporter_id: user.id,
                p_reason: finalReason,
            });
            if (error)
                throw error;
            toast({
                title: 'Report submitted',
                description: 'Thank you for your report. Our team will review it shortly.',
            });
            setIsOpen(false);
            setSelectedReason('');
            setCustomReason('');
            if (onReportComplete) {
                onReportComplete();
            }
        }
        catch (error) {
            toast({
                title: 'Failed to submit report',
                description: error.message,
                variant: 'destructive',
            });
        }
        finally {
            setIsSubmitting(false);
        }
    };
    return (_jsxs(AlertDialog, { open: isOpen, onOpenChange: setIsOpen, children: [_jsx(AlertDialogTrigger, { asChild: true, children: trigger || (_jsxs(Button, { variant: "outline", size: "sm", className: "gap-2", children: [_jsx(Flag, { className: "h-4 w-4" }), " Report User"] })) }), _jsxs(AlertDialogContent, { className: "max-w-md", children: [_jsxs(AlertDialogHeader, { children: [_jsxs(AlertDialogTitle, { className: "flex items-center gap-2", children: [_jsx(ShieldAlert, { className: "h-5 w-5 text-destructive" }), "Report ", userName] }), _jsx(AlertDialogDescription, { children: "Please tell us why you're reporting this user. Your report will be kept confidential." })] }), _jsxs("div", { className: "space-y-4 py-4", children: [_jsx(RadioGroup, { value: selectedReason, onValueChange: setSelectedReason, children: reportReasons.map((reportReason) => (_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(RadioGroupItem, { value: reportReason.id, id: reportReason.id }), _jsx(Label, { htmlFor: reportReason.id, className: "cursor-pointer", children: reportReason.label })] }, reportReason.id))) }), selectedReason === 'other' && (_jsxs("div", { className: "space-y-2 pt-2", children: [_jsx(Label, { htmlFor: "custom-reason", children: "Please provide details" }), _jsx(Textarea, { id: "custom-reason", placeholder: "Please explain why you're reporting this user...", value: customReason, onChange: (e) => setCustomReason(e.target.value), className: "min-h-[100px]" })] })), _jsxs("div", { className: "bg-amber-50 dark:bg-amber-950/20 p-3 rounded-md border border-amber-200 dark:border-amber-800 flex items-start gap-2", children: [_jsx(AlertCircle, { className: "h-5 w-5 text-amber-600 mt-0.5" }), _jsx("div", { className: "text-sm text-amber-800 dark:text-amber-300", children: _jsx("p", { children: "Our team will review your report and take appropriate action if necessary." }) })] })] }), _jsxs(AlertDialogFooter, { children: [_jsx(AlertDialogCancel, { disabled: isSubmitting, children: "Cancel" }), _jsx(AlertDialogAction, { onClick: (e) => {
                                    e.preventDefault();
                                    handleSubmit();
                                }, disabled: isSubmitting || !selectedReason || (selectedReason === 'other' && !customReason.trim()), className: "bg-destructive text-destructive-foreground hover:bg-destructive/90", children: isSubmitting ? 'Submitting...' : 'Submit Report' })] })] })] }));
};
