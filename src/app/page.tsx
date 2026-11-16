import styles from './page.module.css';

const Home = () => (
  <main id="landing-page">
    <section className={styles.hero}>
      <div className={styles.content}>
        <h1>Manoa Bathroom Finder</h1>
        <p>Find a bathroom on campus with confidence.</p>
      </div>
    </section>

    <section className={styles.overview}>
      <div className={styles.content}>
        <h2>Find the right bathroom</h2>
        <p>Explore campus restrooms and find the facilities that meet your needs.</p>
      </div>
    </section>

    <section className={styles.community}>
      <div className={styles.content}>
        <h2>Made for the Manoa community</h2>
        <p>Helping students, faculty, and visitors navigate campus.</p>
      </div>
    </section>
  </main>
);

export default Home;
