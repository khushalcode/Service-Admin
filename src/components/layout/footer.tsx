"use client";

import { Link } from "@/components/ui/locale-link";
import { Clock, MapPin, Mail, Phone } from "lucide-react";
import { AppImage } from "@/components/ui/app-image";
import whiteLogo from "@/assets/brand/white_logo.svg";
import {
  PlayStoreIcon,
  AppStoreIcon,
  DoubleChevronRightIcon,
  InstagramIcon,
  FacebookIcon,
  TwitterIcon,
} from "@/components/icons/icons";
import { useTranslation } from "@/lib/i18n/translation-context";
import { useCustomPages } from "@/lib/use-custom-pages";
import { useConsent } from "@/lib/consent-context";
import { useCookieConsentSettings } from "@/lib/use-cookie-consent-settings";

const QUICK_LINKS = [
  { labelKey: "nav.services", href: "/services" },
  { labelKey: "nav.providers", href: "/providers" },
  { labelKey: "nav.blogs", href: "/blogs" },
  { labelKey: "nav.faqs", href: "/faqs" },
  { labelKey: "footer.becomeAnProvider", href: "/become-provider" },
];

const COMPANY_LINKS = [
  { labelKey: "nav.aboutUs", href: "/about-us" },
  { labelKey: "nav.contactUs", href: "/contact-us" },
  { labelKey: "nav.sitemap", href: "/sitemap" },
  { labelKey: "footer.termsAndConditions", href: "/terms-and-conditions" },
  { labelKey: "nav.privacyPolicy", href: "/privacy-policy" },
];

const SOCIAL_LINKS = [
  { label: "Instagram", href: "https://instagram.com", Icon: InstagramIcon },
  { label: "Facebook", href: "https://facebook.com", Icon: FacebookIcon },
  { label: "Twitter", href: "https://twitter.com", Icon: TwitterIcon },
];

// Footer is always a dark surface, regardless of the app's light/dark theme
// (verified: using the theme-reactive Background/Inverse + Text/Inverse Light
// tokens here flips the footer to a white bg in dark mode while link/copy text
// stays white too, making it invisible). Fixed Footer component tokens only, below.

function FooterColumn({
  title,
  links,
}: {
  title: string;
  /** Either a translation key (fixed nav links) or a raw label (admin-created
   * custom pages — already server-translated by `translated_title`). */
  links: { labelKey?: string; label?: string; href: string }[];
}) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-1 flex-col items-start gap-6 pt-6">
      <div className="w-fit border-b border-footer-white pb-1">
        <span className="text-lg font-medium text-footer-light-text">
          {title}
        </span>
      </div>
      <ul className="flex w-full flex-col items-start gap-3">
        {links.map((link) => (
          <li key={link.href} className="w-full">
            <Link
              href={link.href}
              className="flex items-center gap-1 text-base text-footer-light-text underline decoration-transparent underline-offset-4 transition-all duration-300 ease-out hover:translate-x-1.5 hover:decoration-footer-light-text"
            >
              <DoubleChevronRightIcon className="size-3.5 shrink-0 rtl:rotate-180" />
              {link.label ?? t(link.labelKey as string)}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Footer() {
  const { t } = useTranslation();
  const { pages: customPages } = useCustomPages();
  const { reopenSettings } = useConsent();
  const { status: cookieConsentStatus } = useCookieConsentSettings();
  const customPageLinks = customPages.map((page) => ({
    label: page.title,
    href: `/custom-page/${page.slug}`,
  }));

  return (
    <footer className="bg-footer-main-bg pt-16 pb-16 max-lg:hidden">
      <div className="container flex flex-col gap-6">
        <div className="flex flex-col items-start gap-6 lg:flex-row">
          <div className="flex w-full flex-col items-start gap-6 py-6 lg:w-96 lg:shrink-0">
            <Link href="/" className="flex items-center">
              <AppImage src={whiteLogo} alt="eDemand" className="h-11 w-auto" />
            </Link>
            <p className="text-base text-footer-light-text">
              {t("footer.tagline")}
            </p>

            <div className="flex flex-col items-start gap-4">
              <span className="text-base font-medium text-footer-light-text">
                {t("footer.downloadApp")}
              </span>
              <div className="flex flex-wrap items-start gap-4">
                <Link
                  href="https://play.google.com"
                  className="flex items-center gap-3 rounded-lg p-3 text-lg text-footer-light-text transition-colors duration-200 hover:bg-footer-light-bg hover:text-footer-dark-text"
                >
                  <PlayStoreIcon className="h-7 w-6" />
                  {t("footer.googlePlay")}
                </Link>
                <Link
                  href="https://www.apple.com/app-store"
                  className="flex items-center gap-3 rounded-lg p-3 text-lg text-footer-light-text transition-colors duration-200 hover:bg-footer-light-bg hover:text-footer-dark-text"
                >
                  <AppStoreIcon className="h-7 w-6" />
                  {t("footer.appStore")}
                </Link>
              </div>
            </div>
          </div>

          <FooterColumn title={t("footer.quickLinks")} links={QUICK_LINKS} />
          <FooterColumn title={t("footer.company")} links={COMPANY_LINKS} />
          {customPageLinks.length > 0 && (
            <FooterColumn title={t("footer.pages")} links={customPageLinks} />
          )}

          <div className="flex flex-1 flex-col items-start gap-6 pt-6">
            <div className="w-fit border-b border-footer-white pb-1">
              <span className="text-lg font-medium text-footer-light-text">
                {t("footer.contactUs")}
              </span>
            </div>
            <div className="flex w-full flex-col items-start gap-4">
              <div className="flex items-center gap-3">
                <Phone className="size-5 shrink-0 text-footer-light-icon" />
                <span className="text-base text-footer-light-text">
                  +91 97979 45459
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="size-5 shrink-0 text-footer-light-icon" />
                <span className="text-base text-footer-light-text">
                  Support@wrteam.in
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="size-5 shrink-0 text-footer-light-icon" />
                <span className="text-base text-footer-light-text">
                  09:00 AM to 09:00 PM
                </span>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 size-5 shrink-0 text-footer-light-icon" />
                <span className="text-base text-footer-light-text">
                  Time Square Empire, 262-263, highway, Mirjapar, Bhuj,
                  Mirjapar Part, Gujarat 370001
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full border-t border-dashed border-footer-light-text/30" />

        <div className="flex flex-col items-center gap-4 pt-6 md:flex-row md:justify-between">
          <div className="flex flex-wrap items-center gap-4">
            <p className="text-base text-footer-light-text">
              {t("footer.copyright", { year: new Date().getFullYear() })}
            </p>
            {cookieConsentStatus === "enabled" && (
              <button
                type="button"
                onClick={reopenSettings}
                className="text-base text-footer-light-text underline decoration-transparent underline-offset-4 transition-colors hover:decoration-footer-light-text"
              >
                {t("cookie.settingsLink")}
              </button>
            )}
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            {SOCIAL_LINKS.map(({ label, href, Icon }) => (
              <Link
                key={label}
                href={href}
                aria-label={label}
                className="flex items-center gap-3 rounded-3xl border border-footer-light-text/20 p-3 text-footer-light-text transition-colors duration-200 hover:bg-footer-light-bg hover:text-footer-dark-text"
              >
                <Icon className="size-6" />
                <span className="hidden text-base sm:inline">{label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
