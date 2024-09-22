export const IMAGE_FORMATS = [
  "avif",
  "jpeg",
  "png",
  "webp",
  "avif",
  "tiff",
] as const;

export type ImageFormat = (typeof IMAGE_FORMATS)[number] | "original";

export const VIDEO_FORMATS = [
  "orginal",
  "aiff",
  "asf",
  "mp4",
  "mov",
  "gif",
  "webm",
] as const;

export type VideoFormat = (typeof VIDEO_FORMATS)[number];
