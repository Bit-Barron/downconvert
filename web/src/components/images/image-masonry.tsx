/* eslint-disable @typescript-eslint/no-explicit-any */
import { a, useTransition } from "@react-spring/web";
import shuffle from "lodash.shuffle";
import React, { useEffect, useMemo } from "react";
import useMeasure from "react-use-measure";
import { ImageStore } from "../../store/ImageStore";
import useMedia from "../../store/MediaStore";
import styles from "./styles.module.css";

export const ImageMasonry: React.FC = () => {
  const { images, setAllImages, setSelectedImage, selectedImages } =
    ImageStore();

  const columns = useMedia(
    ["(min-width: 1500px)", "(min-width: 1000px)", "(min-width: 600px)"],
    [5, 4, 3],
    2
  );

  const [ref, { width }] = useMeasure();

  useEffect(() => {
    setAllImages(shuffle(images));
  }, []);

  const [heights, gridItems] = useMemo(() => {
    const heights = new Array(columns).fill(0);
    const gridItems = images.map((child) => {
      const column = heights.indexOf(Math.min(...heights));
      const x = (width / columns) * column;
      const y = (heights[column] += child.height / 2) - child.height / 2;
      return {
        ...child,
        x,
        y,
        width: width / columns,
        height: child.height / 2,
      };
    });
    return [heights, gridItems];
  }, [columns, images, width]);

  const transitions = useTransition(gridItems, {
    key: (item: { css: string; height: number; id: string }) => item.id,
    from: ({ x, y, width, height }) => ({ x, y, width, height, opacity: 0 }),
    enter: ({ x, y, width, height }) => ({ x, y, width, height, opacity: 1 }),
    update: ({ x, y, width, height }) => ({ x, y, width, height }),
    leave: { height: 0, opacity: 0 },
    config: { mass: 5, tension: 500, friction: 100 },
    trail: 25,
  });

  return (
    <div
      ref={ref}
      className={styles.list}
      style={{ height: Math.max(...heights) }}
    >
      {transitions((style, item: any) => (
        <a.div style={style}>
          <div
            onClick={() => setSelectedImage(item)}
            style={{
              backgroundImage: `url(${item.url})`,
              borderWidth: selectedImages.includes(item) ? "4px" : "0px",
              borderStyle: "solid",
              borderColor: "rgb(30, 64, 175)",
            }}
          >
            {item.isGif && (
              <div className="absolute bottom-0 right-0 bg-black bg-opacity-50 text-white px-2 py-1 text-xs">
                GIF
              </div>
            )}
          </div>
        </a.div>
      ))}
    </div>
  );
};
