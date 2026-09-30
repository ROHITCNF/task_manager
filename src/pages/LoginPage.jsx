import { SignInCard } from '../features/auth/SignInCard.jsx';
import styles from './LoginPage.module.css';

/** /login — login_light.png: a single card centred in the viewport, no app shell. */
export default function LoginPage() {
  return (
    <main className={styles.page}>
      <SignInCard />
    </main>
  );
}
