import type {
  AuditLogEntry,
  DashboardStat,
  Hive,
  MediaItem,
  Message,
  Notification,
  Task,
  TeamMember
} from "../types";

export const dashboardStats: DashboardStat[] = [
  {
    id: "hive-health",
    label: "Sveikų avilių",
    value: "92%",
    trend: "+4.1% nuo praėjusios savaitės",
    trendTone: "positive"
  },
  {
    id: "honey-output",
    label: "Medunešio prognozė",
    value: "1.240 kg",
    trend: "Pastarąsias 24 val. stabilu",
    trendTone: "neutral"
  },
  {
    id: "team-progress",
    label: "Užbaigtų užduočių",
    value: "36",
    trend: "-3 laukia patvirtinimo",
    trendTone: "negative"
  },
  {
    id: "alerts",
    label: "Aktyvūs įspėjimai",
    value: "5",
    trend: "2 nauji per pask. 3 val.",
    trendTone: "negative"
  }
];

export const hives: Hive[] = [
  {
    id: "B-204",
    name: "Pavasario karalienė",
    queenStatus: "aktyvi",
    productivityIndex: 87,
    lastInspection: "2025-09-18",
    location: "Bitininkystės parkas A",
    temperature: 34.2,
    humidity: 58
  },
  {
    id: "B-198",
    name: "Miško rasa",
    queenStatus: "aktyvi",
    productivityIndex: 91,
    lastInspection: "2025-09-17",
    location: "Bitininkystės parkas B",
    temperature: 33.5,
    humidity: 55
  },
  {
    id: "B-176",
    name: "Dzūkijos gintaras",
    queenStatus: "per žiemą",
    productivityIndex: 72,
    lastInspection: "2025-09-12",
    location: "Bitininkystės parkas C",
    temperature: 29.9,
    humidity: 63
  },
  {
    id: "B-168",
    name: "Pievų žydėjimas",
    queenStatus: "keisti",
    productivityIndex: 54,
    lastInspection: "2025-09-05",
    location: "Bitininkystės parkas D",
    temperature: 27.3,
    humidity: 68
  }
];

export const tasks: Task[] = [
  {
    id: "T-31",
    title: "Pakaitinės motinėlės įleidimas",
    assignedTo: "Rokas",
    dueDate: "2025-09-22",
    status: "vykdoma",
    priority: "aukšta"
  },
  {
    id: "T-29",
    title: "Avilio B-204 gydymas nuo erkių",
    assignedTo: "Aistė",
    dueDate: "2025-09-21",
    status: "užbaigta",
    priority: "aukšta"
  },
  {
    id: "T-27",
    title: "Žiemai skirtų rėmelių paruošimas",
    assignedTo: "Giedrė",
    dueDate: "2025-09-28",
    status: "laukiama",
    priority: "vidutinė"
  },
  {
    id: "T-22",
    title: "Avilio svorio stebėjimo kalibracija",
    assignedTo: "Simas",
    dueDate: "2025-09-24",
    status: "kritinė",
    priority: "aukšta"
  }
];

export const messages: Message[] = [
  {
    id: "M-14",
    sender: "Aistė Petrauskaitė",
    preview: "Patvirtinu, kad vakarinė apžiūra baigta ir rezultatai įkelti.",
    sentAt: "prieš 12 min.",
    channel: "programa",
    unread: true
  },
  {
    id: "M-13",
    sender: "Simas Žemaitis",
    preview: "Temperatūros daviklis B-168 rodo anomalijas, reikia pakeisti.",
    sentAt: "prieš 33 min.",
    channel: "sms"
  },
  {
    id: "M-12",
    sender: "Lina Danytė",
    preview: "Įkėliau naują partiją nuotraukų prieš žiemojimo darbus.",
    sentAt: "prieš 1 val.",
    channel: "programa"
  }
];

export const notifications: Notification[] = [
  {
    id: "N-51",
    title: "Padidėjusi drėgmė avilyje B-168",
    description: "Viršijo 65% ribą per 4 valandas.",
    type: "įspėjimas",
    createdAt: "prieš 9 min."
  },
  {
    id: "N-48",
    title: "Žiedadulkių surinkimo pikas",
    description: "Aviliai B-176 ir B-198 pasiekė rekordinius kiekius.",
    type: "informacija",
    createdAt: "prieš 1 val."
  },
  {
    id: "N-47",
    title: "Svorio kritimas",
    description: "Avilys B-204 neteko 4,3 kg per 48 valandas.",
    type: "kritinis",
    createdAt: "prieš 3 val."
  }
];

export const mediaLibrary: MediaItem[] = [
  {
    id: "IMG-91",
    hiveId: "B-204",
    capturedAt: "2025-09-19 18:30",
    author: "Lina Danytė",
    url: "https://images.unsplash.com/photo-1486365227551-f3f90034a57c?auto=format&fit=crop&w=600&q=80",
    tags: ["profilaktika", "žiemojimas"]
  },
  {
    id: "IMG-87",
    hiveId: "B-198",
    capturedAt: "2025-09-18 07:45",
    author: "Simas Žemaitis",
    url: "https://images.unsplash.com/photo-1505761671935-60b3a7427bad?auto=format&fit=crop&w=600&q=80",
    tags: ["apžiūra", "temperatūra"]
  },
  {
    id: "IMG-85",
    hiveId: "B-176",
    capturedAt: "2025-09-17 16:20",
    author: "Giedrė Vaičiulytė",
    url: "https://images.unsplash.com/photo-1501856054483-1a9f456585b0?auto=format&fit=crop&w=600&q=80",
    tags: ["drono vaizdas"]
  }
];

export const teamMembers: TeamMember[] = [
  {
    id: "U-9",
    name: "Aistė Petrauskaitė",
    role: "Vyriausioji bitininkė",
    contact: "+370 600 10001",
    activeSince: "2018",
    avatarColor: "bg-brand-500"
  },
  {
    id: "U-7",
    name: "Simas Žemaitis",
    role: "Technologijų specialistas",
    contact: "+370 600 10008",
    activeSince: "2020",
    avatarColor: "bg-sky-500"
  },
  {
    id: "U-5",
    name: "Lina Danytė",
    role: "Kokybės užtikrinimo vadovė",
    contact: "+370 600 10011",
    activeSince: "2019",
    avatarColor: "bg-emerald-500"
  }
];

export const auditLog: AuditLogEntry[] = [
  {
    id: "A-110",
    actor: "Simas Žemaitis",
    action: "Atnaujino temperatūros sensoriaus kalibraciją",
    entity: "Avilys B-168",
    severity: "vidutinis",
    createdAt: "prieš 12 min."
  },
  {
    id: "A-109",
    actor: "Lina Danytė",
    action: "Įkėlė 8 naujus dokumentus į medijos archyvą",
    entity: "Biblioteka",
    severity: "žemas",
    createdAt: "prieš 48 min."
  },
  {
    id: "A-108",
    actor: "Aistė Petrauskaitė",
    action: "Patvirtino kritinės užduoties užbaigimą",
    entity: "Užduotis T-22",
    severity: "aukštas",
    createdAt: "prieš 1 val. 12 min."
  }
];
