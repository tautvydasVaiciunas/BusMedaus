import { describe, expect, it } from "vitest";
import { mapSafeUserToTeamMember, mapSafeUsersToTeamMembers } from "./userMapper";
import type { SafeUser } from "../../types";

describe("mapSafeUserToTeamMember", () => {
  const baseUser: SafeUser = {
    id: "user-1",
    email: "ada@example.com",
    firstName: "Ada",
    lastName: "Lovelace",
    phoneNumber: "+37060000001",
    roles: ["admin", "keeper"],
    isActive: true,
    createdAt: new Date("2024-01-05T08:45:00.000Z").toISOString(),
    updatedAt: new Date("2024-01-10T08:45:00.000Z").toISOString()
  };

  it("maps API payloads into the team member view model", () => {
    const member = mapSafeUserToTeamMember(baseUser);

    expect(member.id).toBe("user-1");
    expect(member.name).toBe("Ada Lovelace");
    expect(member.role).toBe("Administratorius");
    expect(member.contact).toBe("ada@example.com • +37060000001");
    expect(member.activeSince).toBe(
      new Intl.DateTimeFormat("lt-LT", { dateStyle: "medium" }).format(
        new Date(baseUser.createdAt)
      )
    );
    expect(member.avatarColor).toMatch(/^bg-/);
  });

  it("falls back to safe defaults when profile details are missing", () => {
    const payload: SafeUser = {
      ...baseUser,
      id: "user-2",
      email: "no-name@example.com",
      firstName: null,
      lastName: " ",
      phoneNumber: null,
      roles: [],
      createdAt: "not-a-date"
    };

    const member = mapSafeUserToTeamMember(payload);

    expect(member.name).toBe("no-name@example.com");
    expect(member.role).toBe("Nenurodyta rolė");
    expect(member.contact).toBe("no-name@example.com");
    expect(member.activeSince).toBe("nežinoma");
  });

  it("produces deterministic avatar colors based on the user identifier", () => {
    const first = mapSafeUserToTeamMember(baseUser);
    const second = mapSafeUserToTeamMember({ ...baseUser });
    const others = mapSafeUsersToTeamMembers([
      baseUser,
      { ...baseUser, id: "user-99", email: "alt@example.com" }
    ]);

    expect(first.avatarColor).toBe(second.avatarColor);
    expect(others[0].avatarColor).not.toBe(others[1].avatarColor);
  });
});
