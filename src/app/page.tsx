import styles from './page.module.css';
import Image from 'next/image';
import Link from 'next/link';
import { GeoAlt, Star, Heart } from 'react-bootstrap-icons';

const Home = () => (
  <main id="landing-page">
    <section className={styles.hero}>
      <div className={styles.content}>
        <h1>Manoa Bathroom Finder</h1>
        <p>Find a bathroom on campus with confidence.</p>
        <Link className={styles.signIn} href="/auth/signin">Sign in</Link>
      </div>
    </section>

    <section className={styles.overview}>
      <div className={`${styles.content} ${styles.introduction}`}>
        <div>
          <h2>Know before you go</h2>
          <p>Manoa Bathroom Finder is a planned campus bathroom finder for the UH Mānoa community. It brings restroom locations and community insights together to help you find a stop that fits your needs.</p>
        </div>
        <figure className={styles.photo}>
          <Image src="/manoa-campus.jpg" alt="View of the UH Mānoa campus from Round Top Drive" width={3264} height={2448} sizes="(max-width: 700px) 100vw, 45vw" />
          <figcaption>
            Photo by <a href="https://commons.wikimedia.org/wiki/File:UniversityHawaiiManoaCampusRoundtop.jpg">Travis.Thurston</a>, <a href="https://creativecommons.org/licenses/by-sa/3.0/">CC BY-SA 3.0</a>.
          </figcaption>
        </figure>
      </div>
    </section>

    <section className={styles.community}>
      <div className={styles.content}>
        <h2>What you can look forward to</h2>
        <p>Designed for students, faculty, staff, and visitors navigating campus.</p>
        <div className={styles.cards}>
          <article className={styles.card}>
            <GeoAlt aria-hidden="true" size={28} />
            <h3>Find a bathroom</h3>
            <p>Search, filter, and explore campus restrooms on a map.</p>
          </article>
          <article className={styles.card}>
            <Star aria-hidden="true" size={28} />
            <h3>Check ratings</h3>
            <p>See community ratings for cleanliness and odor, plus recent reports.</p>
          </article>
          <article className={styles.card}>
            <Heart aria-hidden="true" size={28} />
            <h3>Save favorites</h3>
            <p>Keep track of your preferred restrooms for your next visit.</p>
          </article>
        </div>
      </div>
    </section>
  </main>
);

export default Home;
