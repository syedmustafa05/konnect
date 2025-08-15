import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { Search, X, ArrowLeft } from 'lucide-react';

interface Profile {
  id: string;
  user_id: string;
  username: string;
  display_name: string;
  bio: string;
  avatar_url: string;
}

interface UserSearchProps {
  onSelectUser: (userId: string) => void;
  onClose: () => void;
}

export const UserSearch = ({ onSelectUser, onClose }: UserSearchProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (searchQuery.trim()) {
      searchUsers(searchQuery.trim());
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const searchUsers = async (query: string) => {
    setLoading(true);
    
    const { data: users, error } = await supabase
      .from('profiles')
      .select('*')
      .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
      .limit(20);

    if (error) {
      console.error('Error searching users:', error);
    } else {
      setSearchResults(users || []);
    }

    setLoading(false);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Search Header */}
      <div className="p-4 border-b border-border bg-card">
        <div className="flex items-center gap-3 mb-4">
          <Button variant="ghost" size="icon" onClick={onClose}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-lg font-semibold">Search Users</h2>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by username or display name..."
            className="pl-10"
            autoFocus
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6"
              onClick={() => setSearchQuery('')}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Search Results */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-center text-muted-foreground">
            Searching...
          </div>
        ) : searchQuery.trim() === '' ? (
          <div className="p-4 text-center text-muted-foreground">
            <div className="text-sm">Start typing to search for users</div>
          </div>
        ) : searchResults.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            <div className="text-sm">No users found</div>
            <div className="text-xs mt-1">Try a different search term</div>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {searchResults.map((user) => (
              <div
                key={user.id}
                className="p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => onSelectUser(user.user_id)}
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={user.avatar_url} />
                    <AvatarFallback>
                      {user.display_name?.[0]?.toUpperCase() || 
                       user.username[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">
                      {user.display_name || user.username}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      @{user.username}
                    </div>
                    {user.bio && (
                      <div className="text-xs text-muted-foreground mt-1 truncate">
                        {user.bio}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};