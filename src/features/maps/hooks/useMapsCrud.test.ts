import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { mapApi } from "@/lib/api/client";
import { useMapsCrud } from "./useMapsCrud";

const mockMap = (id: number, name: string) => ({
  id,
  name,
  sensorMapImagePath: null as string | null,
});

describe("useMapsCrud", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("loads maps and manages create/update/delete flow", async () => {
    const list = vi
      .spyOn(mapApi, "list")
      .mockResolvedValueOnce([mockMap(1, "First")]);
    const createMapApi = vi
      .spyOn(mapApi, "create")
      .mockResolvedValueOnce(mockMap(2, "Second"));
    const updateMapApi = vi
      .spyOn(mapApi, "update")
      .mockResolvedValueOnce({ id: 1, name: "Renamed" });
    const removeMapApi = vi.spyOn(mapApi, "remove").mockResolvedValue(undefined);

    const { result } = renderHook(() => useMapsCrud());

    await waitFor(() => {
      expect(result.current.maps).toHaveLength(1);
      expect(list).toHaveBeenCalledTimes(1);
    });

    act(() => {
      result.current.setCreateName("Second");
    });
    await act(async () => {
      const created = await result.current.createMap();
      expect(created).toBe(true);
    });
    expect(createMapApi).toHaveBeenCalledWith("Second");
    expect(result.current.maps).toHaveLength(2);

    act(() => {
      const target = result.current.maps[0];
      result.current.beginRename(target);
      result.current.setEditingName("Renamed");
    });
    await act(async () => {
      const saved = await result.current.submitRename();
      expect(saved).toBe(true);
    });
    expect(updateMapApi).toHaveBeenCalledWith(1, "Renamed");
    expect(result.current.maps[0].name).toBe("Renamed");

    await act(async () => {
      const deleted = await result.current.removeMap(2);
      expect(deleted).toBe(true);
    });
    expect(removeMapApi).toHaveBeenCalledWith(2);
    expect(result.current.maps).toHaveLength(1);
  });

  it("blocks invalid name input", async () => {
    vi.spyOn(mapApi, "list").mockResolvedValue([]);
    const { result } = renderHook(() => useMapsCrud());

    act(() => {
      result.current.setCreateName("");
    });
    await act(async () => {
      const created = await result.current.createMap();
      expect(created).toBe(false);
    });

    await waitFor(() => {
      expect(result.current.createError).toBe("이름은 1~100자 사이여야 합니다.");
    });
  });
});
