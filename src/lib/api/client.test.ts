import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { areaApi, keepoutApi, mapApi, worldApi } from "./client";

const API_BASE_URL = process.env.NEXT_PUBLIC_TUDUBEM_API_URL ?? "http://localhost:8080";

const createResponse = async <T>(
  status: number,
  body?: T,
  headers: Record<string, string> = {},
  statusText = "OK",
) => {
  const responseBody =
    body === undefined ? null : typeof body === "string" ? body : JSON.stringify(body);

  return new Response(
    responseBody,
    {
      status,
      statusText,
      headers: {
        "content-type": body === undefined
          ? "text/plain"
          : typeof body === "string"
            ? "application/octet-stream"
            : "application/json",
        ...headers,
      },
    },
  );
};

describe("api client", () => {
  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchSpy = vi.fn(async () => {
      return createResponse(200, null);
    });
    globalThis.fetch = fetchSpy;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("requests map list and map details using expected endpoints", async () => {
    fetchSpy.mockResolvedValue(createResponse(200, [{ id: 1, name: "test" }]));
    const list = await mapApi.list();

    expect(fetchSpy).toHaveBeenCalledWith(
      `${API_BASE_URL}/map`,
      expect.objectContaining({ credentials: "include" }),
    );
    expect(list).toEqual([{ id: 1, name: "test" }]);
  });

  it("creates, updates, and removes area with proper payload", async () => {
    const areaPayload = {
      name: "Area 1",
      type: "DANGER",
      verticesJson: "[[1,2],[3,4],[5,6]]",
      metadataJson: "{}",
    };

    fetchSpy
      .mockResolvedValueOnce(
        createResponse(200, { id: 10, ...areaPayload, map: { id: 1 } }),
      )
      .mockResolvedValueOnce(
        createResponse(200, { id: 10, ...areaPayload, type: "SAFE", map: { id: 1 } }),
      )
      .mockResolvedValueOnce(new Response(null, { status: 204 }));

    await areaApi.create(1, areaPayload);
    await areaApi.update(1, 10, {
      ...areaPayload,
      type: "SAFE",
      metadataJson: "{}",
    });
    await areaApi.remove(1, 10);

    const [createCall, updateCall, removeCall] = fetchSpy.mock.calls;
    expect(createCall[0]).toBe(`${API_BASE_URL}/map/1/areas`);
    expect(createCall[1]).toEqual(
      expect.objectContaining({
        method: "POST",
        credentials: "include",
        body: JSON.stringify(areaPayload),
        headers: expect.objectContaining({
          "content-type": "application/json",
        }),
      }),
    );
    expect(updateCall[0]).toBe(`${API_BASE_URL}/map/1/areas/10`);
    expect(updateCall[1]).toEqual(
      expect.objectContaining({
        method: "PUT",
      }),
    );
    expect(removeCall[0]).toBe(`${API_BASE_URL}/map/1/areas/10`);
    expect(removeCall[1]).toEqual(
      expect.objectContaining({
        method: "DELETE",
      }),
    );
  });

  it("creates, updates, and removes keepout with expected payload", async () => {
    const keepoutPayload = {
      name: "Keepout 1",
      verticesJson: "[[1,2],[3,4],[5,6]]",
      enabled: true,
      reason: "test",
    };

    fetchSpy
      .mockResolvedValueOnce(
        createResponse(200, { id: 20, ...keepoutPayload, map: { id: 2 } }),
      )
      .mockResolvedValueOnce(createResponse(200, { id: 20, ...keepoutPayload, map: { id: 2 } }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }));

    await keepoutApi.create(2, keepoutPayload);
    await keepoutApi.update(2, 20, keepoutPayload);
    await keepoutApi.remove(2, 20);

    const calls = fetchSpy.mock.calls;
    expect(calls[0][0]).toBe(`${API_BASE_URL}/map/2/keepout-zones`);
    expect(calls[0][1]).toEqual(expect.objectContaining({ method: "POST" }));
    expect(calls[1][0]).toBe(`${API_BASE_URL}/map/2/keepout-zones/20`);
    expect(calls[1][1]).toEqual(expect.objectContaining({ method: "PUT" }));
    expect(calls[2][0]).toBe(`${API_BASE_URL}/map/2/keepout-zones/20`);
    expect(calls[2][1]).toEqual(expect.objectContaining({ method: "DELETE" }));
  });

  it("builds world and fetches world image", async () => {
    const gridPayload = {
      widthCells: 20,
      heightCells: 10,
      cellSizePx: 10,
      occupancy: [[0, 1]],
    };
    const imageBody = "png";

    fetchSpy
      .mockResolvedValueOnce(createResponse(200, gridPayload))
      .mockResolvedValueOnce(
        createResponse(200, imageBody, { "content-type": "image/png" }),
      );

    const built = await worldApi.build(3);
    const image = await worldApi.getImage(3);

    expect(fetchSpy.mock.calls[0][0]).toBe(`${API_BASE_URL}/world/3/build`);
    expect(fetchSpy.mock.calls[0][1]).toEqual(expect.objectContaining({ method: "POST" }));
    expect(fetchSpy.mock.calls[1][0]).toBe(`${API_BASE_URL}/world/3/image`);
    expect(await image.text()).toBe("png");
    expect(built).toEqual(gridPayload);
  });
});
