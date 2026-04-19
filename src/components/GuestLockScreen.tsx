import { Lock, LogIn } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useGuestMode } from "@/hooks/useGuestMode";

interface Props { feature: string }

const GuestLockScreen = ({ feature }: Props) => {
  const navigate = useNavigate();
  const { exitGuestMode } = useGuestMode();

  const handleSignIn = () => {
    exitGuestMode();
    navigate("/auth");
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-5 pb-24">
      <div className="w-16 h-16 rounded-2xl bg-card border border-border flex items-center justify-center">
        <Lock size={24} className="text-primary" />
      </div>
      <div className="space-y-2 max-w-sm">
        <h2 className="text-lg font-semibold tracking-[-0.03em] text-foreground">
          {feature} is locked in guest mode
        </h2>
        <p className="text-sm text-muted-foreground font-mono">
          Sign in or create an account to unlock {feature.toLowerCase()} and save your work.
        </p>
      </div>
      <button
        onClick={handleSignIn}
        className="h-11 px-6 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-2"
      >
        <LogIn size={16} />
        Sign In / Create Account
      </button>
    </div>
  );
};

export default GuestLockScreen;
