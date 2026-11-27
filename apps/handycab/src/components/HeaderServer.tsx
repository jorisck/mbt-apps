import { getAuthenticatedProfile } from "../lib/auth-session";
import { Header } from "./Header";

/**
 * Wrapper serveur du Header — lit la session et transmet le prénom.
 * Utilisé dans le layout racine à la place de <Header />.
 */
export async function HeaderServer() {
  const profile = await getAuthenticatedProfile();
  return <Header firstName={profile?.first_name} />;
}
