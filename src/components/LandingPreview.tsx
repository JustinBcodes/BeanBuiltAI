'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowRight, BarChart3, CalendarDays, Check, Dumbbell, Utensils } from 'lucide-react'
import { BrandLogo } from '@/components/BrandLogo'
import styles from '@/app/landing.module.css'

export function LandingPreview() {
  const [selected, setSelected] = useState<'training' | 'nutrition' | 'progress'>('training')
  const reduced = useReducedMotion()
  return <section id="inside" className={styles.section} aria-labelledby="preview-heading">
    <div className={styles.sectionHeading}><span>Your routine, connected</span><h2 id="preview-heading">Meet your everyday<br />fitness headquarters.</h2><p className={styles.sectionSub}>Try the preview. See how the pieces fit together.</p></div>
    <motion.div initial={{ opacity: 0, y: reduced ? 0 : 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} className={styles.appPreview}>
      <div className={styles.previewToolbar}><BrandLogo /><span>Interactive preview · example data</span></div>
      <div className={styles.previewTabs} role="group" aria-label="Choose a preview">{([{ id: 'training', icon: Dumbbell, title: 'Training' }, { id: 'nutrition', icon: Utensils, title: 'Nutrition' }, { id: 'progress', icon: BarChart3, title: 'Progress' }] as const).map(tab => <button key={tab.id} aria-pressed={selected === tab.id} onClick={() => setSelected(tab.id)} className={selected === tab.id ? styles.tabActive : ''}><tab.icon size={17} />{tab.title}</button>)}</div>
      <motion.div key={selected} initial={{ opacity: 0, y: reduced ? 0 : 8 }} animate={{ opacity: 1, y: 0 }} className={styles.previewBody}>
        <div className={styles.previewIntro}><p>{selected === 'training' ? 'YOUR WEEK AT A GLANCE' : selected === 'nutrition' ? 'ON THE MENU' : 'THE BIGGER PICTURE'}</p><h3>{selected === 'training' ? <>A clear plan.<br />Room to recover.</> : selected === 'nutrition' ? <>Fuel the work.<br />Enjoy the process.</> : <>Consistency looks<br />good on you.</>}</h3><span>{selected === 'training' ? 'Choose your training days and keep your next session in sight.' : selected === 'nutrition' ? 'Your meals and daily targets, without jumping between apps.' : 'See completed workouts and meals add up throughout your week.'}</span><Link href="/auth/signin">Make it yours <ArrowRight size={16} /></Link></div>
        {selected === 'training' ? <div className={styles.demoWeek}>{['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map((day, i) => <div key={day} className={i === 0 ? styles.demoToday : ''}><span>{day}</span>{[0, 2, 4].includes(i) ? <Dumbbell size={20} /> : <span className={styles.restDot} />}<small>{[0, 2, 4].includes(i) ? 'Train' : 'Rest'}</small></div>)}<p><CalendarDays size={16} /> Your plan, your rhythm.</p></div>
          : selected === 'nutrition' ? <div className={styles.demoMeals}>{[['Breakfast', 'Greek yogurt & berries', '420 kcal'], ['Lunch', 'Chicken & quinoa bowl', '580 kcal'], ['Dinner', 'Salmon & roasted vegetables', '610 kcal']].map(([type, name, calories]) => <div key={type}><Utensils size={18} /><span><small>{type}</small><strong>{name}</strong></span><span>{calories}</span></div>)}</div>
          : <div className={styles.demoChart} aria-label="Example meals logged: Monday 2, Tuesday 3, Wednesday 2, Thursday 1, Friday 3, Saturday 2, Sunday 1"><div className={styles.chartLegend}><span />Meals logged <strong>Example week</strong></div><div className={styles.bars}>{[66, 100, 66, 33, 100, 66, 33].map((height, i) => <div key={i}><div><motion.span initial={{ height: 0 }} animate={{ height: `${height}%` }} transition={{ duration: reduced ? 0 : 0.6, delay: reduced ? 0 : i * 0.06 }} /></div><small>{['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}</small></div>)}</div></div>}
      </motion.div>
    </motion.div>
  </section>
}

export function LandingFAQ() {
  return <>
    <section className={`${styles.section} ${styles.freePanel}`} aria-labelledby="free-heading"><div><span className={styles.eyebrow}>Your starting point</span><h2 id="free-heading">Build your routine. For free.</h2><p>Starter workout and meal plans, completion tracking, weight history, goals, and your weekly dashboard.</p></div><div><p><Check size={16} /> No card required</p><Link href="/auth/signin" className={styles.primaryCta}>Start building <ArrowRight size={16} /></Link></div></section>
    <section className={`${styles.section} ${styles.faq}`} aria-labelledby="faq-heading"><div><span className={styles.eyebrow}>Good questions</span><h2 id="faq-heading">A few things<br />before you start.</h2></div><div>{[
      ['Can I start for free?', 'Yes. Sign in with Google and complete a short onboarding to get starter plans, workout and meal tracking, and your progress dashboard. No card is needed.'],
      ['What does Pro add?', 'Pro is $12 USD per month when checkout opens. It adds AI plan refreshes (3 requests per 24 hours), grocery lists from saved meal plans, workout calendar exports, and downloadable plan backups.'],
      ['Is my progress saved across devices?', 'Your profile, latest weight, and saved plans are stored in your account. Workout and meal checkmarks and weight history currently stay in this browser; signing out clears the local record.'],
      ['Can I cancel my membership?', 'Once subscriptions are available, open Membership, then Manage billing to cancel through Stripe. Pro remains available while your subscription is active.'],
      ['How should I use the meal plans?', 'Treat plans as starting points and review ingredients for your needs. Starter meals do not automatically filter allergens. AI output can also make mistakes.'],
    ].map(([question, answer]) => <details key={question}><summary>{question}<span aria-hidden="true">+</span></summary><p>{answer}</p></details>)}</div></section>
  </>
}
