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
    applyDamageToTarget(ip, attack.damage);
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

  document.querySelector(".container").classList.add("victory");
  updateStatusMessage("🎉 VICTORY! SPAMTON'S HEADQUARTERS DESTROYED! 🎉");

  addHackLog("", "success");
  addHackLog("▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓", "success");
  addHackLog("✓ HACK ORGANIZATION ELIMINATED", "success");
  addHackLog("✓ SPAMTON'S NETWORK DESTROYED", "success");
  addHackLog("✓ INTERNET SECURED", "success");
  addHackLog("✓ HPT VICTORIOUS", "success");
  addHackLog("▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓", "success");
}

function handleLoss(reason) {
  gameState.isGameOver = true;
  disableHackButtons();

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

// Initialize
function initializeGame() {
  initializeSpamtonIP();
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
    "Mission briefing: Locate and defeat Spamton (location randomized)",
  );
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeGame);
} else {
  initializeGame();
}
