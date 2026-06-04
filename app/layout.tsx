import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SmartBidHub | Inteligência em Facilities & Serviços",
  description: "Plataforma de engenharia de custos e gestão comercial da Silva Consultoria Empresarial LTDA.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            try {
              var cookie = document.cookie.split('; ').find(function(row) {
                return row.startsWith('sb_user=');
              });
              var color = '#1B4D3E';
              var logoUrl = '';
              if (cookie) {
                var parsed = JSON.parse(decodeURIComponent(cookie.split('=')[1]));
                if (parsed.primaryColor) {
                  color = parsed.primaryColor;
                }
                if (parsed.tenantLogoUrl) {
                  logoUrl = parsed.tenantLogoUrl;
                }
              }
              
              if (window.location.pathname.indexOf('/proposta/ver/') !== -1) {
                return;
              }
              
              if (window.location.pathname.indexOf('/admin/empresas') !== -1) {
                color = '#1B4D3E';
                logoUrl = '';
              }
              
              var c = color.replace('#', '').trim();
              if (c.length === 3) {
                c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
              }
              if (c.length !== 6) {
                c = '1B4D3E';
              }
              var r = parseInt(c.substring(0, 2), 16);
              var g = parseInt(c.substring(2, 4), 16);
              var b = parseInt(c.substring(4, 6), 16);
              
              var darken = function(val, amt) { return Math.max(0, val - amt); };
              var rHover = darken(r, 20);
              var gHover = darken(g, 20);
              var bHover = darken(b, 20);
              var hexHover = '#' + ((1 << 24) + (rHover << 16) + (gHover << 8) + bHover).toString(16).slice(1);
              
              var hexLight = 'rgba(' + r + ', ' + g + ', ' + b + ', 0.08)';
              
              var rDark = darken(r, 45);
              var gDark = darken(g, 45);
              var bDark = darken(b, 45);
              var hexDark = '#' + ((1 << 24) + (rDark << 16) + (gDark << 8) + bDark).toString(16).slice(1);
              
              var style = document.getElementById('dynamic-theme-style');
              if (!style) {
                style = document.createElement('style');
                style.id = 'dynamic-theme-style';
                document.head.appendChild(style);
              }
              style.innerHTML = [
                ':root {',
                '  --primary-color: #' + c + ';',
                '  --primary-color-rgb: ' + r + ', ' + g + ', ' + b + ';',
                '  --primary-color-hover: ' + hexHover + ';',
                '  --primary-color-light: ' + hexLight + ';',
                '  --primary-color-dark: ' + hexDark + ';',
                '}',
                '.bg-\\\\[\\\\#1B4D3E\\\\] , .bg-\\\\[\\\\#1b4d3e\\\\] { background-color: var(--primary-color) !important; }',
                '.hover\\\\:bg-\\\\[\\\\#13382D\\\\]:hover, .hover\\\\:bg-\\\\[\\\\#13382d\\\\]:hover, .hover\\\\:bg-\\\\[\\\\#143d31\\\\]:hover { background-color: var(--primary-color-hover) !important; }',
                '.text-\\\\[\\\\#1B4D3E\\\\], .text-\\\\[\\\\#1b4d3e\\\\] { color: var(--primary-color) !important; }',
                '.border-\\\\[\\\\#1B4D3E\\\\], .border-\\\\[\\\\#1b4d3e\\\\] { border-color: var(--primary-color) !important; }',
                '.focus\\\\:border-\\\\[\\\\#1B4D3E\\\\]:focus, .focus\\\\:border-\\\\[\\\\#1b4d3e\\\\]:focus { border-color: var(--primary-color) !important; }',
                '.focus\\\\:ring-\\\\[\\\\#1B4D3E\\\\]:focus, .focus\\\\:ring-\\\\[\\\\#1b4d3e\\\\]:focus { --tw-ring-color: var(--primary-color) !important; }',
                '.hover\\\\:text-\\\\[\\\\#1B4D3E\\\\]:hover, .hover\\\\:text-\\\\[\\\\#1b4d3e\\\\]:hover { color: var(--primary-color) !important; }',
                '.hover\\\\:bg-\\\\[\\\\#1B4D3E\\\\]:hover, .hover\\\\:bg-\\\\[\\\\#1b4d3e\\\\]:hover { background-color: var(--primary-color) !important; }',
                '.group:hover .group-hover\\\\:bg-\\\\[\\\\#1B4D3E\\\\], .group:hover .group-hover\\\\:bg-\\\\[\\\\#1b4d3e\\\\] { background-color: var(--primary-color) !important; }',
                '.group:hover .group-hover\\\\:text-\\\\[\\\\#1B4D3E\\\\], .group:hover .group-hover\\\\:text-\\\\[\\\\#1b4d3e\\\\] { color: var(--primary-color) !important; }',
                '.hover\\\\:border-\\\\[\\\\#1B4D3E\\\\]:hover, .hover\\\\:border-\\\\[\\\\#1b4d3e\\\\]:hover { border-color: var(--primary-color) !important; }',
                '.from-\\\\[\\\\#1B4D3E\\\\], .from-\\\\[\\\\#1b4d3e\\\\] { --tw-gradient-from: var(--primary-color) !important; --tw-gradient-to: var(--primary-color-hover) !important; --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to) !important; }',
                '.via-\\\\[\\\\#2A6D5A\\\\], .via-\\\\[\\\\#2a6d5a\\\\] { --tw-gradient-to: var(--primary-color-hover) !important; --tw-gradient-stops: var(--tw-gradient-from), var(--primary-color-hover), var(--tw-gradient-to) !important; }',
                '.to-\\\\[\\\\#1B4D3E\\\\], .to-\\\\[\\\\#1b4d3e\\\\] { --tw-gradient-to: var(--primary-color) !important; }',
                '.to-\\\\[\\\\#12362b\\\\], .to-\\\\[\\\\#12362B\\\\] { --tw-gradient-to: var(--primary-color-dark) !important; }',
                '.bg-\\\\[\\\\#0B2E24\\\\], .bg-\\\\[\\\\#0b2e24\\\\] { background-color: var(--primary-color-hover) !important; }',
                '.bg-\\\\[\\\\#3b8026\\\\], .bg-\\\\[\\\\#3B8026\\\\] { background-color: var(--primary-color-hover) !important; }',
                '.border-\\\\[\\\\#2d631d\\\\], .border-\\\\[\\\\#2D631D\\\\] { border-color: var(--primary-color-dark) !important; }',
                '.bg-\\\\[\\\\#599e41\\\\], .bg-\\\\[\\\\#599E41\\\\] { background-color: var(--primary-color) !important; }',
                '.border-\\\\[\\\\#488234\\\\], .border-\\\\[\\\\#488234\\\\] { border-color: var(--primary-color-hover) !important; }',
                '.bg-\\\\[\\\\#8ec277\\\\], .bg-\\\\[\\\\#8EC277\\\\] { background-color: rgba(' + r + ',' + g + ',' + b + ', 0.25) !important; }',
                
                /* Standard Emerald Text Overrides to guarantee white readability on dark bg headers */
                '.text-emerald-100 { color: rgba(255, 255, 255, 0.95) !important; }',
                '.text-emerald-200 { color: rgba(255, 255, 255, 0.9) !important; }',
                '.text-emerald-250 { color: rgba(255, 255, 255, 0.9) !important; }',
                '.text-emerald-300 { color: rgba(255, 255, 255, 0.85) !important; }',
                '.text-emerald-400 { color: var(--primary-color) !important; }',
                '.text-emerald-500 { color: var(--primary-color) !important; }',
                '.text-emerald-600 { color: var(--primary-color-hover) !important; }',
                '.text-emerald-700 { color: var(--primary-color-hover) !important; }',
                '.text-emerald-750 { color: var(--primary-color-hover) !important; }',
                '.text-emerald-800 { color: var(--primary-color-dark) !important; }',
                '.text-emerald-900 { color: var(--primary-color-dark) !important; }',
                '.bg-emerald-50 { background-color: var(--primary-color-light) !important; }',
                '.bg-emerald-100 { background-color: var(--primary-color-light) !important; }',
                '.bg-emerald-200 { background-color: var(--primary-color-light) !important; }',
                '.bg-emerald-400 { background-color: var(--primary-color) !important; }',
                '.bg-emerald-500 { background-color: var(--primary-color) !important; }',
                '.bg-emerald-600 { background-color: var(--primary-color-hover) !important; }',
                '.bg-emerald-800 { background-color: var(--primary-color-dark) !important; }',
                '.bg-emerald-900 { background-color: var(--primary-color-dark) !important; }',
                '.bg-emerald-950 { background-color: var(--primary-color-dark) !important; }',
                '.border-emerald-100 { border-color: var(--primary-color-light) !important; }',
                '.border-emerald-200 { border-color: var(--primary-color-light) !important; }',
                '.border-emerald-300 { border-color: var(--primary-color-light) !important; }',
                '.border-emerald-400 { border-color: var(--primary-color) !important; }',
                '.border-emerald-500 { border-color: var(--primary-color) !important; }',
                '.border-emerald-600 { border-color: var(--primary-color-hover) !important; }',
                
                /* Specific banner contrast styling overrides */
                '[class*="fixed top-0"][class*="bg-gradient-to-r"] { color: #ffffff !important; }',
                '[class*="fixed top-0"][class*="bg-gradient-to-r"] span, [class*="fixed top-0"][class*="bg-gradient-to-r"] p, [class*="fixed top-0"][class*="bg-gradient-to-r"] div, [class*="fixed top-0"][class*="bg-gradient-to-r"] svg { color: #ffffff !important; }',
                '[class*="fixed top-0"][class*="bg-gradient-to-r"] span.font-mono { color: #ffffff !important; background-color: rgba(0, 0, 0, 0.25) !important; }',
                logoUrl ? '.sidebar-tenant-logo { display: flex !important; }' : '.sidebar-tenant-logo { display: none !important; }',
                logoUrl ? '.sidebar-default-logo { display: none !important; }' : '.sidebar-default-logo { display: block !important; }'
              ].join('\\n');
            } catch(e) {}
          })();
        ` }} />
      </head>
      <body className="min-h-full bg-[#F8FAFC]">{children}</body>
    </html>
  );
}
