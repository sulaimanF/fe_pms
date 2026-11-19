"use client";
import { useRef } from "react";
import axios from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { QueryClient } from "@tanstack/react-query";
import { useSessionQuery } from "@/hooks/useAuth";
import { useAuthorization } from "@/hooks/useAuthorization";
import { useOrganizationUnits } from "@/hooks/useOrganizationUnits";
import { ACCESS, assertAccess, canAccess, isForbidden } from "@/lib/authorization";
import { assertSession, requestInSession } from "@/lib/session";
import { sessionQueryKey } from "@/lib/queryClient";
import { isValidEntityId } from "@/lib/managementApi";
import { createOrganization, getAllOrganizationUnits, getOrganizationById, organizationWriteMatches, OrganizationWriteUncertainError, updateOrganization } from "@/services/organizationUnit.service";
import { getOutletById, OutletWriteUncertainError, updateOutlet } from "@/services/outlet.service";
import type { OrganizationSaveAttempt } from "@/types/organizationUnit";
export function useOutletOrganizationLookup(enabled = true) {
    const access = useAuthorization(ACCESS.organizationList);
    const query = useOrganizationUnits(true, access.allowed && enabled, ACCESS.organizationList);
    return { ...query, data: access.allowed && !isForbidden(query.error) ? query.data : undefined, denied: enabled && access.status === "valid" && !access.allowed };
}
export function useOutletOrganization(id: number) {
    const session = useSessionQuery(), access = useAuthorization(ACCESS.organizationDetail);
    return useQuery({ ...session, queryKey: sessionQueryKey(session.id, "organization-unit", id),
        enabled: session.enabled && access.allowed && isValidEntityId(id),
        queryFn: ({ signal }) => requestInSession(session.id, () => { assertAccess(session.id, ACCESS.organizationDetail); return getOrganizationById(id, signal); }),
    });
}
export async function synchronizeOrganizations(client: QueryClient, sessionId: number) {
    assertSession(sessionId);
    const related = { predicate: (query: {
            queryKey: readonly unknown[];
            meta?: Record<string, unknown>;
        }) => query.meta?.scope !== "global" && query.queryKey[0] === "session" && query.queryKey[1] === sessionId &&
            ["organization-units", "organization-unit", "outlets", "outlet", "users", "user"].includes(String(query.queryKey[2])) };
    await client.cancelQueries(related);
    assertSession(sessionId);
    await client.invalidateQueries({ ...related, refetchType: "none" });
    assertSession(sessionId);
    await client.refetchQueries({ type: "active", predicate: query => {
            if (!related.predicate(query))
                return false;
            const resource = query.queryKey[2];
            if (resource === "organization-unit")
                return canAccess(ACCESS.organizationDetail);
            if (resource === "outlet")
                return canAccess(ACCESS.outletDetail);
            if (resource === "outlets" && query.queryKey[3] !== "user-lookup")
                return canAccess(ACCESS.outletList);
            if (resource === "users")
                return canAccess(ACCESS.userList);
            if (resource === "user")
                return canAccess(ACCESS.userDetail);
            return canAccess(ACCESS.dashboard);
        } }, { throwOnError: true });
}
// A progress ledger lives only in the calling form. Confirmed phases are never submitted again.
export async function performOrganizationSave(input: OrganizationSaveAttempt, sessionId: number): Promise<OrganizationSaveAttempt> {
    const progress = { ...structuredClone(input), synchronizationFailed: false };
    if (progress.uncertain)
        throw new Error("Hasil sebelumnya belum pasti; mutation tidak diulang.");
    if (!progress.primaryConfirmed) {
        try {
            const result = await requestInSession(sessionId, () => {
                assertAccess(sessionId, progress.create ? ACCESS.organizationCreate : ACCESS.organizationUpdate);
                if (progress.create)
                    return createOrganization(progress.create);
                if (!isValidEntityId(progress.id))
                    throw new Error("ID organisasi tidak valid.");
                return Object.keys(progress.update ?? {}).length ? updateOrganization(progress.id, progress.update ?? {}) : Promise.resolve(null);
            });
            if (result) {
                progress.id = result.data.id;
                progress.message = result.message;
            }
            progress.primaryConfirmed = true;
        }
        catch (error: unknown) {
            if (!(error instanceof OrganizationWriteUncertainError))
                throw error;
            return { ...progress, uncertain: true, issue: error.message };
        }
    }
    if (!isValidEntityId(progress.id))
        throw new Error("ID penyimpanan belum terkonfirmasi.");
    while (progress.remaining.length) {
        const change = progress.remaining[0], parent = change.parentId === "saved" ? progress.id : change.parentId;
        try {
            await requestInSession<unknown>(sessionId, () => {
                assertAccess(sessionId, change.entity === "organization" ? ACCESS.organizationUpdate : ACCESS.outletUpdate);
                if (!isValidEntityId(change.id))
                    throw new Error("ID relasi tidak valid.");
                if (change.entity === "organization")
                    return updateOrganization(change.id, { parent_id: parent });
                if (!isValidEntityId(parent))
                    throw new Error("Induk Outlet wajib diisi; Unlink tidak tersedia.");
                return updateOutlet(change.id, { organization_unit_id: parent });
            });
            progress.remaining.shift();
        }
        catch (error: unknown) {
            if (axios.isCancel(error))
                throw error;
            return { ...progress, uncertain: error instanceof OrganizationWriteUncertainError || error instanceof OutletWriteUncertainError,
                issue: `Data utama tersimpan. Tahap relasi ${change.name} belum selesai${axios.isAxiosError(error) && error.response?.status === 403 ? " karena akses ditolak (403)" : ""}. Draft dipertahankan; tahap terkonfirmasi tidak diulang.` };
        }
    }
    return { ...progress, issue: undefined };
}
export function useSaveOutletOrganization() {
    const session = useSessionQuery(), client = useQueryClient(), busy = useRef(false);
    return useMutation({ mutationKey: sessionQueryKey(session.id, "save-organization"), meta: session.meta, retry: false, gcTime: 0,
        mutationFn: async (attempt: OrganizationSaveAttempt) => {
            if (busy.current)
                throw new Error("Penyimpanan sedang berlangsung.");
            busy.current = true;
            try {
                const result = await performOrganizationSave(attempt, session.id);
                assertSession(session.id);
                if (result.primaryConfirmed) {
                    try {
                        await synchronizeOrganizations(client, session.id);
                    }
                    catch {
                        result.synchronizationFailed = true;
                    }
                }
                assertSession(session.id);
                return result;
            }
            finally {
                busy.current = false;
            }
        },
    });
}
export function useCheckOrganizationWrite() {
    const session = useSessionQuery();
    return async (attempt: OrganizationSaveAttempt) => {
        const controller = new AbortController(), timeout = setTimeout(() => controller.abort(), 30000);
        try {
            return await requestInSession(session.id, async () => {
                if (attempt.primaryConfirmed && attempt.remaining[0]) {
                    const change = attempt.remaining[0];
                    assertAccess(session.id, change.entity === "organization" ? ACCESS.organizationDetail : ACCESS.outletDetail);
                    const parent = change.parentId === "saved" ? attempt.id : change.parentId;
                    const matches = change.entity === "organization" ? (await getOrganizationById(change.id, controller.signal)).data.parent_id === parent :
                        (await getOutletById(change.id, controller.signal)).data.organization_unit_id === parent;
                    return `${matches ? "Relasi yang dapat dibaca sesuai snapshot." : "Relasi terbaca belum sesuai snapshot."} Hasil operasi sebelumnya masih belum pasti; tidak ada mutation yang diulang. Periksa bersama administrator.`;
                }
                const payload = attempt.create ?? attempt.update ?? {};
                assertAccess(session.id, attempt.id ? ACCESS.organizationDetail : ACCESS.organizationList);
                const rows = attempt.id ? [(await getOrganizationById(attempt.id, controller.signal)).data] :
                    (await getAllOrganizationUnits(controller.signal)).data.filter(unit => unit.code === attempt.create?.code);
                return rows.length === 1 && organizationWriteMatches(rows[0], payload) ?
                    "Field yang terbaca sesuai snapshot, tetapi identitas operasi belum terkonfirmasi. Jangan otomatis membuat entity atau assignment baru; periksa bersama administrator." :
                    "Belum ada hasil yang pasti. Tidak ditemukan bukan bukti request gagal atau tidak sedang diproses.";
            });
        }
        finally {
            clearTimeout(timeout);
        }
    };
}
