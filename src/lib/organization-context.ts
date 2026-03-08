import { authClient } from "@/lib/auth-client";

// ── Per-org active-team preference (localStorage) ─────────────────────────
// Keyed by org ID so switching back to a previously visited org restores
// the last team the user had active there.

const TEAM_PREF_KEY = "ba_org_team_pref";

interface TeamPreferences {
  [orgId: string]: string;
}

export const saveTeamPreference = (orgId: string, teamId: string): void => {
  try {
    const raw = localStorage.getItem(TEAM_PREF_KEY);
    const prefs: TeamPreferences = raw
      ? (JSON.parse(raw) as TeamPreferences)
      : {};
    prefs[orgId] = teamId;
    localStorage.setItem(TEAM_PREF_KEY, JSON.stringify(prefs));
  } catch {
    // localStorage unavailable (SSR / private browsing) — silently ignore
  }
};

const loadTeamPreference = (orgId: string): string | null => {
  try {
    const raw = localStorage.getItem(TEAM_PREF_KEY);
    if (!raw) return null;
    const prefs = JSON.parse(raw) as TeamPreferences;
    return prefs[orgId] ?? null;
  } catch {
    return null;
  }
};

// ── Active org + team resolution ──────────────────────────────────────────

interface TeamLike {
  id: string;
}

/**
 * Switches the active organization and resolves the best active team:
 *
 * 1. Fetch the user's teams in the new org.
 * 2. If a saved preference exists for this org **and** is still present in
 *    the team list → restore it.
 * 3. Otherwise fall back to the first team in the list.
 * 4. If the user has no teams → explicitly clear activeTeamId (null).
 *
 * The org switch is mandatory — its error is returned to the caller.
 * Team resolution is best-effort — failures are logged, never propagated.
 */
export const setActiveOrganizationWithTeam = async (
  organizationId: string,
): Promise<{ error: unknown }> => {
  const { error: orgError } = await authClient.organization.setActive({
    organizationId,
  });

  if (orgError) {
    return { error: orgError };
  }

  try {
    const { data, error: listError } =
      await authClient.organization.listUserTeams();

    if (listError) {
      console.warn("[org-context] Could not list user teams:", listError);
      return { error: null };
    }

    const teams: TeamLike[] = Array.isArray(data) ? (data as TeamLike[]) : [];

    // Validate saved preference; fall back to first team; null if no teams.
    const saved = loadTeamPreference(organizationId);
    const teamId: string | null =
      saved != null && teams.some((t) => t.id === saved)
        ? saved
        : (teams[0]?.id ?? null);

    const { error: teamError } = await authClient.organization.setActiveTeam({
      teamId,
    });

    if (teamError) {
      console.warn("[org-context] Could not set active team:", teamError);
    } else if (teamId) {
      // Persist so switching back to this org restores the same team.
      saveTeamPreference(organizationId, teamId);
    }
  } catch (err) {
    console.warn(
      "[org-context] Unexpected error while resolving active team:",
      err,
    );
  }

  return { error: null };
};
