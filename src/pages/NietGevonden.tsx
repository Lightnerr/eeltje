import { href } from '../hooks/useRoute';

export default function NietGevonden() {
  return (
    <>
      <h1>Pagina niet gevonden</h1>
      <p>
        <a href={href('vandaag')}>Terug naar Vandaag</a>
      </p>
    </>
  );
}
