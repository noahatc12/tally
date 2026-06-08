// Curated habit-icon set, drawn from Lucide. We import each icon explicitly (rather than
// `import * as`) so the bundler only ships the ones we actually offer. Habits store an
// `iconName` (a key of HABIT_ICON_MAP); when it's missing or unknown the UI falls back to a
// serif monogram of the habit's first letter, so no icon is ever a hard requirement.

import {
  Dumbbell, Footprints, Bike, Waves, PersonStanding, HeartPulse, Activity, Mountain,
  Droplet, GlassWater, Coffee, Apple, Salad, Carrot, Soup, Wheat,
  Moon, BedDouble, Sun, Sunrise, AlarmClock, Hourglass, Timer,
  BookOpen, Book, PenLine, NotebookPen, GraduationCap, Brain, Languages, Pencil,
  Music, Guitar, Palette, Camera, Code, Briefcase, Wallet, PiggyBank,
  Target, Flag, Trophy, Flame, Star, Sparkles, Heart, Smile,
  Sprout, Leaf, TreePine, Flower2, Wind, Dog, Cat,
  Pill, Stethoscope, Bath, ShowerHead, Cigarette, Hand, Phone, Bell,
  Recycle, Tent, Shirt, WashingMachine, Brush, CheckCheck,
} from 'lucide-react'

export const HABIT_ICON_MAP = {
  Dumbbell, Footprints, Bike, Waves, PersonStanding, HeartPulse, Activity, Mountain,
  Droplet, GlassWater, Coffee, Apple, Salad, Carrot, Soup, Wheat,
  Moon, BedDouble, Sun, Sunrise, AlarmClock, Hourglass, Timer,
  BookOpen, Book, PenLine, NotebookPen, GraduationCap, Brain, Languages, Pencil,
  Music, Guitar, Palette, Camera, Code, Briefcase, Wallet, PiggyBank,
  Target, Flag, Trophy, Flame, Star, Sparkles, Heart, Smile,
  Sprout, Leaf, TreePine, Flower2, Wind, Dog, Cat,
  Pill, Stethoscope, Bath, ShowerHead, Cigarette, Hand, Phone, Bell,
  Recycle, Tent, Shirt, WashingMachine, Brush, CheckCheck,
}

export const HABIT_ICON_NAMES = Object.keys(HABIT_ICON_MAP)

// The Lucide component for a name, or null if absent (caller renders the monogram fallback).
export function iconComponent(name) {
  return (name && HABIT_ICON_MAP[name]) || null
}
