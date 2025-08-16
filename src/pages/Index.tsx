import { useEffect } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { MessageCircle, Users, Zap, Shield } from 'lucide-react';

const Index = () => {
  const { user, loading } = useAuth();

  // Redirect authenticated users to chat
  if (!loading && user) {
    return <Navigate to="/chat" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-primary/20">
      {/* Header */}
      <header className="p-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary">
              <MessageCircle className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">ChatApp</span>
          </div>
          
          {!loading && (
            <div className="flex items-center gap-4">
              <Button variant="ghost" asChild>
                <Link to="/auth">Sign In</Link>
              </Button>
              <Button asChild>
                <Link to="/auth">Get Started</Link>
              </Button>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Connect & Chat with Friends
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            A modern, secure messaging platform that keeps you connected with the people who matter most.
          </p>
          
          {!loading && (
            <div className="flex items-center justify-center gap-4">
              <Button size="lg" asChild>
                <Link to="/auth">Start Messaging</Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link to="/auth">Create Account</Link>
              </Button>
            </div>
          )}
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="text-center p-6">
            <div className="p-4 rounded-full bg-primary/10 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Zap className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Real-time Messaging</h3>
            <p className="text-muted-foreground">
              Instant delivery and real-time updates keep your conversations flowing naturally.
            </p>
          </div>

          <div className="text-center p-6">
            <div className="p-4 rounded-full bg-primary/10 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Secure & Private</h3>
            <p className="text-muted-foreground">
              Your messages are protected with industry-standard security and encryption.
            </p>
          </div>

          <div className="text-center p-6">
            <div className="p-4 rounded-full bg-primary/10 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Users className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Find Friends</h3>
            <p className="text-muted-foreground">
              Easily find and connect with friends using their unique usernames.
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-card rounded-lg p-8 border">
          <h2 className="text-2xl font-bold mb-4">Ready to get started?</h2>
          <p className="text-muted-foreground mb-6">
            Join thousands of users who are already connecting through our platform.
          </p>
          
          {!loading && (
            <Button size="lg" asChild>
              <Link to="/auth">Create Your Account</Link>
            </Button>
          )}
        </div>
      </main>
    </div>
  );
};

export default Index;
