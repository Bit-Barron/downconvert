import { ImageStore } from "@/store/ImageStore";
import React, { useCallback, useEffect, useState } from "react";
import { Toaster } from "sonner";
import { ImageMasonry } from "./images/image-masonry";

interface ImageDetails {
  url: string;
  type: string;
}

interface ImageData {
  url: string;
  height: number;
}

export const Images: React.FC = () => {
  const { upsertImage, setAllImages, clearImages, setCurrentTabId } =
    ImageStore();
  const [loading, setLoading] = useState(true);

  const loadImages = useCallback(
    async (tabId: number) => {
      setLoading(true);
      clearImages();

      chrome.storage.local.get(tabId.toString(), (items) => {
        const requests = (items[tabId.toString()] as ImageDetails[]) || [];
        const imgs = requests.filter(({ type }) => type === "image");

        const uniqueImages = [
          ...new Map(imgs.map((item) => [item.url, item])).values(),
        ];

        const imagePromises = uniqueImages.map(({ url }) => {
          return new Promise<ImageData>((resolve) => {
            const img = new Image();
            img.onload = () => resolve({ url: img.src, height: img.height });
            img.onerror = () => resolve({ url, height: 0 }); // Handle load errors
            img.src = url;
          });
        });

        Promise.all(imagePromises).then((loadedImages) => {
          setAllImages(loadedImages);
          loadedImages.forEach((image) => upsertImage(image));
          setLoading(false);
        });
      });
    },
    [upsertImage, setAllImages, clearImages]
  );

  const handleTabChange = useCallback(
    (tabId: number) => {
      setCurrentTabId(tabId);
      loadImages(tabId);
    },
    [setCurrentTabId, loadImages]
  );

  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0] && tabs[0].id) {
        handleTabChange(tabs[0].id);
      }
    });

    const messageListener = (message: { type: string; tabId: number }) => {
      if (message.type === "TAB_CHANGED") {
        handleTabChange(message.tabId);
      }
    };

    chrome.runtime.onMessage.addListener(messageListener);

    return () => {
      chrome.runtime.onMessage.removeListener(messageListener);
    };
  }, [handleTabChange]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        Loading images...
      </div>
    );
  }

  return (
    <div className="relative min-h-screen pb-16">
      <Toaster richColors position="top-center" />
      <ImageMasonry />
    </div>
  );
};
