import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import Landing from "@/components/landing";
import { CatalogSection } from "@/components/catalog-section";

export default async function HomePage() {
  const session = await auth();
  if (session?.user) {
    redirect("/dashboard");
  }
  return (
    <main>
      <Landing />
      <CatalogSection />
    </main>
  );
}
