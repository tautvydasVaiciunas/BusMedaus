import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../../lib/apiClient";
import { Card } from "../../components/ui/Card";
import { StatusBadge } from "../../components/ui/StatusBadge";
import type { Message as UiMessage } from "../../types";

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

const formatSender = (author: MessageApiItem["author"]): string => {
  if (author.displayName && author.displayName.trim()) {
    return author.displayName;
  }
  const parts = [author.firstName, author.lastName].filter((part) => part && part.trim());
  if (parts.length) {
    return parts.join(" ");
  }
  return author.email;
};

const formatPreview = (content: string): string => {
  const normalized = content.trim();
  return normalized.length > 120 ? `${normalized.slice(0, 117)}...` : normalized;
};

const formatSentAt = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Nežinomas laikas";
  }
  return new Intl.DateTimeFormat("lt-LT", { dateStyle: "medium", timeStyle: "short" }).format(date);
};

const computeUnread = (item: MessageApiItem): boolean => {
  if (item.isOwn) {
    return false;
  }
  const created = new Date(item.createdAt);
  if (Number.isNaN(created.getTime())) {
    return false;
  }
  const now = Date.now();
  return now - created.getTime() < 48 * 60 * 60 * 1000;
};

const mapMessageResponse = (item: MessageApiItem): UiMessage => ({
  id: item.id,
  sender: formatSender(item.author),
  preview: formatPreview(item.content),
  sentAt: formatSentAt(item.createdAt),
  channel: "programa",
  unread: computeUnread(item)
});

const MessagingPage = () => {
  const {
    data: messages,
    isLoading,
    isError,
    error
  } = useQuery<MessageApiItem[], Error, UiMessage[]>({
    queryKey: ["messages"],
    queryFn: () => apiClient.get<MessageApiItem[]>("/messages"),
    staleTime: 10_000,
    select: (items) => items.map(mapMessageResponse)
  });
  const [activeMessageId, setActiveMessageId] = useState<string | null>(null);

  const conversationItems = messages ?? [];
  const activeMessage = useMemo<UiMessage | null>(() => {
    if (!conversationItems.length) return null;
    if (activeMessageId) {
      return conversationItems.find((message) => message.id === activeMessageId) ?? conversationItems[0];
    }
    return conversationItems[0];
  }, [conversationItems, activeMessageId]);

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
                onClick={() => setActiveMessageId(message.id)}
                className={`w-full rounded-xl border border-slate-800 px-3 py-3 text-left transition ${
                  activeMessage?.id === message.id
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
        title={activeMessage ? activeMessage.sender : "Žinutės"}
        subtitle={activeMessage ? channelLabels[activeMessage.channel] : "Pasirinkite žinutę iš sąrašo"}
        className="lg:col-span-2"
      >
        {activeMessage ? (
          <div className="space-y-4 text-sm text-slate-300">
            <div className="flex items-center justify-between text-xs uppercase tracking-wide text-slate-500">
              <span>{activeMessage.sentAt}</span>
              <StatusBadge tone={activeMessage.unread ? "warning" : "info"}>
                {activeMessage.unread ? "NEPERSKAITYTA" : "ARCHYVUOTA"}
              </StatusBadge>
            </div>
            <p>
              Šis skydelis atkuria planuojamą žinučių formatą – antraštė, konteksto žymės, susiję aviliai ir įtrauktos
              nuotraukos. Integravus backend'ą, čia bus rodomas visas pokalbio siūlas su atsakymais ir failų istorija.
            </p>
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-xs text-slate-400">
              <p className="font-semibold text-slate-200">Numatyti laukai:</p>
              <ul className="mt-2 list-disc space-y-1 pl-4">
                <li>Susieti aviliai (B-204, B-176)</li>
                <li>Veiksmų žymos ("jutiklis", "profilaktika")</li>
                <li>Failų peržiūra ir komentarai realiu laiku</li>
              </ul>
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-400">Pasirinkite žinutę kairėje, kad peržiūrėtumėte detales.</p>
        )}
      </Card>
    </div>
  );
};

export default MessagingPage;
