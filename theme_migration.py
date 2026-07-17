from pathlib import Path
import re

ROOT = Path(__file__).resolve().parent
APP = ROOT / "app"
COMPONENTS = ROOT / "components"
COMPONENT_DIRS = (
    "restaurant", "cuisines", "offers", "cart", "checkout", "orders",
    "tracking", "profile", "settings", "favorites", "rewards",
    "notifications", "addresses", "payments", "about", "contact", "support",
)
EXTENSIONS = {".ts", ".tsx", ".css"}

files = [
    path for path in APP.rglob("*")
    if path.is_file()
    and path.suffix in EXTENSIONS
    and path not in {APP / "page.tsx", APP / "layout.tsx", APP / "globals.css"}
    and (APP / "partner") not in path.parents
]
for directory in COMPONENT_DIRS:
    files.extend(
        path for path in (COMPONENTS / directory).rglob("*")
        if path.is_file()
        and path.suffix in EXTENSIONS
        and not (directory == "cart" and path.name == "CartDrawer.tsx")
    )

literal_replacements = {
    "#0B0B0B": "#FFFFFF",
    "#0b0b0b": "#FFFFFF",
    "#050505": "#FFFFFF",
    "#080808": "#FFFFFF",
    "#0A0A0A": "#FFFFFF",
    "#0a0a0a": "#FFFFFF",
    "#101010": "#F8FAFC",
    "#111111": "#F8FAFC",
    "#121212": "#F8FAFC",
    "#141414": "#F8FAFC",
    "#151515": "#F8FAFC",
    "#161616": "#F8FAFC",
    "#171717": "#F8FAFC",
    "#181818": "#F8FAFC",
    "#1A1A1A": "#F8FAFC",
    "#1a1a1a": "#F8FAFC",
    "#1C1C1C": "#F8FAFC",
    "#1c1c1c": "#F8FAFC",
    "#1E1E1E": "#F8FAFC",
    "#1e1e1e": "#F8FAFC",
    "#202020": "#F8FAFC",
    "#222222": "#F8FAFC",
    "#242424": "#F8FAFC",
    "#252525": "#F8FAFC",
    "#262626": "#F8FAFC",
    "#2A2A2A": "#F8FAFC",
    "#2a2a2a": "#F8FAFC",
    "#2D2D2D": "#E5E7EB",
    "#2d2d2d": "#E5E7EB",
    "#333333": "#E5E7EB",
    "#3A3A3A": "#E5E7EB",
    "#3a3a3a": "#E5E7EB",
    "#404040": "#E5E7EB",
    "#FF2D3B": "#FC8019",
    "#ff2d3b": "#FC8019",
    "#FF3040": "#FC8019",
    "#ff3040": "#FC8019",
    "#E02633": "#E66F0E",
    "#e02633": "#E66F0E",
    "#D91F2B": "#E66F0E",
    "#d91f2b": "#E66F0E",
    "#A1A1A1": "#6B7280",
    "#a1a1a1": "#6B7280",
    "#A3A3A3": "#6B7280",
    "#a3a3a3": "#6B7280",
    "#737373": "#6B7280",
    "#525252": "#6B7280",
}

