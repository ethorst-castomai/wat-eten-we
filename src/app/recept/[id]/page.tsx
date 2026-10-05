import { RecipeScreen } from "@/components/screens/RecipeScreen";
import { recipes } from "@/data/recipes";

export function generateStaticParams() {
  return recipes.map((r) => ({ id: r.id }));
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <RecipeScreen key={id} id={id} />;
}
