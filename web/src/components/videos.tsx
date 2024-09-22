import { useEffect } from "react";
import { getUrlResolver } from "../resolver/videoUrlResolver";
import { VideoStore } from "../store/VideoStore";

export const Videos: React.FC = () => {
  const { upsertVideo, setUrl, url } = VideoStore();

  useEffect(() => {
    chrome.storage.local.get(null, async (items) => {
      const requests = Object.values(items) as [
        chrome.webRequest.WebResponseCacheDetails
      ];
      for (const item of requests) {
        const resolver = getUrlResolver(item.url);
        if (!resolver) continue;
        const vid = document.createElement("video");
        vid.onload = () =>
          upsertVideo({
            url: vid.src,
            height: vid.height,
          });

        vid.src = await resolver.resolveVideoUrl(item.url);
      }
    });
  }, []);

  return (
    <section>
      <div className="mt-10">
        {url ? (
          <div>
            <video controls onClick={() => setUrl(url)}>
              <source src={url} />
            </video>
          </div>
        ) : (
          <div>
            <h1 className="text-xl font-bold">No videos found</h1>
            <p>Video Capturing is still in BETA</p>
          </div>
        )}
      </div>
    </section>
  );
};
