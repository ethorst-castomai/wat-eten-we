import { ImportScreen } from "@/components/screens/ImportScreen";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ImportScreen key={id} editId={id} />;
}
