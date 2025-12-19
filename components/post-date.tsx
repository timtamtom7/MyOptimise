"use client";
import { formatDate } from "@/lib/utils";

export default function PostDate({ date }: { date: string }) {
  return <div>{date ? formatDate(date) : ""}</div>;
}
