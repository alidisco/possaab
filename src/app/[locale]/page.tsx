import { redirect } from 'next/navigation';
import { hasLocale } from 'next-intl';
import { routing } from '@/i18n/routing';
import { notFound } from 'next/navigation';

export default async function LocaleRootPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  // Redirect root locale traffic directly to the login portal.
  // Once the cashier is successfully authenticated, the app routes them into the styled /dashboard.
  redirect(`/${locale}/login`);
}