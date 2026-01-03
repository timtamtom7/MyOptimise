export type CommandPaletteCommand = {
  id: string;
  label: string;
  kind: "link" | "logout_all";
  href?: string;
  keywords?: string;
};

export default function CommandPalette({
  enabled,
  commands,
}: {
  enabled: boolean;
  commands: CommandPaletteCommand[];
}) {
  return null;
}

