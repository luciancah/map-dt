"use client";

import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { aiApi } from "@/lib/api/client";
import type { GenerateStreamResponse } from "@/lib/api/types";

export default function AiPage() {
  const [message, setMessage] = useState("");
  const [conversationId, setConversationId] = useState("");
  const [answer, setAnswer] = useState("");
  const [reason, setReason] = useState("");
  const [streaming, setStreaming] = useState("");
  const [streamDone, setStreamDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const doGenerate = useCallback(async () => {
    if (!message.trim()) return;

    setLoading(true);
    setError("");
    setAnswer("");
    setReason("");

    try {
      const payload = { message, conversationId: conversationId || undefined };
      const response = await aiApi.generate(payload);
      setConversationId(response.conversationId);
      setAnswer(response.generation);
      setReason(response.reason ?? "");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "생성 실패");
    } finally {
      setLoading(false);
    }
  }, [conversationId, message]);

  const onStreamMessage = useCallback((next: GenerateStreamResponse) => {
    if (next.done) {
      setStreamDone(true);
      setConversationId(next.conversationId);
      return;
    }

    setConversationId(next.conversationId);
    setStreaming((prev) => `${prev}${next.delta}`);
  }, []);

  const doStream = useCallback(async () => {
    if (!message.trim()) return;

    setLoading(true);
    setError("");
    setStreaming("");
    setAnswer("");
    setReason("");
    setStreamDone(false);

    try {
      await aiApi.streamGenerate(
        { message, conversationId: conversationId || undefined },
        onStreamMessage,
      );
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "스트림 생성 실패");
    } finally {
      setLoading(false);
    }
  }, [conversationId, message, onStreamMessage]);

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle>AI 생성</CardTitle>
          <CardDescription>LLM 단건 생성/스트림 생성 API를 테스트합니다.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="ai-message">메시지</Label>
            <Input
              id="ai-message"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="예: 안녕하세요, 오늘 일정 추천해줘"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="ai-conversation">conversationId (선택)</Label>
            <Input
              id="ai-conversation"
              value={conversationId}
              onChange={(event) => setConversationId(event.target.value)}
              placeholder="비워두면 새로 생성"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={doGenerate} disabled={loading || !message.trim()}>
              {loading ? "처리 중" : "단건 생성"}
            </Button>
            <Button onClick={doStream} variant="outline" disabled={loading || !message.trim()}>
              {loading ? "스트리밍 중" : "스트리밍 생성"}
            </Button>
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {conversationId ? <p className="text-sm text-muted-foreground">conversation: {conversationId}</p> : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>단건 응답</CardTitle>
          <CardDescription>generate API 응답</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p className="whitespace-pre-wrap">{answer || "-"}</p>
            {reason ? <p className="text-muted-foreground">reason: {reason}</p> : null}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>스트림 응답</CardTitle>
          <CardDescription>streamGenerate의 delta 누적 결과</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="min-h-12 whitespace-pre-wrap text-sm">
            {streaming || (streamDone ? "(완료)" : "-")}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
