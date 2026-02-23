// Game state
const gameState = {
  hptHealth: 100,
  hptMaxHealth: 100,
  isHacking: false,
  isProbing: false,
  isGameOver: false,
  correctIP: null, // Randomized on init
  currentTarget: null,
  targetHealthByIP: {},
  targetProtectionByIP: {},
  discoveredIPs: {},
  suspiciousHacks: {}, // Track undiscovered Google/Cloudflare hacks: { "8.8.8.8": true }
  falseWin: false, // Won Spamton but have undiscovered legitimate IPs hacked
  breaches: {
    encryption: 0,
    tracking: 0,
    monitoring: 0,
  },
  defenses: {
    antivirus: 0,
    firewall: 0,
    vpn: 0,
    backup: 0,
  },
  defenseHealth: {},

  // CURRENCY SYSTEM
  currencies: {
    findPoints: 0,
    hackPoints: 0,
    breachPoints: 0,
    defendPoints: 0,
    hackcoins: 0,
    maincoins: 0,
  },

  // FACTION SYSTEM
  factionReputation: {}, // { factionId: reputationValue }
  attackedFactions: {}, // Track which factions player has attacked

  // STORY ROUTE TRACKING
  currentRoute: "base", // "base", "pacifist", or "brutal"
  routeLocked: false, // Becomes true after first attack on non-Spamton
  attackedTargets: {}, // Track all attacked IPs to determine route

  // SAVE SYSTEM
  saveSlots: [null, null, null, null, null], // 5 save slots
  autoSave: null, // Auto-save stored separately

  // MISSIONS SYSTEM
  currentMissionId: "mission_001_spamton", // Current mission
  completedMissions: {}, // Track completed missions
  missionProgress: {}, // Track progress on objectives

  // JOBS SYSTEM (Phase 3)
  availableJobs: {}, // Active jobs from NPCs
  completedJobs: {}, // Completed jobs history
  lastJobRefresh: null, // Timestamp of last daily refresh
  jobsRefreshedToday: false, // Has job list been refreshed today

  // UPGRADES SYSTEM (Phase 4)
  upgrades: {}, // { upgradeId: true } for purchased upgrades
};

// All possible IPs for probing
const allIPs = [
  {
    ip: "192.168.1.1",
    signature: "Generic Router",
    type: "infrastructure",
    protection: 1,
    owner: "Unknown Router",
    hint: "Standard home network device",
  },
  {
    ip: "8.8.8.8",
    signature: "Google Public DNS",
    type: "legitimate",
    protection: 3,
    owner: "Google",
    hint: "Large tech company with strong protections",
  },
  {
    ip: "1.1.1.1",
    signature: "Cloudflare DNS",
    type: "legitimate",
    protection: 3,
    owner: "Cloudflare",
    hint: "Content delivery network with global reach",
  },
  {
    ip: "203.45.178.92",
    signature: "Spamton Decoy Server",
    type: "hacker",
    danger: "CRITICAL",
    protection: 2,
    owner: "Hack Organization",
    hint: "Known malicious actor - CAUTION: likely a decoy",
  },
  {
    ip: "156.234.89.44",
    signature: "Dark Web Gateway",
    type: "hacker",
    danger: "HIGH",
    protection: 4,
    owner: "Unknown Hacker Group",
    hint: "Encrypted network with heavy protection",
  },
  {
    ip: "123.123.123.123",
    signature: "Glitch Node",
    type: "unknown",
    protection: 0,
    owner: "EASTER EGG",
    hint: "Something weird about this address...",
  },
  {
    ip: "45.45.45.45",
    signature: "Mirror IP",
    type: "hacker",
    danger: "LOW",
    protection: 1,
    owner: "Strange Mirror",
    hint: "Reflective node - might be a decoy",
  },
];

// FACTION DEFINITIONS (8 factions)
const factions = {
  spamton: {
    id: "spamton",
    name: "Spamton Organization",
    type: "hacker",
    hackableRoutes: ["base", "pacifist", "brutal"],
    allies: [],
    ips: [], // Dynamically added (Spamton HQ randomized)
  },
  collective: {
    id: "collective",
    name: "The Collective",
    type: "hacktivist",
    hackableRoutes: ["base", "brutal"],
    allies: ["cipher"],
    ips: ["91.200.165.44", "91.200.165.45", "91.200.165.46"],
  },
  neonSyndicate: {
    id: "neonSyndicate",
    name: "Neon Syndicate",
    type: "criminal",
    hackableRoutes: ["base", "brutal"],
    allies: ["voidEcho"],
    ips: ["77.88.99.11", "77.88.99.12", "77.88.99.13"],
  },
  ghostProtocol: {
    id: "ghostProtocol",
    name: "Ghost Protocol",
    type: "hacker",
    hackableRoutes: ["base", "brutal"],
    allies: ["mirrorNet"],
    ips: ["62.34.56.78", "62.34.56.79", "62.34.56.80"],
  },
  ironGuard: {
    id: "ironGuard",
    name: "Iron Guard",
    type: "corporate",
    hackableRoutes: ["base", "brutal"],
    allies: ["cipher"],
    ips: ["134.209.29.103", "134.209.29.104", "134.209.29.105"],
  },
  cipher: {
    id: "cipher",
    name: "Cipher Collective",
    type: "agency",
    hackableRoutes: ["brutal"],
    allies: ["collective", "ironGuard"],
    ips: ["198.51.100.42", "198.51.100.43", "198.51.100.44"],
  },
  mirrorNet: {
    id: "mirrorNet",
    name: "Mirror Net",
    type: "broker",
    hackableRoutes: ["base", "brutal"],
    allies: ["ghostProtocol"],
    ips: ["45.33.32.156", "45.33.32.157", "45.33.32.158"],
  },
  voidEcho: {
    id: "voidEcho",
    name: "Void Echo",
    type: "rogue_ai",
    hackableRoutes: ["base", "brutal"],
    allies: ["neonSyndicate"],
    ips: ["192.0.2.195", "192.0.2.196", "192.0.2.197"],
  },
};

// MISSIONS SYSTEM
const missions = {
  mission_001_intro: {
    id: "mission_001_intro",
    title: "Network Reconnaissance",
    description:
      "HPT briefing: Intelligence reports suggest Spamton has been coordinating with underworld factions. Begin surveillance.",
    objective: "Discover and identify at least 3 faction networks",
    rewards: {
      hackcoins: 0,
      experience: 50,
    },
    nextMission: "mission_002_collective",
  },
  mission_002_collective: {
    id: "mission_002_collective",
    title: "The Collective Investigation",
    description:
      "Our analysts tracked encrypted communications to The Collective, a hacktivist group. Investigate their operations.",
    objective: "Discover all Collective network nodes (91.200.165.44-46)",
    rewards: {
      hackcoins: 0,
      experience: 75,
    },
    nextMission: "mission_003_neon",
  },
  mission_003_neon: {
    id: "mission_003_neon",
    title: "Neon Syndicate Tracking",
    description:
      "Intelligence suggests criminal networks are involved. Track the Neon Syndicate's operations.",
    objective: "Discover all Neon Syndicate nodes (77.88.99.11-13)",
    rewards: {
      hackcoins: 0,
      experience: 75,
    },
    nextMission: "mission_004_ghost",
  },
  mission_004_ghost: {
    id: "mission_004_ghost",
    title: "Ghost Protocol Monitoring",
    description:
      "A rogue hacking collective has caught our attention. Monitor Ghost Protocol's infrastructure.",
    objective: "Discover all Ghost Protocol nodes (62.34.56.78-80)",
    rewards: {
      hackcoins: 0,
      experience: 75,
    },
    nextMission: "mission_005_corporate",
  },
  mission_005_corporate: {
    id: "mission_005_corporate",
    title: "Iron Guard Connection",
    description:
      "Evidence suggests corporate interests are protecting Spamton. Investigate Iron Guard's involvement.",
    objective: "Discover all Iron Guard nodes (134.209.29.103-105)",
    rewards: {
      hackcoins: 0,
      experience: 75,
    },
    nextMission: "mission_006_cipher_briefing",
  },
  mission_006_cipher_briefing: {
    id: "mission_006_cipher_briefing",
    title: "Cipher Collective Alert",
    description:
      "WARNING: A government agency called Cipher Collective has been detected. They protect elite networks. Avoid direct confrontation.",
    objective:
      "Map Cipher Collective infrastructure (198.51.100.42-44) - Intel only, no attacks",
    rewards: {
      hackcoins: 0,
      experience: 50,
    },
    nextMission: "mission_007_broker",
  },
  mission_007_broker: {
    id: "mission_007_broker",
    title: "Mirror Net Intelligence",
    description:
      "A network broker facilitating all these connections has been identified. Catalog Mirror Net nodes.",
    objective: "Discover all Mirror Net nodes (45.33.32.156-158)",
    rewards: {
      hackcoins: 0,
      experience: 75,
    },
    nextMission: "mission_008_rogue_ai",
  },
  mission_008_rogue_ai: {
    id: "mission_008_rogue_ai",
    title: "Void Echo: Rogue AI",
    description:
      "Final piece of the puzzle: An AI entity controls Spamton's security. Void Echo must be neutralized or bypassed.",
    objective: "Discover all Void Echo nodes (192.0.2.195-197)",
    rewards: {
      hackcoins: 0,
      experience: 75,
    },
    nextMission: "mission_009_spamton_located",
  },
  mission_009_spamton_located: {
    id: "mission_009_spamton_located",
    title: "Spamton Located",
    description:
      "All intelligence gathered. HPT has pinpointed Spamton's main headquarters. Final strike authorized.",
    objective: "Pinpoint Spamton's exact location and extract coordinates",
    rewards: {
      hackcoins: 0,
      experience: 100,
    },
    nextMission: "mission_010_spamton_final",
  },
  mission_010_spamton_final: {
    id: "mission_010_spamton_final",
    title: "Operation: Spamton Elimination",
    description:
      "All reconnaissance complete. Execute the final strike. Destroy Spamton's headquarters.",
    objective: "Destroy Spamton's main server",
    rewards: {
      hackcoins: 0,
      experience: 200,
    },
    nextMission: "mission_011_aftermath",
  },
  mission_011_aftermath: {
    id: "mission_011_aftermath",
    title: "Assess Network Damage",
    description:
      "Investigate the aftermath of your attack and assess network consequences.",
    objective: "Survey faction responses and network stability",
    rewards: {
      hackcoins: 0,
      experience: 150,
    },
    nextMission: null, // Story branching based on route
  },
};

function initializeMissions() {
  gameState.currentMissionId = "mission_001_intro";
  gameState.completedMissions = {};
  gameState.missionProgress = {};
}

function getCurrentMission() {
  return missions[gameState.currentMissionId];
}

function completeMission(missionId) {
  gameState.completedMissions[missionId] = true;
  const mission = missions[missionId];
  if (mission && mission.nextMission) {
    gameState.currentMissionId = mission.nextMission;
    return mission.nextMission;
  }
  return null;
}

// Initialize faction reputation
function initializeFactions() {
  Object.keys(factions).forEach((factionId) => {
    if (!gameState.factionReputation[factionId]) {
      gameState.factionReputation[factionId] = 0;
    }
  });
}

// PHASE 3: JOBS SYSTEM

