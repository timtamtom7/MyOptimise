import { NextResponse } from "next/server";
import { client } from "@/sanity/lib/client";
import { groq } from "next-sanity";

export async function GET() {
  const events = await client.fetch(
    groq`*[_type == "event"]{_id, title, description, location, "orgName": organization->name}`
  );
  const orgs = await client.fetch(
    groq`*[_type == "organization"]{_id, name, description}`
  );
  return NextResponse.json({ events, orgs });
}
