import { useCallback, useEffect, useState } from "react";
import type { Layer, LayerContext } from "@/lib/map-editor/types";
import {
  DEFAULT_AREA_TYPE,
  DEFAULT_METADATA_JSON,
} from "@/features/world-editor/world-editor-constants";

type UseWorldEditorInspectorFormOptions = {
  selectedLayer: Layer | null;
  defaultLayerContext?: LayerContext;
};

export type UseWorldEditorInspectorFormResult = {
  selectedLayerContext: LayerContext;
  setSelectedLayerContext: (nextContext: LayerContext) => void;
  areaType: string;
  setAreaType: (value: string) => void;
  metadataJson: string;
  setMetadataJson: (value: string) => void;
  keepoutEnabled: boolean;
  setKeepoutEnabled: (value: boolean) => void;
  keepoutReason: string;
  setKeepoutReason: (value: string) => void;
  reset: () => void;
};

const getSafeLayerContext = (value: LayerContext | undefined): LayerContext =>
  value === "keepout" ? "keepout" : "area";

export function useWorldEditorInspectorForm({
  selectedLayer,
  defaultLayerContext = "area",
}: UseWorldEditorInspectorFormOptions): UseWorldEditorInspectorFormResult {
  const [selectedLayerContext, setSelectedLayerContext] =
    useState<LayerContext>(defaultLayerContext);
  const [areaType, setAreaType] = useState(DEFAULT_AREA_TYPE);
  const [metadataJson, setMetadataJson] = useState(DEFAULT_METADATA_JSON);
  const [keepoutEnabled, setKeepoutEnabled] = useState(true);
  const [keepoutReason, setKeepoutReason] = useState("");

  useEffect(() => {
    const sync = async () => {
      if (!selectedLayer) {
        setSelectedLayerContext(getSafeLayerContext(defaultLayerContext));
        setAreaType(DEFAULT_AREA_TYPE);
        setMetadataJson(DEFAULT_METADATA_JSON);
        setKeepoutEnabled(true);
        setKeepoutReason("");
        return;
      }

      setSelectedLayerContext(getSafeLayerContext(selectedLayer.context));
      setAreaType(selectedLayer.serverType ?? DEFAULT_AREA_TYPE);
      setMetadataJson(selectedLayer.serverMetadataJson ?? DEFAULT_METADATA_JSON);
      setKeepoutEnabled(selectedLayer.serverEnabled ?? true);
      setKeepoutReason(selectedLayer.serverReason ?? "");
    };

    void sync();
  }, [defaultLayerContext, selectedLayer]);

  const reset = useCallback(() => {
    setSelectedLayerContext(getSafeLayerContext(defaultLayerContext));
    setAreaType(DEFAULT_AREA_TYPE);
    setMetadataJson(DEFAULT_METADATA_JSON);
    setKeepoutEnabled(true);
    setKeepoutReason("");
  }, [defaultLayerContext]);

  return {
    selectedLayerContext,
    setSelectedLayerContext,
    areaType,
    setAreaType,
    metadataJson,
    setMetadataJson,
    keepoutEnabled,
    setKeepoutEnabled,
    keepoutReason,
    setKeepoutReason,
    reset,
  };
}
