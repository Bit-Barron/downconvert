import { ImageFormat } from "@/utils/constants";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

interface Image {
  url: string;
  height: number;
}

export type ImageStore = {
  format: ImageFormat;
  setFormat: (format: ImageFormat) => void;

  currentTabId: number | null;
  setCurrentTabId: (tabId: number | null) => void;

  images: Image[];
  upsertImage: (image: Image) => void;
  setAllImages: (images: Image[]) => void;
  clearImages: () => void;

  selectedImages: Image[];
  setSelectedImage: (img: Image) => void;
};

export const ImageStore = create<ImageStore>()(
  immer<ImageStore>((set, get) => ({
    format: "original",
    setFormat: (format) => set((state) => ({ ...state, format })),

    currentTabId: null,
    setCurrentTabId: (tabId) =>
      set((state) => ({ ...state, currentTabId: tabId })),

    images: [],
    upsertImage: (image) => {
      const foundImage = get().images.findIndex((i) => i.url === image.url);
      if (foundImage !== -1) {
        set((state) => void (state.images[foundImage] = image));
      } else {
        set((state) => void state.images.push(image));
      }
    },
    setAllImages: (images) => set((state) => void (state.images = images)),
    clearImages: () => set((state) => void (state.images = [])),

    selectedImages: [],
    setSelectedImage: (img) => {
      const foundImage = get().selectedImages.findIndex(
        (i) => i.url === img.url
      );
      if (foundImage !== -1) {
        set((state) => void state.selectedImages.splice(foundImage, 1));
      } else {
        set((state) => void state.selectedImages.push(img));
      }
    },
  }))
);
