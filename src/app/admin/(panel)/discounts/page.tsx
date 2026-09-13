"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Trash2Icon } from "lucide-react";
import { adminApi } from "@/lib/admin/client";
import { AdminHeader, Card, EmptyRow, TableFrame, Td, Th } from "@/components/admin/ui";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/format";

export default function AdminDiscountsPage() {
  const qc = useQueryClient();
  const { data, isPending } = useQuery({
    queryKey: ["admin", "discounts"],
    queryFn: adminApi.discounts,
  });
  const discounts = data?.discounts ?? [];

  const [code, setCode] = useState("");
  const [percent, setPercent] = useState("");
  const [label, setLabel] = useState("");
  const [toDelete, setToDelete] = useState<string | null>(null);

  const refresh = () =>
    qc.invalidateQueries({ queryKey: ["admin", "discounts"] });

  const create = useMutation({
    mutationFn: () =>
      adminApi.createDiscount({
        code,
        percentOff: Number(percent),
        label: label || undefined,
      }),
    onSuccess: () => {
      refresh();
      setCode("");
      setPercent("");
      setLabel("");
      toast.success("Discount created");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggle = useMutation({
    mutationFn: ({ code, active }: { code: string; active: boolean }) =>
      adminApi.setDiscountActive(code, active),
    onSuccess: () => refresh(),
  });

  const remove = useMutation({
    mutationFn: (code: string) => adminApi.deleteDiscount(code),
    onSuccess: () => {
      refresh();
      toast.success("Discount deleted");
    },
  });

  return (
    <>
      <AdminHeader
        title="Discounts"
        description="Percentage codes customers can apply at checkout."
      />

      <Card className="mb-6" title="Create a discount">
        <form
          className="grid gap-4 sm:grid-cols-[1fr_120px_1fr_auto] sm:items-end"
          onSubmit={(e) => {
            e.preventDefault();
            if (code && percent) create.mutate();
          }}
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="code">Code</Label>
            <Input
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="SUMMER20"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="pct">% off</Label>
            <Input
              id="pct"
              type="number"
              min={1}
              max={90}
              value={percent}
              onChange={(e) => setPercent(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="label">Label (optional)</Label>
            <Input
              id="label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="20% off everything"
            />
          </div>
          <Button type="submit" disabled={!code || !percent || create.isPending}>
            {create.isPending ? "Creating…" : "Create"}
          </Button>
        </form>
      </Card>

      <TableFrame>
        <thead>
          <tr>
            <Th>Code</Th>
            <Th>Discount</Th>
            <Th>Used</Th>
            <Th>Created</Th>
            <Th>Status</Th>
            <Th />
          </tr>
        </thead>
        <tbody>
          {isPending ? (
            Array.from({ length: 3 }).map((_, i) => (
              <tr key={i}>
                <Td colSpan={6}>
                  <Skeleton className="h-4 w-full" />
                </Td>
              </tr>
            ))
          ) : discounts.length === 0 ? (
            <EmptyRow colSpan={6} label="No discounts yet." />
          ) : (
            discounts.map((d) => (
              <tr key={d.code} className="hover:bg-[#faf8f2]">
                <Td className="font-mono font-medium">{d.code}</Td>
                <Td>
                  {d.percentOff}% off
                  <span className="block text-xs text-muted-foreground">
                    {d.label}
                  </span>
                </Td>
                <Td className="tabular-nums">{d.timesUsed}</Td>
                <Td className="text-muted-foreground">{formatDate(d.createdAt)}</Td>
                <Td>
                  <button
                    type="button"
                    onClick={() =>
                      toggle.mutate({ code: d.code, active: !d.active })
                    }
                  >
                    <Badge
                      variant="outline"
                      className={
                        d.active
                          ? "bg-emerald-100 text-emerald-900"
                          : "bg-black/5 text-muted-foreground"
                      }
                    >
                      {d.active ? "Active" : "Paused"}
                    </Badge>
                  </button>
                </Td>
                <Td>
                  <button
                    type="button"
                    onClick={() => setToDelete(d.code)}
                    className="text-muted-foreground transition-colors hover:text-rose-600"
                    aria-label={`Delete ${d.code}`}
                  >
                    <Trash2Icon className="size-4" />
                  </button>
                </Td>
              </tr>
            ))
          )}
        </tbody>
      </TableFrame>

      <ConfirmDialog
        open={toDelete !== null}
        onOpenChange={(o) => !o && setToDelete(null)}
        title={`Delete ${toDelete}?`}
        description="Customers will no longer be able to use this code. This can't be undone."
        confirmLabel="Delete"
        destructive
        onConfirm={async () => {
          if (toDelete) await remove.mutateAsync(toDelete);
          setToDelete(null);
        }}
      />
    </>
  );
}
