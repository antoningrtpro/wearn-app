import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * The project's font-size scale (globals.css `--text-*` tokens: caption,
 * body, body-lg, subheading, heading-sm, heading, heading-lg, display) isn't
 * part of Tailwind's built-in `text-{size}` scale, so plain twMerge can't
 * tell "text-body" apart from a text-COLOR utility like "text-ink" — both
 * match its generic `text-{value}` color matcher, so whichever comes last
 * in a merged className silently wins and the other is dropped. This is
 * exactly what was happening on every Button/AdminButton with a variant
 * (the size class always lost to the variant's text-color class). Declaring
 * the scale here keeps size and color conflicts correctly separated.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [
        {
          text: ["caption", "body", "body-lg", "subheading", "heading-sm", "heading", "heading-lg", "display"],
        },
      ],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
