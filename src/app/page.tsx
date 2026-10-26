'use client'

import { useRef } from 'react'
import Link from 'next/link'
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from 'framer-motion'
import {
  ArrowRight,
  BarChart3,
  Check,
  Star,
  Utensils,
  Zap,
} from 'lucide-react'
import styles from './landing.module.css'
import { BrandLogo } from '@/components/BrandLogo'
import { LandingPreview, LandingFAQ } from '@/components/LandingPreview'

const features = [
  {
    icon: Zap,
    title: 'Smart Workout Plans',
    description:
      'Start with workout routines for your goals and experience. See your next session before you walk in.',
  },
  {
    icon: Utensils,
    title: 'Nutrition, Organized',
    description:
      'Keep your meal plan, ingredients, daily targets, and completed meals together in one place.',
  },
  {
    icon: BarChart3,
    title: 'Progress Analytics',
    description:
      'Track your progress with detailed analytics, insights, and visual charts.',
  },
]

const steps = [
  { number: '01', title: 'Tell us about you', copy: 'Your goals, experience, and preferred training days give your routine a starting point.' },
  { number: '02', title: 'Find your rhythm', copy: 'Explore your starter workout and meal plans. Find your next session and make it happen.' },
  { number: '03', title: 'Build the habit', copy: 'Check off workouts and meals, log your weight, and keep your goals in view.' },
]

const stats = [['Train', 'With intention'], ['Eat', 'With a plan'], ['Track', 'The little wins'], ['Repeat', 'At your pace']]

const reveal = {
  hidden: { opacity: 0, y: 34 },
  visible: { opacity: 1, y: 0 },
}

