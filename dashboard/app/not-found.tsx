import React from "react";
import DashboardPageLayout from "@/components/dashboard/layout";
import GearIcon from "@/components/icons/gear";

export default function NotFound() {
  return (
    <DashboardPageLayout
      header={{
        title: "Not found",
        description: "page under construction",
        icon: GearIcon,
      }}
    >
      <div className="flex flex-col items-center justify-center gap-10 flex-1">
        <div className="flex flex-col items-center justify-center gap-2">
          <h1 className="text-xl font-bold uppercase text-muted-foreground">
            Not found, yet
          </h1>
          <p className="text-sm max-w-sm text-center text-muted-foreground text-balance">
            This page is under construction.
          </p>
        </div>
      </div>
    </DashboardPageLayout>
  );
}
