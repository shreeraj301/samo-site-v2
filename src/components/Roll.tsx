/** A label that slots up one row on hover and focus. The second copy is a text-shadow, so the
 *  label exists once in the DOM and is read once. */
export function Roll({ children }: { children: string }) {
  return (
    <span className="roll">
      <span>{children}</span>
    </span>
  );
}
