import { orderableDocumentListDeskItem } from "@sanity/orderable-document-list";
import {
  Files,
  BookA,
  User,
  ListCollapse,
  Quote,
  Menu,
  Settings,
  CalendarDays,
  Building2,
} from "lucide-react";

export const structure = (S: any, context: any) =>
  S.list()
    .title("Content")
    .items([
      S.listItem()
        .title("Volunteering")
        .icon(CalendarDays)
        .child(
          S.list()
            .title("Volunteering")
            .items([
              S.listItem()
                .title("Events")
                .icon(CalendarDays)
                .child(
                  S.documentTypeList("event")
                    .title("Events")
                    .defaultOrdering([{ field: "date", direction: "asc" }])
                ),
              S.listItem()
                .title("Organizations")
                .icon(Building2)
                .child(
                  S.documentTypeList("organization")
                    .title("Organizations")
                    .defaultOrdering([{ field: "name", direction: "asc" }])
                ),
              S.listItem()
                .title("Pending Requests")
                .icon(User)
                .child(
                  S.documentList()
                    .title("Pending Requests")
                    .filter('_type == "signup" && status == "received"')
                    .defaultOrdering([{ field: "_createdAt", direction: "desc" }])
                ),
              S.listItem()
                .title("Approved Volunteers")
                .icon(User)
                .child(
                  S.documentList()
                    .title("Approved Volunteers")
                    .filter('_type == "signup" && status == "confirmed"')
                    .defaultOrdering([{ field: "_createdAt", direction: "desc" }])
                ),
              S.listItem()
                .title("Rejected Requests")
                .icon(User)
                .child(
                  S.documentList()
                    .title("Rejected Requests")
                    .filter('_type == "signup" && status == "rejected"')
                    .defaultOrdering([{ field: "_createdAt", direction: "desc" }])
                ),
              S.listItem()
                .title("Proof Submissions")
                .icon(User)
                .child(
                  S.documentList()
                    .title("Proof Submissions")
                    .filter('_type == "signup" && defined(proofMedia) && count(proofMedia) > 0')
                    .defaultOrdering([{ field: "_createdAt", direction: "desc" }])
                ),
            ])
        ),
      S.listItem()
        .title("Business")
        .icon(Building2)
        .child(
          S.list()
            .title("Business")
            .items([
              S.listItem()
                .title("Pending Sponsorships")
                .icon(Building2)
                .child(
                  S.documentList()
                    .title("Pending Sponsorships")
                    .filter('_type == "sponsorship" && status == "submitted"')
                    .defaultOrdering([{ field: "_createdAt", direction: "desc" }])
                ),
              S.listItem()
                .title("Approved Sponsorships")
                .icon(Building2)
                .child(
                  S.documentList()
                    .title("Approved Sponsorships")
                    .filter('_type == "sponsorship" && status == "approved"')
                    .defaultOrdering([{ field: "_createdAt", direction: "desc" }])
                ),
              S.listItem()
                .title("Rejected Sponsorships")
                .icon(Building2)
                .child(
                  S.documentList()
                    .title("Rejected Sponsorships")
                    .filter('_type == "sponsorship" && status == "rejected"')
                    .defaultOrdering([{ field: "_createdAt", direction: "desc" }])
                ),
              S.listItem()
                .title("Completed Sponsorships")
                .icon(Building2)
                .child(
                  S.documentList()
                    .title("Completed Sponsorships")
                    .filter('_type == "sponsorship" && status == "completed"')
                    .defaultOrdering([{ field: "_createdAt", direction: "desc" }])
                ),
            ])
        ),
      S.listItem()
        .title("Accounts")
        .icon(User)
        .child(
          S.list()
            .title("Accounts")
            .items([
              S.listItem()
                .title("Pending Accounts")
                .icon(User)
                .child(
                  S.documentList()
                    .title("Pending Accounts")
                    .filter('_type == "account" && status == "pending"')
                    .defaultOrdering([{ field: "_createdAt", direction: "asc" }])
                ),
              S.listItem()
                .title("Approved Accounts")
                .icon(User)
                .child(
                  S.documentList()
                    .title("Approved Accounts")
                    .filter('_type == "account" && status == "approved"')
                    .defaultOrdering([{ field: "_createdAt", direction: "asc" }])
                ),
              S.listItem()
                .title("Denied Accounts")
                .icon(User)
                .child(
                  S.documentList()
                    .title("Denied Accounts")
                    .filter('_type == "account" && status == "denied"')
                    .defaultOrdering([{ field: "_createdAt", direction: "asc" }])
                ),
            ])
        ),
      orderableDocumentListDeskItem({
        type: "page",
        title: "Pages",
        icon: Files,
        S,
        context,
      }),
      S.divider({ title: "Global" }),
      S.listItem()
        .title("Navigation")
        .icon(Menu)
        .child(
          S.editor()
            .id("navigation")
            .schemaType("navigation")
            .documentId("navigation")
        ),
      S.listItem()
        .title("Settings")
        .icon(Settings)
        .child(
          S.editor()
            .id("settings")
            .schemaType("settings")
            .documentId("settings")
        ),
    ]);
