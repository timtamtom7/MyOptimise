"use client";

import * as React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TimezoneSelectorProps {
  defaultValue?: string;
  disabled?: boolean;
}

export function TimezoneSelector({ defaultValue, disabled }: TimezoneSelectorProps) {
  const timezones = React.useMemo(() => {
    try {
      // @ts-ignore - supportedValuesOf is available in modern environments
      if (typeof Intl !== "undefined" && Intl.supportedValuesOf) {
        // @ts-ignore
        return Intl.supportedValuesOf("timeZone");
      }
    } catch (e) {
      console.warn("Intl.supportedValuesOf not supported", e);
    }
    return [
      "UTC",
      "America/New_York",
      "America/Chicago",
      "America/Denver",
      "America/Los_Angeles",
      "Europe/London",
      "Europe/Paris",
      "Asia/Tokyo",
      "Australia/Sydney",
    ];
  }, []);

  return (
    <Select name="timezone" defaultValue={defaultValue || "UTC"} disabled={disabled}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select a timezone" />
      </SelectTrigger>
      <SelectContent className="max-h-[300px]">
        {timezones.map((tz: string) => (
          <SelectItem key={tz} value={tz}>
            {tz.replace(/_/g, " ")}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
