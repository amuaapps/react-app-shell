import * as React from 'react';

export const TopNavigation = React.forwardRef<
  HTMLElement,
  { logo?: React.ReactNode }
>(({ logo, ...props }, ref) => (
  <nav ref={ref} {...props}>
    {logo}
  </nav>
));

TopNavigation.displayName = 'TopNavigation';

export const Footer = React.forwardRef<
  HTMLElement,
  {
    logo?: React.ReactNode;
    copyrightText?: string;
    links?: Array<{ label: string; href: string }>;
  }
>(({ copyrightText, links, ...props }, ref) => (
  <footer ref={ref} {...props}>
    {copyrightText && <p>{copyrightText}</p>}
    {links && (
      <ul>
        {links.map((link) => (
          <li key={link.href}>
            <a href={link.href}>{link.label}</a>
          </li>
        ))}
      </ul>
    )}
  </footer>
));

Footer.displayName = 'Footer';
