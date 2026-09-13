import { Breadcrumbs, type Crumb } from "@/components/common/breadcrumbs";

type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  crumbs?: Crumb[];
};

export function PageHeader({ eyebrow, title, description, crumbs }: PageHeaderProps) {
  return (
    <header className="border-b border-border bg-cream">
      <div className="container-page flex flex-col gap-4 py-10 sm:py-14">
        {crumbs && crumbs.length > 0 && <Breadcrumbs items={crumbs} />}
        {eyebrow && (
          <span className="text-xs font-medium uppercase tracking-[0.2em] text-gold-dark">
            {eyebrow}
          </span>
        )}
        <h1 className="text-3xl sm:text-4xl">{title}</h1>
        {description && (
          <p className="max-w-2xl text-muted-foreground">{description}</p>
        )}
      </div>
    </header>
  );
}
