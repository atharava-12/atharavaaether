export interface ImageTextRequest {
  text: string;
  backgroundPrompt: string;
}

const stopClause = "(?=\\s+(?:and\\s+(?:(?:the|a)\\s+)?(?:theme|style|background|mood)|with\\s+(?:a\\s+)?theme|on\\s+the\\s+theme|in\\s+the\\s+(?:middle|center|centre)|at\\s+the\\s+(?:middle|center|centre)|(?:near|at)\\s+the\\s+(?:top|bottom|left|right))|[,;.!?]|$)";

const replaceTextInstruction = (prompt: string, match: RegExpExecArray) => {
  const trailingPlacement = prompt
    .slice(match.index + match[0].length)
    .match(/^\s+(?:in\s+the\s+(?:middle|center|centre)|at\s+the\s+(?:middle|center|centre)|(?:near|at)\s+the\s+(?:top|bottom|left|right))/i)?.[0] ?? "";
  return prompt.replace(`${match[0]}${trailingPlacement}`, "without any visible text").trim();
};

export function parseImageTextRequest(prompt: string): ImageTextRequest | null {
  const quoted = prompt.match(/(?:written|write|text(?: should say| saying| reading)?|words? (?:say|saying|reading))\s+["'“]([^"'”]+)["'”]/i);
  if (quoted?.[1]) {
    return {
      text: quoted[1].trim(),
      backgroundPrompt: replaceTextInstruction(prompt, quoted),
    };
  }

  const patterns = [
    new RegExp(`(?:there\\s+(?:should|needs?\\s+to)\\s+be|it\\s+should\\s+have)\\s+(?:written|the\\s+word|text\\s+(?:saying|reading))\\s+(.+?)${stopClause}`, "i"),
    new RegExp(`(?:text|words?)\\s+(?:should\\s+say|saying|reading|that\\s+says)\\s+(.+?)${stopClause}`, "i"),
    new RegExp(`\\bwrite\\s+(.+?)${stopClause}`, "i"),
  ];

  for (const pattern of patterns) {
    const match = pattern.exec(prompt);
    const text = match?.[1]?.trim().replace(/["'“”]+$/g, "");
    if (!match || !text || text.length > 48) continue;
    return {
      text,
      backgroundPrompt: replaceTextInstruction(prompt, match),
    };
  }

  return null;
}

export function addImageTextOverlay(imageUrl: string, text: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    if (!imageUrl.startsWith("data:")) image.crossOrigin = "anonymous";

    image.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        const context = canvas.getContext("2d");
        if (!context) throw new Error("Canvas is unavailable");

        context.drawImage(image, 0, 0);
        const inset = canvas.width * 0.06;
        const maxWidth = canvas.width - inset * 2;
        let fontSize = Math.round(canvas.width * 0.13);
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.font = `800 ${fontSize}px system-ui, sans-serif`;
        while (context.measureText(text).width > maxWidth && fontSize > 18) {
          fontSize = Math.floor(fontSize * 0.9);
          context.font = `800 ${fontSize}px system-ui, sans-serif`;
        }

        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const metrics = context.measureText(text);
        const textHeight = fontSize * 1.25;
        const paddingX = fontSize * 0.35;
        const paddingY = fontSize * 0.2;
        context.fillStyle = "rgba(0, 0, 0, 0.34)";
        context.fillRect(
          Math.max(0, centerX - metrics.width / 2 - paddingX),
          centerY - textHeight / 2 - paddingY,
          Math.min(canvas.width, metrics.width + paddingX * 2),
          textHeight + paddingY * 2,
        );
        context.lineJoin = "round";
        context.strokeStyle = "rgba(0, 0, 0, 0.6)";
        context.lineWidth = Math.max(2, fontSize * 0.045);
        context.strokeText(text, centerX, centerY, maxWidth);
        context.fillStyle = "#ffffff";
        context.fillText(text, centerX, centerY, maxWidth);

        resolve(canvas.toDataURL("image/png"));
      } catch (error) {
        reject(error);
      }
    };
    image.onerror = () => reject(new Error("Could not load the generated image for text rendering."));
    image.src = imageUrl;
  });
}