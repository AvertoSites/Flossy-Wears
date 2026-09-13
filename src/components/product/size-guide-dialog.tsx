"use client";

import { RulerIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const ROWS = [
  { size: "XS", chest: "34–36", length: "66" },
  { size: "S", chest: "36–38", length: "68" },
  { size: "M", chest: "38–40", length: "70" },
  { size: "L", chest: "42–44", length: "72" },
  { size: "XL", chest: "46–48", length: "74" },
  { size: "2XL", chest: "50–52", length: "76" },
  { size: "3XL", chest: "54–56", length: "78" },
];

export function SizeGuideDialog() {
  return (
    <Dialog>
      <DialogTrigger className="inline-flex items-center gap-1.5 text-sm text-muted-foreground underline-offset-2 hover:underline">
        <RulerIcon className="size-4" />
        Size guide
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Size guide</DialogTitle>
          <DialogDescription>
            Measurements in inches. Garments are a relaxed unisex fit — size down
            for a classic fit.
          </DialogDescription>
        </DialogHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="py-2 pr-4 font-medium">Size</th>
                <th className="py-2 pr-4 font-medium">Chest (to fit)</th>
                <th className="py-2 font-medium">Body length</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row) => (
                <tr key={row.size} className="border-b border-border/60">
                  <td className="py-2 pr-4 font-medium">{row.size}</td>
                  <td className="py-2 pr-4">{row.chest}</td>
                  <td className="py-2">{row.length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DialogContent>
    </Dialog>
  );
}