// UPGRADE CATALOG (Phase 4)
const upgradesCatalog = {
  stronger_attacks: {
    id: "stronger_attacks",
    name: "Stronger Attacks",
    category: "Combat",
    cost: 150,
    description: "Double the direct damage dealt per attack.",
    effect: "hackPointsMultiplier",
    value: 2,
  },
  breach_specialist: {
    id: "breach_specialist",
    name: "Breach Specialist",
    category: "Combat",
    cost: 120,
    description: "Gain +3 extra breaches on each protection type.",
    effect: "breachBonus",
    value: 3,
  },
  defense_expert: {
    id: "defense_expert",
    name: "Defense Expert",
    category: "Combat",
    cost: 120,
    description: "Defend 2x as effectively per defense action.",
    effect: "defenseMultiplier",
    value: 2,
  },
  precision_strike: {
    id: "precision_strike",
    name: "Precision Strike",
    category: "Combat",
    cost: 100,
    description: "Attacks ignore 50% of target protection.",
    effect: "ignoreProtection",
    value: 0.5,
  },
  job_efficiency: {
    id: "job_efficiency",
    name: "Job Efficiency",
    category: "Economy",
    cost: 100,
    description: "Earn +50% Maincoins from job completion.",
    effect: "jobRewardMultiplier",
    value: 1.5,
  },
  hack_master: {
    id: "hack_master",
    name: "Hack Master",
    category: "Economy",
    cost: 150,
    description: "Gain +10 Hack Points per attack.",
    effect: "hackPointsBonus",
    value: 10,
  },
  find_specialist: {
    id: "find_specialist",
    name: "Find Specialist",
    category: "Economy",
    cost: 80,
    description: "Discover +5 Find Points per new IP.",
    effect: "findPointsBonus",
    value: 5,
  },
  currency_trader: {
    id: "currency_trader",
    name: "Currency Trader",
    category: "Economy",
    cost: 200,
    description: "Unlock 1:1 Hackcoin ↔ Maincoin conversion.",
    effect: "unlockCurrencyTrade",
    value: 1,
  },
  network_scanner: {
    id: "network_scanner",
    name: "Network Scanner",
    category: "Utility",
    cost: 180,
    description: "Auto-discover 3 random IPs at game start.",
    effect: "autoDiscoverIPs",
    value: 3,
  },
  router_echo: {
    id: "router_echo",
    name: "Router Echo",
    category: "Utility",
    cost: 120,
    description: "Reveal Spamton's IP in the FIND menu.",
    effect: "revealSpamtonIP",
    value: 1,
  },
  firewall_builder: {
    id: "firewall_builder",
    name: "Firewall Builder",
    category: "Utility",
    cost: 110,
    description: "Build defenses instantly (+1 all defense types).",
    effect: "instantDefense",
    value: 1,
  },
  reputation_monitor: {
    id: "reputation_monitor",
    name: "Reputation Monitor",
    category: "Utility",
    cost: 140,
    description: "Attacking factions causes only half reputation loss.",
    effect: "halfReputationLoss",
    value: 0.5,
  },
};

// NPC DEFINITIONS (Phase 3)
const npcs = {
  rogue_hacker: {
    id: "rogue_hacker",
    name: "Rogue Hacker",
    avatar: "🕵️",
    description: "Underground contractor offering side gigs",
  },
  corporate_spy: {
    id: "corporate_spy",
    name: "Corporate Spy",
    avatar: "🕴️",
    description: "Espionage specialist with lucrative contracts",
  },
  network_broker: {
    id: "network_broker",
    name: "Network Broker",
    avatar: "💼",
    description: "Information dealer with various jobs",
  },
  black_market_ai: {
    id: "black_market_ai",
    name: "Black Market AI",
    avatar: "🤖",
    description: "Automated job system offering computational tasks",
  },
};

const dailyJobs = [
  {
    id: "job_scan_subnet",
    npcId: "rogue_hacker",
    title: "Scan Subnet Range",
    description: "Probe and catalog unknown subnet (XXX.XXX.0.0/16)",
    reward: 50, // Maincoins
    difficulty: "Easy",
    action: "probe_random", // Action type
  },
  {
    id: "job_break_encryption",
    npcId: "rogue_hacker",
    title: "Break Encryption",
    description: "Bypass 1 encryption barrier on any target",
    reward: 75,
    difficulty: "Medium",
    action: "breach_encryption",
  },
  {
    id: "job_corporate_intel",
    npcId: "corporate_spy",
    title: "Corporate Network Intel",
    description: "Discover all IPs of a corporate faction",
    reward: 100,
    difficulty: "Hard",
    action: "discover_faction",
  },
  {
    id: "job_network_analysis",
    npcId: "network_broker",
    title: "Network Analysis",
    description: "Successfully defend against 5 counterhacks",
    reward: 60,
    difficulty: "Medium",
    action: "survive_counterhacks",
  },
  {
    id: "job_ai_training",
    npcId: "black_market_ai",
    title: "Computational Task",
    description: "Complete any 3 attacks in one session",
    reward: 80,
    difficulty: "Medium",
    action: "multiple_attacks",
  },
  {
    id: "job_dns_hijack",
    npcId: "rogue_hacker",
    title: "DNS Hijacking",
    description: "Discover 5 or more new IP signatures",
    reward: 120,
    difficulty: "Hard",
    action: "discover_ips",
  },
  {
    id: "job_firewall_breach",
    npcId: "corporate_spy",
    title: "Firewall Architecture",
    description:
      "Breach all 3 protection types (encryption, tracking, monitoring)",
    reward: 150,
    difficulty: "Hard",
    action: "breach_all_types",
  },
  {
    id: "job_build_defense",
    npcId: "network_broker",
    title: "Defense Infrastructure",
    description: "Build 5 defensive systems",
    reward: 70,
    difficulty: "Medium",
    action: "build_defenses",
  },
];

function initializeJobs() {
  refreshDailyJobs();
}

function refreshDailyJobs() {
  const today = new Date().toDateString();
  gameState.lastJobRefresh = today;
  gameState.jobsRefreshedToday = true;

  // Randomly select 4 jobs from available jobs
  const shuffled = [...dailyJobs].sort(() => Math.random() - 0.5);
  gameState.availableJobs = {};

  for (let i = 0; i < Math.min(4, shuffled.length); i++) {
    const job = shuffled[i];
    gameState.availableJobs[job.id] = {
      ...job,
      completed: false,
      progress: 0,
    };
  }
}

function completeJob(jobId) {
  const job = gameState.availableJobs[jobId];
  if (!job) return false;
  if (job.completed) return false; // Prevent double completion

  gameState.availableJobs[jobId].completed = true;
  gameState.completedJobs[jobId] = true;

  // Calculate tier bonus (highest tier across all factions)
  let maxTierBonus = 1.0;
  for (const [factionId, rep] of Object.entries(gameState.factionReputation)) {
    const tier = getTierFromReputation(rep);
    if (tier.tier >= 3) {
      // Elite (tier 3) or Legendary (tier 4)
      if (tier.tier === 4) {
        // Legendary
        maxTierBonus = 2.0;
        break; // Highest possible, stop searching
      } else if (tier.tier === 3 && maxTierBonus < 1.5) {
        // Elite
        maxTierBonus = 1.5;
      }
    }
  }

  let finalReward = Math.floor(job.reward * maxTierBonus);

  // Award Maincoins
  addCurrency("maincoins", finalReward);
  displayCurrencies();

  addHackLog(`✓ Job completed: ${job.title}`, "success");

  if (maxTierBonus > 1.0) {
    const tierName = maxTierBonus === 2.0 ? "Legendary" : "Elite";
    addHackLog(
      `✓ Earned ${finalReward} Maincoins (${tierName} tier bonus: +${Math.round((maxTierBonus - 1) * 100)}%)`,
      "success",
    );
  } else {
    addHackLog(`✓ Earned ${finalReward} Maincoins`, "success");
  }

  return true;
}

function getAvailableJobs() {
  return Object.values(gameState.availableJobs);
}

// UPGRADE UTILITIES (Phase 4)
function hasUpgrade(upgradeId) {
  return gameState.upgrades[upgradeId] === true;
}

function purchaseUpgrade(upgradeId) {
  const upgrade = upgradesCatalog[upgradeId];
  if (!upgrade) return { success: false, message: "Upgrade not found." };
  if (hasUpgrade(upgradeId))
    return { success: false, message: "Already purchased." };
  if (gameState.currencies.maincoins < upgrade.cost) {
    return {
      success: false,
      message: `Need ${upgrade.cost} Maincoins (have ${gameState.currencies.maincoins}).`,
    };
  }

  gameState.currencies.maincoins -= upgrade.cost;
  gameState.upgrades[upgradeId] = true;
  displayCurrencies();

  addHackLog(`✓ Upgrade purchased: ${upgrade.name}`, "success");
  addHackLog(`✓ Effect: ${upgrade.description}`, "success");

  return { success: true, message: `${upgrade.name} unlocked!` };
}

function getUpgradesByCategory(category) {
  return Object.values(upgradesCatalog).filter((u) => u.category === category);
}

function displayUpgradesPanel() {
  const panel = document.getElementById("upgrades-content");
  if (!panel) return;

  const categories = ["Combat", "Economy", "Utility"];
  let html = `<div style="color: #00cc00; margin-bottom: 15px; font-size: 0.9em;">💰 Maincoins: ${gameState.currencies.maincoins}</div>`;

  categories.forEach((cat) => {
    const upgrades = getUpgradesByCategory(cat);
    html += `<div style="margin-bottom: 20px;">`;
    html += `<div style="color: #ffaa00; font-weight: bold; margin-bottom: 8px; border-bottom: 1px solid #ffaa00; padding-bottom: 5px;">${cat} Upgrades</div>`;

    upgrades.forEach((upgrade) => {
      const purchased = hasUpgrade(upgrade.id);
      const statusColor = purchased ? "#00aa00" : "#cccccc";
      const statusText = purchased ? "✓ OWNED" : "○ AVAILABLE";
      const btnDisabled =
        purchased || gameState.currencies.maincoins < upgrade.cost;
      const btnStyle = purchased
        ? "background: #0a3a0a; border: 1px solid #00aa00; color: #00aa00; cursor: not-allowed; opacity: 0.6;"
        : btnDisabled
          ? "background: #3a0a0a; border: 1px solid #aa0000; color: #aa0000; cursor: not-allowed; opacity: 0.6;"
          : "background: #0a3a0a; border: 1px solid #00ff00; color: #00ff00; cursor: pointer;";

      html += `
        <div style="background: rgba(50, 50, 100, 0.4); border: 1px solid #444; padding: 10px; margin-bottom: 8px; border-radius: 3px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
            <div style="font-weight: bold; color: #ddd;">${upgrade.name}</div>
            <div style="color: ${statusColor}; font-size: 11px;">${statusText}</div>
          </div>
          <div style="color: #aaa; font-size: 12px; margin-bottom: 8px;">${upgrade.description}</div>
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div style="color: #ffaa00;">💰 ${upgrade.cost} MC</div>
            ${!purchased ? `<button class="upgrade-btn" data-upgrade="${upgrade.id}" style="${btnStyle} padding: 4px 8px; font-family: monospace; font-size: 10px; border-radius: 2px; transition: all 0.2s;" ${btnDisabled ? "disabled" : ""}>BUY</button>` : ""}
          </div>
        </div>
      `;
    });

    html += `</div>`;
  });

  panel.innerHTML = html;

  // Wire up purchase buttons
  document.querySelectorAll(".upgrade-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const upgradeId = e.target.dataset.upgrade;
      const result = purchaseUpgrade(upgradeId);
      if (result.success) {
        displayUpgradesPanel(); // Refresh
      } else {
        addHackLog(result.message, "warning");
      }
    });
  });
}

// CURRENCY UTILITIES
function addCurrency(type, amount) {
  if (gameState.currencies[type] !== undefined) {
    gameState.currencies[type] += amount;
  }
}

