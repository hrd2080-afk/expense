'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, List, BarChart2, Settings } from 'lucide-react';

const TABS = [
  { href: '/',             label: '홈',   Icon: Home      },
  { href: '/transactions', label: '내역', Icon: List      },
  { href: '/stats',        label: '통계', Icon: BarChart2  },
  { href: '/settings',     label: '설정', Icon: Settings  },
];

export default function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-white border-t border-gray-100 z-50 shadow-[0_-1px_8px_rgba(0,0,0,0.06)]">
      <div className="grid grid-cols-4">
        {TABS.map(({ href, label, Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center py-2.5 gap-0.5 text-xs font-medium transition-colors ${
                active ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Icon size={22} strokeWidth={active ? 2.2 : 1.8} />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
