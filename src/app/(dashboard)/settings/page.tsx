import { getFullState } from "@/lib/db";
import SettingsCards from "@/components/settings/SettingsCards";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const { settings, appState } = await getFullState();

  return (
    <SettingsCards
      settings={settings}
      rothYTD={{ josh: appState.rothYTDJosh, elana: appState.rothYTDElana }}
    />
  );
}
