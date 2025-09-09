"use client";

import { TextlyLogo } from "@/components/icons";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Languages, LucideIcon } from "lucide-react";
import Link from 'next/link';
import { useLanguage } from "@/context/language-context";
import { Button } from "./ui/button";

interface HeaderProps {
  isHomePage?: boolean;
  pageLinks?: { href: string; label: string, icon: LucideIcon }[];
}

export function Header({ isHomePage = false, pageLinks = [] }: HeaderProps) {
  const { locale, setLocale, t } = useLanguage();

  return (
    <header className="py-4 border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-4">
          <TextlyLogo className="h-12 w-12 text-primary" />
          <div>
            <h1 className="text-3xl font-headline text-primary">
              {t("header.title")}
            </h1>
            <p className="text-sm text-muted-foreground -mt-1">
              {t("header.subtitle")}
            </p>
          </div>
        </Link>
        <div className="flex items-center gap-4">
          {!isHomePage && (
            <>
              {pageLinks.map(link => {
                const Icon = link.icon;
                return (
                  <Button asChild variant="ghost" key={link.href}>
                    <Link href={link.href} className="flex items-center gap-2">
                      <Icon className="w-5 h-5" />
                      <span>{link.label}</span>
                    </Link>
                  </Button>
                )
              })}
            </>
          )}
           <div className="flex items-center gap-2">
              <Languages className="h-5 w-5 text-muted-foreground" />
              <Select value={locale} onValueChange={(value) => setLocale(value as 'en' | 'pa')}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="pa">ਪੰਜਾਬੀ</SelectItem>
                </SelectContent>
              </Select>
            </div>
        </div>
      </div>
    </header>
  );
}
