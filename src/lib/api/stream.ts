export type SseListener<T> = (payload: T) => void;

export const subscribeSse = <T>(
  streamUrl: string,
  onMessage: SseListener<T>,
  options?: {
    event?: string;
    onError?: (error: unknown) => void;
  },
): (() => void) => {
  const source = new EventSource(streamUrl);
  const parseMessage = (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) {
      return;
    }

    try {
      onMessage(JSON.parse(trimmed) as T);
    } catch {
      onMessage(trimmed as T);
    }
  };

  const onMessageEvent = (event: MessageEvent) => {
    parseMessage(event.data as string);
  };

  if (options?.event) {
    source.addEventListener(options.event, onMessageEvent);
  } else {
    source.onmessage = onMessageEvent;
  }

  source.onerror = (event) => {
    if (options?.onError) {
      options.onError(event);
    }
  };

  return () => {
    if (options?.event) {
      source.removeEventListener(options.event, onMessageEvent);
    } else {
      source.onmessage = null;
    }
    source.onerror = null;
    source.close();
  };
};

export const readNdjson = async <T>(
  streamUrl: string,
  onMessage: (payload: T) => void,
  options: RequestInit & { credentials?: RequestCredentials } = {},
): Promise<void> => {
  const response = await fetch(streamUrl, {
    credentials: options.credentials ?? "include",
    ...options,
  });

  if (!response.ok) {
    const responseText = await response.text();
    throw new Error(responseText || `Request failed: ${response.status}`);
  }

  if (!response.body) {
    throw new Error("No response stream available");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) {
        continue;
      }

      try {
        onMessage(JSON.parse(line) as T);
      } catch {
        onMessage(line as T);
      }
    }
  }

  const tail = buffer.trim();
  if (tail) {
    try {
      onMessage(JSON.parse(tail) as T);
    } catch {
      onMessage(tail as T);
    }
  }
};
