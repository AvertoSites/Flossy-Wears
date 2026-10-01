"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  BellIcon,
  CreditCardIcon,
  ExternalLinkIcon,
  MapPinIcon,
  PhoneIcon,
  StoreIcon,
  TruckIcon,
} from "lucide-react";
import { adminApi } from "@/lib/admin/client";
import { refundOrder } from "@/lib/firebase/functions";
import { AdminHeader, Card } from "@/components/admin/ui";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import {
  OrderStatusBadge,
  PaymentStatusBadge,
} from "@/components/common/order-status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, formatPrice } from "@/lib/format";
import { collectionPointFor, isCollectionOrder, orderStatusLabel } from "@/lib/delivery";
import type { OrderStatus } from "@/types";

const STATUSES: OrderStatus[] = [
  "processing",
  "packed",
  "shipped",
  "delivered",
  "cancelled",
];
const CARRIERS = ["Royal Mail", "DPD", "Evri", "UPS", "FedEx"];

export default function AdminOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const qc = useQueryClient();

  const { data, isPending } = useQuery({
    queryKey: ["admin", "order", id],
    queryFn: () => adminApi.order(id),
  });
  const order = data?.order;

  const [status, setStatus] = useState<OrderStatus>("processing");
  const [carrier, setCarrier] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [trackingUrl, setTrackingUrl] = useState("");
  const [notify, setNotify] = useState(true);
  const [note, setNote] = useState("");
  const [refundOpen, setRefundOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);

  useEffect(() => {
    if (!order) return;
    // Hydrate the editor once the order loads / after a save.
    /* eslint-disable react-hooks/set-state-in-effect */
    setStatus(order.status);
    setCarrier(order.carrier ?? "");
    setTrackingNumber(order.trackingNumber ?? "");
    setTrackingUrl(order.trackingUrl ?? "");
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [order]);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin", "order", id] });
    qc.invalidateQueries({ queryKey: ["admin", "orders"] });
    qc.invalidateQueries({ queryKey: ["admin", "summary"] });
  };

  const fulfil = useMutation({
    mutationFn: () =>
      adminApi.updateOrder(id, {
        status,
        carrier,
        trackingNumber,
        trackingUrl,
        notifyCustomer: notify,
      }),
    onSuccess: () => {
      invalidate();
      toast.success(
        notify ? "Fulfillment saved · customer notified" : "Fulfillment saved",
      );
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const addNote = useMutation({
    mutationFn: () => adminApi.updateOrder(id, { note }),
    onSuccess: () => {
      invalidate();
      setNote("");
      toast.success("Note added");
    },
  });

  const refund = useMutation({
    mutationFn: () => refundOrder(id),
    onSuccess: (res) => {
      invalidate();
      toast.success(
        `Refund of ${formatPrice(res.amount)} issued${res.cancelled ? " · order cancelled" : ""}${res.restocked ? " · items back in stock" : ""} · customer emailed`,
      );
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Cancelling always goes through the refund function so the payment is
  // refunded, stock is returned and the customer gets one email.
  const cancelOrder = useMutation({
    mutationFn: () => refundOrder(id, { cancel: true }),
    onSuccess: (res) => {
      invalidate();
      toast.success(
        [
          "Order cancelled",
          res.amount > 0 && `${formatPrice(res.amount)} refunded`,
          res.restocked && "items back in stock",
          "customer emailed",
        ]
          .filter(Boolean)
          .join(" · "),
      );
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const refreshTracking = useMutation({
    mutationFn: () => adminApi.refreshTracking(id),
    onSuccess: () => {
      invalidate();
      toast.success("Tracking updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isPending) {
    return (
      <>
        <AdminHeader title="Order" backHref="/admin/orders" backLabel="Orders" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </>
    );
  }

  if (!order) {
    return (
      <>
        <AdminHeader title="Order not found" backHref="/admin/orders" backLabel="Orders" />
        <Card>This order doesn&rsquo;t exist.</Card>
      </>
    );
  }

  const collecting = isCollectionOrder(order);
  const point = collecting ? collectionPointFor(order) : null;
  const contact = order.collectionContact;
  const address = order.shippingAddress;
  // Collection orders never ship — keep "shipped" only if a legacy order is already on it.
  const statusOptions = collecting
    ? STATUSES.filter((s) => s !== "shipped" || order.status === "shipped")
    : STATUSES;
  const refundable = order.total - (order.refundedAmount ?? 0);
  // Items are still with us (not shipped/collected) and haven't been restocked already.
  const willRestock =
    (order.status === "processing" || order.status === "packed") && !order.restockedAt;
  const cancelling = status === "cancelled" && order.status !== "cancelled";
  const dirty =
    status !== order.status ||
    carrier !== (order.carrier ?? "") ||
    trackingNumber !== (order.trackingNumber ?? "") ||
    trackingUrl !== (order.trackingUrl ?? "");

  return (
    <>
      <AdminHeader
        title={`Order ${order.number}`}
        description={`Placed ${formatDate(order.placedAt)}`}
        backHref="/admin/orders"
        backLabel="Orders"
        actions={
          <>
            <OrderStatusBadge status={order.status} collection={collecting} />
            <PaymentStatusBadge status={order.paymentStatus ?? "paid"} />
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="flex flex-col gap-6">
          <div
            className={
              collecting
                ? "flex items-start gap-3 rounded-xl border-2 border-[#1e3a5f] bg-[#f1eadb] p-4"
                : "flex items-start gap-3 rounded-xl border border-black/10 bg-white p-4"
            }
          >
            {collecting ? (
              <StoreIcon className="mt-0.5 size-5 shrink-0 text-[#1e3a5f]" />
            ) : (
              <TruckIcon className="mt-0.5 size-5 shrink-0 text-[#1e3a5f]" />
            )}
            <div className="text-sm">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Delivery method
              </p>
              <p className="text-base font-bold text-[#1e3a5f]">
                {order.shippingMethod}
                {collecting && " — do not post"}
              </p>
              {point && (
                <p className="mt-1 text-muted-foreground">
                  Customer collects from {point.address} ({point.hours}). Set the status to
                  &ldquo;Ready for collection&rdquo; when it&rsquo;s packed — that emails the
                  customer to come in.
                </p>
              )}
            </div>
          </div>

          <Card title={collecting ? "Collection status" : "Fulfillment & tracking"}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label>Status</Label>
                <Select
                  value={status}
                  onValueChange={(v) => setStatus(v as OrderStatus)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((s) => (
                      <SelectItem key={s} value={s}>
                        {orderStatusLabel(s, collecting)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {!collecting && (
                <>
                  <div className="flex flex-col gap-1.5">
                    <Label>Carrier</Label>
                    <Select
                      value={carrier || "none"}
                      onValueChange={(v) => setCarrier(v === "none" ? "" : v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select carrier" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No carrier</SelectItem>
                        {CARRIERS.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="tn">Tracking number</Label>
                    <Input
                      id="tn"
                      value={trackingNumber}
                      onChange={(e) => setTrackingNumber(e.target.value)}
                      placeholder="e.g. RM123456789GB"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="tu">Tracking URL</Label>
                    <Input
                      id="tu"
                      value={trackingUrl}
                      onChange={(e) => setTrackingUrl(e.target.value)}
                      placeholder="https://…"
                    />
                  </div>
                </>
              )}
            </div>

            <label className="mt-4 flex items-center gap-2 text-sm">
              <Checkbox
                checked={notify}
                onCheckedChange={(c) => setNotify(!!c)}
              />
              <BellIcon className="size-4 text-muted-foreground" />
              Email the customer {collecting ? "a status update" : "a tracking update"}
            </label>
            <p className="mt-1 text-xs text-muted-foreground">
              {collecting
                ? "Ready for collection, collected, and cancelled always email the customer, whether or not this is checked."
                : "Shipped, delivered, and cancelled always email the customer, whether or not this is checked."}
            </p>

            <div className="mt-4 flex items-center gap-2">
              <Button
                variant={cancelling ? "destructive" : "default"}
                onClick={() => (cancelling ? setCancelOpen(true) : fulfil.mutate())}
                disabled={fulfil.isPending || cancelOrder.isPending || (!dirty && !notify)}
              >
                {fulfil.isPending || cancelOrder.isPending
                  ? "Saving…"
                  : cancelling
                    ? "Cancel order…"
                    : "Save & update customer"}
              </Button>
              <Link
                href={`/track?order=${order.number}`}
                target="_blank"
                className="text-sm text-[#1e3a5f] underline-offset-4 hover:underline"
              >
                Preview customer view ↗
              </Link>
              {!collecting && carrier === "Royal Mail" && trackingNumber && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refreshTracking.mutate()}
                  disabled={refreshTracking.isPending}
                >
                  {refreshTracking.isPending ? "Refreshing…" : "Refresh tracking"}
                </Button>
              )}
            </div>
          </Card>

          <Card title={`Items (${order.lines.length})`}>
            <ul className="flex flex-col divide-y divide-black/5">
              {order.lines.map((line, i) => (
                <li key={i} className="flex gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="relative size-14 shrink-0 overflow-hidden rounded-md border border-black/10 bg-[#f1eadb]">
                    <Image
                      src={line.image}
                      alt={line.name}
                      fill
                      sizes="56px"
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 text-sm">
                    <p className="font-medium">{line.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {line.colourLabel} · {line.size} · Qty {line.quantity}
                    </p>
                    {line.customVerse && (
                      <p className="mt-1 rounded-md bg-[#faf8f2] px-2 py-1 text-xs text-[#8a6d1a]">
                        Custom print: &ldquo;{line.customVerse.text}&rdquo; —{" "}
                        {line.customVerse.reference}
                        {line.customVerse.note && (
                          <>
                            <br />
                            Note: {line.customVerse.note}
                          </>
                        )}
                      </p>
                    )}
                  </div>
                  <span className="text-sm tabular-nums">
                    {formatPrice(line.price * line.quantity)}
                  </span>
                </li>
              ))}
            </ul>
            <dl className="mt-4 flex flex-col gap-1 border-t border-black/10 pt-3 text-sm">
              <Row label="Subtotal" value={formatPrice(order.subtotal)} />
              {order.discount > 0 && (
                <Row label="Discount" value={`−${formatPrice(order.discount)}`} />
              )}
              <Row
                label={collecting ? "Collect from store" : "Delivery"}
                value={order.shipping === 0 ? "Free" : formatPrice(order.shipping)}
              />
              {(order.tax ?? 0) > 0 && <Row label="Tax" value={formatPrice(order.tax!)} />}
              {(order.refundedAmount ?? 0) > 0 && (
                <Row
                  label="Refunded"
                  value={`−${formatPrice(order.refundedAmount!)}`}
                />
              )}
              <Row label="Total" value={formatPrice(order.total)} strong />
            </dl>
          </Card>

          <Card title="Internal notes">
            {order.notes && order.notes.length > 0 ? (
              <ul className="mb-3 flex flex-col gap-2">
                {order.notes.map((n) => (
                  <li
                    key={n.id}
                    className="rounded-md bg-[#faf8f2] px-3 py-2 text-sm"
                  >
                    <p>{n.body}</p>
                    <p className="text-xs text-muted-foreground">
                      {n.author} · {formatDate(n.at)}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mb-3 text-sm text-muted-foreground">No notes yet.</p>
            )}
            <Textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a note for the team (not shown to the customer)"
            />
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              disabled={!note.trim() || addNote.isPending}
              onClick={() => addNote.mutate()}
            >
              Add note
            </Button>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card title="Customer">
            <p className="text-sm font-medium">{order.customerName}</p>
            <a
              href={`mailto:${order.customerEmail}`}
              className="text-sm text-[#1e3a5f] hover:underline"
            >
              {order.customerEmail}
            </a>
            <Link
              href={`/admin/customers/${encodeURIComponent(order.customerEmail ?? "")}`}
              className="mt-1 block text-xs text-muted-foreground underline-offset-2 hover:underline"
            >
              View customer →
            </Link>
            {collecting ? (
              <div className="mt-3 flex flex-col gap-1.5 border-t border-black/10 pt-3 text-sm">
                <p className="flex items-center gap-2 font-semibold text-[#1e3a5f]">
                  <StoreIcon className="size-4" />
                  Collecting in store
                </p>
                {contact ? (
                  <>
                    <p>
                      {contact.firstName} {contact.lastName}
                    </p>
                    <p className="text-muted-foreground">{contact.email}</p>
                    <a
                      href={`tel:${contact.phone}`}
                      className="inline-flex items-center gap-1.5 text-[#1e3a5f] hover:underline"
                    >
                      <PhoneIcon className="size-3.5" />
                      {contact.phone}
                    </a>
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Placed before collection contact details were recorded — use the email above.
                  </p>
                )}
              </div>
            ) : address ? (
              <div className="mt-3 flex gap-2 border-t border-black/10 pt-3 text-sm text-muted-foreground">
                <MapPinIcon className="mt-0.5 size-4 shrink-0" />
                <address className="not-italic">
                  {address.firstName} {address.lastName}
                  <br />
                  {address.line1}
                  <br />
                  {address.line2 && (
                    <>
                      {address.line2}
                      <br />
                    </>
                  )}
                  {address.city}, {address.postcode}
                  <br />
                  {address.country}
                  <br />
                  {address.phone}
                </address>
              </div>
            ) : null}
          </Card>

          <Card title="Payment">
            <div className="flex items-center justify-between text-sm">
              <span className="inline-flex items-center gap-2 text-muted-foreground">
                <CreditCardIcon className="size-4" />
                Stripe
              </span>
              <PaymentStatusBadge status={order.paymentStatus ?? "paid"} />
            </div>
            <p className="mt-2 break-all font-mono text-xs text-muted-foreground">
              {order.stripePaymentIntentId}
            </p>
            <a
              href={`https://dashboard.stripe.com/payments/${order.stripePaymentIntentId}`}
              target="_blank"
              rel="noreferrer"
              className="mt-1 inline-flex items-center gap-1 text-xs text-[#1e3a5f] hover:underline"
            >
              Open in Stripe <ExternalLinkIcon className="size-3" />
            </a>
            <div className="mt-3 border-t border-black/10 pt-3">
              <Button
                variant="destructive"
                size="sm"
                className="w-full"
                disabled={refundable <= 0}
                onClick={() => setRefundOpen(true)}
              >
                {refundable <= 0
                  ? "Fully refunded"
                  : `Refund ${formatPrice(refundable)}`}
              </Button>
            </div>
          </Card>

          <Card title="Timeline">
            <ol className="flex flex-col gap-3">
              {[...(order.timeline ?? [])].reverse().map((event) => (
                <li key={event.id} className="flex gap-2.5 text-sm">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[#c8a44d]" />
                  <div>
                    <p>{event.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(event.at)}
                      {event.detail ? ` · ${event.detail}` : ""}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={refundOpen}
        onOpenChange={setRefundOpen}
        title={`Refund ${formatPrice(refundable)} to ${order.customerName}?`}
        description={
          <span>
            This refunds the remaining balance to the original payment method via
            Stripe and emails the customer.
            {order.status !== "delivered" && (
              <>
                {" "}
                The order will also be cancelled
                {willRestock ? " and its items returned to stock" : ""}.
              </>
            )}
          </span>
        }
        confirmLabel="Issue refund"
        destructive
        onConfirm={async () => {
          await refund.mutateAsync();
        }}
      />

      <ConfirmDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        title={`Cancel order ${order.number}?`}
        description={
          <span>
            {refundable > 0 && order.stripePaymentIntentId
              ? `${formatPrice(refundable)} will be refunded to ${order.customerName}'s original payment method via Stripe. `
              : "Nothing is left to refund. "}
            {willRestock
              ? "The items go back into stock. "
              : "Stock isn't changed — the items have already left the shop (or were restocked before). "}
            The customer is emailed that the order is cancelled. This can&rsquo;t be undone.
          </span>
        }
        confirmLabel="Cancel order & refund"
        destructive
        onConfirm={async () => {
          await cancelOrder.mutateAsync();
        }}
      />
    </>
  );
}

function Row({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div
      className={
        strong
          ? "flex justify-between border-t border-black/10 pt-2 font-medium"
          : "flex justify-between"
      }
    >
      <dt className={strong ? "" : "text-muted-foreground"}>{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  );
}
