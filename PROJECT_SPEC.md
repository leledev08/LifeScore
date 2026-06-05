# LifeScore - Personal Performance Tracking Web App

## Project Overview

Build a modern full-stack web application called **LifeScore** that allows users to rate different aspects of their daily life on a scale from 1 to 10.

The goal is to help users track habits, personal growth, health, productivity, and well-being over time through visual analytics and historical trends.

The application should feel similar to a combination of:

* Habit Tracker
* Personal Dashboard
* Analytics Platform
* Self Improvement Journal

The UI must be clean, modern, responsive, and optimized for desktop and mobile devices.

---

# Tech Stack

## Frontend

* React
* TypeScript
* Vite
* Tailwind CSS
* shadcn/ui
* React Query
* Zustand

## Backend

* Node.js
* Express

## Database

* PostgreSQL

## Charts

* Recharts

---

# Core Features

## 1. Authentication

Users can:

* Register
* Login
* Logout

Authentication should use JWT.

---

# 2. Daily Score Entry

Users can create one entry per day.

Each category receives a score from 1 to 10.

Default categories:

### Health

* Nutrition
* Hydration
* Sleep

### Fitness

* Workout
* Recovery

### Productivity

* Focus
* Deep Work

### Mindset

* Mood
* Motivation

### Learning

* Reading
* Learning

---

Example:

Date: 2026-06-05

Nutrition: 8
Hydration: 7
Sleep: 6
Workout: 9
Recovery: 8
Focus: 7
Deep Work: 8
Mood: 9
Motivation: 8
Reading: 5
Learning: 7

---

# 3. Notes

Each daily entry can contain:

* Notes
* Reflections
* Comments

Example:

"Had a great workout but slept poorly."

---

# 4. Dashboard

Dashboard displays:

* Today's overall score
* Weekly average
* Monthly average
* Current streak
* Best category
* Worst category

Cards should be displayed at the top.

---

# 5. Historical Data

Users can browse previous days.

Features:

* Calendar view
* List view
* Filters

Filters:

* Date range
* Category
* Minimum score

---

# 6. Analytics Section

This is the most important part of the application.

Create a dedicated Analytics page.

---

## Overall Score Trend

Display a line chart:

X-axis = Date

Y-axis = Overall Daily Score

Example:

Jun 1 -> 7.2
Jun 2 -> 8.1
Jun 3 -> 6.8
Jun 4 -> 7.5

---

## Category Trend Charts

For EVERY category create a dedicated chart.

Examples:

### Workout Chart

X-axis = Date

Y-axis = Workout Score

### Sleep Chart

X-axis = Date

Y-axis = Sleep Score

### Nutrition Chart

X-axis = Date

Y-axis = Nutrition Score

### Focus Chart

X-axis = Date

Y-axis = Focus Score

etc.

The user should be able to:

* Zoom
* Filter by date range
* Hover to see exact values

---

## Multi-Series Comparison Chart

Allow users to compare multiple categories.

Example:

Workout
Sleep
Mood

Displayed on the same chart.

X-axis = Date

Y-axis = Score

Each category is a separate line.

---

## Radar Chart

Display a radar chart for a selected day.

Categories:

* Nutrition
* Sleep
* Workout
* Focus
* Mood
* Reading
* Learning

This provides a visual snapshot of daily performance.

---

## Heatmap Calendar

GitHub-style calendar.

Color intensity based on overall score.

Score 1 = Light
Score 10 = Dark

This allows users to quickly identify good and bad periods.

---

# 7. Custom Categories

Users can:

* Add categories
* Edit categories
* Delete categories

Examples:

* Coding
* Meditation
* Finance
* Language Learning
* Creativity

Custom categories automatically appear in analytics.

---

# 8. Goals

Users can set goals.

Examples:

Workout >= 8

Sleep >= 8

Focus >= 7

The dashboard should display progress.

---

# 9. Statistics Engine

Compute:

## Per Category

* Average score
* Highest score
* Lowest score
* Standard deviation

## Global

* Daily average
* Weekly average
* Monthly average

---

# Database Schema

Users

* id
* email
* password_hash
* created_at

Categories

* id
* user_id
* name
* created_at

DailyEntries

* id
* user_id
* date
* notes
* created_at

Scores

* id
* entry_id
* category_id
* score

---

# API Endpoints

POST /auth/register

POST /auth/login

GET /categories

POST /categories

PUT /categories/:id

DELETE /categories/:id

GET /entries

POST /entries

PUT /entries/:id

DELETE /entries/:id

GET /analytics

GET /analytics/category/:id

GET /analytics/overall

---

# UI Requirements

Modern SaaS style.

Use:

* Cards
* Charts
* Sidebar navigation
* Dark mode
* Responsive layout

Pages:

* Dashboard
* Daily Entry
* History
* Analytics
* Goals
* Settings

---

# Future Features

* AI-generated insights
* Correlation analysis
* Habit recommendations
* Export to CSV
* Export to PDF
* Mobile app
* Notifications
* Weekly reports

---

# Success Criteria

A user should be able to:

1. Create categories.
2. Enter daily scores.
3. View historical data.
4. See one graph per activity.
5. Compare multiple activities.
6. Identify long-term trends.
7. Improve personal performance using data.
