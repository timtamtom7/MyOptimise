import { orderableDocumentListDeskItem } from "@sanity/orderable-document-list";
import {
  Files,
  User,
  Menu,
  Settings,
  Building2,
  CalendarDays,
  ClipboardList,
  MessageSquare,
  UserPlus,
  Utensils,
  Flag,
  BarChart3,
  Receipt,
  CreditCard,
  StickyNote,
  PlugZap,
} from "lucide-react";

export const structure = (S: any, context: any) =>
  S.list()
    .title("Content")
    .items([
      S.listItem()
        .title("Accounts")
        .icon(User)
        .child(
          S.list()
            .title("Accounts")
            .items([
              S.listItem()
                .title("Admins")
                .icon(User)
                .child(
                  S.documentList()
                    .title("Admins")
                    .filter('_type == "account" && type == "admin"')
                    .defaultOrdering([{ field: "_createdAt", direction: "asc" }])
                ),
              S.listItem()
                .title("Managers")
                .icon(User)
                .child(
                  S.documentList()
                    .title("Managers")
                    .filter('_type == "account" && type == "manager"')
                    .defaultOrdering([{ field: "_createdAt", direction: "asc" }])
                ),
              S.listItem()
                .title("Employees")
                .icon(User)
                .child(
                  S.documentList()
                    .title("Employees")
                    .filter('_type == "account" && type == "employee"')
                    .defaultOrdering([{ field: "_createdAt", direction: "asc" }])
                ),
              S.listItem()
                .title("Clients")
                .icon(User)
                .child(
                  S.documentList()
                    .title("Clients")
                    .filter('_type == "account" && type == "client"')
                    .defaultOrdering([{ field: "_createdAt", direction: "asc" }])
                ),
              S.listItem()
                .title("All Accounts")
                .icon(User)
                .child(
                  S.documentTypeList("account")
                    .title("All Accounts")
                    .defaultOrdering([{ field: "_createdAt", direction: "asc" }])
                ),
            ])
        ),
      S.divider({ title: "Operations" }),
      S.listItem()
        .title("Events")
        .icon(CalendarDays)
        .child(
          S.documentTypeList("event")
            .title("Events")
            .defaultOrdering([{ field: "date", direction: "desc" }])
        ),
      S.listItem()
        .title("Signups")
        .icon(UserPlus)
        .child(
          S.documentTypeList("signup")
            .title("Signups")
            .defaultOrdering([{ field: "createdAt", direction: "desc" }])
        ),
      S.listItem()
        .title("Sponsorships")
        .icon(Utensils)
        .child(
          S.documentTypeList("sponsorship")
            .title("Sponsorships")
            .defaultOrdering([{ field: "_createdAt", direction: "desc" }])
        ),
      S.listItem()
        .title("Work Items")
        .icon(ClipboardList)
        .child(
          S.documentTypeList("workItem")
            .title("Work Items")
            .defaultOrdering([{ field: "createdAt", direction: "desc" }])
        ),
      S.listItem()
        .title("Client Requests")
        .icon(MessageSquare)
        .child(
          S.documentTypeList("clientRequest")
            .title("Client Requests")
            .defaultOrdering([{ field: "createdAt", direction: "desc" }])
        ),
      S.listItem()
        .title("Message Threads")
        .icon(MessageSquare)
        .child(
          S.documentTypeList("messageThread")
            .title("Message Threads")
            .defaultOrdering([{ field: "updatedAt", direction: "desc" }])
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
      S.listItem()
        .title("Feature Flags")
        .icon(Flag)
        .child(
          S.documentTypeList("featureFlag")
            .title("Feature Flags")
            .defaultOrdering([{ field: "key", direction: "asc" }])
        ),
      S.divider({ title: "Analytics" }),
      S.listItem()
        .title("Analytics Records")
        .icon(BarChart3)
        .child(
          S.documentTypeList("analyticsRecord")
            .title("Analytics Records")
            .defaultOrdering([{ field: "createdAt", direction: "desc" }])
        ),
      S.listItem()
        .title("Analytics Notes")
        .icon(StickyNote)
        .child(
          S.documentTypeList("analyticsNote")
            .title("Analytics Notes")
            .defaultOrdering([{ field: "createdAt", direction: "desc" }])
        ),
      S.listItem()
        .title("Analytics Ingestion")
        .icon(PlugZap)
        .child(
          S.documentTypeList("analyticsIngestionConfig")
            .title("Analytics Ingestion")
            .defaultOrdering([{ field: "updatedAt", direction: "desc" }])
        ),
      S.divider({ title: "Billing" }),
      S.listItem()
        .title("Invoices")
        .icon(Receipt)
        .child(S.documentTypeList("invoice").title("Invoices").defaultOrdering([{ field: "createdAt", direction: "desc" }])),
      S.listItem()
        .title("Billing Profiles")
        .icon(CreditCard)
        .child(
          S.documentTypeList("billingProfile")
            .title("Billing Profiles")
            .defaultOrdering([{ field: "updatedAt", direction: "desc" }])
        ),
    ]);
