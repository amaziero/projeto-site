import Link from "next/link";

export default function Header() {
  return (
    <header className="w-full py-6 border-b border-[var(--secondary)] bg-[var(--background)] shadow-sm">
      <div className="max-w-3xl mx-auto flex justify-center items-center px-4">
        <h1 className="text-3xl font-serif tracking-wide text-[var(--primary)]">
          TuttiTool
        </h1>
        {/* <nav className="space-x-6 text-[var(--foreground)] text-sm">
          <Link
            href="/upload"
            className="hover:text-[var(--primary)] transition-colors"
          >
            Unir PDFs
          </Link>
          <Link
            href="/sobre"
            className="hover:text-[var(--primary)] transition-colors"
          >
            Sobre
          </Link>
        </nav> */}
      </div>
    </header>
  );
}
