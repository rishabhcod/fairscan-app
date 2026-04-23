# FairScan: AI Bias Detection Platform

**FairScan** is a high-fidelity audit tool designed to expose hidden discrimination within datasets used to train AI models. Powered by **Gemini 2.0 Flash**, it provides a "Cyberpunk-Industrial" interface for data scientists and policy auditors to evaluate algorithmic fairness through specific metrics, flags, and actionable remediation steps.

---

## 🎯 The Motive

As AI systems increasingly automate life-altering decisions—such as loan approvals, hiring, and healthcare—the risk of "encoded bias" grows. Often, datasets contain historical prejudices that AI models inadvertently learn and amplify.

**The motive behind FairScan is threefold:**
1.  **Visibility:** To transform abstract CSV data into a clear, visual report of how different protected groups (race, gender, age, etc.) are being treated by an algorithm.
2.  **Quantification:** To move beyond "vibe-based" ethics by calculating hard metrics like **Demographic Parity**, **Disparate Impact Ratios**, and **Equalized Odds**.
3.  **Accountability:** To provide a "pre-flight check" for developers, ensuring they identify and fix systemic unfairness *before* a model is deployed into the real world.

---

## 🛠️ Build Guide

Follow these steps to set up and run the FairScan application.

### 1. Prerequisites
* **Node.js** (v18 or higher)
* **npm** or **yarn**
* **Gemini API Key:** Obtain one for free from the [Google AI Studio](https://aistudio.google.com/app/apikey).

### 2. Project Initialization
Create a new Vite project with React:
```bash
npm create vite@latest fairscan -- --template react
cd fairscan
npm install
```

### 3. Install Dependencies
FairScan uses **Lucide React** for iconography and standard React hooks for state management:
```bash
npm install lucide-react
```

### 4. Implementation
1.  Open `src/App.jsx`.
2.  Replace the entire content of the file with the code provided in your source.
3.  Ensure your `index.html` or global CSS doesn't conflict with the custom `:root` variables defined in the `styles` constant.

### 5. Running the App
Start the development server:
```bash
npm run dev
```

---

## 🔍 How It Works

1.  **Data Injection:** You paste CSV data into the interface. The app includes a sample dataset regarding loan approvals to test immediately.
2.  **Contextual Analysis:** You define what the data is for (e.g., "Hiring for a tech role"). This helps the AI understand if a disparity is potentially "justifiable" or purely discriminatory.
3.  **The Gemini Audit:**
    * The app constructs a complex prompt including the CSV data and protected attributes.
    * It requests a **structured JSON** response from `gemini-2.0-flash`.
    * The AI performs a "zero-shot" statistical analysis on the data provided.
4.  **Reporting:** The UI parses the JSON to render:
    * **Fairness Score:** A 0-100 gauge of overall equity.
    * **Discrimination Flags:** Specific alerts (Critical/High/Medium) for groups being underserved.
    * **Remediation:** 4-6 actionable steps to fix the detected bias (e.g., "Oversample minority groups" or "Remove proxy variables").

---

## ⚠️ Security Note
FairScan is designed for **local-first** auditing. The API key you enter is stored in the component's state and is only sent to Google’s official Generative Language API. No middle-man servers are used, ensuring your data remains between you and the model provider.
