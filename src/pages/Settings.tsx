import { useState } from "react";
import { ArrowLeft, Moon, Sun, LogOut, Trash2, Shield, FileText, Globe } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import BottomNav from "@/components/BottomNav";
import SeoHead from "@/components/SeoHead";
import { toast } from "sonner";

const Settings = () => {
  const { user, signOut, deleteAccount } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [deleting, setDeleting] = useState(false);

  const handleLogout = async () => {
    if (user) await signOut();
    navigate("/");
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm("Are you sure? This will permanently delete your account and ALL chat history. This action cannot be undone.")) return;
    if (!window.confirm("Final confirmation: Delete your account and all data?")) return;

    setDeleting(true);
    const { error } = await deleteAccount();
    setDeleting(false);

    if (error) {
      toast.error("Failed to delete account. Please try again.");
    } else {
      toast.success("Account deleted successfully.");
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SeoHead
        title="Settings – ChitChat AI"
        description="Manage your ChitChat AI account, appearance, language, privacy, and data preferences."
        path="/settings"
      />
      <div className="noise-overlay" />
      <header className="fixed top-0 left-0 right-0 z-40 h-12 flex items-center px-4 border-b border-border bg-background/80 backdrop-blur-md">
        <Link to="/" aria-label="Back to home" className="flex items-center gap-2 text-foreground hover:text-primary transition-colors">
          <ArrowLeft size={16} />
          <span className="text-sm font-medium">Back</span>
        </Link>
      </header>

      <main className="pt-16 pb-32 px-4 max-w-md mx-auto space-y-2">
        <h1 className="text-lg font-semibold tracking-tight text-foreground px-1 pb-1">Settings</h1>
        {/* User info */}
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-sm font-medium text-foreground truncate">{user?.email ?? "Anonymous"}</p>
          <p className="text-xs text-muted-foreground font-mono mt-1">{user ? "Signed in" : "Anonymous mode"}</p>
        </div>

        {/* Appearance */}
        <button
          onClick={toggleTheme}
          className="w-full flex items-center justify-between rounded-xl border border-border bg-card p-4 hover:bg-secondary transition-colors"
        >
          <span className="flex items-center gap-3 text-sm text-foreground">
            {theme === "dark" ? <Moon size={16} /> : <Sun size={16} />}
            {theme === "dark" ? "Dark Mode" : "Light Mode"}
          </span>
          <span className="text-xs text-muted-foreground font-mono">Tap to switch</span>
        </button>

        {/* Language */}
        <div className="flex items-center justify-between rounded-xl border border-border bg-card p-4">
          <span className="flex items-center gap-3 text-sm text-foreground">
            <Globe size={16} />
            Language
          </span>
          <span className="text-xs text-muted-foreground font-mono">Auto-detect</span>
        </div>

        {/* Legal */}
        <Link to="/privacy" className="w-full flex items-center gap-3 rounded-xl border border-border bg-card p-4 hover:bg-secondary transition-colors text-sm text-foreground">
          <Shield size={16} />
          Privacy Policy
        </Link>
        <Link to="/terms" className="w-full flex items-center gap-3 rounded-xl border border-border bg-card p-4 hover:bg-secondary transition-colors text-sm text-foreground">
          <FileText size={16} />
          Terms of Service
        </Link>

        {/* Actions */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 rounded-xl border border-border bg-card p-4 hover:bg-secondary transition-colors text-sm text-foreground"
        >
          <LogOut size={16} />
          Log Out
        </button>

        {user && (
          <button
            onClick={handleDeleteAccount}
            disabled={deleting}
            className="w-full flex items-center gap-3 rounded-xl border border-destructive/30 bg-card p-4 hover:bg-destructive/10 transition-colors text-sm text-destructive disabled:opacity-50"
          >
            <Trash2 size={16} />
            {deleting ? "Deleting..." : "Delete Account"}
          </button>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default Settings;
