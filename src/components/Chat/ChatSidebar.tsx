import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { Search, MessageSquarePlus, LogOut, Settings } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Profile {
  id: string;
  user_id: string;
  username: string;
  display_name: string;
  bio: string;
  avatar_url: string;
}

interface Conversation {
  id: string;
  participant_one_id: string;
  participant_two_id: string;
  created_at: string;
  updated_at: string;
  other_participant?: Profile;
  last_message?: {
    content: string;
    created_at: string;
    sender_id: string;
  };
}

interface ChatSidebarProps {
  conversations: Conversation[];
  selectedConversation: string | null;
  onSelectConversation: (id: string) => void;
  onShowSearch: () => void;
  userProfile: Profile | null;
}

export const ChatSidebar = ({
  conversations,
  selectedConversation,
  onSelectConversation,
  onShowSearch,
  userProfile
}: ChatSidebarProps) => {
  const { signOut } = useAuth();

  const formatTime = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold">Messages</h1>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={onShowSearch}>
              <Search className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onShowSearch}>
              <MessageSquarePlus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* User Profile Section */}
        {userProfile && (
          <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
            <Avatar className="h-10 w-10">
              <AvatarImage src={userProfile.avatar_url} />
              <AvatarFallback>
                {userProfile.display_name?.[0]?.toUpperCase() || userProfile.username[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">
                {userProfile.display_name || userProfile.username}
              </div>
              <div className="text-xs text-muted-foreground truncate">
                @{userProfile.username}
              </div>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={signOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            <div className="text-sm">No conversations yet</div>
            <Button 
              variant="ghost" 
              className="mt-2 text-xs" 
              onClick={onShowSearch}
            >
              Start a new conversation
            </Button>
          </div>
        ) : (
          conversations.map((conversation) => (
            <div
              key={conversation.id}
              className={`p-4 hover:bg-muted/50 cursor-pointer border-b border-border/50 transition-colors ${
                selectedConversation === conversation.id ? 'bg-muted' : ''
              }`}
              onClick={() => onSelectConversation(conversation.id)}
            >
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={conversation.other_participant?.avatar_url} />
                  <AvatarFallback>
                    {conversation.other_participant?.display_name?.[0]?.toUpperCase() || 
                     conversation.other_participant?.username?.[0]?.toUpperCase() || '?'}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium truncate">
                      {conversation.other_participant?.display_name || 
                       conversation.other_participant?.username || 'Unknown User'}
                    </div>
                    {conversation.last_message && (
                      <div className="text-xs text-muted-foreground">
                        {formatTime(conversation.last_message.created_at)}
                      </div>
                    )}
                  </div>
                  
                  {conversation.last_message && (
                    <div className="text-sm text-muted-foreground truncate mt-1">
                      {conversation.last_message.content}
                    </div>
                  )}
                  
                  <div className="text-xs text-muted-foreground mt-1">
                    @{conversation.other_participant?.username}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};