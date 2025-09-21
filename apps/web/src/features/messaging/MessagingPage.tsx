import { useCallback, useMemo, useState } from "react";
import { useMockQuery } from "../../hooks/useMockQuery";
import { mockService } from "../../mocks/mockService";
import { Card } from "../../components/ui/Card";
import { StatusBadge } from "../../components/ui/StatusBadge";

const channelLabels: Record<string, string> = {
  programa: "Programėlė",
  "el.paštas": "El. paštas",
  sms: "SMS"
};

type Message = Awaited<ReturnType<typeof mockService.getMessages>>[number];

const MessagingPage = () => {
  const query = useMockQuery("messages", useCallback(() => mockService.getMessages(), []));
  const [activeMessageId, setActiveMessageId] = useState<string | null>(null);

  const messages = query.data ?? [];
  const activeMessage = useMemo<Message | null>(() => {
    if (!messages.length) return null;
    if (activeMessageId) {
      return messages.find((message) => message.id === activeMessageId) ?? messages[0];
    }
    return messages[0];
  }, [messages, activeMessageId]);

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card
        title="Komunikacijos centras"
        subtitle="Kai backend'as bus paruoštas, čia bus rodomi realūs pokalbiai ir failų mainai"
        className="lg:col-span-1"
      >
        <div className="space-y-3">
          {query.isLoading ? (
            <p className="text-sm text-slate-400">Įkeliame paskutinius pokalbius...</p>
          ) : (
            messages.map((message) => (
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
