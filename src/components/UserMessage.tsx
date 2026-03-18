import { motion } from "framer-motion";

interface UserMessageProps {
  content: string;
  mode: "chat" | "image";
}

const UserMessage = ({ content, mode }: UserMessageProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="w-full flex justify-end"
    >
      <div className="max-w-[80%] bg-secondary border border-border rounded-lg px-4 py-3">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-mono tracking-[0.1em] uppercase text-muted-foreground">
            {mode === "chat" ? "QUERY" : "IMAGE PROMPT"}
          </span>
        </div>
        <p className="text-sm text-foreground">{content}</p>
      </div>
    </motion.div>
  );
};

export default UserMessage;
