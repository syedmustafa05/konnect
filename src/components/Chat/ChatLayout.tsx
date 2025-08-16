import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ChatSidebar } from './ChatSidebar';
import { ChatWindow } from './ChatWindow';
import { UserSearch } from './UserSearch';

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

const ChatLayout = () => {
  const { user, loading } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [showSearch, setShowSearch] = useState(false);

  const loadUserProfile = useCallback(async () => {
    if (!user) return;

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error('Error loading profile:', error);
      return;
    }

    setUserProfile(profile);
  }, [user]);

  const loadConversations = useCallback(async () => {
    if (!user) return;

    // Get conversations where user is a participant
    const { data: convos, error } = await supabase
      .from('conversations')
      .select(`
        *,
        messages!inner (
          content,
          created_at,
          sender_id
        )
      `)
      .or(`participant_one_id.eq.${user.id},participant_two_id.eq.${user.id}`)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error loading conversations:', error);
      return;
    }

    // Get other participants' profiles
    const conversationsWithProfiles = await Promise.all(
      convos.map(async (convo) => {
        const otherParticipantId = convo.participant_one_id === user.id 
          ? convo.participant_two_id 
          : convo.participant_one_id;

        const { data: otherProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', otherParticipantId)
          .single();

        // Get latest message
        const { data: lastMessage } = await supabase
          .from('messages')
          .select('content, created_at, sender_id')
          .eq('conversation_id', convo.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        return {
          ...convo,
          other_participant: otherProfile,
          last_message: lastMessage
        };
      })
    );

    setConversations(conversationsWithProfiles);
  }, [user]);

  // Load user profile
  useEffect(() => {
    if (user?.id) {
      loadUserProfile();
    }
  }, [user?.id, loadUserProfile]);

  // Load conversations
  useEffect(() => {
    if (userProfile?.user_id && user?.id) {
      loadConversations();
    }
  }, [userProfile?.user_id, user?.id, loadConversations]);

  // Redirect to auth if not logged in
  if (!loading && !user) {
    return <Navigate to="/auth" replace />;
  }

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  const startConversation = async (otherUserId: string) => {
    if (!user) return;

    // Check if conversation already exists
    const { data: existingConvo } = await supabase
      .from('conversations')
      .select('id')
      .or(`and(participant_one_id.eq.${user.id},participant_two_id.eq.${otherUserId}),and(participant_one_id.eq.${otherUserId},participant_two_id.eq.${user.id})`)
      .single();

    if (existingConvo) {
      setSelectedConversation(existingConvo.id);
      setShowSearch(false);
      return;
    }

    // Create new conversation
    const { data: newConvo, error } = await supabase
      .from('conversations')
      .insert({
        participant_one_id: user.id,
        participant_two_id: otherUserId
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating conversation:', error);
      return;
    }

    setSelectedConversation(newConvo.id);
    setShowSearch(false);
    loadConversations(); // Refresh conversations list
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar - Hidden on mobile when chat is selected */}
      <div className={`${selectedConversation ? 'hidden md:flex' : 'flex'} w-full md:w-80 border-r border-border flex-col`}>
        <ChatSidebar
          conversations={conversations}
          selectedConversation={selectedConversation}
          onSelectConversation={setSelectedConversation}
          onShowSearch={() => setShowSearch(true)}
          userProfile={userProfile}
        />
      </div>

      {/* Main Chat Area - Full width on mobile, hidden when sidebar is shown */}
      <div className={`${selectedConversation ? 'flex' : 'hidden md:flex'} flex-1 flex-col`}>
        {showSearch ? (
          <UserSearch
            onSelectUser={startConversation}
            onClose={() => setShowSearch(false)}
          />
        ) : selectedConversation ? (
          <ChatWindow
            conversationId={selectedConversation}
            currentUserId={user?.id || ''}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <div className="text-lg font-medium mb-2">Welcome to Chat</div>
              <div className="text-sm">Select a conversation or search for users to start messaging</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatLayout;