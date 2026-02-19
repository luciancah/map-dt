import { StaticImageData } from "next/image";
import { ChangeEvent, useCallback, useEffect, useRef, useState } from "react";
import defaultMapSource from "@/assets/tempmap.webp";
import type { MapImage } from "@/lib/map-editor/types";

type UseMapImageUploader = {
  mapImage: MapImage | null;
  mapError: string;
  loading: boolean;
  onFileInputChange: (event: ChangeEvent<HTMLInputElement>) => void;
  clearMapImage: () => void;
  setMapImageFromFile: (file: File | null) => void;
};

function createMapImageId(fileName: string) {
  return `${fileName}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function useMapImageUploader(): UseMapImageUploader {
  const [mapImage, setMapImage] = useState<MapImage | null>(null);
  const [mapError, setMapError] = useState("");
  const [loading, setLoading] = useState(false);
  const objectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
    };
  }, []);

  const setMapImageFromFile = (file: File | null) => {
    if (!file) {
      setLoading(false);
      return;
    }
    if (!file.type.startsWith("image/")) {
      setLoading(false);
      setMapError("이미지 파일만 업로드할 수 있습니다.");
      return;
    }

    setLoading(true);
    setMapError("");
    const url = URL.createObjectURL(file);

    const img = new Image();
    img.onload = () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
      objectUrlRef.current = url;

      setMapImage({
        id: createMapImageId(file.name),
        fileName: file.name,
        src: url,
        width: img.naturalWidth,
        height: img.naturalHeight,
      });
      setLoading(false);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      setMapError("이미지 업로드에 실패했습니다.");
      setLoading(false);
    };

    img.src = url;
  };

  const setMapImageFromSource = useCallback(
    (imageSource: string | StaticImageData, fileName: string) => {
      const resolvedSource =
        typeof imageSource === "string" ? imageSource : imageSource.src;
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }

      const img = new Image();
      img.onload = () => {
        setMapImage({
          id: createMapImageId(fileName),
          fileName,
          src: resolvedSource,
          width: img.naturalWidth,
          height: img.naturalHeight,
        });
        setLoading(false);
      };

      img.onerror = () => {
        setMapError("기본 지도 불러오기에 실패했습니다.");
        setLoading(false);
      };
      img.src = resolvedSource;
    },
    [],
  );

  useEffect(() => {
    setMapImageFromSource(defaultMapSource, "tempmap.webp");
  }, [setMapImageFromSource]);

  const onFileInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    event.target.value = "";
    setMapImageFromFile(file);
  };

  const clearMapImage = () => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    setMapImage(null);
    setLoading(false);
    setMapError("");
  };

  return {
    mapImage,
    mapError,
    loading,
    onFileInputChange,
    clearMapImage,
    setMapImageFromFile,
  };
}
