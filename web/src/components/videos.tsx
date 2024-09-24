import React, { useEffect } from "react";
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
        try {
          const resolvedUrl = await resolver.resolveVideoUrl(item.url);
          if (resolvedUrl) {
            const vid = document.createElement("video");
            vid.onloadedmetadata = () => {
              upsertVideo({
                url: resolvedUrl,
                height: vid.videoHeight,
              });
            };
            vid.src = resolvedUrl;
          }
        } catch (error) {
          console.error("Error resolving video URL:", error);
        }
      }
    });
  }, []);

  return (
    <section>
      <div className="">
        {url ? (
          <div>
            <video controls src={url} onClick={() => setUrl(url)}>
              Your browser does not support the video tag.
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
