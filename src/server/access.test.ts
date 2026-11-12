import { describe, expect, it } from "vitest";
import { canDelete, canEdit, canShare, resolveRole } from "./access";

const doc = {
  ownerId: "alice",
  shares: [
    { userId: "bob", role: "EDITOR" as const },
    { userId: "carol", role: "VIEWER" as const },
  ],
};

describe("resolveRole", () => {
  it("identifies the owner", () => {
    expect(resolveRole(doc, "alice")).toBe("OWNER");
  });

  it("returns the role granted by a share", () => {
    expect(resolveRole(doc, "bob")).toBe("EDITOR");
    expect(resolveRole(doc, "carol")).toBe("VIEWER");
  });

  it("returns null for users with no access", () => {
    expect(resolveRole(doc, "mallory")).toBeNull();
  });
});

describe("permissions", () => {
  it("lets owners and editors edit, but not viewers or strangers", () => {
    expect(canEdit("OWNER")).toBe(true);
    expect(canEdit("EDITOR")).toBe(true);
    expect(canEdit("VIEWER")).toBe(false);
    expect(canEdit(null)).toBe(false);
  });

  it("restricts sharing and deleting to the owner", () => {
    expect(canShare("OWNER")).toBe(true);
    expect(canShare("EDITOR")).toBe(false);
    expect(canDelete("OWNER")).toBe(true);
    expect(canDelete("EDITOR")).toBe(false);
    expect(canDelete("VIEWER")).toBe(false);
  });
});
