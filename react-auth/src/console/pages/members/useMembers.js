import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    changeMemberRole,
    createInvite,
    fetchMemberActivity,
    fetchMembers,
    removeMember,
    revokeInvite,
} from "../../api/consoleApi";
import { consoleKeys } from "../../api/queryKeys";

export const ACTIVITY_PAGE_SIZE = 20;

export function useMembers(organizationSlug) {
    return useQuery({
        queryKey: consoleKeys.members(organizationSlug),
        queryFn: () => fetchMembers(organizationSlug),
    });
}

export function useMemberActivity(organizationSlug, page, { enabled }) {
    return useQuery({
        queryKey: consoleKeys.memberActivity(organizationSlug, page),
        queryFn: () => fetchMemberActivity(organizationSlug, { page, pageSize: ACTIVITY_PAGE_SIZE }),
        enabled,
        placeholderData: keepPreviousData,
    });
}

/** Members and activity both change after any membership action. */
function useRefreshMembership(organizationSlug) {
    const queryClient = useQueryClient();
    return () => {
        queryClient.invalidateQueries({ queryKey: consoleKeys.members(organizationSlug) });
        queryClient.invalidateQueries({
            predicate: ({ queryKey }) =>
                queryKey[0] === "console" && queryKey[1] === organizationSlug && queryKey[3] === "member-activity",
        });
    };
}

export function useChangeRole(organizationSlug) {
    const refresh = useRefreshMembership(organizationSlug);
    return useMutation({
        mutationFn: ({ membershipId, orgRole }) => changeMemberRole(organizationSlug, membershipId, orgRole),
        onSuccess: refresh,
    });
}

export function useRemoveMember(organizationSlug) {
    const refresh = useRefreshMembership(organizationSlug);
    return useMutation({
        mutationFn: (membershipId) => removeMember(organizationSlug, membershipId),
        onSuccess: refresh,
    });
}

export function useCreateInvite(organizationSlug) {
    const refresh = useRefreshMembership(organizationSlug);
    return useMutation({
        mutationFn: ({ email, orgRole }) => createInvite(organizationSlug, { email, orgRole }),
        onSuccess: refresh,
    });
}

export function useRevokeInvite(organizationSlug) {
    const refresh = useRefreshMembership(organizationSlug);
    return useMutation({
        mutationFn: (inviteId) => revokeInvite(organizationSlug, inviteId),
        onSuccess: refresh,
    });
}

/** Resend = revoke + create: a new token, so the old link stops working. */
export function useResendInvite(organizationSlug) {
    const refresh = useRefreshMembership(organizationSlug);
    return useMutation({
        mutationFn: async (invite) => {
            await revokeInvite(organizationSlug, invite.id);
            return createInvite(organizationSlug, { email: invite.email, orgRole: invite.org_role });
        },
        onSettled: refresh,
    });
}