export default function LandingPage() {
  const heroRef = useRef<HTMLElement>(null)
  const reduceMotion = useReducedMotion()
  const { scrollYProgress } = useScroll()
  const { scrollYProgress: heroProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  })

  const heroY = useTransform(heroProgress, [0, 1], [0, reduceMotion ? 0 : 120])
  const heroScale = useTransform(heroProgress, [0, 1], [1, reduceMotion ? 1 : 0.92])
  const heroOpacity = useTransform(heroProgress, [0, 0.8], [1, 0.15])

  return (
    <main className={styles.site}>
      <motion.div className={styles.scrollProgress} style={{ scaleX: scrollYProgress }} />

      <header className={styles.header}>
        <Link className={styles.brand} href="/" aria-label="BeanBuilt AI home">
          <BrandLogo />
        </Link>

        <nav className={styles.nav} aria-label="Main navigation">
          <a href="#features">Features</a>
          <a href="#inside">Inside the app</a>
          <a href="#pricing">Pricing</a>
        </nav>

        <Link className={styles.navCta} href="/auth/signin">
          get started
        </Link>
      </header>

      <section ref={heroRef} className={styles.hero} aria-labelledby="hero-heading">
        <motion.div
          className={styles.heroAtmosphere}
          style={{ x: '-50%', y: heroY, scale: heroScale, opacity: heroOpacity }}
          aria-hidden="true"
        >
          <span className={styles.orbitOuter} />
          <span className={styles.orbitInner} />
          <span className={styles.glowTop} />
          <span className={styles.glowBottom} />
        </motion.div>

        <motion.p
          className={`${styles.heroWord} ${styles.heroWordLeft}`}
          aria-hidden="true"
          initial={false}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          train
        </motion.p>
        <motion.p
          className={`${styles.heroWord} ${styles.heroWordRight}`}
          aria-hidden="true"
          initial={false}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.08 }}
        >
          smarter
        </motion.p>

        <motion.div
          className={styles.heroContent}
          style={{ x: '-50%', y: heroY, scale: heroScale, opacity: heroOpacity }}
        >
          <motion.h1
            id="hero-heading"
            className={styles.heroTitle}
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, ease: 'easeOut', delay: 0.12 }}
          >
            <span>beanbuilt ai</span>
            <strong>built around you.</strong>
          </motion.h1>
          <motion.p
            className={styles.heroCopy}
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.28 }}
          >
            Your personal fitness and nutrition co-pilot. Workouts, meal plans,
            and progress tracking, built around you.
          </motion.p>
          <motion.div
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.4 }}
          >
            <Link className={styles.primaryCta} href="/auth/signin">
              start my fitness journey <ArrowRight aria-hidden="true" />
            </Link>
          </motion.div>
        </motion.div>

        <motion.div
          className={`${styles.floatingStat} ${styles.floatingStatRight}`}
          initial={false}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.5 }}
        >
          <span className={styles.statLine} />
          <strong>Your goals.</strong>
          <small>one clear plan</small>
        </motion.div>
        <motion.div
          className={`${styles.floatingStat} ${styles.floatingStatLeft}`}
          initial={false}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.6 }}
        >
          <strong>Your pace.</strong>
          <span className={styles.statLine} />
          <small>one day at a time</small>
        </motion.div>
        <motion.div
          className={`${styles.floatingStat} ${styles.floatingStatBottom}`}
          initial={false}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.7 }}
        >
          <span className={styles.statLine} />
          <strong>Your progress.</strong>
          <small>every little win</small>
        </motion.div>

        <div className={styles.scrollCue} aria-hidden="true">
          <span>scroll to explore</span>
          <i />
        </div>
      </section>

      <section className={styles.contentShell}>
        <motion.div
          className={styles.statsGrid}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.4 }}
          transition={{ staggerChildren: 0.1 }}
        >
          {stats.map(([value, label]) => (
            <motion.div key={label} variants={reveal} transition={{ duration: 0.55 }}>
              <strong>{value}</strong>
              <span>{label}</span>
            </motion.div>
          ))}
        </motion.div>

        <section id="features" className={styles.section} aria-labelledby="features-heading">
          <motion.div
            className={styles.sectionHeading}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.55 }}
            variants={reveal}
            transition={{ duration: 0.65 }}
          >
            <span>capabilities</span>
            <h2 id="features-heading">
              Everything you need,
              <br />
              built around your routine
            </h2>
          </motion.div>

          <motion.div
            className={styles.cardGrid}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            transition={{ staggerChildren: 0.12 }}
          >
            {features.map((feature) => {
              const Icon = feature.icon
              return (
                <motion.article
                  className={styles.featureCard}
                  key={feature.title}
                  variants={reveal}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                  whileHover={reduceMotion ? undefined : { y: -8 }}
                >
                  <div className={styles.iconBox}>
                    <Icon aria-hidden="true" />
                  </div>
                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>
                </motion.article>
              )
            })}
          </motion.div>
        </section>

        <LandingPreview />
        <section className={styles.section} aria-labelledby="steps-heading">
          <motion.div className={styles.sectionHeading} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={reveal}><span>from someday to day one</span><h2 id="steps-heading">Your starting line is right here.</h2></motion.div>
          <div className={styles.cardGrid}>{steps.map(step => <motion.article key={step.number} className={styles.featureCard} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={reveal}><span className={styles.stepNumber}>{step.number}</span><h3>{step.title}</h3><p>{step.copy}</p></motion.article>)}</div>
        </section>
        <section id="pricing" className={`${styles.section} ${styles.pricingSection}`} aria-labelledby="pricing-heading">
          <motion.div
            className={styles.pricingPanel}
            initial={{ opacity: 0, y: 40, scale: reduceMotion ? 1 : 0.98 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
          >
            <div className={styles.pricingCopy}>
              <span className={styles.eyebrow}>simple pricing</span>
              <h2 id="pricing-heading">Build a stronger you.</h2>
              <p>
                Start free with your core plans and tracking. Add more planning power with BeanBuilt Pro.
              </p>
              <ul>
                {['AI refreshes (3 requests / 24h)', 'Meal-plan grocery lists', 'Workout calendar export', 'Downloadable plan backups'].map((item) => (
                  <li key={item}>
                    <Check aria-hidden="true" /> {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className={styles.priceBlock}>
              <p><strong>$12</strong><span>/ month</span></p>
              <small>Pro checkout coming soon. Monthly membership, cancel through Stripe billing.</small>
              <Link className={styles.primaryCta} href="/auth/signin?from=/billing">
                explore Pro <ArrowRight aria-hidden="true" />
              </Link>
            </div>
          </motion.div>
        </section>
        <LandingFAQ />
      </section>

      <footer className={styles.footer}>
        <Link className={styles.brand} href="/">
          <BrandLogo />
        </Link>
        <p>AI fitness, built around you.</p>
        <div>
          <a href="#features">Features</a>
          <a href="#inside">Inside the app</a>
          <Link href="/auth/signin">sign in</Link>
        </div>
      </footer>
    </main>
  )
}
