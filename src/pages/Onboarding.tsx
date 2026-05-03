import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Zap, ArrowRight, Check, Sparkles } from "lucide-react";

const INTEREST_OPTIONS = [
  "Technology", "Science", "Art & Design", "Music",
  "Gaming", "Sports", "Travel", "Cooking",
  "Business", "Health", "Education", "Writing",
];

const Onboarding = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [displayName, setDisplayName] = useState("");
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const toggleInterest = (interest: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest]
    );
  };

  const handleFinish = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await supabase
        .from("profiles")
        .update({
          display_name: displayName.trim() || null,
          interests: selectedInterests,
          onboarding_complete: true,
        } as any)
        .eq("id", user.id);
      // Trigger first-run feature tour on Index
      localStorage.removeItem("chitchat:tourSeen");
      navigate("/?tour=1", { replace: true });
    } catch {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === step
                  ? "w-8 bg-primary"
                  : i < step
                  ? "w-4 bg-primary/50"
                  : "w-4 bg-muted"
              }`}
            />
          ))}
        </div>

        {/* Step 0: Welcome */}
        {step === 0 && (
          <div className="flex flex-col items-center text-center gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Sparkles size={28} className="text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-foreground mb-2">
                Welcome to ChitChat
              </h1>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
                Let's personalize your experience. This only takes a moment.
              </p>
            </div>
            <Button
              onClick={() => setStep(1)}
              className="w-full max-w-xs gap-2"
              size="lg"
            >
              Get Started
              <ArrowRight size={16} />
            </Button>
          </div>
        )}

        {/* Step 1: Name */}
        {step === 1 && (
          <div className="flex flex-col items-center text-center gap-6 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Zap size={28} className="text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-foreground mb-2">
                What should we call you?
              </h1>
              <p className="text-sm text-muted-foreground">
                Pick a display name for your profile.
              </p>
            </div>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
              className="max-w-xs text-center text-lg h-12"
              maxLength={50}
              autoFocus
            />
            <div className="flex gap-3 w-full max-w-xs">
              <Button variant="outline" onClick={() => setStep(0)} className="flex-1">
                Back
              </Button>
              <Button
                onClick={() => setStep(2)}
                disabled={!displayName.trim()}
                className="flex-1 gap-2"
              >
                Next
                <ArrowRight size={16} />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Interests */}
        {step === 2 && (
          <div className="flex flex-col items-center text-center gap-6 animate-in fade-in slide-in-from-right-4 duration-500">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-foreground mb-2">
                What are you into?
              </h1>
              <p className="text-sm text-muted-foreground">
                Pick topics you're interested in. This helps ChitChat tailor responses.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2 max-w-sm">
              {INTEREST_OPTIONS.map((interest) => {
                const selected = selectedInterests.includes(interest);
                return (
                  <button
                    key={interest}
                    onClick={() => toggleInterest(interest)}
                    className={`px-3.5 py-2 rounded-full text-sm font-medium transition-all duration-200 active:scale-95 border ${
                      selected
                        ? "bg-primary text-primary-foreground border-primary shadow-sm"
                        : "bg-card text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
                    }`}
                  >
                    {selected && <Check size={12} className="inline mr-1 -mt-0.5" />}
                    {interest}
                  </button>
                );
              })}
            </div>
            <div className="flex gap-3 w-full max-w-xs">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                Back
              </Button>
              <Button
                onClick={handleFinish}
                disabled={saving || selectedInterests.length === 0}
                className="flex-1 gap-2"
              >
                {saving ? "Saving…" : "Finish"}
                {!saving && <Check size={16} />}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Onboarding;
