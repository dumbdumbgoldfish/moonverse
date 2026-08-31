type ClientSignOut = (options: {
  redirect: false;
  redirectTo: string;
}) => Promise<unknown>;

type ReloadNavigation = (destination: string) => void;

export async function signOutAndReload(
  signOutAction: ClientSignOut,
  destination: string,
  navigate: ReloadNavigation = (nextDestination) => {
    window.location.assign(nextDestination);
  }
): Promise<void> {
  await signOutAction({ redirect: false, redirectTo: destination });
  navigate(destination);
}
