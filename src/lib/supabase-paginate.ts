// Paginate a Supabase query past the PostgREST server-side row cap (typically 1000).
// Pass a factory that returns a fresh query builder each call; we apply .range()
// per page and concatenate until a short page (or maxRows) is reached.

type PageResult<T> = { data: T[] | null; error: unknown };
type QueryLike<T> = PromiseLike<PageResult<T>> & {
  range: (from: number, to: number) => QueryLike<T>;
};

export async function fetchAllRows<T>(
  buildQuery: () => QueryLike<T>,
  opts: { pageSize?: number; maxRows?: number } = {},
): Promise<T[]> {
  const pageSize = opts.pageSize ?? 1000;
  const maxRows = opts.maxRows ?? 50000;
  const all: T[] = [];
  let offset = 0;
  while (offset < maxRows) {
    const to = Math.min(offset + pageSize, maxRows) - 1;
    const { data, error } = await buildQuery().range(offset, to);
    if (error) throw error;
    const rows = data ?? [];
    all.push(...rows);
    if (rows.length < pageSize) break;
    offset += pageSize;
  }
  return all;
}
