import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { acceptInviteById, fetchMyInvites } from "../api/consoleApi";
import { consoleKeys } from "../api/queryKeys";

function isUnconfirmed(error) {
    return error?.response?.status === 403 && error?.response?.data?.code === "EMAIL_NOT_VERIFIED";
}

/**
 * INV1: the signed-in account's pending invites. The invite follows the
 * account's confirmed email, so it survives whatever tab the confirmation
 * link opened in. Until the email is confirmed Gait answers 403
 * EMAIL_NOT_VERIFIED; that's "nothing to show yet", not an error, and the
 * default refetch-on-focus picks the invites up once they confirm elsewhere.
 */
export function useMyInvites({ enabled = true } = {}) {
    const query = useQuery({
        queryKey: consoleKeys.myInvites(),
        queryFn: async () => {
            try {
                return await fetchMyInvites();
            } catch (error) {
                if (isUnconfirmed(error)) return [];
                throw error;
            }
        },
        enabled,
    });
    // `waiting`: asked for but no answer yet (true from the very first render,
    // so a page can hold its default content back instead of flashing it).
    return { ...query, invites: query.data || [], waiting: enabled && query.isPending };
}

/** Join through one of your own invites; refreshes your workspaces and invites either way. */
export function useJoinInvite() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (inviteId) => acceptInviteById(inviteId),
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: consoleKeys.myInvites() });
            queryClient.invalidateQueries({ queryKey: consoleKeys.myOrganizations() });
        },
    });
}
