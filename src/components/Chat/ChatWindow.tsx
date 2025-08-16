import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { Send, MoreVertical } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  read_at: string | null;
  edited_at: string | null;
}

interface Profile {
  id: string;
  user_id: string;
  username: string;
  display_name: string;
  bio: string;
  avatar_url: string;
}

interface ChatWindowProps {
  conversationId: string;
  currentUserId: string;
}

export const ChatWindow = ({ conversationId, currentUserId }: ChatWindowProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [otherParticipant, setOtherParticipant] = useState<Profile | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load conversation details and messages
  useEffect(() => {
    if (conversationId) {
      loadConversationDetails();
      loadMessages();
      subscribeToMessages();
    }
  }, [conversationId]);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversationDetails = async () => {
    const { data: conversation, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .single();

    if (error) {
      console.error('Error loading conversation:', error);
      return;
    }

    // Get other participant
    const otherParticipantId = conversation.participant_one_id === currentUserId 
      ? conversation.participant_two_id 
      : conversation.participant_one_id;

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', otherParticipantId)
      .single();

    setOtherParticipant(profile);
  };

  const loadMessages = async () => {
    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error loading messages:', error);
      return;
    }

    setMessages(messages || []);
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          setMessages(prev => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || loading) return;

    setLoading(true);
    
    const { error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: currentUserId,
        content: newMessage.trim()
      });

    if (error) {
      console.error('Error sending message:', error);
    } else {
      setNewMessage('');
      
      // Update conversation timestamp
      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId);
    }

    setLoading(false);
  };

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return format(date, 'HH:mm');
    } else if (diffInHours < 168) { // 7 days
      return format(date, 'EEE HH:mm');
    } else {
      return format(date, 'MMM dd, HH:mm');
    }
  };

  if (!otherParticipant) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-muted-foreground">Loading conversation...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="p-4 border-b border-border bg-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden"
              onClick={() => window.history.back()}
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Button>
            <Avatar className="h-10 w-10">
              <AvatarImage src={otherParticipant.avatar_url} />
              <AvatarFallback>
                {otherParticipant.display_name?.[0]?.toUpperCase() || 
                 otherParticipant.username[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium">
                {otherParticipant.display_name || otherParticipant.username}
              </div>
              <div className="text-sm text-muted-foreground">
                @{otherParticipant.username}
              </div>
            </div>
          </div>
          <Button variant="ghost" size="icon">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-muted-foreground">
            <div className="text-sm">No messages yet</div>
            <div className="text-xs mt-1">Start the conversation!</div>
          </div>
        ) : (
          messages.map((message) => {
            const isOwn = message.sender_id === currentUserId;
            
            return (
              <div
                key={message.id}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] sm:max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                    isOwn
                      ? 'bg-[hsl(var(--message-bg))] text-[hsl(var(--message-text))]'
                      : 'bg-[hsl(var(--received-message-bg))] text-[hsl(var(--received-message-text))]'
                  }`}
                >
                  <div className="text-sm">{message.content}</div>
                  <div
                    className={`text-xs mt-1 ${
                      isOwn 
                        ? 'text-primary-foreground/70' 
                        : 'text-muted-foreground/70'
                    }`}
                  >
                    {formatMessageTime(message.created_at)}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-border bg-card">
        <form onSubmit={sendMessage} className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1"
            disabled={loading}
          />
          <Button 
            type="submit" 
            size="icon" 
            disabled={loading || !newMessage.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
};