import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { format } from 'date-fns';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/Avatar';
const TypingIndicator = ({ avatarUrl, avatarName }) => (_jsxs(motion.div, { layout: true, initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0 }, className: "flex items-end gap-2 justify-start", children: [_jsxs(Avatar, { className: "h-8 w-8", children: [_jsx(AvatarImage, { src: avatarUrl, alt: avatarName || 'User' }), _jsx(AvatarFallback, { children: avatarName?.charAt(0) || 'U' })] }), _jsxs("div", { className: "max-w-md p-3 rounded-2xl bg-muted flex items-center gap-1.5", children: [_jsx(motion.span, { className: "w-2 h-2 bg-muted-foreground rounded-full", animate: { y: [0, -4, 0] }, transition: { duration: 1, repeat: Infinity, ease: "easeInOut", delay: 0.1 } }), _jsx(motion.span, { className: "w-2 h-2 bg-muted-foreground rounded-full", animate: { y: [0, -4, 0] }, transition: { duration: 1, repeat: Infinity, ease: "easeInOut", delay: 0.2 } }), _jsx(motion.span, { className: "w-2 h-2 bg-muted-foreground rounded-full", animate: { y: [0, -4, 0] }, transition: { duration: 1, repeat: Infinity, ease: "easeInOut", delay: 0.3 } })] })] }));
const ConversationPage = () => {
    const { conversationId } = useParams();
    const { user } = useAuth();
    const [messages, setMessages] = useState([]);
    const [conversation, setConversation] = useState(null);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);
    const typingTimeoutRef = useRef(null);
    const messagesEndRef = useRef(null);
    useEffect(() => {
        const scrollToBottom = () => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        };
        scrollToBottom();
    }, [messages]);
    // Fetch initial data
    useEffect(() => {
        const fetchConversationDetails = async () => {
            if (!conversationId)
                return;
            setLoading(true);
            const { data, error } = await supabase
                .rpc('get_conversation_details', { p_conversation_id: conversationId });
            if (error) {
                setError(error.message);
            }
            else if (data && data.length > 0) {
                setConversation(data[0]);
                setMessages(data[0].messages.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()));
            }
            setLoading(false);
        };
        fetchConversationDetails();
    }, [conversationId]);
    // Set up real-time subscription
    useEffect(() => {
        if (!conversationId)
            return;
        const channel = supabase.channel(`messages:${conversationId}`);
        // Subscribe to new messages
        channel.on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` }, (payload) => {
            // As soon as a message comes in, we know the other user is no longer typing
            if (payload.new.sender_id !== user?.id) {
                setIsOtherUserTyping(false);
                if (typingTimeoutRef.current)
                    clearTimeout(typingTimeoutRef.current);
            }
            setMessages(currentMessages => {
                // Avoid duplicate messages
                if (currentMessages.some(m => m.id === payload.new.id)) {
                    return currentMessages;
                }
                return [...currentMessages, payload.new];
            });
        });
        // Subscribe to typing events
        channel.on('broadcast', { event: 'typing' }, ({ payload }) => {
            if (payload.user_id !== user?.id) {
                setIsOtherUserTyping(true);
                if (typingTimeoutRef.current) {
                    clearTimeout(typingTimeoutRef.current);
                }
                typingTimeoutRef.current = setTimeout(() => {
                    setIsOtherUserTyping(false);
                }, 3000); // Hide after 3 seconds of inactivity
            }
        });
        channel.subscribe();
        return () => {
            supabase.removeChannel(channel);
        };
    }, [conversationId, user?.id]);
    const broadcastTyping = () => {
        if (!conversationId || !user)
            return;
        const channel = supabase.channel(`messages:${conversationId}`);
        channel.track({ event: 'typing', user_id: user.id });
    };
    const handleInputChange = (e) => {
        setNewMessage(e.target.value);
        broadcastTyping();
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (newMessage.trim() === '' || !user)
            return;
        const content = newMessage;
        setNewMessage('');
        await supabase.from('messages').insert({
            conversation_id: conversationId,
            sender_id: user.id,
            content: content,
        });
    };
    if (loading) {
        return _jsx("div", { className: "flex justify-center items-center h-96", children: _jsx(Loader2, { className: "animate-spin h-8 w-8 text-primary" }) });
    }
    if (error || !conversation) {
        return _jsx("div", { className: "text-center text-destructive p-8", children: error || 'Conversation not found.' });
    }
    const otherParticipant = user?.id === conversation.renter_id ? conversation.owner_details : conversation.renter_details;
    return (_jsxs("div", { className: "flex flex-col h-[calc(100vh-10rem)] max-w-4xl mx-auto", children: [_jsxs("header", { className: "flex items-center gap-4 p-4 border-b bg-card sticky top-0", children: [_jsx(Link, { to: "/inbox", className: "p-2 rounded-full hover:bg-muted", children: _jsx(ArrowLeft, { size: 20 }) }), _jsxs(Avatar, { children: [_jsx(AvatarImage, { src: otherParticipant.avatar_url, alt: otherParticipant.full_name }), _jsx(AvatarFallback, { children: otherParticipant.full_name?.charAt(0) || 'U' })] }), _jsxs("div", { children: [_jsx("h2", { className: "font-bold", children: otherParticipant.full_name }), _jsxs("p", { className: "text-sm text-muted-foreground", children: ["re: ", _jsx("span", { className: "font-medium text-foreground", children: conversation.listing_title })] })] })] }), _jsxs("div", { className: "flex-grow p-4 overflow-y-auto", children: [_jsxs("div", { className: "space-y-4", children: [_jsx(AnimatePresence, { children: messages.map((msg, index) => {
                                    const isMe = msg.sender_id === user?.id;
                                    const showAvatar = !isMe && (index === 0 || messages[index - 1].sender_id !== msg.sender_id);
                                    return (_jsxs(motion.div, { layout: true, initial: { opacity: 0, y: 20, scale: 0.9 }, animate: { opacity: 1, y: 0, scale: 1 }, transition: { duration: 0.3, ease: 'easeOut' }, className: `flex items-end gap-2 ${isMe ? 'justify-end' : 'justify-start'}`, children: [!isMe && showAvatar && (_jsxs(Avatar, { className: "h-8 w-8", children: [_jsx(AvatarImage, { src: otherParticipant.avatar_url, alt: otherParticipant.full_name }), _jsx(AvatarFallback, { children: otherParticipant.full_name?.charAt(0) || 'U' })] })), !isMe && !showAvatar && _jsx("div", { className: "w-8" }), _jsxs("div", { className: `max-w-md p-3 rounded-2xl ${isMe ? 'bg-primary text-primary-foreground' : 'bg-muted'}`, children: [_jsx("p", { children: msg.content }), _jsx("p", { className: `text-xs mt-1 text-right ${isMe ? 'text-primary-foreground/70' : 'text-muted-foreground'}`, children: format(new Date(msg.created_at), 'p') })] })] }, msg.id));
                                }) }), _jsx(AnimatePresence, { children: isOtherUserTyping && (_jsx(TypingIndicator, { avatarUrl: otherParticipant?.avatar_url, avatarName: otherParticipant?.full_name })) })] }), _jsx("div", { ref: messagesEndRef })] }), _jsx("div", { className: "p-4 border-t bg-card", children: _jsxs("form", { onSubmit: handleSubmit, className: "flex items-center gap-2", children: [_jsx("input", { type: "text", value: newMessage, onChange: handleInputChange, placeholder: "Type a message...", className: "flex-grow p-3 bg-muted border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring" }), _jsx(Button, { type: "submit", size: "icon", disabled: !newMessage.trim(), children: _jsx(Send, { size: 20 }) })] }) })] }));
};
export default ConversationPage;
