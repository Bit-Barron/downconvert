import { IMAGE_FORMATS } from "@/utils/constants";
import axios from "axios";
import React, { useRef } from "react";
import { toast } from "sonner";
import { ImageStore } from "../../store/ImageStore";
import { Button } from "../ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

const API_URL = import.meta.env.VITE_API_URL;

export const ImageDownload: React.FC = () => {
  const downloadLinkRef = useRef<HTMLAnchorElement>(null);
  const { format, setFormat, selectedImages } = ImageStore();

  const sendImages = async (images: Image[]): Promise<void> => {
    try {
      const response = await axios.post(
        `${API_URL}/api/imgs`,
        {
          images,
          format,
        },
        {
          responseType: "blob",
        }
      );
      const contentdisposition =
        response.headers["content-disposition"].split("=")[1];
      const blob = new Blob([response.data], { type: "application/zip" });

      if (downloadLinkRef.current) {
        downloadLinkRef.current.href = URL.createObjectURL(blob);
        downloadLinkRef.current.download = contentdisposition;
        downloadLinkRef.current.click();
        URL.revokeObjectURL(downloadLinkRef.current.href);
      }

      toast.success("Images downloaded successfully");
    } catch (err) {
      console.error(err);
      toast.error("Error downloading images");
    }
  };

  if (selectedImages.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background bg-opacity-90 backdrop-blur-sm shadow-lg transition-all duration-300 ease-in-out">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="text-sm font-medium">
          {selectedImages.length} image{selectedImages.length !== 1 ? "s" : ""}{" "}
          selected
        </div>
        <div className="flex items-center space-x-4">
          <Select value={format} onValueChange={setFormat}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Select format" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="original">Original</SelectItem>
              {IMAGE_FORMATS.map((fmt) => (
                <SelectItem key={fmt} value={fmt}>
                  {fmt.toUpperCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={() => sendImages(selectedImages)} variant="default">
            Download
          </Button>
        </div>
      </div>
      <a ref={downloadLinkRef} className="hidden" />
    </div>
  );
};
