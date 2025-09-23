import { FormEvent, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../../lib/apiClient";
import { Card } from "../../components/ui/Card";
import { StatusBadge } from "../../components/ui/StatusBadge";
import type { Message as UiMessage } from "../../types";
import { useCommentComposer, useTaskComments } from "./hooks";
import { computeUnread, formatPreview, formatSender, formatSentAt } from "./utils";

const channelLabels: Record<string, string> = {
  programa: "Programėlė",
  "el.paštas": "El. paštas",
  sms: "SMS"
};

type MessageApiItem = {
  id: string;
  task: { id: string; title: string; hiveId: string; hiveName: string };
  author: {
    id: string;
    email: string;
    roles: string[];
    firstName?: string;
    lastName?: string;
    displayName: string;
  };
  content: string;
  createdAt: string;
  isOwn: boolean;
};

type ConversationListItem = UiMessage & {
  taskId: string;
  taskTitle: string;
  hiveId: string;
  hiveName: string;
};

const mapMessageResponse = (item: MessageApiItem): ConversationListItem => ({
  id: item.id,
  sender: formatSender(item.author),
  preview: formatPreview(item.content),
  sentAt: formatSentAt(item.createdAt),
  channel: "programa",
  unread: computeUnread(item),
  taskId: item.task.id,
  taskTitle: item.task.title,
  hiveId: item.task.hiveId,
  hiveName: item.task.hiveName
});

const MessagingPage = () => {
  const {
    data: messages,
    isLoading,
    isError,
    error
  } = useQuery<MessageApiItem[], Error, ConversationListItem[]>({
    queryKey: ["messages"],
    queryFn: () => apiClient.get<MessageApiItem[]>("/messages"),
    staleTime: 10_000,
    select: (items) => items.map(mapMessageResponse)
  });
  const conversationItems = messages ?? [];
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [composerValue, setComposerValue] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (!conversationItems.length) {
      setActiveTaskId(null);
      return;
    }
    if (!activeTaskId || !conversationItems.some((message) => message.taskId === activeTaskId)) {
      setActiveTaskId(conversationItems[0].taskId);
    }
  }, [conversationItems, activeTaskId]);

  const activeMessage = useMemo<ConversationListItem | null>(() => {
    if (!conversationItems.length) return null;
    if (!activeTaskId) {
      return conversationItems[0];
    }
    return conversationItems.find((message) => message.taskId === activeTaskId) ?? conversationItems[0];
  }, [conversationItems, activeTaskId]);

  const {
    data: thread = [],
    isLoading: isThreadLoading,
    isError: isThreadError,
    error: threadError
  } = useTaskComments(activeTaskId);

  const { submit: submitComment, isSubmitting, error: composerError, resetError } = useCommentComposer(activeTaskId);

  useEffect(() => {
    setComposerValue("");
    setLocalError(null);
    resetError();
  }, [activeTaskId, resetError]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!activeTaskId) {
      return;
    }

    const trimmed = composerValue.trim();
    if (!trimmed) {
      setLocalError("Įrašykite žinutę prieš pateikdami.");
      return;
    }

    try {
      await submitComment(trimmed);
      setComposerValue("");
      setLocalError(null);
    } catch {
      // error handled by hook state
    }
  };

  const combinedError = localError ?? composerError;

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card
        title="Komunikacijos centras"
        subtitle="Kai backend'as bus paruoštas, čia bus rodomi realūs pokalbiai ir failų mainai"
        className="lg:col-span-1"
      >
        <div className="space-y-3">
          {isLoading ? (
            <p className="text-sm text-slate-400">Įkeliame paskutinius pokalbius...</p>
          ) : isError ? (
            <p className="rounded-lg border border-rose-500/40 bg-rose-500/10 p-3 text-sm text-rose-200">
              {error instanceof Error ? error.message : "Nepavyko įkelti žinučių."}
            </p>
          ) : conversationItems.length ? (
            conversationItems.map((message) => (
              <button
                key={message.id}
                type="button"
                onClick={() => setActiveTaskId(message.taskId)}
                className={`w-full rounded-xl border border-slate-800 px-3 py-3 text-left transition ${
                  activeMessage?.taskId === message.taskId
                    ? "bg-slate-900/80 text-white"
                    : "bg-slate-900/40 text-slate-300 hover:bg-slate-900/60"
                }`}
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-100">{message.sender}</p>
                  {message.unread ? <StatusBadge tone="warning">nauja</StatusBadge> : null}
                </div>
                <p className="mt-1 text-xs text-slate-400">{message.preview}</p>
                <div className="mt-3 flex items-center justify-between text-[11px] uppercase tracking-wide text-slate-500">
                  <span>{channelLabels[message.channel]}</span>
                  <span>{message.sentAt}</span>
                </div>
              </button>
            ))
          ) : (
            <p className="text-sm text-slate-400">Žinučių istorija tuščia.</p>
          )}
        </div>
      </Card>

      <Card
        title={activeMessage ? activeMessage.taskTitle : "Žinutės"}
        subtitle={
          activeMessage
            ? `${activeMessage.sender} • ${channelLabels[activeMessage.channel]} • Avilys ${activeMessage.hiveName}`
            : "Pasirinkite žinutę iš sąrašo"
        }
        className="lg:col-span-2"
      >
        {activeMessage ? (
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between text-xs uppercase tracking-wide text-slate-500">
              <span>{activeMessage.sentAt}</span>
              <StatusBadge tone={activeMessage.unread ? "warning" : "info"}>
                {activeMessage.unread ? "NEPERSKAITYTA" : "ARCHYVUOTA"}
              </StatusBadge>
            </div>

            <div className="space-y-4">
              {isThreadLoading ? (
                <p className="text-sm text-slate-400">Įkeliame pokalbio istoriją...</p>
              ) : isThreadError ? (
                <p className="rounded-lg border border-rose-500/40 bg-rose-500/10 p-3 text-sm text-rose-200">
                  {threadError instanceof Error ? threadError.message : "Nepavyko įkelti pokalbio."}
                </p>
              ) : thread.length ? (
                thread.map((entry) => (
                  <div
                    key={entry.id}
                    className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 shadow-inner shadow-black/10"
                  >
                    <div className="flex items-center justify-between text-xs uppercase tracking-wide text-slate-500">
                      <span className="font-medium text-slate-300">{entry.authorLabel}</span>
                      <span>{entry.formattedCreatedAt}</span>
                    </div>
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-200">{entry.content}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-400">Dar nėra komentarų šiame pokalbyje.</p>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <label className="block text-sm font-medium text-slate-200" htmlFor="comment-content">
                Nauja žinutė
              </label>
              <textarea
                id="comment-content"
                value={composerValue}
                onChange={(event) => {
                  setComposerValue(event.target.value);
                  if (localError) {
                    setLocalError(null);
                  }
                  if (composerError) {
                    resetError();
                  }
                }}
                rows={4}
                placeholder="Rašykite komentarą apie užduoties eigą..."
                className="w-full rounded-xl border border-slate-800 bg-slate-900/40 p-3 text-sm text-slate-200 placeholder:text-slate-500 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
              />
              {combinedError ? (
                <p className="text-sm text-rose-300" role="alert">
                  {combinedError}
                </p>
              ) : null}
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:bg-amber-500/60"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Siunčiame..." : "Siųsti"}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <p className="text-sm text-slate-400">Pasirinkite žinutę kairėje, kad peržiūrėtumėte detales.</p>
        )}
      </Card>
    </div>
  );
};

export default MessagingPage;
