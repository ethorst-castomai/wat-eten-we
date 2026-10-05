import { createRoot } from "react-dom/client";
import "../src/app/globals.css";
import { AppStateProvider } from "@/components/AppState";
import { AppShell } from "@/components/AppShell";
import { TodayScreen } from "@/components/screens/TodayScreen";
import { RecipeScreen } from "@/components/screens/RecipeScreen";
import { ShoppingScreen } from "@/components/screens/ShoppingScreen";
import { FavoritesScreen } from "@/components/screens/FavoritesScreen";
import { ProfileScreen } from "@/components/screens/ProfileScreen";
import { WeekScreen } from "@/components/screens/WeekScreen";
import { ImportScreen } from "@/components/screens/ImportScreen";
import { NavProvider, usePath } from "./nav";

function Routes() {
  const path = usePath();
  if (path.startsWith("/recept/")) {
    const id = path.slice("/recept/".length);
    return <RecipeScreen key={id} id={id} />;
  }
  if (path === "/week") return <WeekScreen />;
  if (path === "/importeren") return <ImportScreen />;
  if (path.startsWith("/importeren/")) {
    const id = path.slice("/importeren/".length);
    return <ImportScreen key={id} editId={id} />;
  }
  if (path === "/boodschappen") return <ShoppingScreen />;
  if (path === "/favorieten") return <FavoritesScreen />;
  if (path === "/profiel") return <ProfileScreen />;
  return <TodayScreen />;
}

createRoot(document.getElementById("root")!).render(
  <NavProvider>
    <AppStateProvider>
      <AppShell>
        <Routes />
      </AppShell>
    </AppStateProvider>
  </NavProvider>,
);