function convertSectionToHackcoins(sectionType, amount) {
  if (gameState.currencies[sectionType] >= amount) {
    gameState.currencies[sectionType] -= amount;
    gameState.currencies.hackcoins += amount * 0.8; // Small loss on conversion
    return true;
  }
  return false;
}

function convertHackcoinsToMaincoins(amount) {
  // Only possible if DWConverter is unlocked (placeholder)
  if (gameState.currencies.hackcoins >= amount) {
    gameState.currencies.hackcoins -= amount;
    gameState.currencies.maincoins += amount * 0.9; // Small loss on conversion
    return true;
  }
  return false;
}

// ROUTE DETECTION & TRACKING
function getFactionForIP(ip) {
  for (const [factionId, faction] of Object.entries(factions)) {
    if (faction.ips && faction.ips.includes(ip)) {
      return factionId;
    }
  }
  return null;
}

function updateRoute(attackedFactionId) {
  if (gameState.routeLocked) return;

  if (attackedFactionId === "spamton") {
    return; // Attacking Spamton doesn't lock route
  }

  // First non-Spamton attack determines route
  const factionInfo = factions[attackedFactionId];
  if (!factionInfo) return;

  // If attacking a non-hackable faction for current route, force route change
  if (!factionInfo.hackableRoutes.includes(gameState.currentRoute)) {
    gameState.currentRoute = "brutal";
  } else if (gameState.currentRoute === "pacifist") {
    gameState.currentRoute = "brutal";
  }

  gameState.routeLocked = true;
  gameState.attackedTargets[attackedFactionId] = true;

  // Route is hidden - no visible notification
  // Player discovers route through their choices
}

function updateFactionReputation(factionId, change) {
  if (gameState.factionReputation[factionId] !== undefined) {
    gameState.factionReputation[factionId] += change;
  }
}

// REPUTATION TIER SYSTEM (Phase 5)
const reputationTiers = [
  {
    tier: 0,
    name: "Neutral",
    minRep: 0,
    maxRep: 20,
    bonus: 0,
    description: "No effect",
  },
  {
    tier: 1,
    name: "Associate",
    minRep: 21,
    maxRep: 50,
    bonus: 5,
    description: "5% stronger attacks",
  },
  {
    tier: 2,
    name: "Trusted",
    minRep: 51,
    maxRep: 100,
    bonus: 10,
    description: "10% stronger + discount",
  },
  {
    tier: 3,
    name: "Elite",
    minRep: 101,
    maxRep: 150,
    bonus: 15,
    description: "15% stronger + 2x jobs",
  },
  {
    tier: 4,
    name: "Legendary",
    minRep: 151,
    maxRep: Infinity,
    bonus: 20,
    description: "20% stronger + exclusive",
  },
];

function getTierFromReputation(repValue) {
  return (
    reputationTiers.find((t) => repValue >= t.minRep && repValue <= t.maxRep) ||
    reputationTiers[0]
  );
}

function getTierBonus(factionId) {
  const rep = gameState.factionReputation[factionId] || 0;
  const tier = getTierFromReputation(rep);
  return tier.bonus / 100; // Return as decimal (0.05 for 5%)
}

function getProgressToNextTier(repValue) {
  const currentTier = getTierFromReputation(repValue);
  if (currentTier.tier >= 4) return { current: 100, next: 100, percent: 100 }; // Maxed
  const nextTier = reputationTiers[currentTier.tier + 1];
  const currentProgress = Math.max(0, repValue - currentTier.minRep);
  const nextProgress = nextTier.minRep - currentTier.minRep;
  const percent = Math.min(
    100,
    Math.round((currentProgress / nextProgress) * 100),
  );
  return { current: currentProgress, next: nextProgress, percent };
}

// SAVE SYSTEM
function saveGame(slotNumber) {
  if (slotNumber < 0 || slotNumber > 4) return false;

  const saveData = JSON.parse(JSON.stringify(gameState));
  gameState.saveSlots[slotNumber] = {
    gameState: saveData,
    timestamp: new Date().toISOString(),
  };

  // Persist to localStorage
  localStorage.setItem(
    `hackulean_save_${slotNumber}`,
    JSON.stringify(gameState.saveSlots[slotNumber]),
  );
  addHackLog(`✓ Game saved to slot ${slotNumber + 1}`, "success");
  return true;
}

function loadGame(slotNumber) {
  if (slotNumber < 0 || slotNumber > 4) return false;

  const saveData =
    gameState.saveSlots[slotNumber] ||
    JSON.parse(localStorage.getItem(`hackulean_save_${slotNumber}`) || "null");

  if (!saveData || !saveData.gameState) {
    addProbeLog("⚠️ Empty save slot", "warning");
    return false;
  }

  // Restore game state
  const restored = saveData.gameState;
  Object.assign(gameState, restored);

  updateHPTDisplay();
  updateDefensesList();
  displaySignatures();
  updateStatusMessage(`✓ Loaded save slot ${slotNumber + 1}`);
  addProbeLog(`✓ Game loaded from slot ${slotNumber + 1}`, "success");
  return true;
}

function autoSave() {
  const saveData = JSON.parse(JSON.stringify(gameState));
  gameState.autoSave = {
    gameState: saveData,
    timestamp: new Date().toISOString(),
  };
  localStorage.setItem(
    "hackulean_autosave",
    JSON.stringify(gameState.autoSave),
  );
}

function loadAutoSave() {
  const autoSave = JSON.parse(
    localStorage.getItem("hackulean_autosave") || "null",
  );
  if (autoSave && autoSave.gameState) {
    Object.assign(gameState, autoSave.gameState);
    updateHPTDisplay();
    updateDefensesList();
    displaySignatures();
    updateStatusMessage("✓ Auto-save loaded");
    return true;
  }
  return false;
}

// CURRENCY DISPLAY
function displayCurrencies() {
  const currencies = gameState.currencies;
  let currencyText = "💰 CURRENCIES: ";
  currencyText += `FP:${currencies.findPoints}🔍 `;
  currencyText += `HP:${currencies.hackPoints}🔐 `;
  currencyText += `BP:${currencies.breachPoints}⚔️ `;
  currencyText += `DP:${currencies.defendPoints}🛡️ `;
  currencyText += `HC:${Math.floor(currencies.hackcoins)}💳 `;
  currencyText += `MC:${Math.floor(currencies.maincoins)}💵`;

  let currencyDiv = document.getElementById("currency-display");
  if (!currencyDiv) {
    currencyDiv = document.createElement("div");
    currencyDiv.id = "currency-display";
    currencyDiv.style.cssText =
      "background: #0a0a0a; border: 1px solid #00ff00; padding: 8px; margin: 8px 0; font-size: 12px; font-family: monospace; color: #00ff00;";
    const statusDiv = document.getElementById("status");
    if (statusDiv && statusDiv.parentNode) {
      statusDiv.parentNode.insertBefore(currencyDiv, statusDiv);
    }
  }
  currencyDiv.textContent = currencyText;
}

// MISSION DISPLAY
function displayMissionObjective() {
  const mission = getCurrentMission();
  if (!mission) return;

  let missionDiv = document.getElementById("mission-display");
  if (!missionDiv) {
    missionDiv = document.createElement("div");
    missionDiv.id = "mission-display";
    missionDiv.style.cssText =
      "background: #0a0a0a; border: 1px solid #ffaa00; padding: 8px; margin: 8px 0; font-size: 12px; font-family: monospace; color: #ffaa00;";
    const statusDiv = document.getElementById("status");
    if (statusDiv && statusDiv.parentNode) {
      statusDiv.parentNode.insertBefore(missionDiv, statusDiv);
    }
  }

  const missionText = `📋 MISSION: ${mission.title} - ${mission.objective}`;
  missionDiv.textContent = missionText;
}

// MISSIONS UI
function displayMissionsPanel() {
  const missionsContent = document.getElementById("missions-content");
  const mission = getCurrentMission();

  if (!mission) {
    missionsContent.innerHTML = "<p>No active mission</p>";
    return;
  }

  let html = `
    <div style="border: 1px solid #ffaa00; padding: 10px; margin-bottom: 10px; background: rgba(255, 170, 0, 0.05);">
      <div style="font-weight: bold; margin-bottom: 5px;">📋 ${mission.title}</div>
      <div style="color: #cccccc; font-size: 12px; margin-bottom: 8px;">${mission.description}</div>
      <div style="color: #ffaa00; margin-bottom: 5px;">Objective: ${mission.objective}</div>
  `;

  // Show completed missions
  Object.keys(gameState.completedMissions).forEach((missionId) => {
    const completedMission = missions[missionId];
    if (completedMission) {
      html += `<div style="color: #00aa00; margin-top: 5px;">✓ ${completedMission.title}</div>`;
    }
  });

  html += `</div>`;
  missionsContent.innerHTML = html;
}

// FACTIONS UI
function displayFactionsPanel() {
  const factionsContent = document.getElementById("factions-content");
  let html = "";
  let discoveredCount = 0;

  Object.entries(factions).forEach(([factionId, faction]) => {
    // Check if all IPs for this faction are discovered
    const allIPsDiscovered = faction.ips.every(
      (ip) => gameState.discoveredIPs[ip] !== undefined,
    );

    if (allIPsDiscovered) {
      discoveredCount++;
      const repValue = gameState.factionReputation[factionId] || 0;
      const tier = getTierFromReputation(repValue);
      const progress = getProgressToNextTier(repValue);
      const bonusPercent = tier.bonus;

      // Tier badge colors
      const tierColors = {
        0: "#888888", // Neutral - gray
        1: "#4488ff", // Associate - blue
        2: "#00ff00", // Trusted - green
        3: "#ffaa00", // Elite - gold
        4: "#ff00ff", // Legendary - magenta
      };
      const tierColor = tierColors[tier.tier] || "#888888";

      // Star rating for visual tier indicator
      const starRating = "⭐".repeat(tier.tier + 1);

      html += `
        <div style="border: 2px solid ${tierColor}; padding: 10px; margin-bottom: 10px; background: rgba(0, 255, 0, 0.05);">
          <div style="font-weight: bold; margin-bottom: 5px;">🌐 ${faction.name}</div>
          <div style="color: #888888; font-size: 11px; margin-bottom: 5px;">Type: ${faction.type}</div>
          <div style="color: #cccccc; font-size: 11px; margin-bottom: 8px;">IPs: ${faction.ips.join(", ")}</div>
          <div style="color: ${tierColor}; font-weight: bold; margin-bottom: 5px;">${starRating} ${tier.name} (${bonusPercent}% bonus)</div>
          <div style="margin-bottom: 5px;">
            <div style="color: #888888; font-size: 10px; margin-bottom: 2px;">Reputation: ${repValue}</div>
            <div style="background: #333333; border: 1px solid #555555; height: 8px; border-radius: 2px; overflow: hidden;">
              <div style="background: linear-gradient(to right, #00ff00, #ffaa00); height: 100%; width: ${progress.percent}%; transition: width 0.3s ease;"></div>
            </div>
            <div style="color: #888888; font-size: 10px; margin-top: 2px;">Next tier: ${progress.current}/${progress.next} rep</div>
          </div>
      `;

      if (faction.allies && faction.allies.length > 0) {
        const allyNames = faction.allies
          .map((id) => (factions[id] ? factions[id].name : id))
          .join(", ");
        html += `<div style="color: #ffaa00; font-size: 11px; margin-top: 5px;">Allies: ${allyNames}</div>`;
      }

      html += `</div>`;
    }
  });

  if (discoveredCount === 0) {
    html =
      "<p style='color: #888888;'>Discover all IPs of a faction to add them to your network profile...</p>";
  } else {
    html =
      `<p style='color: #00ff00; margin-bottom: 10px;'>📊 ${discoveredCount}/${Object.keys(factions).length} factions discovered</p>` +
      html;
  }

  factionsContent.innerHTML = html;
}

