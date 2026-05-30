import { redirect } from "next/navigation";

// Rota raiz — redireciona para o locale padrão
export default function RootPage() {
  redirect("/pt");
}
