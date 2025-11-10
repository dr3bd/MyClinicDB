import type { ReactNode } from 'react';
import { clsx } from 'clsx';
import './styles.css';

export interface NavItem {
  id: string;
  label: string;
  icon?: ReactNode;
  active?: boolean;
  onClick?: () => void;
}

export interface AppShellProps {
  brand: ReactNode;
  sidebarItems: NavItem[];
  topbarContent?: ReactNode;
  children: ReactNode;
  collapsed?: boolean;
  onToggleSidebar?: () => void;
  locale?: 'ar' | 'en';
}

export function AppShell({
  brand,
  sidebarItems,
  topbarContent,
  children,
  collapsed = false,
  onToggleSidebar,
  locale = 'ar'
}: AppShellProps) {
  const dir = locale === 'ar' ? 'rtl' : 'ltr';
  return (
    <div className={clsx('mc-app-shell', collapsed && 'mc-app-shell--collapsed')} dir={dir} data-locale={locale}>
      <aside className="mc-app-shell__sidebar">
        <div className="mc-app-shell__brand">{brand}</div>
        <nav className="mc-app-shell__nav">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={clsx('mc-app-shell__nav-item', item.active && 'is-active')}
              onClick={item.onClick}
            >
              <span className="mc-app-shell__nav-icon">{item.icon}</span>
              <span className="mc-app-shell__nav-label">{item.label}</span>
            </button>
          ))}
        </nav>
        <button type="button" className="mc-app-shell__toggle" onClick={onToggleSidebar}>
          ☰
        </button>
      </aside>
      <div className="mc-app-shell__main">
        <header className="mc-app-shell__topbar">{topbarContent}</header>
        <main className="mc-app-shell__content">{children}</main>
      </div>
    </div>
  );
}
