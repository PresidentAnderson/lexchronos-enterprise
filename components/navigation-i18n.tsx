"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useTranslation } from "../hooks/useTranslation";
import { LanguageSwitcher } from "./language-switcher";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Scale,
  Menu,
  Moon,
  Sun,
  User,
  Settings,
  LogOut,
  Bell,
  Search,
  Globe,
} from "lucide-react";

interface NavigationProps {
  user?: {
    name: string;
    email: string;
    role: "lawyer" | "client" | "admin";
    avatar?: string;
  };
}

export function Navigation({ user }: NavigationProps) {
  const pathname = usePathname();
  const { t, isRTL, direction } = useTranslation();
  const [theme, setTheme] = React.useState<"light" | "dark">("light");
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  // Dynamic navigation items with translations
  const mainNavItems = React.useMemo(() => [
    {
      title: t('navigation.dashboard'),
      href: "/dashboard",
    },
    {
      title: t('navigation.cases'),
      href: "/cases",
      items: [
        {
          title: t('navigation.cases'),
          href: "/cases",
          description: t('messages.loading', { fallback: 'View and manage all your cases' }),
        },
        {
          title: t('status.active'),
          href: "/cases/active", 
          description: t('messages.loading', { fallback: 'Currently ongoing legal cases' }),
        },
        {
          title: t('status.completed'),
          href: "/cases/completed",
          description: t('messages.loading', { fallback: 'Finished and closed cases' }),
        },
      ],
    },
    {
      title: t('navigation.timeline'),
      href: "/timeline",
    },
    {
      title: t('navigation.documents'),
      href: "/documents",
    },
    {
      title: t('navigation.calendar'),
      href: "/calendar", 
    },
    {
      title: t('navigation.billing'),
      href: "/billing",
    },
  ], [t]);

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
    document.documentElement.classList.toggle("dark");
  };

  // Apply RTL class to header
  const headerClasses = cn(
    "sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
    isRTL && "rtl"
  );

  const containerClasses = cn(
    "container flex h-16 items-center justify-between",
    isRTL && "flex-row-reverse"
  );

  return (
    <header className={headerClasses} dir={direction}>
      <div className={containerClasses}>
        {/* Logo */}
        <Link href="/" className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
          <Scale className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold">{t('appName')}</span>
        </Link>

        {/* Desktop Navigation */}
        <NavigationMenu className="hidden lg:flex">
          <NavigationMenuList>
            {mainNavItems.map((item) => (
              <NavigationMenuItem key={item.href}>
                {item.items ? (
                  <>
                    <NavigationMenuTrigger>{item.title}</NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                        {item.items.map((subItem) => (
                          <ListItem
                            key={subItem.title}
                            title={subItem.title}
                            href={subItem.href}
                            isRTL={isRTL}
                          >
                            {subItem.description}
                          </ListItem>
                        ))}
                      </ul>
                    </NavigationMenuContent>
                  </>
                ) : (
                  <Link href={item.href} legacyBehavior passHref>
                    <NavigationMenuLink
                      className={cn(
                        navigationMenuTriggerStyle(),
                        pathname === item.href && "bg-accent"
                      )}
                    >
                      {item.title}
                    </NavigationMenuLink>
                  </Link>
                )}
              </NavigationMenuItem>
            ))}
          </NavigationMenuList>
        </NavigationMenu>

        {/* Right side actions */}
        <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
          {/* Language Switcher */}
          <LanguageSwitcher variant="compact" className="hidden sm:inline-flex" />
          
          {/* Search */}
          <Button variant="ghost" size="icon" className="hidden md:inline-flex">
            <Search className="h-4 w-4" />
            <span className="sr-only">{t('buttons.search')}</span>
          </Button>

          {/* Notifications */}
          <Button variant="ghost" size="icon" className="hidden md:inline-flex">
            <Bell className="h-4 w-4" />
            <span className="sr-only">{t('notifications.title', { fallback: 'Notifications' })}</span>
          </Button>

          {/* Theme toggle */}
          <Button variant="ghost" size="icon" onClick={toggleTheme}>
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">{t('buttons.close', { fallback: 'Toggle theme' })}</span>
          </Button>

          {/* User menu */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="h-8 w-8 rounded-full"
                      />
                    ) : (
                      <span className="text-sm font-medium">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                className={cn("w-56", isRTL && "text-right")} 
                align={isRTL ? "start" : "end"} 
                forceMount
              >
                <DropdownMenuLabel className="font-normal">
                  <div className={cn("flex flex-col space-y-1", isRTL && "text-right")}>
                    <p className="text-sm font-medium leading-none">{user.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground capitalize">
                      {user.role}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <User className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} />
                  <span>{t('navigation.profile')}</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} />
                  <span>{t('navigation.settings')}</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <LogOut className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} />
                  <span>{t('navigation.logout')}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
              <Button asChild variant="ghost">
                <Link href="/login">{t('navigation.login')}</Link>
              </Button>
              <Button asChild>
                <Link href="/register">{t('navigation.register')}</Link>
              </Button>
            </div>
          )}

          {/* Mobile menu */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Menu className="h-6 w-6" />
                <span className="sr-only">{t('accessibility.menu')}</span>
              </Button>
            </SheetTrigger>
            <SheetContent side={isRTL ? "left" : "right"} className="w-80" dir={direction}>
              <SheetHeader>
                <SheetTitle>
                  <Link
                    href="/"
                    className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Scale className="h-6 w-6 text-primary" />
                    <span className="text-xl font-bold">{t('appName')}</span>
                  </Link>
                </SheetTitle>
              </SheetHeader>
              
              {/* Mobile Language Switcher */}
              <div className="mt-4 mb-6">
                <LanguageSwitcher variant="default" />
              </div>
              
              <nav className="flex flex-col gap-4 mt-8">
                {mainNavItems.map((item) => (
                  <div key={item.href} className="space-y-2">
                    <Link
                      href={item.href}
                      className={cn(
                        "block px-2 py-1 text-lg font-medium rounded-md transition-colors hover:bg-accent",
                        pathname === item.href && "bg-accent",
                        isRTL && "text-right"
                      )}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {item.title}
                    </Link>
                    {item.items && (
                      <div className={cn("space-y-1", isRTL ? "mr-4" : "ml-4")}>
                        {item.items.map((subItem) => (
                          <Link
                            key={subItem.href}
                            href={subItem.href}
                            className={cn(
                              "block px-2 py-1 text-sm text-muted-foreground hover:text-foreground rounded-md transition-colors hover:bg-accent",
                              isRTL && "text-right"
                            )}
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            {subItem.title}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

const ListItem = React.forwardRef<
  React.ElementRef<"a">,
  React.ComponentPropsWithoutRef<"a"> & { title: string; isRTL?: boolean }
>(({ className, title, children, isRTL, ...props }, ref) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <a
          ref={ref}
          className={cn(
            "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
            isRTL && "text-right",
            className
          )}
          {...props}
        >
          <div className="text-sm font-medium leading-none">{title}</div>
          <p className={cn(
            "line-clamp-2 text-sm leading-snug text-muted-foreground",
            isRTL && "text-right"
          )}>
            {children}
          </p>
        </a>
      </NavigationMenuLink>
    </li>
  );
});

ListItem.displayName = "ListItem";

export default Navigation;