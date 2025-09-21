import {
  auditLog,
  dashboardStats,
  hives,
  mediaLibrary,
  messages,
  notifications,
  tasks,
  teamMembers
} from "./mockData";

const delay = async (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const mockService = {
  async getDashboard() {
    await delay(200);
    return {
      stats: dashboardStats,
      alerts: notifications,
      tasks: tasks.filter((task) => task.status !== "užbaigta").slice(0, 3)
    };
  },
  async getHives() {
    await delay(220);
    return hives;
  },
  async getTasks() {
    await delay(260);
    return tasks;
  },
  async getMessages() {
    await delay(240);
    return messages;
  },
  async getNotifications() {
    await delay(180);
    return notifications;
  },
  async getMediaLibrary() {
    await delay(280);
    return mediaLibrary;
  },
  async getTeamMembers() {
    await delay(210);
    return teamMembers;
  },
  async getAuditLog() {
    await delay(250);
    return auditLog;
  }
};