token_replacements = {
    "bg-white/5": "bg-[#F8FAFC]",
    "bg-white/10": "bg-[#F8FAFC]",
    "bg-white/15": "bg-[#F8FAFC]",
    "bg-white/20": "bg-[#E5E7EB]",
    "hover:bg-white/5": "hover:bg-[#F8FAFC]",
    "hover:bg-white/10": "hover:bg-[#E5E7EB]",
    "hover:bg-white/15": "hover:bg-[#E5E7EB]",
    "hover:bg-white/20": "hover:bg-[#E5E7EB]",
    "border-white/5": "border-[#E5E7EB]",
    "border-white/10": "border-[#E5E7EB]",
    "border-white/15": "border-[#E5E7EB]",
    "border-white/20": "border-[#E5E7EB]",
    "border-white/30": "border-[#E5E7EB]",
    "divide-white/5": "divide-[#E5E7EB]",
    "divide-white/10": "divide-[#E5E7EB]",
    "ring-white/10": "ring-[#E5E7EB]",
    "ring-white/20": "ring-[#E5E7EB]",
    "bg-neutral-950": "bg-white",
    "bg-neutral-900": "bg-[#F8FAFC]",
    "bg-neutral-800": "bg-[#F8FAFC]",
    "bg-zinc-950": "bg-white",
    "bg-zinc-900": "bg-[#F8FAFC]",
    "bg-zinc-800": "bg-[#F8FAFC]",
    "bg-gray-950": "bg-white",
    "bg-gray-900": "bg-[#F8FAFC]",
    "bg-gray-800": "bg-[#F8FAFC]",
    "bg-slate-950": "bg-white",
    "bg-slate-900": "bg-[#F8FAFC]",
    "bg-slate-800": "bg-[#F8FAFC]",
    "text-gray-100": "text-[#111827]",
    "text-gray-200": "text-[#111827]",
    "text-gray-300": "text-[#6B7280]",
    "text-gray-400": "text-[#6B7280]",
    "text-gray-500": "text-[#9CA3AF]",
    "text-gray-600": "text-[#9CA3AF]",
    "text-neutral-100": "text-[#111827]",
    "text-neutral-200": "text-[#111827]",
    "text-neutral-300": "text-[#6B7280]",
    "text-neutral-400": "text-[#6B7280]",
    "text-neutral-500": "text-[#9CA3AF]",
    "text-zinc-100": "text-[#111827]",
    "text-zinc-200": "text-[#111827]",
    "text-zinc-300": "text-[#6B7280]",
    "text-zinc-400": "text-[#6B7280]",
    "text-zinc-500": "text-[#9CA3AF]",
    "placeholder-gray-400": "placeholder-[#9CA3AF]",
    "placeholder-gray-500": "placeholder-[#9CA3AF]",
    "placeholder:text-gray-400": "placeholder:text-[#9CA3AF]",
    "placeholder:text-gray-500": "placeholder:text-[#9CA3AF]",
    "text-black": "text-[#111827]",
    "border-gray-700": "border-[#E5E7EB]",
    "border-gray-800": "border-[#E5E7EB]",
    "border-neutral-700": "border-[#E5E7EB]",
    "border-neutral-800": "border-[#E5E7EB]",
    "border-zinc-700": "border-[#E5E7EB]",
    "border-zinc-800": "border-[#E5E7EB]",
}

primary_patterns = (
    ("primary", "[#FC8019]"),
    ("orange-400", "[#FC8019]"),
    ("orange-500", "[#FC8019]"),
    ("orange-600", "[#E66F0E]"),
)

changed = []
for path in sorted(set(files)):
    original = path.read_text(encoding="utf-8")
    text = original
    for old, new in literal_replacements.items():
        text = text.replace(old, new)
    for old, new in token_replacements.items():
        text = text.replace(old, new)
    for old, new in primary_patterns:
        text = re.sub(
            rf"(?P<prefix>(?:[a-z-]+:)*(?:bg|text|border|ring|outline|decoration|from|via|to))-"
            rf"{re.escape(old)}(?P<opacity>/\d+)?",
            lambda match: f"{match.group('prefix')}-{new}{match.group('opacity') or ''}",
            text,
        )
    text = text.replace("bg-[var(--color-primary)]", "bg-[#FC8019]")
    text = text.replace("text-[var(--color-primary)]", "text-[#FC8019]")
    text = text.replace("border-[var(--color-primary)]", "border-[#FC8019]")
    text = text.replace("rgba(255,45,59", "rgba(252,128,25")
    text = text.replace("rgba(255, 45, 59", "rgba(252, 128, 25")

    migrated_lines = []
    for line in text.splitlines(keepends=True):
        preserve_white = (
            "selection:text-white" in line
            or "from-black" in line
            or "via-black" in line
            or "bg-black" in line
            or "bg-[#FC8019]" in line
            or "bg-[#E66F0E]" in line
            or re.search(r"bg-(?:red|green|blue|purple|rose|emerald)-", line)
        )
        if not preserve_white:
            line = re.sub(r"(?<!selection:)text-white(?!/)", "text-[#111827]", line)
        migrated_lines.append(line)
    text = "".join(migrated_lines)

    if text != original:
        path.write_text(text, encoding="utf-8")
        changed.append(path.relative_to(ROOT).as_posix())

(ROOT / "theme_migration_report.txt").write_text(
    "\n".join(changed) + ("\n" if changed else ""),
    encoding="utf-8",
)
print(f"Changed {len(changed)} files")