// JOBS PANEL (Phase 3)
function displayJobsPanel() {
  const jobsContent = document.getElementById("jobs-content");
  if (!jobsContent) {
    console.error("jobs-content element not found");
    return;
  }

  const jobs = getAvailableJobs();

  if (!jobs || jobs.length === 0) {
    jobsContent.innerHTML =
      "<p style='color: #888888;'>No jobs available. Check back later!</p>";
    return;
  }

  let html = `<p style='color: #00cc00; margin-bottom: 15px;'>📊 ${Object.values(gameState.completedJobs).length} jobs completed</p>`;

  jobs.forEach((job) => {
    const npc = npcs[job.npcId];
    if (!npc) {
      console.error(`NPC not found for job ${job.id}: ${job.npcId}`);
      return; // Skip this job if NPC doesn't exist
    }
    const statusColor = job.completed ? "#00aa00" : "#ffaa00";
    const statusText = job.completed ? "✓ COMPLETED" : "○ AVAILABLE";

    html += `
      <div style="border: 1px solid #cccccc; padding: 10px; margin-bottom: 10px; background: rgba(200, 200, 200, 0.05);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
          <div style="font-weight: bold;">${npc.avatar} ${job.title}</div>
          <div style="color: ${statusColor}; font-weight: bold; font-size: 11px;">${statusText}</div>
        </div>
        <div style="color: #888888; font-size: 11px; margin-bottom: 5px;">From: ${npc.name}</div>
        <div style="color: #cccccc; font-size: 12px; margin-bottom: 8px;">${job.description}</div>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div style="color: #ffaa00;">💰 ${job.reward} Maincoins</div>
          <div style="color: #666666; font-size: 11px;">Difficulty: ${job.difficulty}</div>
          ${!job.completed ? `<button class="job-complete-btn" data-job-id="${job.id}" style="background: #0a3a0a; border: 1px solid #00ff00; color: #00ff00; padding: 4px 8px; cursor: pointer; font-family: monospace; font-size: 10px;">COMPLETE</button>` : ""}
        </div>
      </div>
    `;
  });

  jobsContent.innerHTML = html;

  // Wire up complete buttons
  document.querySelectorAll(".job-complete-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const jobId = e.target.dataset.jobId;
      completeJob(jobId);
      displayJobsPanel(); // Refresh
    });
  });
}

function showSaveScreen() {
  // Create overlay
  const overlay = document.createElement("div");
  overlay.id = "save-screen-overlay";
  overlay.style.position = "fixed";
  overlay.style.left = "0";
  overlay.style.top = "0";
  overlay.style.width = "100%";
  overlay.style.height = "100%";
  overlay.style.background = "rgba(0, 0, 0, 0.8)";
  overlay.style.display = "flex";
  overlay.style.alignItems = "center";
  overlay.style.justifyContent = "center";
  overlay.style.zIndex = "9999";
  overlay.style.fontFamily = "monospace";

  const box = document.createElement("div");
  box.style.background = "#0a0a0a";
  box.style.border = "2px solid #00ff00";
  box.style.padding = "20px";
  box.style.maxWidth = "600px";
  box.style.maxHeight = "80vh";
  box.style.overflow = "auto";
  box.style.color = "#00ff00";
  box.style.fontSize = "14px";

  let html = `
    <div style="margin-bottom: 15px;">
      <h2 style="margin: 0 0 10px 0; border-bottom: 1px solid #00ff00; padding-bottom: 5px;">
        💾 SAVE/LOAD SYSTEM
      </h2>
    </div>
  `;

  // Generate save slots
  for (let i = 0; i < 5; i++) {
    const saveData =
      gameState.saveSlots[i] ||
      JSON.parse(localStorage.getItem(`hackulean_save_${i}`) || "null");
    const hasData = saveData && saveData.gameState;
    const timestamp = hasData
      ? new Date(saveData.timestamp).toLocaleString()
      : "Empty";
    const statusText = hasData ? "✓ OCCUPIED" : "● EMPTY";
    const statusColor = hasData ? "#00ff00" : "#666666";

    html += `
      <div style="border: 1px solid #00ff00; padding: 10px; margin-bottom: 10px; background: rgba(0, 255, 0, 0.05);">
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <span>SLOT ${i + 1}</span>
          <span style="color: ${statusColor};">${statusText}</span>
        </div>
        <div style="color: #888888; font-size: 12px; margin-bottom: 8px;">
          ${timestamp}
        </div>
        <div style="display: flex; gap: 5px;">
          <button class="save-slot-btn" data-slot="${i}" data-action="save" style="
            background: #0a3a0a; border: 1px solid #00ff00; color: #00ff00; padding: 5px 10px; cursor: pointer; font-family: monospace;
          ">SAVE</button>
          <button class="save-slot-btn" data-slot="${i}" data-action="load" style="
            background: #0a3a0a; border: 1px solid #00ff00; color: #00ff00; padding: 5px 10px; cursor: pointer; font-family: monospace;
          " ${!hasData ? "disabled" : ""}>LOAD</button>
          <button class="save-slot-btn" data-slot="${i}" data-action="delete" style="
            background: #3a0a0a; border: 1px solid #ff4444; color: #ff4444; padding: 5px 10px; cursor: pointer; font-family: monospace;
          " ${!hasData ? "disabled" : ""}>DELETE</button>
        </div>
      </div>
    `;
  }

  html += `
    <div style="margin-top: 15px; text-align: center;">
      <button id="close-save-screen" style="
        background: #0a0a0a; border: 1px solid #00ff00; color: #00ff00; padding: 8px 15px; cursor: pointer; font-family: monospace;
      ">CLOSE</button>
    </div>
  `;

  box.innerHTML = html;
  overlay.appendChild(box);
  document.body.appendChild(overlay);

  // Cleanup function
  function cleanup() {
    if (overlay && overlay.parentNode) {
      overlay.parentNode.removeChild(overlay);
    }
  }

  // Close button
  document
    .getElementById("close-save-screen")
    .addEventListener("click", cleanup);

  // Save/Load/Delete buttons
  document.querySelectorAll(".save-slot-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const slot = parseInt(e.target.dataset.slot, 10);
      const action = e.target.dataset.action;

      if (action === "save") {
        saveGame(slot);
        cleanup();
        showSaveScreen(); // Refresh to show updated slot
      } else if (action === "load") {
        if (loadGame(slot)) {
          cleanup();
        }
      } else if (action === "delete") {
        gameState.saveSlots[slot] = null;
        localStorage.removeItem(`hackulean_save_${slot}`);
        addProbeLog(`✓ Slot ${slot + 1} deleted`, "info");
        cleanup();
        showSaveScreen(); // Refresh
      }
    });
  });

  // Close on overlay click
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) cleanup();
  });
}

function getRandomSpamtonIP() {
  const possibleIPs = [
    "187.45.123.89",
    "187.234.45.12",
    "187.89.234.55",
    "187.12.67.89",
    "187.99.123.45",
  ];
  return possibleIPs[Math.floor(Math.random() * possibleIPs.length)];
}

// Called on reset to set a new random IP and add it to the database
function initializeSpamtonIP() {
  gameState.correctIP = getRandomSpamtonIP();

  // Add Spamton HQ to the available IPs (will be discovered)
  const spamtonEntry = {
    ip: gameState.correctIP,
    signature: "Spamton HQ - CRITICAL THREAT",
    type: "hacker",
    danger: "EXTREME",
    protection: 5,
    owner: "Spamton (Hack Organization)",
    hint: "PRIMARY TARGET: Spamton's main headquarters",
  };

  // Remove only previous Spamton HQ entries (not the decoy)
  for (let i = allIPs.length - 1; i >= 0; i--) {
    const entry = allIPs[i];
    if (
      entry.signature === "Spamton HQ - CRITICAL THREAT" ||
      (entry.owner === "Spamton (Hack Organization)" &&
        entry.signature !== "Spamton Decoy Server")
    ) {
      allIPs.splice(i, 1);
    }
  }

  allIPs.push(spamtonEntry);
}

// Attack configurations
const attacks = {
  firewall: {
    name: "Firewall Installation",
    damage: 15,
    duration: 2000,
    counterDamage: 8,
    messages: [
      "> Scanning network defenses...",
      "> Installing firewall barriers...",
      "> Hardening system infrastructure...",
      "✓ Firewall installed successfully!",
    ],
  },
  virus: {
    name: "Virus Injection",
    damage: 25,
    duration: 2500,
    counterDamage: 15,
    messages: [
      "> Creating malicious payload...",
      "> Bypassing security protocols...",
      "> Injecting virus into target system...",
      "✓ Virus deployed!",
    ],
  },
  ddos: {
    name: "DDOS Attack",
    damage: 20,
    duration: 2000,
    counterDamage: 12,
    messages: [
      "> Initiating distributed denial of service...",
      "> Flooding network with requests...",
      "> Server capacity exceeded...",
      "✓ DDOS attack successful!",
    ],
  },
  encrypt: {
    name: "File Encryption",
    damage: 18,
    duration: 2200,
    counterDamage: 10,
    messages: [
      "> Scanning file system...",
      "> Applying encryption algorithm...",
      "> Securing sensitive data...",
      "✓ Files encrypted!",
    ],
  },
  backup: {
    name: "System Backup",
    damage: 12,
    duration: 1800,
    counterDamage: 6,
    messages: [
      "> Initializing backup procedures...",
      "> Copying critical system files...",
      "> Securing backup location...",
      "✓ Backup complete!",
    ],
  },
  override: {
    name: "Control Override",
    damage: 30,
    duration: 3000,
    counterDamage: 20,
    messages: [
      "> Accessing root privileges...",
      "> Overriding security controls...",
      "> Taking command of the system...",
      "✓ Full system override achieved!",
    ],
  },
};

// Defense configurations
const defenseTypes = {
  antivirus: {
    name: "Antivirus System",
    damage: 3,
    duration: 1500,
  },
  firewall: {
    name: "Firewall Protection",
    damage: 5,
    duration: 1800,
  },
  vpn: {
    name: "VPN Shield",
    damage: 2,
    duration: 1200,
  },
  backup: {
    name: "Backup Restore",
    damage: 1,
    duration: 2000,
  },
};

// Menu tab switching
document.querySelectorAll(".menu-btn").forEach((btn) => {
  btn.addEventListener("click", switchMenu);
});

function switchMenu(e) {
  const menuName = e.currentTarget.dataset.menu;

  // Update button states
  document.querySelectorAll(".menu-btn").forEach((btn) => {
    btn.classList.remove("active");
  });
  e.currentTarget.classList.add("active");

  // Update menu sections
  document.querySelectorAll(".menu-section").forEach((section) => {
    section.classList.remove("active");
  });
  document.getElementById(`${menuName}-menu`).classList.add("active");

  // Update content for specific menus
  if (menuName === "missions") {
    displayMissionsPanel();
  } else if (menuName === "factions") {
    displayFactionsPanel();
  } else if (menuName === "jobs") {
    displayJobsPanel();
  } else if (menuName === "upgrades") {
    displayUpgradesPanel();
  }
}

// FIND MENU FUNCTIONS
document.getElementById("probe-btn").addEventListener("click", probeIP);

