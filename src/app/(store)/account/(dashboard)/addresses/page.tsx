import { getAddresses } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default async function AddressesPage() {
  const addresses = await getAddresses();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">Saved addresses</h2>
        <Button variant="outline" size="sm" disabled>
          Add address
        </Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {addresses.map((address) => (
          <div
            key={address.id}
            className="rounded-xl border border-border bg-card p-5 text-sm"
          >
            <div className="mb-2 flex items-center gap-2">
              <p className="font-medium">
                {address.firstName} {address.lastName}
              </p>
              {address.isDefault && <Badge variant="outline">Default</Badge>}
            </div>
            <address className="not-italic text-muted-foreground">
              {address.line1}
              <br />
              {address.line2 && (
                <>
                  {address.line2}
                  <br />
                </>
              )}
              {address.city}
              {address.county && `, ${address.county}`}
              <br />
              {address.postcode}
              <br />
              {address.country}
            </address>
            {address.phone && (
              <p className="mt-2 text-muted-foreground">{address.phone}</p>
            )}
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Address management is read-only in this preview build.
      </p>
    </div>
  );
}
