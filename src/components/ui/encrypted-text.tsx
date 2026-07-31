/**
 * VoidFetch - Aceternity Encrypted Text Effect Component
 * Copyright (c) 2026 VoidStation.
 */

"use client";

import React, { useEffect, useState } from "react";

interface EncryptedTextProps {
  text: string;
  className?: string;
  scrambleSpeed?: number;
}

const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789@#$%&*!<>~";

export function EncryptedText({
  text,
  className = "",
  scrambleSpeed = 30,
}: EncryptedTextProps) {
  const [displayText, setDisplayText] = useState(text);

  useEffect(() => {
    let iteration = 0;
    const maxIterations = text.length;

    const interval = setInterval(() => {
      setDisplayText(() => {
        return text
          .split("")
          .map((char, index) => {
            if (char === " ") return " ";
            if (index < iteration) {
              return text[index];
            }
            return CHARS[Math.floor(Math.random() * CHARS.length)];
          })
          .join("");
      });

      iteration += 1 / 3;

      if (iteration >= maxIterations) {
        clearInterval(interval);
        setDisplayText(text);
      }
    }, scrambleSpeed);

    return () => clearInterval(interval);
  }, [text, scrambleSpeed]);

  return (
    <span className={`font-mono tracking-wider ${className}`}>
      {displayText}
    </span>
  );
}