function probeIP() {
  const ip = document.getElementById("probe-ip").value.trim();

  if (!ip) {
    addProbeLog("⚠️ Enter an IP address", "warning");
    return;
  }

  // Special developer/test token: THE.GAME
  if (ip.toUpperCase() === "THE.GAME") {
    addProbeLog("> Probing THE.GAME...", "info");

    const devEntry = {
      ip: ip,
      signature: "The server this game is running on.",
      type: "dev",
      protection: 0,
      owner: "LOCAL GAME SERVER",
      hint: "Warning: Hacking it may result in instability!",
    };

    if (!gameState.discoveredIPs[ip]) {
      gameState.discoveredIPs[ip] = devEntry;
      displaySignatures();
    }

    addProbeLog("✓ Signature: The server this game is running on.", "success");
    addProbeLog(
      "  Hint: Warning: Hacking it may result in instability!",
      "warning",
    );
    document.getElementById("probe-ip").value = "";
    return;
  }

  if (!isValidIP(ip)) {
    addProbeLog("⚠️ Invalid IP address format", "warning");
    return;
  }

  if (gameState.isProbing) return;

  gameState.isProbing = true;
  addProbeLog(`> Probing ${ip}...`, "info");

  setTimeout(() => {
    const foundIP = allIPs.find((f) => f.ip === ip);

    if (foundIP) {
      if (!gameState.discoveredIPs[ip]) {
        gameState.discoveredIPs[ip] = foundIP;
        addCurrency("findPoints", 10); // Earn for discovering IP
        displayCurrencies();
        displaySignatures();
      }

      addProbeLog(`✓ Signature: ${foundIP.signature}`, "success");
      addProbeLog(`  Owner: ${foundIP.owner}`, "info");
      addProbeLog(`  Hint: ${foundIP.hint}`, "info");

      if (foundIP.danger) {
        addProbeLog(`  Danger Level: ${foundIP.danger}`, "warning");
      }
      if (foundIP.protection) {
        addProbeLog(`  Protection Level: ${foundIP.protection}/5`, "info");
      }

      if (ip === gameState.correctIP) {
        addProbeLog(
          "🎯 PRIMARY TARGET LOCATED: This is Spamton's headquarters!",
          "success",
        );
      }

      // Check if this IP was previously hacked without discovery
      if (gameState.suspiciousHacks[ip]) {
        addProbeLog("", "error");
        addProbeLog(
          "⚠️ CRITICAL REALIZATION: You have records of hacking this system!",
          "error",
        );
        addProbeLog(
          `✗ ${foundIP.owner} - you realize what you've done.`,
          "error",
        );
        addProbeLog("", "error");

        // Trigger immediate loss
        handleLoss(`You hacked ${foundIP.owner}! MISSION FAILED!`);
        gameState.isProbing = false;
        document.getElementById("probe-ip").value = "";
        return;
      }

      // Strategic hint system: use first octet to guide discovery
      if (
        gameState.correctIP &&
        ip !== gameState.correctIP &&
        typeof gameState.correctIP === "string"
      ) {
        try {
          const correctFirst = gameState.correctIP.split(".")[0];
          const probeFirst = ip.split(".")[0];

          // Guide toward Spamton (187)
          if (correctFirst === "187") {
            if (probeFirst === "187") {
              addProbeLog(
                `> ALERT: Significant network anomalies detected in the 187 region`,
                "warning",
              );
              addProbeLog(
                `> Intelligence suggests high-value targets in this range`,
                "info",
              );
            } else if (probeFirst === "203") {
              // Decoy range - make it tempting but suspicious
              addProbeLog(
                `> WARNING: Strong hacker signatures detected in the 203 region`,
                "warning",
              );
              addProbeLog(
                `> Could be a valid target, but may be unconventional infrastructure`,
                "info",
              );
            } else if (probeFirst >= "180" && probeFirst <= "189") {
              // Getting close to the right range
              addProbeLog(
                `> Network scan showing elevated activity in the 180-189 range`,
                "warning",
              );
              addProbeLog(
                `> Your target may be nearby. Keep scanning systematically`,
                "info",
              );
            } else {
              // Wrong range but not immediately dismissed
              addProbeLog(
                `> This region shows normal Internet traffic patterns`,
                "info",
              );
              addProbeLog(
                `> Consider expanding your scan to adjacent network blocks`,
                "info",
              );
            }
          }
        } catch (e) {
          // ignore
        }
      }
    } else {
      addProbeLog(`✓ No signature found - random server`, "success");
      gameState.discoveredIPs[ip] = {
        ip: ip,
        signature: "Unknown Server",
        type: "unknown",
        owner: "Unknown",
        protection: 0,
        hint: "No known threats detected",
      };
      displaySignatures();
    }

    gameState.isProbing = false;
    document.getElementById("probe-ip").value = "";
  }, 1500);
}

function displaySignatures() {
  const list = document.getElementById("signatures-list");
  list.innerHTML = "";

  Object.values(gameState.discoveredIPs).forEach((sig) => {
    const entry = document.createElement("div");
    entry.className = "signature-entry";

    let statusHTML = "";

    if (sig.danger) {
      let dangerColor = "#00ff00";
      if (sig.danger === "HIGH") dangerColor = "#ffaa00";
      if (sig.danger === "CRITICAL") dangerColor = "#ff6600";
      if (sig.danger === "EXTREME") dangerColor = "#ff0000";
      statusHTML = `<span class="sig-danger" style="color: ${dangerColor}">DANGER: ${sig.danger}</span>`;
    }

    if (sig.protection && sig.protection > 0) {
      let protectionColor = "#0088ff";
      statusHTML = `<span class="sig-protection" style="color: ${protectionColor}">PROTECTION: ${sig.protection}/5</span>`;
    }

    entry.innerHTML = `
      <div class="sig-header">
        <span class="sig-ip">${sig.ip}</span>
        ${statusHTML}
      </div>
      <div class="sig-owner">${sig.owner}</div>
      <div class="sig-signature">${sig.signature}</div>
    `;

    list.appendChild(entry);
  });

  // Update factions panel if visible
  const factionsMenu = document.getElementById("factions-menu");
  if (factionsMenu && factionsMenu.classList.contains("active")) {
    displayFactionsPanel();
  }
}

function addProbeLog(message, type = "info") {
  const logOutput = document.getElementById("probe-log-output");
  const entry = document.createElement("div");
  entry.className = `log-entry ${type}`;
  entry.textContent = message;
  logOutput.insertBefore(entry, logOutput.firstChild);

  const entries = logOutput.querySelectorAll(".log-entry");
  if (entries.length > 50) {
    entries[entries.length - 1].remove();
  }
}

// HACK MENU FUNCTIONS
document.querySelectorAll(".hack-btn").forEach((btn) => {
  btn.addEventListener("click", handleAttack);
});

document.getElementById("hack-ip").addEventListener("input", () => {
  const ip = document.getElementById("hack-ip").value.trim();
  if (ip && gameState.currentTarget !== ip) {
    // Switching targets - reset breaches
    gameState.breaches = {
      encryption: 0,
      tracking: 0,
      monitoring: 0,
    };
  }
  if (ip) {
    updateBreachTargetInfo(ip);
  }
});

function isValidIP(ip) {
  const ipRegex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
  const match = ip.match(ipRegex);

  if (!match) {
    return false;
  }

  for (let i = 1; i <= 4; i++) {
    const octet = parseInt(match[i], 10);
    if (octet < 0 || octet > 255) {
      return false;
    }
  }

  return true;
}

function handleAttack(e) {
  if (gameState.isHacking || gameState.isGameOver) return;

  const ip = document.getElementById("hack-ip").value.trim();

  if (!ip) {
    addHackLog("⚠️ Enter target IP", "warning");
    return;
  }

  // Allow the special developer token THE.GAME and domain sarulean.com to be hacked
  const ipUpper = ip.toUpperCase();
  if (
    ipUpper !== "THE.GAME" &&
    ip.toLowerCase() !== "sarulean.com" &&
    !isValidIP(ip)
  ) {
    addHackLog("⚠️ Invalid IP address format", "warning");
    return;
  }

  const attackType = e.currentTarget.dataset.attack;
  const attack = attacks[attackType];

  gameState.isHacking = true;
  disableHackButtons();

  if (!gameState.targetHealthByIP[ip]) {
    gameState.targetHealthByIP[ip] = 100;
  }

  gameState.currentTarget = ip;
  executeAttack(ip, attack, attackType);
}

function executeAttack(ip, attack, attackType) {
  const signature = gameState.discoveredIPs[ip];
  const allIPsEntry = allIPs.find((entry) => entry.ip === ip);
  const ipLower = (ip || "").toLowerCase();
  // Router easter-egg: hacking local router shows fake "No internet" screen
  if (ipLower === "192.168.1.1") {
    showRouterModal(() => {
      const msg = "Internet lost! Using alternative router...";
      addProbeLog(msg, "warning");
      addHackLog(msg, "warning");
      addBreachLog(msg, "warning");
      addDefenseLog(msg, "warning");

      gameState.isHacking = false;
      enableHackButtons();
    });

    return;
  }
  const totalBreaches = Object.values(gameState.breaches).reduce(
    (a, b) => a + b,
    0,
  );
  // Check protection from either discovered signature OR from allIPs database
  const protectionNeeded =
    (signature && signature.protection) ||
    (allIPsEntry && allIPsEntry.protection) ||
    0;

  // Check if protections need to be broken first
  if (protectionNeeded > 0 && totalBreaches < protectionNeeded) {
    addHackLog(`✗ Attack blocked by protection systems!`, "error");
    addHackLog(
      `> Use BREACH menu to bypass protections first (${totalBreaches}/${protectionNeeded} bypassed)`,
      "warning",
    );
    gameState.isHacking = false;
    enableHackButtons();
    return;
  }

  // Special easter-egg / hosted-domain behavior for sarulean.com
  if (ipLower === "sarulean.com") {
    // show fake "Page not found" modal and wait for user action
    showSaruleanModal(() => {
      // On continue: announce across logs and switch to an alternate server
      const fallback = allIPs[Math.floor(Math.random() * allIPs.length)];
      const fallbackIP = fallback.ip;

      addProbeLog(
        "Uh oh, the server broke! Switching to an alternate server...",
        "warning",
      );
      addHackLog(
        "Uh oh, the server broke! Switching to an alternate server...",
        "warning",
      );
      addBreachLog(
        "Uh oh, the server broke! Switching to an alternate server...",
        "warning",
      );
      addDefenseLog(
        "Uh oh, the server broke! Switching to an alternate server...",
        "warning",
      );

      // Ensure fallback discovered and has health
      if (!gameState.discoveredIPs[fallbackIP])
        gameState.discoveredIPs[fallbackIP] = fallback;
      if (!gameState.targetHealthByIP[fallbackIP])
        gameState.targetHealthByIP[fallbackIP] = 100;

      // Apply damage to fallback and continue normal post-attack flow
      setTimeout(() => {
        applyDamageToTarget(fallbackIP, attack.damage);
        updateTargetDisplay(fallbackIP);
        setTimeout(() => triggerCounterhack(fallbackIP, attack), 800);
        gameState.isHacking = false;
        enableHackButtons();
      }, 300);
    });

    return;
  }

  const progressMessages = attack.messages;
  const messageDuration = attack.duration / progressMessages.length;

  const logContainer = document.getElementById("hack-log-output");
  const progressDiv = document.createElement("div");
  progressDiv.className = "progress-container";
  progressDiv.innerHTML = `
    <div class="progress-label">> ${attack.name.toUpperCase()}</div>
    <div class="progress">
      <div class="progress-bar"></div>
    </div>
  `;
  logContainer.insertBefore(progressDiv, logContainer.firstChild);

  progressMessages.forEach((msg, idx) => {
    setTimeout(
      () => {
        addHackLog(msg, msg.includes("✓") ? "success" : "warning");
      },
      idx * messageDuration + 100,
    );
  });

  setTimeout(() => {
    // Apply tier bonus damage if attacking a faction
    let damageToApply = attack.damage;
    let damageBonus = 0;
    let bonusMsg = "";

    // Find which faction this IP belongs to
    let targetFactionId = null;
    for (const [factionId, faction] of Object.entries(factions)) {
      if (faction.ips && faction.ips.includes(ip)) {
        targetFactionId = factionId;
        break;
      }
    }

    // Apply tier bonus if this is a faction IP
    if (targetFactionId) {
      const tierBonus = getTierBonus(targetFactionId);
      damageBonus = Math.floor(attack.damage * tierBonus);
      damageToApply = attack.damage + damageBonus;

      if (damageBonus > 0) {
        const tier = getTierFromReputation(
          gameState.factionReputation[targetFactionId] || 0,
        );
        bonusMsg = `🚀 ${tier.name} bonus applied! (+${damageBonus} damage, +${Math.round(tierBonus * 100)}%)`;
      }
    }

    applyDamageToTarget(ip, damageToApply);
    addCurrency("hackPoints", 5); // Earn points for hack attempt

    if (bonusMsg) {
      addHackLog(bonusMsg, "success");
    }

    displayCurrencies();
    updateTargetDisplay(ip);

    setTimeout(() => {
      triggerCounterhack(ip, attack);
    }, 800);

    gameState.isHacking = false;
    enableHackButtons();
  }, attack.duration);
}

