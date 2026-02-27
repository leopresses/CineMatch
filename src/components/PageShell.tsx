import { ReactNode } from "react";

interface Props {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  noPadding?: boolean;
}

const PageShell = ({ title, subtitle, children, noPadding }: Props) => (
  <div className="min-h-screen pb-24">
    {(title || subtitle) && (
      <header className={`pt-12 pb-4 ${noPadding ? "" : "px-5"}`}>
        {title && <h1 className="text-display text-2xl">{title}</h1>}
        {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
      </header>
    )}
    <main className={noPadding ? "" : "px-5"}>{children}</main>
  </div>
);

export default PageShell;
