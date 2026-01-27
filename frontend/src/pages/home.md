---
layout: layouts/page.njk
title: "Digitaler Leitfaden für den Bau-Turbo"
permalink: /
templateEngineOverride: njk
---

<section class="content-container mt-12">
  <div class="grid lg:grid-cols-12 gap-10 items-start">
    <div class="lg:col-span-7">
      <span class="badge">Umsetzungslabor für den Bau-Turbo</span>
      <h1 class="mt-6 text-4xl md:text-5xl font-bold text-primary leading-tight">Digitaler Leitfaden für den Bau-Turbo</h1>
      <p class="mt-5 text-lg text-theme-muted leading-relaxed">
        Ein Kollaborationsprojekt der Bauwende Allianz (initiiert von ProiectTogether), gemeinsam mit dem Bundesministerium
        für Wohnen, Stadtentwicklung und Bauwesen (BMWSB) und dem Deutschen Institut für Urbanıstik (Ditu)
      </p>
    </div>
  </div>
</section>

<section class="content-container mt-12">
  <span class="badge">Praxiswissen fuer den Bau-Turbo</span>
  <h2 class="mt-4 text-3xl font-bold text-primary">Der Bau-Turbo in der Praxis</h2>
  <p class="mt-4 text-xl font-semibold text-theme">Wissen sammeln, Klarheit schaffen, Umsetzung beschleunigen.</p>
  <p class="mt-4 text-lg text-theme-muted leading-relaxed">
    Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna
    aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
    Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint
    occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
  </p>
  <p class="mt-4 text-lg text-theme-muted leading-relaxed">
    Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna
    aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
    Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint
    occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
  </p>
  <div class="section-divider"></div>
</section>

<section class="content-container mt-12">
  <span class="badge">Gemeinsam gelernt und festgehalten</span>
  <h2 class="mt-4 text-3xl font-bold text-primary">Arbeitshilfen für den Bau-Turbo</h2>
  <p class="mt-3 text-xl font-semibold text-theme">Lorem ipsum dolor sit amet, consectetur adipiscing elit</p>
  <p class="mt-4 text-lg text-theme-muted leading-relaxed">
    Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
    Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
  </p>
</section>

{% set boxes = [
  { title: "Checklisten", url: "/checklisten", description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt" },
  { title: "Regeln, Verfahren und Abläufe", url: "/regeln", description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt" },
  { title: "Best Practices", url: "/best-practices", description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt" },
  { title: "Argumentationsgrundlagen", url: "/argumente", description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt" }
] %}

{% include "components/four-box-links.njk" %}

<section class="content-container mt-12">
  <div class="section-divider"></div>
</section>

<section class="content-container mt-12">
  <span class="badge">Wissenssammlung</span>
  <h2 class="mt-4 text-3xl font-bold text-primary">Arbeitshilfen fuer den Bau-Turbo</h2>
  <p class="mt-4 text-xl font-semibold text-theme">Geteiltes  Wissen als Grundlage fuer gute Entscheidungen und schnellere Umsetzung.</p>
  <p class="mt-4 text-lg text-theme-muted leading-relaxed">
    Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
    Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure
    dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat
    non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
  </p>
  <p class="mt-4 text-lg text-theme-muted leading-relaxed">
    Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
    Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure
    dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat
    non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
  </p>
</section>

{% include "components/directories-tabs.njk" %}

<section class="content-container mt-12">
  <div class="section-divider"></div>
  <h2 class="mt-6 text-3xl font-bold text-primary">Gemeinsam den Wissenstand erweitern</h2>
  <p class="mt-4 text-lg text-theme-muted leading-relaxed">
    Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
    Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
  </p>
  <p class="mt-4 text-lg text-theme-muted leading-relaxed">
    Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint
    occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
  </p>
</section>
