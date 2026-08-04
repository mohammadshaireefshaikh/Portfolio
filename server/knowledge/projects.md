# Projects

## DealCalculator — Currys Retail Tool
**Year:** 2026
**Tech:** HTML, CSS, vanilla JavaScript, GitHub Actions, GitHub Pages, Playwright
**Live demo:** https://mohammadshaireefshaikh.github.io/DealCalculator/
**GitHub:** https://github.com/mohammadshaireefshaikh/DealCalculator
**Impact:** Getting recognised and used by Currys / Carphone Warehouse retail staff across the UK

A one-page calculator built for shop-floor use at Currys / Carphone Warehouse. Retail staff enter two mobile phone deals — Contract vs Contract, or SIM Free + SIM Only vs Contract — and instantly see which one is genuinely cheaper over the full term. Correctly models the UK's annual April price increases (so a 24-month contract typically catches two rises) and produces a dated payment roadmap the customer can read like a printed quote — "Jul 2026 – Mar 2027 · 9 × £35/mo · £315.00", "Apr 2027 – Mar 2028 · 12 × £36.50/mo · £438.00", etc.

Built as a single self-contained HTML file (~65 KB) with zero dependencies, no frameworks, and no external requests — fonts embedded as woff2 data URIs. Behaviour verified with Playwright in headless Chromium. Continuously deployed to GitHub Pages via GitHub Actions on every push to main.

---

## Swing State: Rage Edition
**Year:** 2026 (in active development)
**Tech:** Unity 6, C#, URP, Netcode for GameObjects, Unity Cloud Save, Unity Relay, WebGL
**Play now:** https://play.unity.com/en/games/c197861d-7c2b-4413-a1bc-f2b150d9a047/swing-state
**Status:** Solo development, playable WebGL build live on Unity Play

Physics-based endless climbing game. The player scales an infinite tower of floating rock islands using two web-shooters — grapple lines fired from each hand that can be reeled in or slackened to build pendulum momentum. Getting Over It punishment meets Spider-Man traversal.

- **Score:** how high you climb. **Death:** falling too far below your peak.
- Solo, or 2-player online co-op where a rope tether physically links both players.
- Cloud-synced accounts (username/password login), profile and settings persist across sessions.
- Live day → dusk → night atmosphere driven by climb height.
- Custom netcode via Unity's Netcode for GameObjects; online lobbies over Unity Relay by code.

Technically notable: the whole thing runs in a 2.5D constraint (true 3D physics locked to the z = 0 plane), the swing is not scripted movement but a real `SpringJoint` that physics resolves into a pendulum, and reeling actually pumps energy into the swing — which had to be capped or velocity would compound without limit. The repo is private while the game is in development; Windows/Steam release is the eventual target.

---

## Real-Time Robotic Hand Control XR
**Year:** 2025
**Tech:** Unity3D, Meta Quest 3, Android Native Plugins, Google Cloud Platform, C#
**Status:** Professional project at TeknTrash Robotics

An XR app on Meta Quest 3 that lets you move your hands to control a physical robot in real time. Hand tracking data is captured on the headset and sent to the robot. Robot telemetry flows back through Google Cloud. Includes a native Unity–Android plugin built from scratch to talk directly to the hardware. This project also helped win Google's London hackathon in 2025.

---

## Automotive Digital Showroom
**Year:** 2022–2023
**Tech:** Unity3D, JSON, Mapbox API, REST APIs, C#
**Impact:** +20% usage, -30% support requests
**Status:** Professional project at Eccentric

3D showroom apps for car dealerships — MG, Maruti Suzuki, and Jeep. Customers could explore vehicles in full 3D detail. Staff had a separate analytics dashboard showing usage stats and Mapbox location data. After shipping, product usage went up 20%, customer satisfaction improved 15%, and support requests dropped 30%.

---

## Unity Essentials — My First Unity Project
**Year:** 2022
**Tech:** Unity3D, C#, WebGL
**Demo:** https://play.unity.com/en/games/443610c3-e1f8-4310-90f2-737dad5d74f7/unity-essentials-portfolio-demo
**Play now:** Playable in-browser on Unity Play

Built as part of the Unity Essentials Pathway. Covers foundational Unity 6 skills: scene creation, GameObjects and components, materials and lighting, audio, and basic scripting. This was Mohammad's first hands-on experience bringing together the core tools and workflows of the Unity Editor.

---

## Marbles Battle Royale
**Year:** 2024
**Tech:** Unity3D, C#, Photon Fusion 2, WebGL
**GitHub:** https://github.com/mohammadshaireefshaikh/Marbles-Battle-Royale-Game
**Status:** University project at the University of Liverpool

Multiplayer marble arena game built in Unity. Roll your marble around a 3D map and knock other players off the edge. Uses Photon Fusion 2 for real-time netcode, with customizable marble skins and multiple maps.

---

## ConicalGaufres AR
**Year:** 2023
**Tech:** Unity3D, AR Foundation, ARCore, ARKit, C#
**GitHub:** https://github.com/mohammadshaireefshaikh/conicalgaufres-ar

AR app for a Belgian waffle brand. Point your phone at the packaging and you see a 3D version of the product, nutrition information, and a way to order — all without leaving the camera view. Works on both iOS (ARKit) and Android (ARCore).

---

## M.A.D — My Assignments Done
**Year:** 2024
**Tech:** React, Python, FastAPI, PostgreSQL, Docker
**GitHub:** https://github.com/mohammadshaireefshaikh/mad-assignments

Web app for managing university assignments. Track deadlines, share files, collaborate with teammates, and get notified when things change. Full-stack: React frontend, Python/FastAPI backend, PostgreSQL database, Docker for deployment.
