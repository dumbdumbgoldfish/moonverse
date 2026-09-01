/**
 * Build the admin list URL after submitting the search bar.
 * Resets pagination whenever the search query is submitted or cleared.
 */
export function buildAdminSearchSubmitUrl(
  pathname: string,
  currentSearch: string,
  paramName: string,
  query: string
): string {
  const params = new URLSearchParams(currentSearch);
  const trimmed = query.trim();
  if (trimmed) {
    params.set(paramName, trimmed);
  } else {
    params.delete(paramName);
  }
  params.delete("page");
  const qs = params.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}
