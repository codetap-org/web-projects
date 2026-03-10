import gsap from "https://esm.sh/gsap";

lucide.createIcons();

const CONFIG = {
  selectors: {
    dock: "#dock",
    pill: "#pill",
    tabs: ".tab",
    panels: ".panel",
    panelItems: ".item"
  },
  classes: {
    active: "is-active",
    open: "is-open",
    hoverIndicator: "item-hover-indicator",
    pillVisible: "is-visible"
  },
  attributes: {
    panel: "data-panel"
  }
};

const MOTION = {
  duration: {
    fast: 0.15,
    base: 0.25
  },
  ease: {
    pill: "power3.inOut",
    hover: "power3.out",
    fade: "power1.out"
  }
};

/**
 * @typedef {object} DockElements
 * @property {HTMLElement} dock Root dock container element.
 * @property {HTMLElement} pill Tab highlight background element.
 * @property {HTMLElement[]} tabs Tab button elements in render order.
 * @property {Map<string, HTMLElement>} panelsById Panels indexed by `data-panel`.
 * @property {Map<string, HTMLElement>} tabsByPanelId First tab button indexed by `data-panel`.
 */

/**
 * @typedef {object} HoverEntry
 * @property {HTMLElement} indicator Per-panel hover indicator element.
 * @property {HTMLElement | null} activeItem Last hovered or focused panel item.
 * @property {boolean} isVisible Whether the indicator is currently visible.
 */

