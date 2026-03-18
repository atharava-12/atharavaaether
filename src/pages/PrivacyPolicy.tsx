import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-background text-foreground px-6 py-8 max-w-3xl mx-auto">
      <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8">
        <ArrowLeft size={16} /> Back to ChitChat
      </Link>

      <h1 className="text-2xl font-bold mb-6">Privacy Policy</h1>
      <p className="text-sm text-muted-foreground mb-4">Last updated: {new Date().toLocaleDateString()}</p>

      <div className="prose-aether text-sm space-y-6">
        <section>
          <h2 className="text-lg font-semibold mb-2">1. Information We Collect</h2>
          <p>ChitChat collects the following information:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Chat messages</strong>: Text you send to generate AI responses. Messages are processed in real-time and stored locally on your device.</li>
            <li><strong>Voice data</strong>: If you use voice input, audio is processed by your browser's Speech Recognition API and converted to text. We do not store audio recordings.</li>
            <li><strong>Generated content</strong>: Images and videos generated through the app are created via third-party AI services.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">2. How We Use Your Information</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>To provide AI-powered chat responses</li>
            <li>To generate images and videos based on your prompts</li>
            <li>To improve app performance and user experience</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">3. Third-Party Services</h2>
          <p>ChitChat uses the following third-party services:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Google Gemini AI</strong>: For chat responses and image generation</li>
            <li><strong>Luma AI</strong>: For video generation</li>
          </ul>
          <p>These services may process your prompts according to their own privacy policies.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">4. Data Storage & Security</h2>
          <p>Chat history is stored locally on your device using browser storage. We do not store your conversations on our servers. All API communications are encrypted using HTTPS/TLS.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">5. Data Sharing</h2>
          <p>We do not sell or share your personal data with third parties. Your prompts are only sent to AI service providers to generate responses.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">6. Your Rights</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>You can clear your chat history at any time using the "Clear Chat" button</li>
            <li>You can revoke microphone permissions through your browser/device settings</li>
            <li>You can stop using the app at any time</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">7. Children's Privacy</h2>
          <p>ChitChat is not intended for children under 13. We do not knowingly collect information from children under 13.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">8. AI Disclaimer</h2>
          <p className="p-3 bg-secondary rounded-lg border border-border">
            ⚠️ ChitChat uses AI-generated responses which may not always be accurate, complete, or appropriate. AI-generated content should not be considered professional advice. Users should verify important information independently.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">9. Contact</h2>
          <p>If you have questions about this Privacy Policy, please contact us through the app.</p>
        </section>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
