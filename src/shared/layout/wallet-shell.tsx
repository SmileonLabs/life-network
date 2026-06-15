import { type ReactNode } from 'react';

import { AppShell } from '@/shared/layout/app-shell';

type WalletShellProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  aside?: ReactNode;
  headerSlot?: ReactNode;
};

export function WalletShell({ aside, children, headerSlot, subtitle, title }: WalletShellProps) {
  return (
    <AppShell accessorySlot={aside} headerSlot={headerSlot} subtitle={subtitle} title={title}>
      {children}
    </AppShell>
  );
}