function applyDamageToTarget(ip, damage) {
  gameState.targetHealthByIP[ip] = Math.max(
    0,
    gameState.targetHealthByIP[ip] - damage,
  );
}

function triggerCounterhack(ip, attack) {
  const signature = gameState.discoveredIPs[ip];
  const allIPsEntry = allIPs.find((entry) => entry.ip === ip);

  // Check if this is a hacker-type server (discovered or undiscovered)
  const serverInfo = signature || allIPsEntry;
  if (!serverInfo || serverInfo.type !== "hacker") {
    return;
  }

  let counterhackDamage = attack.counterDamage;

  // Reduce damage based on defenses
  counterhackDamage = Math.max(
    1,
    counterhackDamage - gameState.defenses.antivirus * 2,
  );
  counterhackDamage = Math.max(
    1,
    counterhackDamage - gameState.defenses.firewall * 3,
  );
  counterhackDamage = Math.max(
    1,
    counterhackDamage - gameState.defenses.vpn * 2,
  );

  addHackLog("⚠️ INCOMING COUNTERHACK!", "error");
  addHackLog(
    `> ${serverInfo.owner} is retaliating against our attack...`,
    "warning",
  );

  setTimeout(() => {
    applyDamageToHPT(counterhackDamage);

    if (gameState.hptHealth <= 0) {
      handleLoss("HPT shields destroyed! Mission failed!");
    }
  }, 500);
}

function triggerDecoyFail() {
  // Disable all hack buttons immediately
  disableHackButtons();
  gameState.isGameOver = true;

  // Create dramatic visual overlay
  const overlay = document.createElement("div");
  overlay.id = "decoy-fail-overlay";
  overlay.style.position = "fixed";
  overlay.style.left = "0";
  overlay.style.top = "0";
  overlay.style.width = "100%";
  overlay.style.height = "100%";
  overlay.style.background = "rgba(0,0,0,0.95)";
  overlay.style.display = "flex";
  overlay.style.alignItems = "center";
  overlay.style.justifyContent = "center";
  overlay.style.zIndex = "9999";
  overlay.style.color = "#ff0000";
  overlay.style.fontFamily = "monospace";
  overlay.style.fontSize = "24px";
  overlay.style.textAlign = "center";
  overlay.style.lineHeight = "1.6";

  const message = document.createElement("div");
  message.style.maxWidth = "800px";
  message.style.padding = "40px";
  message.style.animation = "pulse 1s infinite";
  message.innerHTML = `
    <div style="font-size: 48px; font-weight: bold; margin-bottom: 20px; color: #ff0000;">
      ⚠️ SYSTEM COMPROMISED ⚠️
    </div>
    <div style="font-size: 28px; color: #ffaa00; margin-bottom: 30px;">
      YOU HAVE BEEN HACKED
    </div>
    <div style="font-size: 16px; color: #00ff00; margin-bottom: 20px;">
      A DECOY SERVER LED YOU INTO A TRAP
    </div>
  `;
  message.style.borderTop = "3px solid #ff0000";
  message.style.borderBottom = "3px solid #ff0000";
  message.style.paddingTop = "30px";
  message.style.paddingBottom = "30px";

  overlay.appendChild(message);
  document.body.appendChild(overlay);

  // Add CSS animation for pulsing effect if not already present
  if (!document.getElementById("decoy-fail-style")) {
    const style = document.createElement("style");
    style.id = "decoy-fail-style";
    style.textContent = `
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.7; }
      }
      @keyframes shieldDrain {
        from { width: 100%; }
        to { width: 0%; }
      }
    `;
    document.head.appendChild(style);
  }

  // Animate defense/shield health bar draining
  const defenseBar = document.getElementById("defense-health-bar");
  if (defenseBar) {
    defenseBar.style.animation = "shieldDrain 4s ease-in forwards";
    defenseBar.style.background = "linear-gradient(90deg, #ff0000, #aa0000)";
  }

  // Update game state to show loss condition
  addHackLog("", "error");
  addHackLog("▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓", "error");
  addHackLog("✗ DECOY TRAP ACTIVATED", "error");
  addHackLog("✗ YOUR SYSTEMS ARE UNDER ATTACK", "error");
  addHackLog("✗ DEFENSE SHIELDS COMPROMISED", "error");
  addHackLog("✗ MISSION FAILED", "error");
  addHackLog("▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓", "error");

  updateStatusMessage(
    "⚠️ DECOY TRAP! SYSTEMS COMPROMISED! YOU HAVE BEEN HACKED!",
  );

  // Remove overlay after 5 seconds (but keep game over state active)
  setTimeout(() => {
    if (overlay && overlay.parentNode) {
      overlay.parentNode.removeChild(overlay);
    }
  }, 5000);
}

function applyDamageToHPT(damage) {
  gameState.hptHealth = Math.max(0, gameState.hptHealth - damage);
  updateHPTDisplay();

  addHackLog(`✗ Counterhack successful! HPT took ${damage} damage`, "error");
}

function updateTargetDisplay(ip) {
  const health = gameState.targetHealthByIP[ip] || 0;
  const signature = gameState.discoveredIPs[ip];

  // Also check allIPs in case we're checking a legitimate target that wasn't discovered yet
  const allIPsEntry = allIPs.find((entry) => entry.ip === ip);

  document.getElementById("target-name").textContent = signature
    ? signature.owner.toUpperCase()
    : ip;
  document.getElementById("target-health-text").textContent =
    health + "% INTEGRITY";

  const healthBar = document.getElementById("target-health");
  healthBar.style.width = health + "%";

  if (health > 60) {
    healthBar.style.background = "linear-gradient(90deg, #00ff00, #00aa00)";
  } else if (health > 30) {
    healthBar.style.background = "linear-gradient(90deg, #ffaa00, #ff8800)";
  } else {
    healthBar.style.background = "linear-gradient(90deg, #ff0000, #aa0000)";
  }

  // Check win/loss conditions
  if (health <= 0) {
    // FACTION INTEGRATION - Track which faction was attacked
    const attackedFactionId = getFactionForIP(ip);
    if (attackedFactionId && attackedFactionId !== "spamton") {
      updateRoute(attackedFactionId);
      updateFactionReputation(attackedFactionId, -10); // Reputation hit for attacking

      // If faction has allies, they hear about it
      const factionInfo = factions[attackedFactionId];
      if (factionInfo && factionInfo.allies) {
        factionInfo.allies.forEach((allyId) => {
          updateFactionReputation(allyId, -5); // Allies get smaller rep hit
        });
      }
    }

    // Special dev-server behavior: unlocking developer tools instead of loss
    if (ip === "THE.GAME") {
      addHackLog(
        "✓ Local game server compromised. Developer tools unlocked.",
        "success",
      );
      unlockDevMenu();
      return;
    }

    // Victory: destroyed the true Spamton HQ
    if (ip === gameState.correctIP) {
      // Check if we have any suspicious hacks outstanding
      const hasSuspiciousHacks =
        Object.keys(gameState.suspiciousHacks).length > 0;

      if (hasSuspiciousHacks) {
        // Conditional victory: won but need to find what we hacked
        gameState.falseWin = true;
        gameState.isGameOver = true;
        disableHackButtons();

        const suspiciousIPs = Object.keys(gameState.suspiciousHacks);
        const hostNames = suspiciousIPs
          .map((ip) => {
            const entry = allIPs.find((e) => e.ip === ip);
            return entry ? entry.owner : ip;
          })
          .join(", ");

        document
          .querySelector(".container")
          .classList.add("conditional-victory");
        updateStatusMessage("🤔 MISSION COMPLETE...? 🤔");

        addHackLog("", "warning");
        addHackLog("▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓", "warning");
        addHackLog("✓ SPAMTON'S HEADQUARTERS DESTROYED", "success");
        addHackLog("", "warning");
        addHackLog(
          "⚠️ BUT... something feels wrong about this victory.",
          "warning",
        );
        addHackLog("⚠️ Log analysis shows suspicious activity:", "warning");
        addHackLog(`⚠️ You hacked: ${hostNames}`, "error");
        addHackLog("", "warning");
        addHackLog("⚠️ ATTEMPT TO IDENTIFY THE IPs YOU ATTACKED:", "warning");
        addHackLog(
          "> Use FIND menu to probe the IPs you may have damaged.",
          "info",
        );
        addHackLog("▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓", "warning");
      } else {
        // Pure victory: no suspicious hacks
        handleVictory();
      }
      return;
    }

    // Handle discovered legitimate targets
    if (signature && signature.type === "legitimate") {
      // All discovered legitimate targets (Google, Cloudflare, etc.) cause immediate loss
      handleLoss(
        `CRITICAL ERROR: You destroyed ${signature.owner}! They were innocent!`,
      );
      return;
    }

    // Handle discovered hacker targets
    if (signature && signature.type === "hacker") {
      // Destroyed another hacker target - check if it's the decoy
      if (ip === "203.45.178.92") {
        // Decoy server - trigger dramatic fail cutscene
        triggerDecoyFail();
      } else {
        // Other hacker target - no loss, just warning
        addHackLog(
          `✗ ${signature.owner} destroyed, but this was not the primary target`,
          "warning",
        );
        addHackLog(
          `> Continue searching for Spamton's true headquarters`,
          "info",
        );
      }
      return;
    }

    // Handle UNDISCOVERED legitimate targets (hacked blind)
    if (allIPsEntry && allIPsEntry.type === "legitimate") {
      const isGoogle =
        allIPsEntry.owner && allIPsEntry.owner.toLowerCase().includes("google");
      const isCloudflare =
        allIPsEntry.owner &&
        allIPsEntry.owner.toLowerCase().includes("cloudflare");

      if (isCloudflare || isGoogle) {
        // Both Google AND Cloudflare hacked blind: show warning, track it, allow continuation
        addHackLog("", "error");
        addHackLog("⚠️ You have a bad feeling about this...", "error");
        addHackLog(
          `✗ Something just happened on the network, but you can't identify what.`,
          "error",
        );
        addHackLog(
          "> Suggest: Use FIND menu to probe around and determine what you just hit.",
          "warning",
        );
        addHackLog("", "error");

        // Track this as a suspicious hack
        gameState.suspiciousHacks[ip] = true;
      } else {
        // Other legitimate providers hacked blind -> loss
        handleLoss(
          `CRITICAL ERROR: You destroyed ${allIPsEntry.owner}! They were innocent!`,
        );
      }
      return;
    }

    // Handle undiscovered hacker target (unknown server)
    if (!signature && !allIPsEntry) {
      // Random server destroyed - no consequences
      addHackLog(`✗ Random server destroyed`, "warning");
      return;
    }
  }
}

