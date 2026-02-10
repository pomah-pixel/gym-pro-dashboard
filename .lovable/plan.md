

# Gym Pro — Fitness Dashboard

A modern, feature-rich fitness dashboard for gym-goers and personal trainers to track workouts, nutrition, sessions, and progress — all backed by a database with user authentication.

## Design & Theme
- **Light theme by default** with a dark mode toggle
- Clean, modern UI inspired by the reference images — colorful stat cards, smooth charts, and an interactive layout
- Sidebar navigation with icons + labels
- Fully responsive for desktop and tablet

---

## 1. Authentication
- **Email/password signup & login**
- **Google sign-in** via Supabase OAuth
- User profiles stored in a `profiles` table (name, avatar, role: trainer or member)
- Protected routes — only logged-in users can access the dashboard

## 2. Dashboard Home
- Welcome greeting with user name and date
- **Stat cards**: Total workouts this week, current streak, calories burned, active goals
- **Workout activity chart** (weekly bar/line chart using Recharts)
- **Upcoming sessions** list with time, type, and trainer info
- **Quick actions**: Log workout, add meal, view schedule

## 3. Workout Tracker
- Log workouts with exercise name, sets, reps, weight, and duration
- Browse/filter exercises by category (strength, cardio, flexibility)
- View workout history with date filters
- Track personal records per exercise

## 4. Calendar & Scheduling
- Interactive weekly/monthly calendar view
- Add, edit, and delete scheduled workout sessions
- Color-coded session types (strength, cardio, yoga, etc.)
- Mini calendar widget in the sidebar/right panel

## 5. Diet & Nutrition
- Log daily meals with food name, calories, protein, carbs, and fats
- Daily macro summary with progress bars (calories, protein, carbs, fats)
- Weekly nutrition trend charts
- Set daily calorie and macro goals

## 6. Progress Tracking
- **Workout streak** counter with visual indicator
- Weight tracking with trend chart over time
- Goals list with progress bars (e.g., "Complete 5K runs", "Bench press 100kg")
- Health score card summarizing overall activity

## 7. Notifications
- Upcoming session reminders displayed in a notification panel
- Alerts for streak milestones, missed workouts, and goal completions
- Bell icon with unread count in the top navigation bar

## 8. AI Fitness Coach (Chatbot)
- Integrated chat panel accessible from the sidebar
- Powered by **Lovable AI** (Gemini model) via a Supabase edge function
- Covers workout suggestions, diet advice, motivation, and general fitness Q&A
- Streaming responses for a smooth, real-time chat experience
- Conversation history saved per user

## 9. Database (Lovable Cloud + Supabase)
Tables for: profiles, workouts, exercises, scheduled_sessions, meals, goals, notifications, chat_messages — all with row-level security so users only see their own data.

