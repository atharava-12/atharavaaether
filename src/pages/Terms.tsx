import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import SeoHead from "@/components/SeoHead";

const Terms = () => (
  <div className="min-h-screen bg-background">
    <SeoHead
      title="Terms of Service – ChitChat AI"
      description="The terms governing your use of ChitChat AI, including acceptable use, AI disclaimer, accounts, and limitation of liability."
      path="/terms"
    />
    <div className="noise-overlay" />
    <div className="max-w-2xl mx-auto px-6 py-16">
      <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8">
        <ArrowLeft size={14} />
        Back to ChitChat
      </Link>
      <h1 className="text-2xl font-bold text-foreground mb-2">Terms of Service</h1>
      <p className="text-xs text-muted-foreground mb-8 font-mono">Last updated: {new Date().toLocaleDateString()}</p>
      <div className="prose-aether space-y-6 text-sm text-muted-foreground">
        <section><h2 className="text-foreground font-semibold text-base">1. Acceptance</h2><p>By using ChitChat, you agree to these Terms of Service.</p></section>
        <section><h2 className="text-foreground font-semibold text-base">2. Service</h2><p>ChitChat provides AI-powered conversational and image generation features. Responses are AI-generated and may be inaccurate.</p></section>
        <section><h2 className="text-foreground font-semibold text-base">3. User Accounts</h2><p>You are responsible for maintaining the security of your account credentials. You must be at least 13 years old to use this service.</p></section>
        <section><h2 className="text-foreground font-semibold text-base">4. Acceptable Use</h2><p>You may not use ChitChat for illegal activities, harassment, generating harmful content, or any purpose that violates applicable laws.</p></section>
        <section><h2 className="text-foreground font-semibold text-base">5. AI Disclaimer</h2><p>AI-generated responses may contain errors or inaccuracies. Always verify important information from authoritative sources.</p></section>
        <section><h2 className="text-foreground font-semibold text-base">6. Termination</h2><p>We may suspend or terminate your account for violations. You may delete your account at any time from Settings.</p></section>
        <section><h2 className="text-foreground font-semibold text-base">7. Limitation of Liability</h2><p>ChitChat is provided "as is" without warranties. We are not liable for any damages arising from your use of the service.</p></section>
      </div>
    </div>
  </div>
);

export default Terms;
