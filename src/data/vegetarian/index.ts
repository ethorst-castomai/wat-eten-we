import type { VegetarianOption } from "@/lib/types";
import { vegetarianWeekdayA } from "./weekday-a";
import { vegetarianWeekdayB } from "./weekday-b";
import { vegetarianWeekend } from "./weekend";

/** Vegetarische varianten per recept-id */
export const vegetarianOptions: Record<string, VegetarianOption> = {
  ...vegetarianWeekdayA,
  ...vegetarianWeekdayB,
  ...vegetarianWeekend,
};
