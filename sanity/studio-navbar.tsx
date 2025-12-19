import { Flex, Button } from "@sanity/ui";
import { ExternalLink } from "lucide-react";
import Link from "next/link";

export default function StudioNavbar(props: any) {
  return (
    <Flex padding={3} justify="space-between" align="center" style={{ backgroundColor: "var(--card-bg)", borderBottom: "1px solid var(--card-border-color, transparent)" }}>
      <props.renderDefault {...props} />
      <Flex gap={2}>
        <Link href="/" passHref>
          <Button mode="ghost" tone="primary" text="Back to Website" />
        </Link>
        <Link href="/" target="_blank" rel="noopener noreferrer" passHref>
          <Button mode="ghost" tone="primary" text="Open in New Tab" icon={ExternalLink} />
        </Link>
      </Flex>
    </Flex>
  );
}