export class DockNavigation {
  /** @type {{ activePanelId: string | null, isOpen: boolean }} */
  #state = {
    activePanelId: null,
    isOpen: false
  };

  /** @type {DockElements | null} */
  #elements = null;

  /** @type {Map<HTMLElement, HoverEntry>} */
  #panelHoverState = new Map();

  constructor() {
    this.#init();
  }

  // Lifecycle
  #init() {
    const elements = this.#cacheElements();
    if (!elements) {
      return;
    }

    this.#elements = elements;
    this.#setupPanels();
    this.#bindEvents();

    this.#renderTabs();
    this.#renderPill({ immediate: true });
    this.#renderDockState();
  }

  #cacheElements() {
    const dock = document.querySelector(CONFIG.selectors.dock);
    const pill = document.querySelector(CONFIG.selectors.pill);

    if (!(dock instanceof HTMLElement) || !(pill instanceof HTMLElement)) {
      return null;
    }

    const tabs = Array.from(
      document.querySelectorAll(CONFIG.selectors.tabs)
    ).filter((tab) => tab instanceof HTMLElement);

    /** @type {Map<string, HTMLElement>} */
    const panelsById = new Map();
    const panels = Array.from(
      document.querySelectorAll(CONFIG.selectors.panels)
    ).filter((panel) => panel instanceof HTMLElement);

    for (const panel of panels) {
      const panelId = this.#getElementPanelId(panel);
      if (!panelId) {
        continue;
      }

      panelsById.set(panelId, panel);
    }

    /** @type {Map<string, HTMLElement>} */
    const tabsByPanelId = new Map();
    for (const tab of tabs) {
      const panelId = this.#getElementPanelId(tab);
      if (!panelId || !panelsById.has(panelId) || tabsByPanelId.has(panelId)) {
        continue;
      }

      tabsByPanelId.set(panelId, tab);
    }

    return {
      dock,
      pill,
      tabs,
      panelsById,
      tabsByPanelId
    };
  }

  #setupPanels() {
    if (!this.#elements) {
      return;
    }

    this.#elements.panelsById.forEach((panel) => {
      this.#setupPanelHoverInteraction(panel);
    });
  }

  /**
   * Sets up hover interactions for a specific panel.
   * @param {HTMLElement} panel
   */
  #setupPanelHoverInteraction(panel) {
    const indicator = document.createElement("span");
    indicator.className = CONFIG.classes.hoverIndicator;
    panel.prepend(indicator);

    /** @type {HoverEntry} */
    const hoverEntry = {
      indicator,
      activeItem: null,
      isVisible: false
    };
    this.#panelHoverState.set(panel, hoverEntry);

    const handleItemActivate = (event) => {
      if (!(event.target instanceof Element)) {
        return;
      }

      const item = event.target.closest(CONFIG.selectors.panelItems);
      if (!(item instanceof HTMLElement) || !panel.contains(item)) {
        return;
      }

      if (hoverEntry.activeItem === item) {
        return;
      }

      const shouldFadeIn = !hoverEntry.isVisible;
      hoverEntry.activeItem = item;
      this.#renderHoverIndicator(panel, {
        item,
        visible: true,
        immediate: false,
        geometryImmediate: shouldFadeIn
      });
    };

    panel.addEventListener("pointerover", handleItemActivate);
    panel.addEventListener("focusin", handleItemActivate);
    panel.addEventListener("pointerleave", () => {
      this.#renderHoverIndicator(panel, { visible: false });
    });
    panel.addEventListener("focusout", (event) => {
      if (!panel.contains(event.relatedTarget)) {
        this.#renderHoverIndicator(panel, { visible: false });
      }
    });
  }

  #bindEvents() {
    if (!this.#elements) {
      return;
    }

    const onTabClick = (tab) => () => {
      this.#handleTabSelect(this.#getElementPanelId(tab));
    };

    const onEscape = (event) => this.#handleDocumentKeydown(event);
    const onOutsidePointerDown = (event) =>
      this.#handleDocumentPointerDown(event);
    const onResize = () => this.#handleResize();

    for (const tab of this.#elements.tabs) {
      tab.addEventListener("click", onTabClick(tab));
    }

    document.addEventListener("keydown", onEscape);
    document.addEventListener("pointerdown", onOutsidePointerDown);
    window.addEventListener("resize", onResize);
  }

  // Event handlers
  /**
   * Reads the element panel id from "https://esm.sh/data-panel".
   * @param {Element} element
   * @returns {string | null} Valid panel id when present, otherwise `null`.
   */
  #getElementPanelId(element) {
    const panelId = element.getAttribute(CONFIG.attributes.panel);
    return panelId && panelId.length > 0 ? panelId : null;
  }

  #handleDocumentKeydown(event) {
    if (event.key === "Escape") {
      this.#closeMenu();
    }
  }

  #handleDocumentPointerDown(event) {
    if (!this.#state.isOpen) {
      return;
    }

    if (
      event.target instanceof Node &&
      this.#elements?.dock.contains(event.target)
    ) {
      return;
    }

    this.#closeMenu();
  }

  #handleResize() {
    this.#renderPill({ immediate: true });

    const activePanel = this.#getActivePanel();
    if (activePanel) {
      this.#syncHoverIndicator(activePanel, true);
    }
  }

  // State and selectors
  /**
   * Resolves a panel id only when it exists in the current panel map.
   * @param {string | null | undefined} panelId
   * @returns {string | null} Resolved panel id or `null` when invalid.
   */
  #resolvePanelId(panelId) {
    if (!panelId || !this.#elements) {
      return null;
    }

    return this.#elements.panelsById.has(panelId) ? panelId : null;
  }

  /**
   * Gets a panel by panel id.
   * @param {string | null} panelId
   * @returns {HTMLElement | null} Matching panel element or `null`.
   */
  #getPanelById(panelId) {
    if (!panelId || !this.#elements) {
      return null;
    }

    return this.#elements.panelsById.get(panelId) ?? null;
  }

  #getActivePanel() {
    return this.#getPanelById(this.#state.activePanelId);
  }

  #getActiveTab() {
    if (!this.#state.activePanelId || !this.#elements) {
      return null;
    }

    return this.#elements.tabsByPanelId.get(this.#state.activePanelId) ?? null;
  }

  // State transitions
  /**
   * Handles tab selection logic.
   * @param {string | null} nextPanelId
   */
  #handleTabSelect(nextPanelId) {
    const resolvedPanelId = this.#resolvePanelId(nextPanelId);
    if (!resolvedPanelId) {
      return;
    }

    const wasOpen = this.#state.isOpen;

    if (this.#state.isOpen && resolvedPanelId === this.#state.activePanelId) {
      this.#closeMenu();
      return;
    }

    this.#setMenuState(true, resolvedPanelId, { fadeOnlyPill: !wasOpen });
  }

  #closeMenu() {
    if (!this.#state.isOpen) {
      return;
    }

    this.#setMenuState(false, null, { fadeOnlyPill: true });
  }

  /**
   * Commits menu state and keeps all UI updates in a single path.
   * @param {boolean} isOpen
   * @param {string | null} nextPanelId
   * @param {{ immediatePill?: boolean, fadeOnlyPill?: boolean }} options
   */
  #setMenuState(isOpen, nextPanelId, options = {}) {
    const normalizedPanelId = isOpen ? this.#resolvePanelId(nextPanelId) : null;
    if (isOpen && !normalizedPanelId) {
      return;
    }

    const nextState = {
      activePanelId: normalizedPanelId,
      isOpen
    };

    if (
      this.#state.isOpen === nextState.isOpen &&
      this.#state.activePanelId === nextState.activePanelId
    ) {
      return;
    }

    this.#switchPanel(nextState.activePanelId);
    this.#state = nextState;
    this.#renderTabs();
    this.#renderPill({
      immediate: options.immediatePill ?? false,
      fadeOnly: options.fadeOnlyPill ?? false
    });
    this.#renderDockState();
  }

  // Render pipeline
  /**
   * Switches the active visible panel.
   * @param {string | null} nextPanelId
   */
  #switchPanel(nextPanelId) {
    const previousPanel = this.#getActivePanel();
    const nextPanel = this.#getPanelById(nextPanelId);

    this.#renderPanelStateChange(previousPanel, nextPanel);
  }

  /**
   * Renders panel activation/deactivation and hover reconciliation.
   * @param {HTMLElement | null} previousPanel
   * @param {HTMLElement | null} nextPanel
   */
  #renderPanelStateChange(previousPanel, nextPanel) {
    if (previousPanel === nextPanel) {
      return;
    }

    if (previousPanel) {
      this.#renderHoverIndicator(previousPanel, {
        visible: false,
        immediate: true
      });
      previousPanel.classList.remove(CONFIG.classes.active);
    }

    if (nextPanel) {
      nextPanel.classList.add(CONFIG.classes.active);
      this.#syncHoverIndicator(nextPanel, true);
    }
  }

  #renderTabs() {
    if (!this.#elements) {
      return;
    }

    for (const tab of this.#elements.tabs) {
      const isActive =
        this.#state.isOpen &&
        this.#getElementPanelId(tab) === this.#state.activePanelId;

      tab.classList.toggle(CONFIG.classes.active, isActive);
      tab.setAttribute("aria-selected", String(isActive));
    }
  }

  #renderDockState() {
    this.#elements?.dock.classList.toggle(
      CONFIG.classes.open,
      this.#state.isOpen
    );
  }

  /**
   * Renders the active tab pill: geometry and visibility.
   * @param {{ immediate?: boolean, fadeOnly?: boolean }} options
   */
  #renderPill(options = {}) {
    const { immediate = false, fadeOnly = false } = options;
    const pill = this.#elements?.pill;
    if (!pill) {
      return;
    }

    if (!this.#state.isOpen || !this.#state.activePanelId) {
      pill.classList.toggle(CONFIG.classes.pillVisible, false);
      this.#tweenElement(
        pill,
        { opacity: 0 },
        {
          duration: MOTION.duration.base,
          ease: MOTION.ease.fade,
          immediate: fadeOnly && !immediate ? false : immediate,
          killProps: ["opacity"]
        }
      );

      if (fadeOnly && !immediate) {
        return;
      }

      this.#tweenElement(
        pill,
        { "--pill-width": "0px" },
        {
          duration: MOTION.duration.base,
          ease: MOTION.ease.pill,
          immediate,
          killProps: ["--pill-width"]
        }
      );
      return;
    }

    const tab = this.#getActiveTab();
    if (!tab) {
      return;
    }

    this.#tweenElement(
      pill,
      {
        "--pill-x": `${tab.offsetLeft}px`,
        "--pill-width": `${tab.offsetWidth}px`
      },
      {
        duration: MOTION.duration.base,
        ease: MOTION.ease.pill,
        immediate: fadeOnly && !immediate ? true : immediate,
        killProps: ["--pill-x", "--pill-width"]
      }
    );

    pill.classList.toggle(CONFIG.classes.pillVisible, true);
    this.#tweenElement(
      pill,
      { opacity: 1 },
      {
        duration: MOTION.duration.base,
        ease: MOTION.ease.fade,
        immediate: fadeOnly && !immediate ? false : immediate,
        killProps: ["opacity"]
      }
    );
  }

  /**
   * Renders a panel hover indicator in a single path.
   * @param {HTMLElement} panel
   * @param {{
   *   item?: HTMLElement | null,
   *   visible: boolean,
   *   immediate?: boolean,
   *   geometryImmediate?: boolean,
   * }} options
   */
  #renderHoverIndicator(panel, options) {
    const {
      item = null,
      visible,
      immediate = false,
      geometryImmediate = immediate
    } = options;
    const entry = this.#panelHoverState.get(panel);

    if (!entry) {
      return;
    }

    const { indicator } = entry;

    if (!visible) {
      entry.activeItem = null;
      entry.isVisible = false;
      indicator.classList.toggle(CONFIG.classes.pillVisible, false);
      this.#tweenElement(
        indicator,
        { opacity: 0 },
        {
          duration: MOTION.duration.fast,
          ease: MOTION.ease.fade,
          immediate,
          killProps: ["opacity"]
        }
      );
      return;
    }

    if (item) {
      entry.activeItem = item;
    }

    if (entry.activeItem && panel.classList.contains(CONFIG.classes.active)) {
      this.#tweenElement(
        indicator,
        {
          "--hover-x": `${entry.activeItem.offsetLeft}px`,
          "--hover-y": `${entry.activeItem.offsetTop}px`,
          "--hover-width": `${entry.activeItem.offsetWidth}px`,
          "--hover-height": `${entry.activeItem.offsetHeight}px`
        },
        {
          duration: MOTION.duration.base,
          ease: MOTION.ease.hover,
          immediate: geometryImmediate,
          killProps: [
            "--hover-x",
            "--hover-y",
            "--hover-width",
            "--hover-height"
          ]
        }
      );
    }

    if (entry.isVisible) {
      return;
    }

    entry.isVisible = true;
    indicator.classList.toggle(CONFIG.classes.pillVisible, true);
    this.#tweenElement(
      indicator,
      { opacity: 1 },
      {
        duration: MOTION.duration.fast,
        ease: MOTION.ease.fade,
        immediate,
        killProps: ["opacity"]
      }
    );
  }

  /**
   * Syncs hover indicator geometry/visibility for the active panel state.
   * @param {HTMLElement} panel
   * @param {boolean} immediate
   */
  #syncHoverIndicator(panel, immediate = true) {
    const entry = this.#panelHoverState.get(panel);
    if (!entry) {
      return;
    }

    if (entry.activeItem && panel.classList.contains(CONFIG.classes.active)) {
      const shouldFadeIn = !entry.isVisible;
      this.#renderHoverIndicator(panel, {
        item: entry.activeItem,
        visible: true,
        immediate: shouldFadeIn ? false : immediate,
        geometryImmediate: immediate
      });
      return;
    }

    this.#renderHoverIndicator(panel, { visible: false, immediate });
  }

  // Motion utilities
  #prefersReducedMotion() {
    if (typeof window.matchMedia !== "function") {
      return false;
    }

    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  /**
   * Resolves tween duration with immediate and reduced motion support.
   * @param {number} duration
   * @param {boolean} immediate
   * @returns {number} Resolved duration in seconds.
   */
  #resolveDuration(duration, immediate) {
    if (immediate || this.#prefersReducedMotion()) {
      return 0;
    }

    return duration;
  }

  /**
   * Runs a GSAP tween with overwrite-safe behavior for selected properties.
   * @param {HTMLElement} element
   * @param {Record<string, string | number>} vars
   * @param {{ duration: number, ease: string, immediate?: boolean, killProps: string[] }} options
   */
  #tweenElement(element, vars, options) {
    const { duration, ease, immediate = false, killProps } = options;

    gsap.killTweensOf(element, killProps.join(","));
    gsap.to(element, {
      ...vars,
      duration: this.#resolveDuration(duration, immediate),
      ease,
      overwrite: "auto"
    });
  }
}

// eslint-disable-next-line no-new
new DockNavigation();