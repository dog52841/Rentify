import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '../lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Mail, Check, Trash2 } from 'lucide-react';
import { Button } from '../components/ui/button';
const InboxPage = () => {
    const { user } = useAuth();
    const [messages, setMessages] = useState([]);
    const [selectedMessage, setSelectedMessage] = useState(null);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        if (user) {
            const fetchMessages = async () => {
                setLoading(true);
                const { data, error } = await supabase
                    .from('messages')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false });
                if (error) {
                    console.error('Error fetching messages:', error);
                }
                else {
                    setMessages(data);
                }
                setLoading(false);
            };
            fetchMessages();
            const subscription = supabase.channel('public:messages:inbox')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'messages', filter: `user_id=eq.${user.id}` }, (payload) => {
                if (payload.eventType === 'INSERT') {
                    setMessages(currentMessages => [payload.new, ...currentMessages]);
                }
                else if (payload.eventType === 'UPDATE') {
                    setMessages(currentMessages => currentMessages.map(msg => msg.id === payload.new.id ? payload.new : msg));
                }
            })
                .subscribe();
            return () => {
                supabase.removeChannel(subscription);
            };
        }
    }, [user]);
    const handleSelectMessage = async (message) => {
        setSelectedMessage(message);
        if (!message.read) {
            const { error } = await supabase
                .from('messages')
                .update({ read: true })
                .eq('id', message.id);
            if (error) {
                console.error('Error marking message as read:', error);
            }
            else {
                setMessages(messages.map(m => m.id === message.id ? { ...m, read: true } : m));
            }
        }
    };
    const handleDeleteMessage = async (messageId) => {
        // Optimistic deletion
        const originalMessages = messages;
        setMessages(messages.filter(m => m.id !== messageId));
        if (selectedMessage?.id === messageId)
            setSelectedMessage(null);
        const { error } = await supabase.from('messages').delete().eq('id', messageId);
        if (error) {
            console.error("Error deleting message:", error);
            setMessages(originalMessages); // Revert on error
        }
    };
    if (loading)
        return _jsx("div", { className: "container mx-auto py-10 text-center", children: "Loading messages..." });
    return (_jsxs("div", { className: "container mx-auto py-10 px-4", children: [_jsx("h1", { className: "text-4xl font-bold mb-8", children: "Inbox" }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-8", children: [_jsxs(Card, { className: "md:col-span-1 h-[calc(100vh-200px)] overflow-y-auto", children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Messages" }) }), _jsx(CardContent, { children: messages.length === 0 ? (_jsxs("div", { className: "text-center text-muted-foreground py-10", children: [_jsx(Mail, { size: 48, className: "mx-auto mb-4" }), _jsx("p", { children: "You have no messages." })] })) : (_jsx("div", { className: "space-y-2", children: messages.map(message => (_jsxs("button", { onClick: () => handleSelectMessage(message), className: cn("w-full text-left p-4 rounded-lg border transition-colors", selectedMessage?.id === message.id ? "bg-muted" : "hover:bg-muted/50", !message.read && "font-bold"), children: [_jsxs("div", { className: "flex justify-between items-start", children: [_jsx("p", { className: "truncate", children: message.title }), !message.read && _jsx("div", { className: "h-2 w-2 rounded-full bg-primary shrink-0 ml-2 mt-1.5" })] }), _jsx("p", { className: "text-sm text-muted-foreground", children: formatDistanceToNow(new Date(message.created_at), { addSuffix: true }) })] }, message.id))) })) })] }), _jsx("div", { className: "md:col-span-2", children: selectedMessage ? (_jsxs(Card, { className: "h-full", children: [_jsxs(CardHeader, { className: "flex flex-row justify-between items-center", children: [_jsxs("div", { children: [_jsx(CardTitle, { children: selectedMessage.title }), _jsx("p", { className: "text-sm text-muted-foreground", children: new Date(selectedMessage.created_at).toLocaleString() })] }), _jsxs("div", { className: "flex gap-2", children: [_jsx(Button, { variant: "ghost", size: "icon", onClick: () => handleSelectMessage(selectedMessage), disabled: selectedMessage.read, children: _jsx(Check, { size: 18 }) }), _jsx(Button, { variant: "destructive", size: "icon", onClick: () => handleDeleteMessage(selectedMessage.id), children: _jsx(Trash2, { size: 18 }) })] })] }), _jsx(CardContent, { children: _jsx("div", { className: "prose dark:prose-invert max-w-none", children: selectedMessage.content }) })] })) : (_jsxs("div", { className: "flex flex-col items-center justify-center h-full text-muted-foreground bg-muted/20 rounded-lg", children: [_jsx(Mail, { size: 64 }), _jsx("p", { className: "mt-4 text-lg", children: "Select a message to read" })] })) })] })] }));
};
export default InboxPage;
