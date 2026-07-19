import React from "react";

interface DashboardPageLayoutProps {
  children: React.ReactNode;

  header: {
    title: string;
    description?: string;
    icon: React.ElementType;
  };
}

export default function DashboardPageLayout({
  children,
  header,
}: DashboardPageLayoutProps) {
  return (
    <div className="flex flex-col relative w-full gap-1 min-h-full">
      <div className="flex items-center gap-3 md:gap-4 px-4 md:px-6 py-3.5 md:py-5 border border-border/60 rounded-xl sticky top-header-mobile lg:top-0 bg-background/95 backdrop-blur-sm z-10 shadow-navbar">
        <div className="shrink-0 rounded-lg bg-primary size-8 md:size-10 flex items-center justify-center shadow-button">
          <header.icon className="size-5 text-primary-foreground" />
        </div>
        <div className="flex flex-col min-w-0">
          <h1 className="text-lg md:text-2xl lg:text-3xl font-semibold tracking-tight leading-tight truncate">
            {header.title}
          </h1>
          {header.description && (
            <span className="text-xs md:text-sm text-muted-foreground truncate lg:hidden">
              {header.description}
            </span>
          )}
        </div>
        {header.description && (
          <span className="ml-auto hidden lg:block text-sm text-muted-foreground text-right">
            {header.description}
          </span>
        )}
      </div>
      <div className="min-h-full flex-1 flex flex-col gap-8 md:gap-12 px-3 md:px-6 py-6 md:py-9 border border-border/60 rounded-xl bg-background shadow-panel">
        {children}
      </div>
    </div>
  );
}
