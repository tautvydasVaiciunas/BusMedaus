import {
  ChartBarIcon,
  ChatBubbleLeftRightIcon,
  ClipboardDocumentCheckIcon,
  PhotoIcon,
  Squares2X2Icon,
  UsersIcon,
  BellAlertIcon,
  ShieldCheckIcon
} from "@heroicons/react/24/outline";
import type { RouteObject } from "react-router-dom";
import { lazy, type SVGProps } from "react";

export type AppRoute = RouteObject & {
  id: string;
  label: string;
  description: string;
  icon: (props: SVGProps<SVGSVGElement>) => JSX.Element;
};

const DashboardPage = lazy(() => import("../features/dashboard/DashboardPage"));
const HivesPage = lazy(() => import("../features/hives/HivesPage"));
const TasksPage = lazy(() => import("../features/tasks/TasksPage"));
const MessagingPage = lazy(() => import("../features/messaging/MessagingPage"));
const NotificationsPage = lazy(() => import("../features/notifications/NotificationsPage"));
const MediaPage = lazy(() => import("../features/media/MediaPage"));
const UsersPage = lazy(() => import("../features/users/UsersPage"));
const AuditLogPage = lazy(() => import("../features/audit/AuditLogPage"));

export const appRoutes: AppRoute[] = [
  {
    id: "dashboard",
    path: "/",
    element: <DashboardPage />,
    label: "Valdymo suvestinė",
    description: "Greita apžvalga apie avilių būseną ir komandą",
    icon: (props) => <Squares2X2Icon {...props} />
  },
  {
    id: "hives",
    path: "/hives",
    element: <HivesPage />, 
    label: "Aviliai",
    description: "Stebėkite avilių aktyvumą, sveikatą ir priežiūrą",
    icon: (props) => <ChartBarIcon {...props} />
  },
  {
    id: "tasks",
    path: "/tasks",
    element: <TasksPage />, 
    label: "Užduotys",
    description: "Planuokite, deleguokite ir sekite darbų eigą",
    icon: (props) => <ClipboardDocumentCheckIcon {...props} />
  },
  {
    id: "messaging",
    path: "/messaging",
    element: <MessagingPage />, 
    label: "Žinutės",
    description: "Koordinuokite veiksmus su komanda realiu laiku",
    icon: (props) => <ChatBubbleLeftRightIcon {...props} />
  },
  {
    id: "notifications",
    path: "/notifications",
    element: <NotificationsPage />, 
    label: "Pranešimai",
    description: "Svarbūs įvykiai ir automatizuoti įspėjimai",
    icon: (props) => <BellAlertIcon {...props} />
  },
  {
    id: "media",
    path: "/media",
    element: <MediaPage />, 
    label: "Medija",
    description: "Tvarkykite avilių nuotraukas ir dokumentaciją",
    icon: (props) => <PhotoIcon {...props} />
  },
  {
    id: "users",
    path: "/users",
    element: <UsersPage />, 
    label: "Nariai",
    description: "Valdykite leidimus ir darbo krūvį",
    icon: (props) => <UsersIcon {...props} />
  },
  {
    id: "audit",
    path: "/audit",
    element: <AuditLogPage />, 
    label: "Audito žurnalas",
    description: "Stebėkite pakeitimus ir saugos įvykius",
    icon: (props) => <ShieldCheckIcon {...props} />
  }
];
