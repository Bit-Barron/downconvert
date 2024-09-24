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

export const ImageDownload: React.FC = () => {
  const downloadLinkRef = useRef<HTMLAnchorElement>(null);
  const { format, setFormat, selectedImages } = ImageStore();

  const sendImages = async (images: Image[]): Promise<void> => {
    try {
      console.log("Sending request with format:", format);
      const response = await axios.post(
        `https://downconvert-server.barron.agency/api/imgs`,
        {
          images,
          format,
        },
        {
          responseType: "blob",
        }
      );

      console.log("Response headers:", response.headers);
      console.log("Response type:", response.data.type);

      const contentDisposition = response.headers["content-disposition"];
      const filename = contentDisposition
        ? contentDisposition.split("filename=")[1].replace(/"/g, "")
        : "images.zip";

      const blob = new Blob([response.data], { type: "application/zip" });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("Images downloaded successfully");
    } catch (err) {
      console.error("Error downloading images:", err);
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
              <SelectItem value="original">original</SelectItem>
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
