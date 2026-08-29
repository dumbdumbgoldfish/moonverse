interface AskMoonieLayoutProps {
  children: React.ReactNode;
}

/** Fills the Ask Moonie route slot between navbar and site footer. */
export default function AskMoonieLayout({ children }: AskMoonieLayoutProps) {
  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      {children}
    </div>
  );
}
