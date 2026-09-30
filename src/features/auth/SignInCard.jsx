import { useLocation } from 'react-router';
import { Button, Card } from '../../components/ui/index.js';
import { useSession } from '../../state/hooks.js';
import styles from './SignInCard.module.css';

/** US-01 — login_light.png. Google is the only sign-in method; the reference shows no icon. */
export function SignInCard() {
  const signIn = useSession((s) => s.signIn);
  const pending = useSession((s) => s.req.status === 'loading');
  const location = useLocation();

  const onContinue = () => {
    if (pending) return;
    signIn({ returnTo: location.state?.from?.pathname });
  };

  return (
    <Card as="section" elevated className={styles.card} aria-labelledby="sign-in-title">
      <h1 id="sign-in-title" className={styles.title}>Sign in</h1>
      <p className={styles.subtitle}>Team action items, all in one place.</p>
      <Button fullWidth className={styles.button} onClick={onContinue}>Continue with Google</Button>
    </Card>
  );
}
