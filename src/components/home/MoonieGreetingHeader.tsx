interface MoonieGreetingHeaderProps {
  displayName?: string;
}

function greetingForHour(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function MoonieGreetingHeader({ displayName }: MoonieGreetingHeaderProps) {
  return (
    <header className="px-4 pt-4 pb-2">
      <p className="text-sm text-muted-foreground">{greetingForHour()}</p>
      <h1 className="text-2xl font-bold tracking-tight">
        {displayName ? `Hi, ${displayName.split(" ")[0]}` : "Discover with Moonie"}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Moonie helps you discover your next favorite novel.
      </p>
    </header>
  );
}
