import type { OrganizationUnit, OutletRelationChange } from "@/types/organizationUnit";
export interface OutletRelationDraft {
    baselineIds: number[];
    selectedIds: number[];
}
export function editRelationDraft(current: OutletRelationDraft | null, baselineIds: readonly number[], selectedIds: readonly number[]): OutletRelationDraft {
    return { baselineIds: current?.baselineIds ?? [...new Set(baselineIds)], selectedIds: [...new Set(selectedIds)] };
}
export function organizationRelationChanges(draft: OutletRelationDraft | null, entity: "organization" | "outlet", names: ReadonlyMap<number, string>): OutletRelationChange[] {
    if (!draft)
        return [];
    const added = draft.selectedIds.filter(id => !draft.baselineIds.includes(id));
    const removed = draft.baselineIds.filter(id => !draft.selectedIds.includes(id));
    if (entity === "outlet" && removed.length)
        throw new Error("Induk Outlet wajib. Pindahkan Outlet melalui halaman update, bukan Unlink.");
    return [
        ...added.map(id => ({ entity, id, name: names.get(id) ?? `${entity} #${id}`, parentId: "saved" as const })),
        ...removed.map(id => ({ entity, id, name: names.get(id) ?? `${entity} #${id}`, parentId: null })),
    ];
}
export function isOrganizationAncestor(candidate: number, id: number, units: readonly OrganizationUnit[]) {
    const index = new Map(units.map(unit => [unit.id, unit])), visited = new Set<number>();
    let current: number | null = id;
    while (current !== null) {
        if (current === candidate)
            return true;
        if (visited.has(current))
            return true;
        visited.add(current);
        const unit = index.get(current);
        if (!unit)
            return false;
        current = unit.parent_id;
    }
    return false;
}

// Read-only traversal: only a proven path counts, never an unknown/cyclic path.
export function descendantBranches(id:number,units:readonly OrganizationUnit[]) {
    const index=new Map(units.map(unit=>[unit.id,unit]));
    return units.filter(unit=>{
        if(unit.unit_type!=="cabang"||unit.parent_id===id)return false;
        const seen=new Set<number>();let current=unit.parent_id;
        while(current!==null&&!seen.has(current)){
            if(current===id)return true;
            seen.add(current);current=index.get(current)?.parent_id??null;
        }
        return false;
    });
}