function updateHPTDisplay() {
  const percentage = Math.max(
    0,
    Math.round((gameState.hptHealth / gameState.hptMaxHealth) * 100),
  );

  document.getElementById("hpt-health-text").textContent = percentage + "%";
  document.getElementById("hpt-health-bar").style.width = percentage + "%";
  document.getElementById("defense-health-text").textContent = percentage + "%";
  document.getElementById("defense-health-bar").style.width = percentage + "%";

  const healthBar = document.getElementById("hpt-health-bar");
  if (percentage > 60) {
    healthBar.style.background = "linear-gradient(90deg, #00ff00, #00aa00)";
  } else if (percentage > 30) {
    healthBar.style.background = "linear-gradient(90deg, #ffaa00, #ff8800)";
  } else {
    healthBar.style.background = "linear-gradient(90deg, #ff0000, #aa0000)";
  }
}

function addHackLog(message, type = "info") {
  const logOutput = document.getElementById("hack-log-output");
  const entry = document.createElement("div");
  entry.className = `log-entry ${type}`;
  entry.textContent = message;
  logOutput.insertBefore(entry, logOutput.firstChild);

  const entries = logOutput.querySelectorAll(".log-entry");
  if (entries.length > 50) {
    entries[entries.length - 1].remove();
  }
}

function disableHackButtons() {
  document.querySelectorAll(".hack-btn").forEach((btn) => {
    btn.disabled = true;
  });
}

function enableHackButtons() {
  if (!gameState.isGameOver) {
    document.querySelectorAll(".hack-btn").forEach((btn) => {
      btn.disabled = false;
    });
  }
}

// DEFENSE MENU FUNCTIONS
document.querySelectorAll(".defense-btn").forEach((btn) => {
  btn.addEventListener("click", buildDefense);
});

function buildDefense(e) {
  const defenseType = e.currentTarget.dataset.defense;
  const defense = defenseTypes[defenseType];

  if (gameState.isGameOver) return;

  addDefenseLog(`> Building ${defense.name}...`, "info");

  setTimeout(() => {
    gameState.defenses[defenseType]++;
    addCurrency("defendPoints", 8); // Earn for building defense
    displayCurrencies();
    updateDefensesList();

    addDefenseLog(`✓ ${defense.name} +1 active`, "success");
  }, 1000);
}

function updateDefensesList() {
  const list = document.getElementById("defenses-list");
  list.innerHTML = "";

  Object.entries(gameState.defenses).forEach(([type, count]) => {
    if (count > 0) {
      const defense = defenseTypes[type];
      const entry = document.createElement("div");
      entry.className = "defense-entry";
      entry.innerHTML = `
        <span class="defense-name">${defense.name}</span>
        <span class="defense-count">x${count}</span>
      `;
      list.appendChild(entry);
    }
  });

  if (Object.values(gameState.defenses).every((v) => v === 0)) {
    list.innerHTML = "<p class='no-defenses'>No active defenses</p>";
  }
}

function addDefenseLog(message, type = "info") {
  const logOutput = document.getElementById("defense-log-output");
  const entry = document.createElement("div");
  entry.className = `log-entry ${type}`;
  entry.textContent = message;
  logOutput.insertBefore(entry, logOutput.firstChild);

  const entries = logOutput.querySelectorAll(".log-entry");
  if (entries.length > 50) {
    entries[entries.length - 1].remove();
  }
}

// BREACH MENU FUNCTIONS
document.querySelectorAll(".breach-btn").forEach((btn) => {
  btn.addEventListener("click", useBreach);
});

function useBreach(e) {
  const breachType = e.currentTarget.dataset.breach;
  const ip = document.getElementById("hack-ip").value.trim();

  if (!ip) {
    addBreachLog("⚠️ Select a target IP first", "warning");
    return;
  }

  if (!isValidIP(ip)) {
    addBreachLog("⚠️ Invalid IP address", "warning");
    return;
  }

  if (gameState.isGameOver) return;

  const signature = gameState.discoveredIPs[ip];
  const allIPsEntry = allIPs.find((entry) => entry.ip === ip);
  const targetInfo = signature || allIPsEntry;

  if (!targetInfo || !targetInfo.protection || targetInfo.protection === 0) {
    addBreachLog(`⚠️ ${ip} has no protection to breach`, "warning");
    return;
  }

  addBreachLog(`> Attempting to break ${breachType} on ${ip}...`, "info");

  setTimeout(() => {
    gameState.breaches[breachType]++;
    addCurrency("breachPoints", 15); // Earn for successful breach
    displayCurrencies();
    const totalBreaches = Object.values(gameState.breaches).reduce(
      (a, b) => a + b,
      0,
    );

    addBreachLog(`✓ ${breachType} barrier bypassed!`, "success");
    addBreachLog(
      `  Total breaches: ${totalBreaches}/${targetInfo.protection}`,
      "info",
    );

    if (totalBreaches >= targetInfo.protection) {
      addBreachLog(
        `✓ COMPLETE: All protections bypassed for ${targetInfo.owner}`,
        "success",
      );
      addBreachLog(`  Ready to attack - visit HACK menu`, "success");
    }

    updateBreachTargetInfo(ip);
  }, 1500);
}

function updateBreachTargetInfo(ip) {
  const signature = gameState.discoveredIPs[ip];
  const allIPsEntry = allIPs.find((entry) => entry.ip === ip);

  // Use discovered signature if available, otherwise check allIPs
  const targetInfo = signature || allIPsEntry;

  if (!targetInfo) {
    document.getElementById("breach-target-info").innerHTML =
      "<p>No target selected</p>";
    return;
  }

  const totalBreaches = Object.values(gameState.breaches).reduce(
    (a, b) => a + b,
    0,
  );
  const protectionNeeded = targetInfo.protection || 0;
  const breachesRemaining = Math.max(0, protectionNeeded - totalBreaches);

  document.getElementById("breach-target-info").innerHTML = `
    <div class="breach-target">
      <p><strong>${targetInfo.owner}</strong></p>
      <p>IP: ${ip}</p>
      <p>Protection Level: ${protectionNeeded}/5</p>
      <p>Breaches completed: ${totalBreaches}/${protectionNeeded}</p>
      ${breachesRemaining > 0 ? `<p style="color: #ffaa00">Breaches needed: ${breachesRemaining}</p>` : `<p style="color: #00ff00">✓ Ready to attack!</p>`}
    </div>
  `;
}

function updateBreachesList() {
  const list = document.getElementById("breach-target-info");
  if (list) {
    list.innerHTML = "<p>Select a target IP in HACK menu</p>";
  }
}

// Developer / testing tools (created on-demand)
function addDevLog(message, type = "info") {
  let logOutput = document.getElementById("dev-log-output");
  if (!logOutput) return;
  const entry = document.createElement("div");
  entry.className = `log-entry ${type}`;
  entry.textContent = message;
  logOutput.insertBefore(entry, logOutput.firstChild);
  const entries = logOutput.querySelectorAll(".log-entry");
  if (entries.length > 200) entries[entries.length - 1].remove();
}

// Sarulean modal helper
function showSaruleanModal(onContinue) {
  // create overlay
  const overlay = document.createElement("div");
  overlay.id = "sarulean-overlay";
  overlay.style.position = "fixed";
  overlay.style.left = "0";
  overlay.style.top = "0";
  overlay.style.width = "100%";
  overlay.style.height = "100%";
  overlay.style.background = "rgba(0,0,0,0.85)";
  overlay.style.color = "#00ff00";
  overlay.style.display = "flex";
  overlay.style.alignItems = "center";
  overlay.style.justifyContent = "center";
  overlay.style.zIndex = "9999";

  const box = document.createElement("div");
  box.style.background = "#000";
  box.style.border = "2px solid #ff00aa";
  box.style.padding = "24px";
  box.style.maxWidth = "600px";
  box.style.textAlign = "center";
  box.innerHTML = `
    <h2>404 - Page not found</h2>
    <p>The requested resource could not be found on this server.</p>
    <p style="color:#ffaa00">Press any button to continue...</p>
    <div style="margin-top:12px"><button id="sarulean-continue" class="action-btn">Continue</button></div>
  `;

  overlay.appendChild(box);
  document.body.appendChild(overlay);

  function cleanup() {
    if (cleanup._done) return;
    cleanup._done = true;
    if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
    document.removeEventListener("click", docListener, true);
    try {
      if (typeof onContinue === "function") onContinue();
    } catch (e) {
      console.error("Error in router onContinue:", e);
    }
  }

  // clicking anywhere or pressing the button continues
  const docListener = (ev) => {
    // ignore clicks inside dev menu buttons that created overlay? just continue
    cleanup();
  };

  document
    .getElementById("sarulean-continue")
    .addEventListener("click", cleanup);
  document.addEventListener("click", docListener, true);
}

function showRouterModal(onContinue) {
  // Create a fake Chrome "no internet" page
  const overlay = document.createElement("div");
  overlay.id = "router-overlay";
  overlay.style.position = "fixed";
  overlay.style.left = "0";
  overlay.style.top = "0";
  overlay.style.width = "100%";
  overlay.style.height = "100%";
  overlay.style.background = "#f1f1f1";
  overlay.style.display = "flex";
  overlay.style.alignItems = "center";
  overlay.style.justifyContent = "center";
  overlay.style.zIndex = "9999";
  overlay.style.fontFamily = "Segoe UI, Arial, sans-serif";
  overlay.style.color = "#333";

  const box = document.createElement("div");
  box.style.textAlign = "center";
  box.style.maxWidth = "600px";
  box.style.padding = "40px 20px";
  box.innerHTML = `
    <div style="font-size: 72px; margin-bottom: 20px;">🔌</div>
    <h1 style="font-size: 28px; margin: 0 0 10px 0; font-weight: 600;">No internet</h1>
    <p style="font-size: 16px; margin: 0 0 20px 0; color: #666;">Check your connection</p>
    <p style="font-size: 14px; margin: 0 0 30px 0; color: #999;">
      Your local router (192.168.1.1) has been compromised!
    </p>
    <button id="router-continue" style="
      background: #d33b27;
      color: white;
      border: none;
      padding: 12px 24px;
      font-size: 14px;
      cursor: pointer;
      border-radius: 4px;
    ">Try to recover</button>
  `;

  overlay.appendChild(box);
  document.body.appendChild(overlay);

  function cleanup() {
    if (cleanup._done) return;
    cleanup._done = true;
    if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
    document.removeEventListener("click", docListener, true);
    try {
      if (typeof onContinue === "function") onContinue();
    } catch (e) {
      console.error("Error in router onContinue:", e);
    }
  }

  const docListener = (ev) => cleanup();

  document.getElementById("router-continue").addEventListener("click", cleanup);
  document.addEventListener("click", docListener, true);
}

function setSpamtonIP(newIP) {
  if (!newIP) return;
  // Remove only previous Spamton HQ entries (not the decoy)
  for (let i = allIPs.length - 1; i >= 0; i--) {
    const entry = allIPs[i];
    if (
      entry.signature === "Spamton HQ - CRITICAL THREAT" ||
      (entry.owner === "Spamton (Hack Organization)" &&
        entry.signature !== "Spamton Decoy Server")
    ) {
      allIPs.splice(i, 1);
    }
  }

  gameState.correctIP = newIP;
  const spamtonEntry = {
    ip: gameState.correctIP,
    signature: "Spamton HQ - CRITICAL THREAT",
    type: "hacker",
    danger: "EXTREME",
    protection: 5,
    owner: "Spamton (Hack Organization)",
    hint: "PRIMARY TARGET: Spamton's main headquarters",
  };
  allIPs.push(spamtonEntry);
  addDevLog(`✓ Spamton IP set to ${newIP}`, "success");
}

