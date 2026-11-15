import { redirect } from 'next/navigation';

export default async function MasterPlayerRedirect({ params }) {
  const { slug } = await params;
  const canonical = String(slug || '').replace(/-\d+$/, '');
  redirect(`/player/${canonical}/?context=master-2026`);
}
