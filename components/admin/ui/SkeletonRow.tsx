import { Skeleton } from "@/components/admin/dashboard/Skeleton";

/**
 * Table-row skeleton shared by admin list tables (orders, restaurants,
 * customers, support...). Renders `columns` cells inside one <tr>, so it
 * drops straight into an existing <tbody> without changing table structure.
 */
export default function SkeletonRow({ columns }: { columns: number }) {
  return (
    <tr className="border-b border-border">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="p-4">
          <Skeleton className="h-4 w-full max-w-[120px]" />
        </td>
      ))}
    </tr>
  );
}

export function SkeletonRows({ rows, columns }: { rows: number; columns: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonRow key={i} columns={columns} />
      ))}
    </>
  );
}
