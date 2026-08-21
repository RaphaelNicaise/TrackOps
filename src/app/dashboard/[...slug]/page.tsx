import { redirect } from "next/navigation";

export default function DashboardCatchAllRedirect({
  params,
}: {
  params: { slug?: string[] };
}) {
  const path = params?.slug ? params.slug.join("/") : "";
  redirect(`/panel/${path}`);
}
