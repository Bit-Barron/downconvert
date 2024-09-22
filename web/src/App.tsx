import { ImageStore } from "@/store/ImageStore";
import "./App.css";
import { Images } from "./components/images";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import { Videos } from "./components/videos";
import { ImageDownload } from "./components/images/image-download";

const App = () => {
  const { selectedImages } = ImageStore();

  return (
    <section className="relative min-h-screen">
      <div className="flex justify-between mb-4">
        <Tabs defaultValue="images" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="images">Images</TabsTrigger>
            <TabsTrigger value="videos">Videos</TabsTrigger>
          </TabsList>
          <TabsContent value="images">
            <Images />
            {selectedImages.length > 0 && (
              <div className="fixed bottom-4 right-4 z-50">
                <ImageDownload />
              </div>
            )}
          </TabsContent>
          <TabsContent value="videos">
            <Videos />
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
};

export default App;
