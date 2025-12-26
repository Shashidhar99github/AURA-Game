🚀 AURA | The Architectural Sequence

AURA is a high-performance, browser-based 3D mathematical challenge powered by Three.js.
It merges minimalist Apple-inspired design with immersive first-person navigation and architectural logic puzzles to create a premium, spatial gameplay experience.

✨ Overview

AURA places players inside a sequence of glass-based architectural chambers.
Each room presents a logical equation — only one door leads forward.

Precision, spatial awareness, and speed determine survival.

Built for modern desktop browsers, AURA focuses on fluid motion, elegant UI, and scalable puzzle difficulty.

🛠 Features

Architectural Glass Engine
Real-time transmission, refraction, and thickness simulation using MeshPhysicalMaterial.

M-Class Physics System
Smooth ray-casting and inertial movement for a cinematic walkthrough feel.

Procedural Logic Scaling
Dynamic math equations ranging from basic arithmetic to multi-step algebra.

Persistent High Scores
Best runs are stored locally via browser localStorage.

Glassmorphic UI
Blur-heavy, responsive HUD inspired by macOS and iOS design language.

🎮 How to Play
Controls
Input	Action
W A S D	Move
Mouse	Look around (360°)
Click	Interact / Open logic gates
P	Open settings (while paused)
Rules

Analyze
Read the equation displayed above each door.

Decide
Only one door is correct.
Choosing the wrong door applies a time penalty.

Survive

Start with 40 seconds

Clearing a room resets the timer

Trap doors appear in advanced levels

🏗 Installation & Setup

This project uses ES Modules and must be served through a local server due to browser CORS policies.

Clone the Repository
git clone https://github.com/your-username/aura-sequence.git
cd aura-sequence

Run Using a Local Server

VS Code (Recommended)

Right-click index.html

Select Open with Live Server

Python

python -m http.server 8000


Open: http://localhost:8000

Node.js

npx serve


Follow the generated local URL.

📂 Project Structure
aura-sequence/
│
├── index.html   # Core structure, landing page, UI overlays
├── style.css    # Apple-style design system, glassmorphism, animations
└── script.js    # Three.js engine, audio synthesis, game logic

🔧 Technical Stack

Core Engine: Three.js (WebGL)

Controls: PointerLockControls

Audio: Web Audio API (dynamic synthesis)

Styling: CSS3 (variable-driven design system)

🖋 Credits

Made with ❤️ by Gemini Spatial Labs
Optimized for modern desktop browsers.

📜 License

This project is intended for educational and portfolio use.
Feel free to fork, explore, and build upon it.

Images :
<img width="1899" height="943" alt="image" src="https://github.com/user-attachments/assets/737236d6-e302-4fd5-8120-7efcd1fa60d1" />
<img width="1912" height="934" alt="image" src="https://github.com/user-attachments/assets/5083112d-a965-44b3-babc-2f4a794ae816" />

