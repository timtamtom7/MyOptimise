import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateBlueGradient(seed: string) {
  // Simple hash function
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }

  // Generate two blue hues
  // Blue is around 200-260 degrees in HSL
  // We'll constrain it to a nice ocean/sky blue range (190-230)
  const h1 = (Math.abs(hash) % 40) + 190;
  const h2 = (Math.abs(hash >> 8) % 40) + 190;

  const s1 = 70 + (Math.abs(hash) % 20); // 70-90% saturation
  const l1 = 40 + (Math.abs(hash) % 20); // 40-60% lightness

  const s2 = 70 + (Math.abs(hash >> 8) % 20);
  const l2 = 40 + (Math.abs(hash >> 8) % 20);

  return `linear-gradient(135deg, hsl(${h1}, ${s1}%, ${l1}%), hsl(${h2}, ${s2}%, ${l2}%))`;
}
