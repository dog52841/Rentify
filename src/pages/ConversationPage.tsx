import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { format } from 'date-fns';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/Avatar';

const TypingIndicator = ({ avatarUrl, avatarName }: { avatarUrl?: string, avatarName?: string }) => (
    <motion.div
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        className="flex items-end gap-2 justify-start"
    >
        <Avatar className="h-8 w-8">
            <AvatarImage src={avatarUrl} alt={avatarName || 'User'} />
            <AvatarFallback>{avatarName?.charAt(0) || 'U'}</AvatarFallback>
        </Avatar>
        <div className="max-w-md p-3 rounded-2xl bg-muted flex items-center gap-1.5">
            <motion.span
                className="w-2 h-2 bg-muted-foreground rounded-full"
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 1, repeat: Infinity, ease: "easeInOut", delay: 0.1 }}
            />
            <motion.span
                className="w-2 h-2 bg-muted-foreground rounded-full"
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 1, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
            />
            <motion.span
                className="w-2 h-2 bg-muted-foreground rounded-full"
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 1, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
            />
        </div>
    </motion.div>
);

const ConversationPage = () => {
  const { conversationId } = useParams();
  const { user } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [conversation, setConversation] = useState<any>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scrollToBottom = () => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };
    scrollToBottom();
  }, [messages]);
  
  // Fetch initial data
  useEffect(() => {
    const fetchConversationDetails = async () => {
      if (!conversationId) return;
      setLoading(true);
      
      const { data, error } = await supabase
        .rpc('get_conversation_details', { p_conversation_id: conversationId });
      
      if (error) {
        setError(error.message);
      } else if (data && data.length > 0) {
        setConversation(data[0]);
        setMessages(data[0].messages.sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()));
      }
      setLoading(false);
    };

    fetchConversationDetails();
  }, [conversationId]);
  
  // Set up real-time subscription
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase.channel(`messages:${conversationId}`);

    // Subscribe to new messages
    channel.on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          // As soon as a message comes in, we know the other user is no longer typing
          if (payload.new.sender_id !== user?.id) {
            setIsOtherUserTyping(false);
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
          }
          setMessages(currentMessages => {
            // Avoid duplicate messages
            if (currentMessages.some(m => m.id === payload.new.id)) {
              return currentMessages;
            }
            return [...currentMessages, payload.new];
          });
        }
    );

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
    if (!conversationId || !user) return;
    const channel = supabase.channel(`messages:${conversationId}`);
    channel.track({ event: 'typing', user_id: user.id });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    broadcastTyping();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() === '' || !user) return;

    const content = newMessage;
    setNewMessage('');

    await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender_id: user.id,
      content: content,
    });
  };

  if (loading) {
    return <div className="flex justify-center items-center h-96"><Loader2 className="animate-spin h-8 w-8 text-primary"/></div>;
  }

  if (error || !conversation) {
    return <div className="text-center text-destructive p-8">{error || 'Conversation not found.'}</div>;
  }
  
  const otherParticipant = user?.id === conversation.renter_id ? conversation.owner_details : conversation.renter_details;

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] max-w-4xl mx-auto">
      {/* Header */}
      <header className="flex items-center gap-4 p-4 border-b bg-card sticky top-0">
        <Link to="/inbox" className="p-2 rounded-full hover:bg-muted">
          <ArrowLeft size={20} />
        </Link>
        <Avatar>
          <AvatarImage src={otherParticipant.avatar_url} alt={otherParticipant.full_name} />
          <AvatarFallback>{otherParticipant.full_name?.charAt(0) || 'U'}</AvatarFallback>
        </Avatar>
        <div>
          <h2 className="font-bold">{otherParticipant.full_name}</h2>
          <p className="text-sm text-muted-foreground">re: <span className="font-medium text-foreground">{conversation.listing_title}</span></p>
        </div>
      </header>
      
      {/* Messages */}
      <div className="flex-grow p-4 overflow-y-auto">
        <div className="space-y-4">
          <AnimatePresence>
            {messages.map((msg, index) => {
              const isMe = msg.sender_id === user?.id;
              const showAvatar = !isMe && (index === 0 || messages[index - 1].sender_id !== msg.sender_id);

              return (
                  <motion.div
                    key={msg.id}
                    layout
                    initial={{ opacity: 0, y: 20, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                    className={`flex items-end gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}
                  >
                    {!isMe && showAvatar && (
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={otherParticipant.avatar_url} alt={otherParticipant.full_name} />
                        <AvatarFallback>{otherParticipant.full_name?.charAt(0) || 'U'}</AvatarFallback>
                      </Avatar>
                    )}
                    {!isMe && !showAvatar && <div className="w-8"/>}
                    
                    <div className={`max-w-md p-3 rounded-2xl ${isMe ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                      <p>{msg.content}</p>
                      <p className={`text-xs mt-1 text-right ${isMe ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                        {format(new Date(msg.created_at), 'p')}
                      </p>
                    </div>
                  </motion.div>
              );
            })}
          </AnimatePresence>
          <AnimatePresence>
            {isOtherUserTyping && (
                <TypingIndicator avatarUrl={otherParticipant?.avatar_url} avatarName={otherParticipant?.full_name} />
            )}
          </AnimatePresence>
        </div>
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t bg-card">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={handleInputChange}
            placeholder="Type a message..."
            className="flex-grow p-3 bg-muted border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <Button type="submit" size="icon" disabled={!newMessage.trim()}>
            <Send size={20} />
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ConversationPage; 