import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '../context/auth-context';
import { CartProvider } from '../context/cart-context';
import { WishlistProvider } from '../context/wishlist-context';
import { CompareProvider } from '../context/compare-context';

export const metadata: Metadata = {
  title: 'MarketHub – Multi-Vendor E-Commerce Marketplace',
  description: 'Scalable modern multi-vendor marketplace connecting customers, independent sellers, and delivery partners.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col font-sans antialiased text-slate-900 bg-slate-50/50">
        <AuthProvider>
          <CartProvider>
            <WishlistProvider>
              <CompareProvider>
                {children}
              </CompareProvider>
            </WishlistProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
