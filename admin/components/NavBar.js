import Link from 'next/link';
import { memo } from 'react';

const navItems = [
  { href: '/', label: 'Tổng quan' },
  { href: '/categories', label: 'Danh mục' },
  { href: '/products', label: 'Sản phẩm' },
  { href: '/users', label: 'Người dùng' },
  { href: '/events', label: 'Sự kiện' },
  { href: '/inventory', label: 'Kho hàng' },
  { href: '/broadcast', label: 'Thông báo' },
  { href: '/orders', label: 'Đơn hàng' },
  { href: '/deposits', label: 'Nạp tiền' }
];

function NavBar({ active }) {
  return (
    <nav className="nav">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={active === item.href ? 'active' : undefined}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

export default memo(NavBar);