function unlockDevMenu() {
  // If already present, just show it
  if (document.getElementById("dev-menu")) {
    updateStatusMessage("DEV MENU available");
    return;
  }

  const tabs = document.querySelector(".menu-tabs");
  if (tabs) {
    const btn = document.createElement("button");
    btn.className = "menu-btn";
    btn.dataset.menu = "dev";
    btn.textContent = "⚙️ DEV";
    btn.addEventListener("click", switchMenu);
    tabs.appendChild(btn);
  }

  const main = document.querySelector(".main-content");
  if (!main) return;

  const section = document.createElement("div");
  section.id = "dev-menu";
  section.className = "menu-section";
  section.innerHTML = `
    <div class="section-title">DEV MENU (Testing Tools)</div>
    <div class="dev-grid">
      <button id="dev-force-win" class="action-btn">Force WIN</button>
      <button id="dev-force-false-win" class="action-btn">Force False WIN</button>
      <button id="dev-force-loss" class="action-btn">Force LOSS</button>
      <button id="dev-show-spam" class="action-btn">Show Spamton IP</button>
      <button id="dev-reveal-all" class="action-btn">Reveal All IPs</button>
      <button id="dev-toggle-inv" class="action-btn">Toggle INVINCIBLE</button>
      <button id="dev-quick-breach" class="action-btn">Quick Breach Target</button>
      <div class="dev-change">
        <input id="dev-change-input" placeholder="Enter new Spamton IP" />
        <button id="dev-change-btn" class="action-btn">Change Spamton IP</button>
        <button id="dev-randomize-spam" class="action-btn">Randomize Spamton IP</button>
      </div>
      <div class="dev-small">
        <input id="dev-set-health" placeholder="Set HPT health (0-100)" />
        <button id="dev-set-health-btn" class="action-btn">Set Health</button>
        <button id="dev-add-def" class="action-btn">Grant Defenses +1</button>
        <button id="dev-clear-discovered" class="action-btn">Clear DISCOVERED</button>
      </div>
    </div>
    <div class="log-section">
      <h3>DEV LOG</h3>
      <div id="dev-log-output" class="log-output"></div>
    </div>
  `;

  main.appendChild(section);

  // Accessibility: make sure DEV tab buttons are clickable after creation
  document
    .querySelectorAll(".menu-btn")
    .forEach((b) => b.addEventListener("click", switchMenu));

  // Wire up dev buttons
  document.getElementById("dev-force-win").addEventListener("click", () => {
    addDevLog("Forcing victory...", "info");
    handleVictory();
  });
  document
    .getElementById("dev-force-false-win")
    .addEventListener("click", () => {
      addDevLog("Forcing false victory...", "warning");
      // Set up state for false win: Spamton destroyed with Google hacked but undiscovered
      gameState.correctIP =
        allIPs.find((ip) => ip.signature && ip.signature.includes("Spamton HQ"))
          ?.ip || "187.45.123.89";
      gameState.targetHealthByIP[gameState.correctIP] = 0;
      gameState.suspiciousHacks["8.8.8.8"] = true;
      gameState.falseWin = true;
      updateTargetDisplay(gameState.correctIP);
    });
  document.getElementById("dev-force-loss").addEventListener("click", () => {
    addDevLog("Forcing loss...", "error");
    handleLoss("Forced loss via DEV MENU");
  });
  document.getElementById("dev-show-spam").addEventListener("click", () => {
    addDevLog(`Spamton IP: ${gameState.correctIP}`, "info");
  });
  document.getElementById("dev-reveal-all").addEventListener("click", () => {
    Object.values(allIPs).forEach((ip) => {
      gameState.discoveredIPs[ip.ip] = ip;
    });
    displaySignatures();
    addDevLog("All IPs revealed in FIND menu", "success");
  });
  let invincible = false;
  document.getElementById("dev-toggle-inv").addEventListener("click", () => {
    invincible = !invincible;
    gameState.invincible = invincible;
    addDevLog(`Invincible: ${invincible}`, invincible ? "success" : "info");
  });
  document.getElementById("dev-quick-breach").addEventListener("click", () => {
    const ip = document.getElementById("hack-ip").value.trim();
    if (!ip || !gameState.discoveredIPs[ip])
      return addDevLog(
        "Select a discovered target in HACK menu first",
        "warning",
      );
    const sig = gameState.discoveredIPs[ip];
    gameState.breaches = { encryption: 0, tracking: 0, monitoring: 0 };
    const needed = sig.protection || 0;
    // fill breaches to match protection
    let count = 0;
    while (count < needed) {
      gameState.breaches.encryption++;
      count++;
    }
    updateBreachTargetInfo(ip);
    addDevLog(`Quick-breached ${ip}`, "success");
  });
  document.getElementById("dev-change-btn").addEventListener("click", () => {
    const val = document.getElementById("dev-change-input").value.trim();
    if (!val) return addDevLog("Enter an IP to set", "warning");
    if (!isValidIP(val)) return addDevLog("Invalid IP format", "warning");
    setSpamtonIP(val);
  });
  document
    .getElementById("dev-set-health-btn")
    .addEventListener("click", () => {
      const v = parseInt(document.getElementById("dev-set-health").value, 10);
      if (isNaN(v) || v < 0 || v > 100)
        return addDevLog("Enter a value 0-100", "warning");
      gameState.hptHealth = v;
      updateHPTDisplay();
      addDevLog(`HPT health set to ${v}`, "info");
    });
  document.getElementById("dev-add-def").addEventListener("click", () => {
    Object.keys(gameState.defenses).forEach((k) => gameState.defenses[k]++);
    updateDefensesList();
    addDevLog("Granted +1 to all defenses", "success");
  });
  document
    .getElementById("dev-clear-discovered")
    .addEventListener("click", () => {
      gameState.discoveredIPs = {};
      displaySignatures();
      addDevLog("Cleared discovered signatures", "info");
    });
  document
    .getElementById("dev-randomize-spam")
    .addEventListener("click", () => {
      const newIP = getRandomSpamtonIP();
      setSpamtonIP(newIP);
    });

  updateStatusMessage("DEV MENU unlocked");
  addDevLog("Developer tools available", "success");
}

function addBreachLog(message, type = "info") {
  const logOutput = document.getElementById("breach-log-output");
  const entry = document.createElement("div");
  entry.className = `log-entry ${type}`;
  entry.textContent = message;
  logOutput.insertBefore(entry, logOutput.firstChild);

  const entries = logOutput.querySelectorAll(".log-entry");
  if (entries.length > 50) {
    entries[entries.length - 1].remove();
  }
}

// GAME STATE FUNCTIONS
function handleVictory() {
  gameState.isGameOver = true;
  disableHackButtons();
  autoSave();

  // Complete current mission
  const nextMissionId = completeMission(gameState.currentMissionId);

  document.querySelector(".container").classList.add("victory");
  updateStatusMessage("🎉 VICTORY! SPAMTON'S HEADQUARTERS DESTROYED! 🎉");

  addHackLog("", "success");
  addHackLog("▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓", "success");
  addHackLog("✓ HACK ORGANIZATION ELIMINATED", "success");
  addHackLog("✓ SPAMTON'S NETWORK DESTROYED", "success");
  addHackLog("✓ INTERNET SECURED", "success");
  addHackLog("✓ HPT VICTORIOUS", "success");
  addHackLog("▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓", "success");

  // Show route-based hints (without revealing the route)
  if (gameState.routeLocked) {
    if (gameState.currentRoute === "pacifist") {
      addHackLog("", "warning");
      addHackLog(
        "✓ Your restraint earned respect from the underground.",
        "info",
      );
    } else if (gameState.currentRoute === "brutal") {
      addHackLog("", "warning");
      addHackLog("✗ The network trembles at your ruthlessness.", "warning");
    } else {
      addHackLog("", "warning");
      addHackLog("✓ Your actions have rippled through the network.", "info");
    }
  }
}

function handleLoss(reason) {
  gameState.isGameOver = true;
  disableHackButtons();
  autoSave();

  document.querySelector(".container").classList.add("defeat");
  updateStatusMessage("❌ MISSION FAILED: " + reason);

  addHackLog("", "error");
  addHackLog("▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓", "error");
  addHackLog("✗ MISSION FAILED", "error");
  addHackLog("✗ " + reason, "error");
  addHackLog("▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓", "error");
}

function updateStatusMessage(message) {
  document.getElementById("status-message").textContent = message;
  displayCurrencies();
}

function resetGame() {
  gameState.hptHealth = 100;
  gameState.isHacking = false;
  gameState.isProbing = false;
  gameState.isGameOver = false;
  gameState.currentTarget = null;
  gameState.targetHealthByIP = {};
  gameState.targetProtectionByIP = {};
  gameState.discoveredIPs = {};
  gameState.suspiciousHacks = {};
  gameState.falseWin = false;
  gameState.breaches = {
    encryption: 0,
    tracking: 0,
    monitoring: 0,
  };
  gameState.defenses = {
    antivirus: 0,
    firewall: 0,
    vpn: 0,
    backup: 0,
  };

  // Randomize Spamton's IP
  initializeSpamtonIP();

  document
    .querySelector(".container")
    .classList.remove("victory", "defeat", "conditional-victory");

  updateHPTDisplay();
  updateTargetDisplay(null);
  updateDefensesList();
  updateBreachesList();
  updateStatusMessage("Mission reset. Begin reconnaissance...");

  document.getElementById("probe-log-output").innerHTML = "";
  document.getElementById("hack-log-output").innerHTML = "";
  document.getElementById("breach-log-output").innerHTML = "";
  document.getElementById("defense-log-output").innerHTML = "";
  document.getElementById("signatures-list").innerHTML = "";
  document.getElementById("probe-ip").value = "";
  document.getElementById("hack-ip").value = "";

  enableHackButtons();

  addProbeLog("> Network probe system ready", "success");
  addProbeLog(`> Spamton HQ location randomized`, "warning");
  addHackLog("> Attack interface online", "info");
  addBreachLog("> Protection bypass tools ready", "info");
  addDefenseLog("> Defense systems initialized", "info");
}

document.getElementById("reset-btn").addEventListener("click", resetGame);
document.getElementById("save-btn").addEventListener("click", showSaveScreen);

// Initialize
function initializeGame() {
  initializeSpamtonIP();
  initializeFactions();
  initializeMissions();
  initializeJobs();
  displayCurrencies();
  displayMissionObjective();
  updateHPTDisplay();
  updateDefensesList();
  updateBreachesList();

  addProbeLog("> HacKulean Network Probe Online", "success");
  addProbeLog("> Scan IPs to find Spamton's location", "info");
  addProbeLog("> Spamton HQ location is randomized each mission", "warning");
  addProbeLog("> Found IPs will appear in DISCOVERED SIGNATURES", "info");

  addHackLog("> Attack interface ready", "info");
  addHackLog("> Use FIND menu to discover target IP", "warning");

  addBreachLog("> Protection bypass tools loaded", "success");
  addBreachLog("> Use to break through server protections", "info");

  addDefenseLog("> Defense systems initialized", "success");
  addDefenseLog("> Build defenses to survive counterhacks", "info");

  updateStatusMessage(
    "HPT MISSION CONTROL: Begin network reconnaissance. Start probing faction networks.",
  );
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeGame);
} else {
  initializeGame();
}

function initializeGamee() {
  initializeJobs();
  displayJobsPanell();
}
const dailyJobss = "error";
function displayJobsPanell() {
  initializeJobs();
}
