import Link from "next/link";

export default function RootNotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 px-6 text-center">
      <span className="font-display text-5xl text-[#9a7b2e]">404</span>
      <h1 className="text-xl">Page not found</h1>
      <Link
        href="/"
        className="text-sm text-[#1e3a5f] underline underline-offset-4"
      >
        Back home
      </Link>
    </div>
  );
}
