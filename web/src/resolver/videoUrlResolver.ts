import { VideoStore } from "@/store/VideoStore";
import axios from "axios";

export function getUrlResolver(url: string): VideoUrlResolver | undefined {
  if (
    url.startsWith("https://www.facebook.com/watch/?v=") ||
    url.startsWith("https://www.facebook.com/watch?v=")
  ) {
    return new FacebookUrlResolver();
  } else if (
    url.startsWith("https://v16-webapp-prime.tiktok.com") ||
    url.startsWith("https://www.tiktok.com/")
  ) {
    return new TikTokUrlResolver();
  } else if (
    url.startsWith("https://cf-st.sc-cdn.net/d/") ||
    url.startsWith("https://cf-st.sc-cdn.net/p/")
  ) {
    return new SnapchatUrlResolver();
  }
}

export interface VideoUrlResolver {
  resolveVideoUrl(originurl: string): Promise<string>;
}

export class RedditUrlResolver implements VideoUrlResolver {
  async resolveVideoUrl(originurl: string): Promise<string> {
    console.log(originurl);
    const { setUrl } = VideoStore.getState();
    const headers = {
      accept: "application/json",
    };
    const client = axios.create({ headers });

    try {
      const jsonUrl = `${originurl}.json`;
      const response = await client.get(jsonUrl);
      const data = response.data;

      const videoUrl =
        data[0]?.data?.children[0]?.data?.secure_media?.reddit_video
          ?.fallback_url;

      if (videoUrl) {
        setUrl(videoUrl);
        return videoUrl;
      }
    } catch (error) {
      console.error("Error resolving Reddit video URL:", error);
    }

    return "";
  }
}
export class FacebookUrlResolver implements VideoUrlResolver {
  async resolveVideoUrl(originurl: string): Promise<string> {
    const { setUrl } = VideoStore.getState();
    const headers = {
      accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
    };
    const client = axios.create({ headers });
    const response = await client.get(originurl);
    const data = response.data;

    const regexRateLimit = /playable_url_quality_hd":"([^"]+)"/;
    const matches = data.match(regexRateLimit);
    if (matches) {
      const cleanStr = (str: string) => {
        const tmpStr = `{"text": "${str}"}`;
        return JSON.parse(tmpStr).text;
      };
      const hdLink = cleanStr(matches[1]);
      setUrl(hdLink);
      return hdLink;
    }
    return "";
  }
}

export class TikTokUrlResolver implements VideoUrlResolver {
  async resolveVideoUrl(originurl: string): Promise<string> {
    const { setUrl } = VideoStore.getState();
    const headers = {
      accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
    };
    const client = axios.create({ headers });
    const response = await client.get(originurl);
    const data = response.data;

    const parser = new DOMParser();
    const doc = parser.parseFromString(data, "text/html");

    const videoElement = doc.querySelector("video");
    const videoUrl = videoElement?.getAttribute("src");

    if (videoUrl) {
      setUrl(videoUrl); // Set the resolved URL to the store
      return videoUrl; // Return the video URL
    }

    return "";
  }
}

export class SnapchatUrlResolver implements VideoUrlResolver {
  async resolveVideoUrl(originurl: string): Promise<string> {
    const { setUrl } = VideoStore.getState();
    setUrl(originurl);
    return originurl;
  }
}
