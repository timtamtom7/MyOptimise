export type MediaType = "image" | "video" | "video_external" | "file" | "unknown";

export function getMediaType(url: string): MediaType {
  if (!url) return "unknown";
  
  const cleanUrl = url.toLowerCase();
  
  // Check for external video services
  if (cleanUrl.includes("youtube.com") || cleanUrl.includes("youtu.be") || cleanUrl.includes("vimeo.com")) {
    return "video_external";
  }

  const ext = url.split(".").pop()?.toLowerCase().split("?")[0]; // Handle query params
  
  if (["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp", "tiff"].includes(ext || "")) {
    return "image";
  }
  
  if (["mp4", "mov", "webm", "m4v", "avi", "mkv"].includes(ext || "")) {
    return "video";
  }
  
  return "file";
}

export function getVideoEmbedUrl(url: string): string | null {
  if (!url) return null;
  
  // YouTube
  const ytMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
  if (ytMatch && ytMatch[1]) {
    return `https://www.youtube.com/embed/${ytMatch[1]}`;
  }
  
  // Vimeo
  const vimeoMatch = url.match(/(?:vimeo\.com\/)(\d+)/);
  if (vimeoMatch && vimeoMatch[1]) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  }
  
  return null;
}
