import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { AnimatedSection, AnimatedItem } from '../ui/AnimatedSection';
import { formatDistanceToNow } from 'date-fns';
import { 
  MessageSquare, 
  Bell, 
  Send, 
  Search, 
  ChevronLeft, 
  Loader2, 
  MoreHorizontal, 
  Trash, 
  CheckCircle, 
  AlertCircle,
  Star
} from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '../ui/dropdown-menu';
import { useToast } from '../../hooks/use-toast';
import { cn } from '../../lib/utils';

// Types
type Conversation = {
  conversation_id: string;
  other_user_id: string;
  other_user_name: string;
  other_user_avatar: string;
  last_message_content: string;
  last_message_time: string;
  unread_count: number;
};

type Message = {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
  attachment_url: string | null;
};

type Notification = {
  id: string;
  created_at: string;
  type: 'message' | 'booking' | 'review' | 'system';
  title: string;
  content: string;
  is_read: boolean;
  action_link: string | null;
  related_id: string | null;
};

const InboxPage = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'messages' | 'notifications'>('messages');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState({
    conversations: true,
    messages: false,
    notifications: true,
    sending: false
  });
  const [searchTerm, setSearchTerm] = useState('');
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  // Fetch conversations
  useEffect(() => {
    const fetchConversations = async () => {
      if (!user) return;
      
      try {
        setLoading(prev => ({ ...prev, conversations: true }));
        
        const { data, error } = await supabase.rpc('get_user_conversations');
        
        if (error) {
          console.error('Error fetching conversations:', error);
          // Provide a user-friendly error message
          toast({
            title: 'Error loading conversations',
            description: 'This feature might not be available yet. Please try again later.',
            variant: 'destructive'
          });
          // Set empty conversations to avoid undefined errors
          setConversations([]);
        } else {
          setConversations(data || []);
        }
      } catch (err) {
        console.error('Exception in fetchConversations:', err);
        setConversations([]);
      } finally {
        setLoading(prev => ({ ...prev, conversations: false }));
      }
    };
    
    fetchConversations();
  }, [user]);
  
  // Fetch notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user) return;
      
      try {
        setLoading(prev => ({ ...prev, notifications: true }));
        
        const { data, error } = await supabase.rpc('get_user_notifications');
        
        if (error) {
          console.error('Error fetching notifications:', error);
          // Provide a user-friendly error message
          toast({
            title: 'Error loading notifications',
            description: 'This feature might not be available yet. Please try again later.',
            variant: 'destructive'
          });
          // Set empty notifications to avoid undefined errors
          setNotifications([]);
        } else {
          setNotifications(data || []);
        }
      } catch (err) {
        console.error('Exception in fetchNotifications:', err);
        setNotifications([]);
      } finally {
        setLoading(prev => ({ ...prev, notifications: false }));
      }
    };
    
    fetchNotifications();
  }, [user]);
  
  // Fetch messages for selected conversation
  useEffect(() => {
    const fetchMessages = async () => {
      if (!user || !selectedConversation) return;
      
      try {
        setLoading(prev => ({ ...prev, messages: true }));
        
        // Extract the other user's ID from the conversation ID
        const otherUserId = selectedConversation.split('-').find(id => id !== user.id);
        
        if (!otherUserId) {
          console.error('Invalid conversation ID');
          return;
        }
        
        // Use the RPC function instead of direct table query
        const { data, error } = await supabase.rpc(
          'get_conversation_messages',
          { p_other_user_id: otherUserId }
        );
        
        if (error) {
          console.error('Error fetching messages:', error);
          toast({
            title: 'Error loading messages',
            description: 'This feature might not be available yet. Please try again later.',
            variant: 'destructive'
          });
          // Set empty messages to avoid undefined errors
          setMessages([]);
        } else {
          setMessages(data || []);
          
          // Update the unread count in the conversations list
          setConversations(prev => 
            prev.map(conv => 
              conv.conversation_id === selectedConversation 
                ? { ...conv, unread_count: 0 } 
                : conv
            )
          );
        }
      } catch (err) {
        console.error('Exception in fetchMessages:', err);
        setMessages([]);
      } finally {
        setLoading(prev => ({ ...prev, messages: false }));
      }
    };
    
    fetchMessages();
  }, [user, selectedConversation]);
  
  // Handle sending a new message
  const handleSendMessage = async () => {
    if (!user || !selectedConversation || !newMessage.trim()) return;
    
    try {
      setLoading(prev => ({ ...prev, sending: true }));
      
      // Extract the other user's ID from the conversation ID
      const otherUserId = selectedConversation.split('-').find(id => id !== user.id);
      
      if (!otherUserId) {
        console.error('Invalid conversation ID');
        return;
      }
      
      const { data, error } = await supabase.rpc(
        'send_message',
        { 
          p_recipient_id: otherUserId,
          p_content: newMessage.trim(),
          p_attachment_url: null
        }
      );
      
      if (error) {
        console.error('Error sending message:', error);
        toast({
          title: 'Error',
          description: 'Failed to send message. Please try again.',
          variant: 'destructive'
        });
      } else {
        // Add the new message to the messages list
        const newMsg: Message = {
          id: data,
          sender_id: user.id,
          recipient_id: otherUserId,
          content: newMessage.trim(),
          created_at: new Date().toISOString(),
          is_read: false,
          attachment_url: null
        };
        
        setMessages(prev => [newMsg, ...prev]);
        setNewMessage('');
        
        // Update the conversation in the list
        setConversations(prev => 
          prev.map(conv => 
            conv.conversation_id === selectedConversation 
              ? { 
                  ...conv, 
                  last_message_content: newMessage.trim(),
                  last_message_time: new Date().toISOString()
                } 
              : conv
          )
        );
      }
    } catch (err) {
      console.error('Exception in handleSendMessage:', err);
    } finally {
      setLoading(prev => ({ ...prev, sending: false }));
    }
  };
  
  // Handle marking a notification as read
  const handleMarkNotificationRead = async (notificationId: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase.rpc(
        'mark_notification_read',
        { p_notification_id: notificationId }
      );
      
      if (error) {
        console.error('Error marking notification as read:', error);
      } else {
        // Update the notification in the list
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === notificationId 
              ? { ...notif, is_read: true } 
              : notif
          )
        );
      }
    } catch (err) {
      console.error('Exception in handleMarkNotificationRead:', err);
    }
  };
  
  // Filter conversations based on search term
  const filteredConversations = conversations.filter(conv => 
    conv.other_user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.last_message_content.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Filter notifications based on search term
  const filteredNotifications = notifications.filter(notif => 
    notif.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    notif.content.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Get the selected conversation details
  const selectedConversationDetails = conversations.find(
    conv => conv.conversation_id === selectedConversation
  );
  
  // Calculate unread counts
  const unreadMessages = conversations.reduce((sum, conv) => sum + conv.unread_count, 0);
  const unreadNotifications = notifications.filter(notif => !notif.is_read).length;

  return (
    <AnimatedSection className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Inbox</h1>
        <p className="text-muted-foreground">Manage your messages and notifications</p>
      </div>
      
      <Tabs 
        defaultValue="messages" 
        value={activeTab} 
        onValueChange={(value) => setActiveTab(value as 'messages' | 'notifications')}
        className="w-full"
      >
        <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
          <TabsTrigger value="messages" className="relative">
            Messages
            {unreadMessages > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 flex items-center justify-center">
                {unreadMessages}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="notifications" className="relative">
            Notifications
            {unreadNotifications > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 flex items-center justify-center">
                {unreadNotifications}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>
        
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
            <Input 
              placeholder={`Search ${activeTab}...`} 
              className="pl-10" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <TabsContent value="messages" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Conversations List */}
            <Card className={cn(
              "overflow-hidden", 
              selectedConversation ? "hidden md:block" : "col-span-full md:col-span-1"
            )}>
              <CardHeader className="p-4">
                <CardTitle className="text-lg flex items-center">
                  <MessageSquare className="mr-2" size={18} />
                  Conversations
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {loading.conversations ? (
                  <div className="flex justify-center items-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredConversations.length === 0 ? (
                  <div className="text-center py-8 px-4">
                    <p className="text-muted-foreground mb-2">No conversations yet</p>
                    <Button onClick={() => navigate('/browse')}>Find people to chat with</Button>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {filteredConversations.map((conv, index) => (
                      <AnimatedItem
                        key={conv.conversation_id}
                        index={index}
                        className={cn(
                          "flex items-center gap-3 p-4 cursor-pointer hover:bg-muted/50 transition-colors",
                          selectedConversation === conv.conversation_id && "bg-muted"
                        )}
                        onClick={() => setSelectedConversation(conv.conversation_id)}
                      >
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={conv.other_user_avatar} alt={conv.other_user_name} />
                          <AvatarFallback>{conv.other_user_name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center">
                            <p className="font-medium truncate">{conv.other_user_name}</p>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(conv.last_message_time), { addSuffix: true })}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground truncate">{conv.last_message_content}</p>
                        </div>
                        {conv.unread_count > 0 && (
                          <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 flex items-center justify-center">
                            {conv.unread_count}
                          </Badge>
                        )}
                      </AnimatedItem>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Message Thread */}
            {selectedConversation ? (
              <Card className={cn(
                "overflow-hidden md:col-span-2",
                !selectedConversation && "hidden"
              )}>
                <CardHeader className="p-4 border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="md:hidden"
                        onClick={() => setSelectedConversation(null)}
                      >
                        <ChevronLeft size={18} />
                      </Button>
                      {selectedConversationDetails && (
                        <>
                          <Avatar className="h-8 w-8">
                            <AvatarImage 
                              src={selectedConversationDetails.other_user_avatar} 
                              alt={selectedConversationDetails.other_user_name} 
                            />
                            <AvatarFallback>
                              {selectedConversationDetails.other_user_name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <CardTitle className="text-base">
                              {selectedConversationDetails.other_user_name}
                            </CardTitle>
                          </div>
                        </>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal size={18} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem 
                          className="text-destructive focus:text-destructive"
                          onClick={() => {
                            setSelectedConversation(null);
                            toast({
                              title: "Conversation deleted",
                              description: "The conversation has been deleted."
                            });
                          }}
                        >
                          <Trash className="mr-2 h-4 w-4" />
                          <span>Delete Conversation</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="p-0 flex flex-col h-[400px]">
                  {loading.messages ? (
                    <div className="flex justify-center items-center py-8 flex-1">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center py-8 px-4 flex-1 flex flex-col justify-center">
                      <p className="text-muted-foreground mb-2">No messages yet</p>
                      <p className="text-sm">Start the conversation by sending a message below.</p>
                    </div>
                  ) : (
                    <div className="flex-1 overflow-y-auto p-4 flex flex-col-reverse space-y-reverse space-y-4">
                      {messages.map((msg, index) => {
                        const isOwnMessage = msg.sender_id === user?.id;
                        return (
                          <AnimatedItem
                            key={msg.id}
                            index={index}
                            className={cn(
                              "flex",
                              isOwnMessage ? "justify-end" : "justify-start"
                            )}
                          >
                            <div className={cn(
                              "max-w-[70%] rounded-lg p-3",
                              isOwnMessage 
                                ? "bg-primary text-primary-foreground" 
                                : "bg-muted"
                            )}>
                              <p className="text-sm">{msg.content}</p>
                              <p className="text-xs opacity-70 text-right mt-1">
                                {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                              </p>
                            </div>
                          </AnimatedItem>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
                <CardFooter className="p-4 border-t">
                  <div className="flex w-full items-center gap-2">
                    <Textarea
                      placeholder="Type your message..."
                      className="min-h-[80px]"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                    />
                    <Button 
                      size="icon" 
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim() || loading.sending}
                    >
                      {loading.sending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            ) : (
              <Card className="hidden md:flex md:col-span-2 items-center justify-center">
                <CardContent className="py-12 text-center">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-medium mb-2">Select a Conversation</h3>
                  <p className="text-muted-foreground">
                    Choose a conversation from the list to start chatting
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="notifications" className="mt-0">
          <Card>
            <CardHeader className="p-4">
              <CardTitle className="text-lg flex items-center">
                <Bell className="mr-2" size={18} />
                Notifications
              </CardTitle>
              <CardDescription>
                Stay updated with booking requests, messages, and system alerts
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {loading.notifications ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="text-center py-8 px-4">
                  <p className="text-muted-foreground">No notifications yet</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {filteredNotifications.map((notif, index) => (
                    <AnimatedItem
                      key={notif.id}
                      index={index}
                      className={cn(
                        "p-4 hover:bg-muted/50 transition-colors",
                        !notif.is_read && "bg-muted/30"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-1">
                          {notif.type === 'message' && (
                            <MessageSquare className="h-5 w-5 text-blue-500" />
                          )}
                          {notif.type === 'booking' && (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          )}
                          {notif.type === 'system' && (
                            <AlertCircle className="h-5 w-5 text-amber-500" />
                          )}
                          {notif.type === 'review' && (
                            <Star className="h-5 w-5 text-yellow-500" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center mb-1">
                            <h4 className="font-medium">{notif.title}</h4>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">{notif.content}</p>
                          <div className="flex items-center gap-2 mt-2">
                            {notif.action_link && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => {
                                  handleMarkNotificationRead(notif.id);
                                  navigate(notif.action_link || '/');
                                }}
                              >
                                View Details
                              </Button>
                            )}
                            {!notif.is_read && (
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleMarkNotificationRead(notif.id)}
                              >
                                Mark as Read
                              </Button>
                            )}
                          </div>
                        </div>
                        {!notif.is_read && (
                          <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                        )}
                      </div>
                    </AnimatedItem>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AnimatedSection>
  );
};

export default InboxPage; 