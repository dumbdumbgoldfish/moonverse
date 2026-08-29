interface MoonieLayoutProps {
  children: React.ReactNode;
}

/** Fills the Moonie route slot between navbar and site footer. */
export default function MoonieLayout({ children }: MoonieLayoutProps) {
  return (
    <div className="flex h-full min-h-0 max-h-full flex-1 basis-0 flex-col overflow-hidden">
      {children}
    </div>
  );
}
