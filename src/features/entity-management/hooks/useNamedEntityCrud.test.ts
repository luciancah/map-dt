import { act, waitFor } from "@testing-library/react";
import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useNamedEntityCrud } from "./useNamedEntityCrud";

type NamedEntity = { id: number; name: string };

describe("useNamedEntityCrud", () => {
  it("loads entities on mount and supports create, edit, remove", async () => {
    const list = vi.fn(async () => [{ id: 1, name: "첫 번째" }]);
    const create = vi.fn(async (name: string) => ({ id: 2, name }));
    const update = vi.fn(async (_id: number, name: string) => ({ id: 1, name }));
    const remove = vi.fn(async () => {});

    const result = renderHook(() =>
      useNamedEntityCrud<NamedEntity>({
        fetchEntities: list,
        createEntity: create,
        updateEntity: update,
        deleteEntity: remove,
        validateName: (name) => (name ? "" : "required"),
      }),
    ).result;

    await waitFor(() => {
      expect(list).toHaveBeenCalledTimes(1);
      expect(result.current.items).toHaveLength(1);
    });

    act(() => {
      result.current.setCreateName("두 번째");
    });

    await waitFor(() => {
      expect(result.current.createName).toBe("두 번째");
    });

    await act(async () => {
      await result.current.create();
    });

    expect(create).toHaveBeenCalledWith("두 번째");
    expect(result.current.items).toHaveLength(2);
    expect(result.current.createOpen).toBe(false);

    act(() => {
      result.current.beginEdit({ id: 1, name: "첫 번째" });
    });

    act(() => {
      result.current.setEditingName("수정된 이름");
    });

    await act(async () => {
      await result.current.saveEdit();
    });

    expect(update).toHaveBeenCalledWith(1, "수정된 이름");
    expect(result.current.items[0].name).toBe("수정된 이름");

    await act(async () => {
      await result.current.remove(2);
    });

    expect(remove).toHaveBeenCalledWith(2);
    expect(result.current.items).toHaveLength(1);
  });

  it("shows validation errors when name is empty", async () => {
    const result = renderHook(() =>
      useNamedEntityCrud<NamedEntity>({
        fetchEntities: () => Promise.resolve([]),
        createEntity: vi.fn(),
        updateEntity: vi.fn(),
        deleteEntity: vi.fn(),
        validateName: (name) => (name ? "" : "required"),
      }),
    ).result;

    act(() => {
      result.current.setCreateName("");
    });

    await act(async () => {
      await result.current.create();
    });

    await waitFor(() => {
      expect(result.current.createError).toBe("이름을 입력하세요.");
    });
  });
});
