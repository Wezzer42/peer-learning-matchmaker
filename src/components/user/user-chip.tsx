"use client";

import Image from "next/image";
import Link from "next/link";

type Props = {
  user: { name?: string | null; image?: string | null };
  className?: string;
};

export default function UserChip({ user, className }: Props) {
  const name = user.name ?? "Profile";
  const img  = user.image ?? "/avatar-placeholder.png"; // добавь плейсхолдер в public/ при желании
  return (
    <Link href="/profile" className={`flex items-center gap-2 rounded-full px-2 py-1 hover:bg-gray-100 ${className ?? ""}`}>
      <Image
        src={img}
        alt={name}
        width={28}
        height={28}
        className="rounded-full"
        unoptimized={img.startsWith("http")} // можно убрать, если настроен next/image для домена
      />
      <span className="text-sm">{name}</span>
    </Link>
  );
}
