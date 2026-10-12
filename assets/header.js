(() => {
  const HEADER_SELECTOR = '.header-top[data-header-root]';
  const headerStates = new Map();
  const headerResizeObservers = new Map();
  const submenuCloseTimers = new WeakMap();
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const isMobileMenuViewport = () => window.matchMedia('(max-width: 991.98px)').matches;
  const submenuTransitionBuffer = 16;
  const menuToggleButtons = new WeakSet();
  const megaMenuBackdropControls = new WeakSet();
  const backdropCursorBindings = new WeakMap();
  const accountElements = new WeakSet();
  const deferredAccounts = new WeakSet();
  const localizationSheetDetails = new WeakSet();
  const footerLocalizationStates = new WeakMap();
  const openAccountSheets = new WeakSet();
  const mobileMegaMenuOrigins = new Map();
  let lastScrollY = window.scrollY;
  let frameId = null;

  const getHeaderRoot = (headerTop) => headerTop.closest('.shopify-section') || headerTop;

  const synchronizeHeaderOverlay = (header, headerTop) => {
    header.classList.toggle('header--overlay', headerTop.hasAttribute('data-header-overlay'));
    header.classList.toggle('header--overlap-first-section', headerTop.hasAttribute('data-header-overlap-first-section'));
  };

  const setHeaderMenuState = (header, isOpen, { opener = null, restoreFocus = true, syncOverlay = true } = {}) => {
    const container = header.querySelector('.header-top') || header;
    const drawer = container.querySelector('[data-header-mobile-drawer]');
    const overlay = drawer ? window.ThemeOverlay?.get(drawer) : null;
    container.classList.toggle('header-top--menu-open', isOpen);
    drawer?.setAttribute('aria-hidden', String(!isOpen));

    if (syncOverlay) {
      if (isOpen) overlay?.open({ opener: opener || document.activeElement, focus: true, restoreFocus: true, defer: isMobileMenuViewport() });
      else overlay?.close({ restoreFocus });
    }

    if (!isOpen) {
      closeLocalizationDialogs(header);
      drawer?.classList.remove('header__mobile-drawer--submenu-active');
      drawer?.querySelectorAll('.header__mobile-drawer-item.is-mobile-submenu-active').forEach((item) => {
        item.classList.remove('is-mobile-submenu-active');
        item.querySelector(':scope > .header__mobile-drawer-details')?.removeAttribute('open');
      });
      drawer?.querySelectorAll('[data-mobile-drawer-submenu-details]').forEach((details) => {
        details.classList.remove('is-mobile-submenu-active');
        details.removeAttribute('open');
      });
      drawer?.querySelectorAll('[data-header-menu-back]').forEach((back) => {
        back.hidden = true;
      });
      container.querySelector('.header-menu')?.querySelectorAll('.header-menu__details.is-mobile-submenu-active').forEach((details) => {
        details.classList.remove('is-mobile-submenu-active');
        details.closest('.header-menu__item')?.classList.remove('is-mobile-submenu-active');
        details.removeAttribute('open');
      });
    }

    container.querySelectorAll('[data-header-menu-toggle]').forEach((toggle) => {
      toggle.setAttribute('aria-expanded', String(isOpen));
      toggle.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
    });
    scheduleUpdate();
  };

  const closeSearchOverlay = () => {
    const overlay = document.querySelector('[data-search-overlay]');
    if (!overlay || overlay.hasAttribute('hidden')) return;
    overlay.querySelector('[data-search-overlay-close]')?.click();
  };

  const closeCartDrawer = () => {
    const drawer = document.querySelector('[data-cart-drawer]');
    if (!drawer?.classList.contains('is-open')) return;
    drawer.querySelector('.cart-drawer__close, [data-cart-drawer-close]')?.click();
  };

  const closeAccountSheet = (account) => {
    if (!openAccountSheets.has(account)) return;
    if (typeof account.close === 'function') {
      account.close();
      return;
    }
    account.querySelector('[slot="signed-out-avatar"]')?.click();
  };

  const getLocalizationDialog = (details) => {
    const id = details?.dataset.localizationDialogId;
    return id ? document.getElementById(id) : null;
  };

  const closeLocalizationDialogs = (header, activeDetails = null) => {
    header.querySelectorAll('.header-localization__details').forEach((details) => {
      if (details === activeDetails) return;
      const dialog = getLocalizationDialog(details);
      if (!dialog || dialog.dataset.state === 'closed') return;
      window.ThemeOverlay?.get(dialog)?.close({ restoreFocus: false });
    });
  };

  const closeLocalizationSheet = (details, { restoreFocus = false } = {}) => {
    const dialog = getLocalizationDialog(details);
    if (dialog && dialog.dataset.state !== 'closed') {
      const overlay = window.ThemeOverlay?.get(dialog);
      if (overlay) overlay.close({ restoreFocus });
      else dialog.close();
      return;
    }

    details.classList.remove('is-submenu-closing');
    details.removeAttribute('open');
    if (restoreFocus) {
      details.querySelector(':scope > .header-localization__summary')?.focus({ preventScroll: true });
    }
    scheduleUpdate();
  };

  const parseCssTime = (value) => {
    const normalized = String(value || '').trim();
    const amount = parseFloat(normalized);
    if (!Number.isFinite(amount)) return 0;
    return normalized.endsWith('ms') ? amount : amount * 1000;
  };

  const getMaxTimedValue = (durations, delays) => {
    const durationValues = String(durations || '0s').split(',').map(parseCssTime);
    const delayValues = String(delays || '0s').split(',').map(parseCssTime);
    return Math.max(
      0,
      ...durationValues.map((duration, index) => duration + (delayValues[index % delayValues.length] || 0)),
    );
  };

  const getHeaderSubmenuSurface = (details) => details?.querySelector(
    ':scope > .header-menu__submenu, :scope > .header-mega-menu, :scope > .header-localization__panel',
  );

  const getHeaderSubmenuMotionDuration = (details) => {
    const surface = getHeaderSubmenuSurface(details);
    if (!surface) return 0;
    const style = getComputedStyle(surface);
    return Math.max(
      getMaxTimedValue(style.transitionDuration, style.transitionDelay),
      getMaxTimedValue(style.animationDuration, style.animationDelay),
    );
  };

  const clearSubmenuClose = (details) => {
    const timer = submenuCloseTimers.get(details);
    if (timer) window.clearTimeout(timer);
    submenuCloseTimers.delete(details);
    details?.classList.remove('is-submenu-closing');
  };

  const releaseHoverSubmenuFocus = (details) => {
    if (details?.dataset.headerSubmenuTrigger !== 'hover') return;

    const summary = details.querySelector(':scope > summary');
    if (summary?.matches(':focus') && !summary.matches(':focus-visible')) {
      summary.blur();
    }
  };

  const keepSubmenuFocusOpen = (details) => {
    if (!details.matches(':focus-within')) return false;
    const summary = details.querySelector(':scope > summary');
    // Pointer focus on a hover trigger must not reopen its panel after exit.
    // Keyboard focus and focus inside the panel keep its controls reachable.
    return details.dataset.headerSubmenuTrigger !== 'hover' ||
      !summary?.matches(':focus') || summary.matches(':focus-visible');
  };

  const closeHeaderDetails = (details) => {
    if (!details?.open && !details?.classList.contains('is-submenu-closing')) return;
    if (submenuCloseTimers.has(details)) return;

    clearSubmenuClose(details);
    const finish = () => {
      details.removeAttribute('open');
      releaseHoverSubmenuFocus(details);
      details.classList.remove('is-submenu-closing');
      scheduleUpdate();
    };

    if (isMobileMenuViewport() || reducedMotion.matches) {
      finish();
      return;
    }

    details.classList.add('is-submenu-closing');
    const duration = getHeaderSubmenuMotionDuration(details);
    let timer;
    timer = window.setTimeout(() => {
      if (submenuCloseTimers.get(details) !== timer) return;
      submenuCloseTimers.delete(details);
      finish();
    }, duration + submenuTransitionBuffer);
    submenuCloseTimers.set(details, timer);
    scheduleUpdate();
  };

  const closeHeaderSurfaces = (header, active = {}) => {
    closeLocalizationDialogs(header, active.details);
    header.querySelectorAll('details[open], details.is-submenu-closing').forEach((details) => {
      if (details === active.details) return;
      if (details.classList.contains('header-localization__details')) {
        if ((details.closest('[data-header-mobile-drawer]') && isMobileMenuViewport()) || window.innerWidth <= 767 || getLocalizationDialog(details)?.dataset.state !== 'closed') closeLocalizationSheet(details);
        else closeHeaderDetails(details);
        return;
      }
      closeHeaderDetails(details);
    });

    if (!active.menu) setHeaderMenuState(header, false, { restoreFocus: false });
    if (!active.search) closeSearchOverlay();
    if (!active.cart) closeCartDrawer();
    header.querySelectorAll('shopify-account').forEach((account) => {
      if (account !== active.account) closeAccountSheet(account);
    });
  };

  const updateHeaderHeight = (header, stickyType) => {
    const height = `${getHeaderLayoutTarget(header).offsetHeight}px`;
    header.style.setProperty('--header-layout-height', height);
    if (stickyType === 'none') {
      document.documentElement.style.removeProperty('--header-height');
    } else {
      document.documentElement.style.setProperty('--header-height', height);
    }
    updateStickyHeaderHeight(header, stickyType);
  };

  // Home overlays have a zero-height wrapper from first paint. Measure the
  // visible header surface for sticky offsets and scroll-up translation.
  const getHeaderLayoutTarget = (header) =>
    header.querySelector('.header-top[data-header-overlap-first-section]') || header;

  const getStickyTarget = (header, stickyType) => {
    if (stickyType === 'top_header_only') {
      return header.querySelector('.header-top') || header;
    }

    if (stickyType === 'bottom_header_only') {
      return (
        header.querySelector('[data-header-region="bottom"]') ||
        header.querySelector('.header-top') ||
        header
      );
    }

    return getHeaderLayoutTarget(header);
  };

  const updateStickyHeaderHeight = (header, stickyType = header.dataset.stickyType || 'none') => {
    const isHidden = stickyType === 'scroll_up' && header.classList.contains('header--is-hidden');
    const stickyHeight = stickyType === 'none' || isHidden ? 0 : getStickyTarget(header, stickyType).offsetHeight;
    const height = `${stickyHeight}px`;

    header.style.setProperty('--header-sticky-height', height);
    document.documentElement.style.setProperty('--header-sticky-height', height);
  };

  const synchronizeStickyType = (header, headerState) => {
    const stickyType = header.querySelector(HEADER_SELECTOR)?.dataset.stickyType || 'none';
    if (headerState.stickyType === stickyType) return stickyType;

    headerState.stickyType = stickyType;
    header.dataset.stickyType = stickyType;
    header.classList.remove('header--is-hidden');
    header.querySelector('[data-header-sticky-target]')?.removeAttribute('data-header-sticky-target');

    const target = getStickyTarget(header, stickyType);
    if (target !== header) target.dataset.headerStickyTarget = stickyType;

    updateHeaderHeight(header, stickyType);
    return stickyType;
  };

  const synchronizeHeaderColorScheme = (header, useBaseScheme) => {
    const headerTop = header.querySelector('.header-top');
    if (!headerTop) return;

    const transparentScheme = headerTop?.dataset.headerTransparentScheme;
    const appliedTransparentScheme = headerTop.dataset.appliedTransparentScheme;

    useBaseScheme ||= !header.classList.contains('header--overlay');
    if (appliedTransparentScheme && appliedTransparentScheme !== transparentScheme) {
      headerTop.classList.remove(appliedTransparentScheme);
    }

    if (!transparentScheme) {
      headerTop.classList.remove('header-top--transparent-scheme');
      if (appliedTransparentScheme) {
        headerTop.classList.remove('section-color-scope', appliedTransparentScheme);
        delete headerTop.dataset.appliedTransparentScheme;
      }
      return;
    }

    headerTop.dataset.appliedTransparentScheme = transparentScheme;
    headerTop.classList.toggle('header-top--transparent-scheme', !useBaseScheme);
    headerTop.classList.toggle('section-color-scope', !useBaseScheme);
    headerTop.classList.toggle(transparentScheme, !useBaseScheme);
  };

  const hasOpenHeaderSubmenu = (header) => Boolean(header.querySelector('details[open], details:hover, details:focus-within, details.is-submenu-closing'));

  const hasOpenMegaMenu = (header) => Array.from(
    header.querySelectorAll('.header-menu__details--mega'),
  ).some((details) => {
    // Release the backdrop as soon as the close animation starts. The details
    // element remains open briefly so its surface can animate out.
    if (details.classList.contains('is-submenu-closing')) return false;
    if (details.open) return true;

    // Hover/focus only opens a mega menu when this menu is configured to use
    // the hover trigger. In click mode, these states must not activate the
    // backdrop before the visitor opens the details element.
    return details.dataset.headerSubmenuTrigger === 'hover' && details.matches(':hover, :focus-within');
  });

  const synchronizeSubmenuOffsets = (header) => {
    const headerTop = header.querySelector('.header-top');
    if (!headerTop) return;

    // Read all geometry before writing CSS variables. Interleaving reads and
    // writes here forces the browser to recalculate layout for every submenu.
    const headerRect = headerTop.getBoundingClientRect();
    const submenuRects = Array.from(
      header.querySelectorAll('.header-localization__details, .header-menu__details'),
      (details) => ({ details, rect: details.getBoundingClientRect() }),
    );
    const megaMenuRects = Array.from(
      header.querySelectorAll('.header-menu__details--mega'),
      (details) => ({ details, rect: details.getBoundingClientRect() }),
    );

    submenuRects.forEach(({ details, rect }) => {
      details.style.setProperty('--header-submenu-offset', `${Math.max(0, headerRect.bottom - rect.bottom)}px`);
      const panel = details.querySelector(':scope > .header-localization__panel, :scope > .header-menu__submenu');
      if (panel) {
        const width = Math.min(panel.offsetWidth || 250, window.innerWidth - 16);
        const left = Math.max(8, Math.min(rect.left, window.innerWidth - width - 8));
        details.style.setProperty('--header-popup-shift', `${left - rect.left}px`);
        details.style.setProperty('--header-popup-left', `${left}px`);
        const headerStyle = getComputedStyle(header);
        const hasFixedContainer = headerStyle.transform !== 'none' || headerStyle.willChange.includes('transform');
        const fixedOrigin = details.closest('[data-header-bottom]') && hasFixedContainer ? header.getBoundingClientRect() : { top: 0, left: 0 };
        details.style.setProperty('--header-popup-left', `${left - fixedOrigin.left}px`);
        details.style.setProperty('--header-popup-top', `${Math.min(headerRect.bottom, window.innerHeight - 80) - fixedOrigin.top}px`);
        details.style.setProperty('--header-popup-height', `${Math.max(64, window.innerHeight - Math.min(headerRect.bottom, window.innerHeight - 80) - 8)}px`);
      }
    });

    megaMenuRects.forEach(({ details, rect }) => {
      details.style.setProperty('--header-mega-inline-offset', `${Math.max(0, rect.left)}px`);
      details.style.setProperty('--header-mega-width', `${headerRect.width}px`);
    });
  };

  const updateHeaderState = (forceShow = false) => {
    const scrollY = Math.max(window.scrollY, 0);
    const scrollDelta = scrollY - lastScrollY;

    const firstSection = document.querySelector('#MainContent > .shopify-section');
    const collectionOverlay = Boolean(firstSection?.querySelector('[data-collection-transparent-header]'));

    headerStates.forEach((headerState) => {
      const { header } = headerState;
      const stickyType = synchronizeStickyType(header, headerState);
      const overlayEnabled = collectionOverlay || Boolean(header.querySelector('[data-header-overlay]'));
      header.classList.toggle('header--overlay', overlayEnabled);
      header.classList.toggle('header--overlap-first-section', overlayEnabled);
      const isSticky = stickyType !== 'none';
      const isScrolled = isSticky && scrollY > 8;
      const isSubmenuOpen = hasOpenHeaderSubmenu(header);
      const isMegaMenuOpen = hasOpenMegaMenu(header);
      if (isSubmenuOpen) synchronizeSubmenuOffsets(header);
      const isSearchOpen = header.classList.contains('header--search-open');
      const isCartOpen = header.classList.contains('header--cart-open');
      const headerTop = header.querySelector('.header-top');
      if (!isMobileMenuViewport() && headerTop?.classList.contains('header-top--menu-open')) {
        setHeaderMenuState(header, false, { restoreFocus: false });
      }
      header.classList.toggle('header--is-scrolled', isScrolled);
      header.classList.toggle('header--submenu-open', isSubmenuOpen);
      header.classList.toggle('header--mega-menu-open', isMegaMenuOpen);
      header.querySelectorAll('[data-header-mega-menu-backdrop]').forEach((backdrop) => {
        backdrop.setAttribute('aria-hidden', String(!isMegaMenuOpen));
        if (!isMegaMenuOpen) backdropCursorBindings.get(backdrop)?.hide();
      });
      synchronizeHeaderColorScheme(header, isScrolled || isSubmenuOpen || isSearchOpen || isCartOpen);

      if (stickyType !== 'scroll_up') {
        header.classList.remove('header--is-hidden');
        updateStickyHeaderHeight(header, stickyType);
        return;
      }

      const revealThreshold = Math.max(getHeaderLayoutTarget(header).offsetHeight, 64);
      const shouldReveal =
        forceShow ||
        scrollY <= 8 ||
        scrollDelta < -2 ||
        isMegaMenuOpen ||
        header.contains(document.activeElement);

      if (shouldReveal) {
        header.classList.remove('header--is-hidden');
      } else if (scrollDelta > 2 && scrollY > revealThreshold) {
        header.classList.add('header--is-hidden');
      }

      updateStickyHeaderHeight(header, stickyType);
    });

    lastScrollY = scrollY;
    frameId = null;
  };

  const scheduleUpdate = () => {
    if (frameId === null) {
      frameId = window.requestAnimationFrame(() => updateHeaderState());
    }
  };

  const organizeHeaderLayout = (header) => {
    const headerTop = header.querySelector('.header-top[data-header-blocks]') || header.querySelector('.header-top');
    const blocks = headerTop?.querySelector('[data-header-blocks]');
    const leftColumn = headerTop?.querySelector('[data-header-column="left"]');
    const centerColumn = headerTop?.querySelector('[data-header-column="center"]');
    const rightColumn = headerTop?.querySelector('[data-header-column="right"]');

    if (!headerTop || !blocks || !leftColumn || !centerColumn || !rightColumn || headerTop.dataset.layoutReady === 'true') {
      return;
    }

    const items = Array.from(blocks.children);
    const logo = items.find((item) => item.matches('.header-logo'));
    const logoPosition = logo?.classList.contains('header-logo--left') ? 'left' : 'center';
    headerTop.dataset.logoPosition = logoPosition;

    items.forEach((item) => {
      if (item.matches('.header-logo')) {
        (logoPosition === 'left' ? leftColumn : centerColumn).append(item);
      } else if (item.matches('.header-menu')) {
        (logoPosition === 'left' ? centerColumn : leftColumn).append(item);
      } else if (item.matches('.header-menu-toggle')) {
        const position = item.dataset.menuTogglePosition;
        const column = position === 'right' ? rightColumn : position === 'center' ? centerColumn : leftColumn;
        column.append(item);
      } else if (item.matches('.header__mobile-drawer')) {
        headerTop.append(item);
      } else {
        rightColumn.append(item);
      }
    });

    headerTop.dataset.layoutReady = 'true';
  };

  const initializeMegaMenus = (header) => {
    header.querySelectorAll('[data-header-mega-menu]').forEach((megaMenu) => {
      const trigger = megaMenu.dataset.megaMenuTrigger;
      if (!trigger) return;

      const menuItem = Array.from(header.querySelectorAll('.header-menu__item')).find(
        (item) => item.dataset.menuTitle === trigger,
      );
      const details = menuItem?.querySelector(':scope > .header-menu__details');
      if (!details) return;

      const submenu = details.querySelector(':scope > .header-menu__submenu');
      megaMenu.querySelector('[data-mega-menu-navigation]')?.append(submenu);
      menuItem.classList.toggle('header-menu__item--highlight', megaMenu.classList.contains('header-mega-menu--highlight'));
      menuItem.style.setProperty('--header-menu-highlight-color', megaMenu.style.getPropertyValue('--mega-menu-highlight-color'));
      details.classList.add('header-menu__details--mega');
      details.append(megaMenu);
      megaMenu.hidden = false;
    });
  };

  const initializeHeader = (headerTop) => {
    const header = getHeaderRoot(headerTop);
    const existingHeaderState = headerStates.get(header);
    if (existingHeaderState) {
      synchronizeHeaderOverlay(header, headerTop);
      synchronizeHeaderColorScheme(header, true);
      synchronizeStickyType(header, existingHeaderState);
      updateHeaderState(true);
      return;
    }

    const headerScheme = headerTop.dataset.headerScheme;
    const stickyType = headerTop.dataset.stickyType || 'none';

    header.classList.add('header', 'section-color-scope');
    if (headerScheme) header.classList.add(headerScheme);
    synchronizeHeaderOverlay(header, headerTop);
    header.dataset.stickyType = stickyType;

    organizeHeaderLayout(header);
    initializeMegaMenus(header);
    const target = getStickyTarget(header, stickyType);

    if (target !== header) {
      target.dataset.headerStickyTarget = stickyType;
    }

    updateHeaderHeight(header, stickyType);
    if ('ResizeObserver' in window) {
      const observer = new ResizeObserver(() => {
        const headerState = headerStates.get(header);
        const currentStickyType = headerState
          ? synchronizeStickyType(header, headerState)
          : header.querySelector(HEADER_SELECTOR)?.dataset.stickyType || 'none';
        updateHeaderHeight(header, currentStickyType);
      });
      observer.observe(header);
      if (target !== header) observer.observe(target);
      headerResizeObservers.set(header, observer);
    }

    headerStates.set(header, { header, stickyType });
    initializeMenuToggles(header);
    initializeHeaderSubmenus(header);
    initializeMegaMenuBackdrops(header);
    initializeMobileDrawer(header);
    initializeLocalizationSheets(header);
    initializeAccountSheets(header);
    updateHeaderState(true);
  };

  const initializeHeaderSubmenus = (header) => {
    const scheduleSubmenuClose = (details) => {
      if (isMobileMenuViewport()) return;
      if (details.dataset.editorSelected || details.matches(':hover') || keepSubmenuFocusOpen(details)) return;
      closeHeaderDetails(details);
    };

    header.querySelectorAll('details:not([data-mobile-drawer-details]):not([data-mobile-drawer-submenu-details])').forEach((details) => {
      const trigger = details.dataset.headerSubmenuTrigger || 'click';
      const summary = details.querySelector(':scope > summary');

      // `pointerout` bubbles whenever the pointer crosses child elements (such as
      // the chevron), which made the closing state flicker. These events only
      // fire when the pointer enters or leaves the complete details boundary.
      details.addEventListener('pointerenter', () => {
        if (isMobileMenuViewport()) return;
        if (trigger === 'hover') {
          closeHeaderSurfaces(header, { details });
          details.open = true;
          clearSubmenuClose(details);
        }
        scheduleUpdate();
      });

      details.addEventListener('pointerleave', () => {
        if (isMobileMenuViewport()) return;
        scheduleSubmenuClose(details);
        scheduleUpdate();
      });

      details.addEventListener('focusin', () => {
        if (isMobileMenuViewport()) return;
        if (trigger === 'hover') {
          closeHeaderSurfaces(header, { details });
          details.open = true;
          clearSubmenuClose(details);
        }
        scheduleUpdate();
      });

      details.addEventListener('focusout', (event) => {
        if (isMobileMenuViewport()) return;
        if (!details.contains(event.relatedTarget)) scheduleSubmenuClose(details);
        scheduleUpdate();
      });

      if (trigger === 'hover') {
        summary?.addEventListener('click', (event) => {
          if (isMobileMenuViewport()) return;
          if (event.defaultPrevented) return;
          // Keep the hover-mode dropdown open while the pointer remains inside;
          // otherwise the native details toggle would immediately close it.
          event.preventDefault();
          closeHeaderSurfaces(header, { details });
          details.open = true;
          clearSubmenuClose(details);
          scheduleUpdate();
        });
      }

      summary?.addEventListener('click', (event) => {
        if (isMobileMenuViewport() || trigger === 'hover' || !details.open) return;
        event.preventDefault();
        closeHeaderDetails(details);
      });

      summary?.addEventListener('click', (event) => {
        if (isMobileMenuViewport()) return;
        if (details.classList.contains('header-localization__details')) return;

        const menu = details.closest('.header-menu');
        if (!menu) return;
        event.preventDefault();

        menu.querySelectorAll('.header-menu__details.is-mobile-submenu-active').forEach((activeDetails) => {
          activeDetails.classList.remove('is-mobile-submenu-active');
          activeDetails.closest('.header-menu__item')?.classList.remove('is-mobile-submenu-active');
          if (activeDetails !== details) activeDetails.removeAttribute('open');
        });
        details.open = true;
        details.classList.add('is-mobile-submenu-active');
        details.closest('.header-menu__item')?.classList.add('is-mobile-submenu-active');
        menu.classList.add('header-menu--mobile-submenu-active');
        menu.querySelectorAll('[data-header-menu-back]').forEach((back) => {
          back.hidden = false;
        });
        scheduleUpdate();
      });

      details.addEventListener('toggle', () => {
        if (details.open) {
          closeHeaderSurfaces(header, { details });
        }
        scheduleUpdate();
      });
    });

    header.addEventListener('toggle', scheduleUpdate, true);
  };

  const initializeMegaMenuBackdrops = (header) => {
    header.querySelectorAll('[data-header-mega-menu-backdrop]').forEach((backdrop) => {
      if (megaMenuBackdropControls.has(backdrop)) return;
      megaMenuBackdropControls.add(backdrop);

      const cursorBinding = window.ThemeOverlay?.bindBackdropCursor({
        backdrop,
        owner: backdrop,
        root: header,
        colorSource: header,
        isOpen: () => !isMobileMenuViewport() && hasOpenMegaMenu(header),
      });
      if (cursorBinding) backdropCursorBindings.set(backdrop, cursorBinding);

      backdrop.addEventListener('click', () => {
        closeHeaderSurfaces(header);
        scheduleUpdate();
      });
    });
  };

  const initializeMenuToggles = (header) => {
    header.querySelectorAll('[data-header-menu-toggle]').forEach((toggle) => {
      if (menuToggleButtons.has(toggle)) return;

      menuToggleButtons.add(toggle);
      const container = toggle.closest('.header-top') || header;

      toggle.addEventListener('click', (event) => {
        const isOpen = !container.classList.contains('header-top--menu-open');
        if (isOpen) closeHeaderSurfaces(header, { menu: true });
        setHeaderMenuState(header, isOpen, { restoreFocus: isOpen || event.detail === 0 });
      });

    });
  };

  const initializeMobileDrawer = (header) => {
    const container = header.querySelector('.header-top') || header;
    const drawer = container.querySelector('[data-header-mobile-drawer]');
    if (!drawer || drawer.dataset.ready === 'true') return;
    drawer.dataset.ready = 'true';
    container.querySelectorAll('[data-header-menu-toggle]').forEach(toggle => toggle.setAttribute('aria-controls', drawer.id));
    window.ThemeOverlay?.get(drawer);
    drawer.addEventListener('close', () => setHeaderMenuState(header, false, { syncOverlay: false }));

    const cursorBinding = window.ThemeOverlay?.bindBackdropCursor({
      backdrop: drawer.querySelector('[data-header-menu-backdrop]'),
      owner: drawer,
      root: drawer,
      colorSource: drawer,
      isOpen: () => isMobileMenuViewport() && drawer.dataset.state === 'open',
    });
    if (cursorBinding) backdropCursorBindings.set(drawer, cursorBinding);

    const setBackLabel = (title) => {
      drawer.querySelectorAll('[data-header-menu-back]').forEach((back) => { back.hidden = false; });
      drawer.querySelectorAll('[data-header-menu-back-label]').forEach((label) => {
        label.textContent = title || label.dataset.headerMenuBackDefaultLabel || 'Menu';
      });
    };

    const clearActiveSubmenu = () => {
      drawer.querySelectorAll('[data-mobile-drawer-submenu-details]').forEach((details) => {
        details.classList.remove('is-mobile-submenu-active');
        details.removeAttribute('open');
      });
      drawer.querySelectorAll('.header__mobile-drawer-item.is-mobile-submenu-active').forEach((item) => {
        item.classList.remove('is-mobile-submenu-active');
        item.querySelector(':scope > .header__mobile-drawer-details')?.removeAttribute('open');
      });
    };

    const resetSubmenu = (animate = true) => {
      drawer.classList.remove('header__mobile-drawer--submenu-active');
      drawer.querySelectorAll('[data-header-menu-back]').forEach((back) => { back.hidden = true; });
      drawer.querySelectorAll('[data-header-menu-back-label]').forEach((label) => {
        label.textContent = label.dataset.headerMenuBackDefaultLabel || 'Menu';
      });
      if (animate) window.setTimeout(clearActiveSubmenu, 320);
      else clearActiveSubmenu();
    };

    const backToParentSubmenu = () => {
      const activeNestedDetails = drawer.querySelector('[data-mobile-drawer-submenu-details].is-mobile-submenu-active');
      if (!activeNestedDetails) {
        resetSubmenu();
        return;
      }

      activeNestedDetails.classList.remove('is-mobile-submenu-active');
      activeNestedDetails.removeAttribute('open');
      const rootSummary = activeNestedDetails.closest('[data-mobile-drawer-details]')?.querySelector(':scope > summary');
      setBackLabel(rootSummary?.querySelector('span')?.textContent?.trim());
    };

    const moveMegaMenuToMobileDrawer = (item) => {
      const trigger = item.dataset.menuTitle;
      const featuredSlot = trigger
        ? drawer.querySelector(`[data-mobile-mega-featured-slot="${CSS.escape(trigger)}"]`)
        : null;
      const slot = trigger ? drawer.querySelector(`[data-mobile-mega-slot="${CSS.escape(trigger)}"]`) : null;
      const megaMenu = trigger
        ? Array.from(header.querySelectorAll('[data-header-mega-menu]')).find((menu) => menu.dataset.megaMenuTrigger === trigger)
        : null;
      const featured = megaMenu?.querySelector(':scope .header-mega-menu__featured');
      if (!featuredSlot || !slot || !megaMenu) return;

      if (!mobileMegaMenuOrigins.has(megaMenu)) {
        mobileMegaMenuOrigins.set(megaMenu, {
          parent: megaMenu.parentElement,
          featured,
          featuredParent: featured?.parentElement,
          featuredNextSibling: featured?.nextSibling,
        });
      }
      if (featured) featuredSlot.append(featured);
      slot.append(megaMenu);
      megaMenu.hidden = false;
      item.classList.add('has-mobile-mega');
    };

    drawer.querySelectorAll('[data-mobile-drawer-details] > summary').forEach((summary) => {
      summary.addEventListener('click', (event) => {
        if (!isMobileMenuViewport()) return;
        event.preventDefault();
        resetSubmenu(false);
        const details = summary.parentElement;
        const item = details?.closest('.header__mobile-drawer-item');
        if (!details || !item) return;
        moveMegaMenuToMobileDrawer(item);
        details.open = true;
        window.requestAnimationFrame(() => {
          item.classList.add('is-mobile-submenu-active');
          drawer.classList.add('header__mobile-drawer--submenu-active');
          setBackLabel(summary.querySelector('span')?.textContent?.trim());
        });
      });
    });

    drawer.querySelectorAll('[data-mobile-drawer-submenu-details] > summary').forEach((summary) => {
      summary.addEventListener('click', (event) => {
        if (!isMobileMenuViewport()) return;
        event.preventDefault();

        const details = summary.parentElement;
        const rootDetails = details?.closest('[data-mobile-drawer-details]');
        const rootItem = rootDetails?.closest('.header__mobile-drawer-item');
        if (!details || !rootItem?.classList.contains('is-mobile-submenu-active')) return;

        drawer.querySelectorAll('[data-mobile-drawer-submenu-details].is-mobile-submenu-active').forEach((activeDetails) => {
          if (activeDetails === details) return;
          activeDetails.classList.remove('is-mobile-submenu-active');
          activeDetails.removeAttribute('open');
        });

        details.open = true;
        window.requestAnimationFrame(() => {
          details.classList.add('is-mobile-submenu-active');
          setBackLabel(summary.querySelector('span')?.textContent?.trim());
        });
      });
    });

    drawer.querySelectorAll('[data-header-menu-back]').forEach((back) => {
      back.addEventListener('click', backToParentSubmenu);
    });
    drawer.addEventListener('click', (event) => {
      const link = event.target.closest?.('a[href]');
      if (!link) return;

      // Let the anchor's default navigation run before collapsing the drawer.
      // Closing the active <details> during the same click event can remove the
      // active submenu before the browser activates a real child-link URL.
      window.setTimeout(() => setHeaderMenuState(header, false, { restoreFocus: false }), 0);
    });
  };

  const restoreMobileMegaMenus = () => {
    if (isMobileMenuViewport()) return;
    mobileMegaMenuOrigins.forEach((origin, megaMenu) => {
      if (origin.featured?.isConnected && origin.featuredParent?.isConnected) {
        const nextSibling = origin.featuredNextSibling?.parentNode === origin.featuredParent
          ? origin.featuredNextSibling
          : null;
        origin.featuredParent.insertBefore(origin.featured, nextSibling);
      }
      if (origin.parent?.isConnected) origin.parent.append(megaMenu);
      mobileMegaMenuOrigins.delete(megaMenu);
    });
  };

  const initializeLocalizationSheets = (header) => {
    header.querySelectorAll('.header-localization__details').forEach((details) => {
      if (localizationSheetDetails.has(details)) return;
      localizationSheetDetails.add(details);

      const summary = details.querySelector(':scope > .header-localization__summary');
      summary?.addEventListener('click', (event) => {
        if (window.innerWidth > 767 && !(details.closest('[data-header-mobile-drawer]') && isMobileMenuViewport())) return;
        event.preventDefault();

        const dialog = getLocalizationDialog(details);
        const overlay = dialog ? window.ThemeOverlay?.get(dialog) : null;
        if (!dialog || !overlay) return;

        if (dialog.dataset.state !== 'closed') {
          overlay.close({ restoreFocus: true });
          return;
        }

        closeHeaderSurfaces(header, { details, menu: true });
        overlay.open({ opener: summary });
        scheduleUpdate();
      });
    });

  };

  const initializeFooterLocalizations = (root = document) => {
    const localizations = [];
    if (root.matches?.('.localization-block')) localizations.push(root);
    root.querySelectorAll?.('.localization-block').forEach((localization) => localizations.push(localization));

    localizations.forEach((localization) => {
      initializeLocalizationSheets(localization);
      localization.querySelectorAll(':scope > .header-localization__details').forEach((details) => {
        if (footerLocalizationStates.has(details)) return;

        const controller = new AbortController();
        const state = { controller };
        const scheduleClose = () => {
          if (details.matches(':hover') || keepSubmenuFocusOpen(details)) return;
          closeHeaderDetails(details);
        };
        const openOnHover = () => {
          if (window.innerWidth <= 767 || details.dataset.headerSubmenuTrigger !== 'hover') return;
          clearSubmenuClose(details);
          details.open = true;
          scheduleUpdate();
        };
        const closeOnLeave = () => {
          if (window.innerWidth <= 767 || details.dataset.headerSubmenuTrigger !== 'hover' || !details.open) return;
          scheduleClose();
        };

        details.addEventListener('pointerenter', openOnHover, { signal: controller.signal });
        details.addEventListener('pointerleave', closeOnLeave, { signal: controller.signal });
        details.addEventListener('focusin', openOnHover, { signal: controller.signal });
        details.addEventListener('focusout', closeOnLeave, { signal: controller.signal });
        const closeOnOutsidePointer = (event) => {
          if (!details.open || details.contains(event.target)) return;
          closeHeaderDetails(details);
        };
        document.addEventListener('pointerdown', closeOnOutsidePointer, { signal: controller.signal });
        details.querySelector(':scope > summary')?.addEventListener('click', (event) => {
          if (window.innerWidth <= 767 || event.defaultPrevented) return;
          if (details.dataset.headerSubmenuTrigger === 'hover') {
            event.preventDefault();
            clearSubmenuClose(details);
            details.open = true;
            scheduleUpdate();
            return;
          }
          event.preventDefault();
          if (details.open && !details.classList.contains('is-submenu-closing')) {
            closeHeaderDetails(details);
          } else {
            clearSubmenuClose(details);
            details.open = true;
            scheduleUpdate();
          }
        }, { signal: controller.signal });
        details.addEventListener('toggle', () => {
          if (details.open && !details.classList.contains('is-submenu-closing')) {
            clearSubmenuClose(details);
            localization.querySelectorAll(':scope > .header-localization__details[open]').forEach((otherDetails) => {
              if (otherDetails !== details) otherDetails.removeAttribute('open');
            });
          }
          scheduleUpdate();
        }, { signal: controller.signal });
        footerLocalizationStates.set(details, state);
      });
    });
  };

  const removeFooterLocalizations = (root) => {
    const localizations = [];
    if (root.matches?.('.localization-block')) localizations.push(root);
    root.querySelectorAll?.('.localization-block').forEach((localization) => localizations.push(localization));

    localizations.forEach((localization) => {
      localization.querySelectorAll(':scope > .header-localization__details').forEach((details) => {
        const state = footerLocalizationStates.get(details);
        if (!state) return;
        state.controller.abort();
        clearSubmenuClose(details);
        footerLocalizationStates.delete(details);
      });
    });
  };

  const destroyLocalizationOverlays = (root) => {
    const details = [];
    if (root.matches?.('.header-localization__details')) details.push(root);
    root.querySelectorAll?.('.header-localization__details').forEach((item) => details.push(item));

    details.forEach((item) => {
      const dialog = getLocalizationDialog(item);
      if (dialog?.parentElement !== document.body) return;
      window.ThemeOverlay?.get(dialog)?.destroy();
    });
  };

  const initializeAccountSheets = (header) => {
    header.querySelectorAll('[data-deferred-account]').forEach((link) => {
      if (deferredAccounts.has(link)) return;
      deferredAccounts.add(link);
      link.addEventListener('click', (event) => {
        if (event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        const template = link.querySelector('[data-deferred-account-template]');
        const account = template?.content.firstElementChild?.cloneNode(true);
        if (!account || !window.customElements?.get('shopify-account')) return;
        event.preventDefault();
        event.stopPropagation();
        for (const attribute of link.attributes) {
          if (attribute.name.startsWith('data-shopify-editor')) account.setAttribute(attribute.name, attribute.value);
        }
        link.replaceWith(account);
        initializeAccountSheets(header);
        // Shopify renders its slotted trigger asynchronously after connection.
        const started = performance.now();
        const openWhenReady = () => {
          if (!account.isConnected) return;
          const trigger = account.shadowRoot?.querySelector('button[part="signed-out-avatar"]');
          if (trigger) { trigger.focus(); trigger.click(); return; }
          if (performance.now() - started < 3000) requestAnimationFrame(openWhenReady);
          else window.location.assign(link.href);
        };
        requestAnimationFrame(openWhenReady);
      });
    });
    header.querySelectorAll('shopify-account').forEach((account) => {
      if (accountElements.has(account)) return;
      accountElements.add(account);
      account.addEventListener('open', () => {
        openAccountSheets.add(account);
        const headerTop = header.querySelector('.header-top') || header;
        const keepMobileMenuOpen =
          isMobileMenuViewport() && headerTop.classList.contains('header-top--menu-open');

        closeHeaderSurfaces(header, { account, menu: keepMobileMenuOpen });
        scheduleUpdate();
      });
      account.addEventListener('close', () => {
        openAccountSheets.delete(account);
        scheduleUpdate();
      });
    });
  };

  const initializeHeaders = (root = document) => {
    if (root.matches?.(HEADER_SELECTOR)) {
      initializeHeader(root);
    }

    root.querySelectorAll?.(HEADER_SELECTOR).forEach(initializeHeader);
  };

  const removeHeaders = (root) => {
    const headers = [];

    if (root.matches?.(HEADER_SELECTOR)) {
      headers.push(getHeaderRoot(root));
    }

    root.querySelectorAll?.(HEADER_SELECTOR).forEach((headerTop) => headers.push(getHeaderRoot(headerTop)));
    headers.forEach((header) => {
      header.querySelectorAll('details').forEach(clearSubmenuClose);
      header.querySelectorAll('[data-header-mega-menu-backdrop]').forEach((backdrop) => {
        backdropCursorBindings.get(backdrop)?.destroy();
        backdropCursorBindings.delete(backdrop);
      });
      header.querySelectorAll('[data-header-mobile-drawer]').forEach((drawer) => {
        window.ThemeOverlay?.get(drawer)?.destroy();
        backdropCursorBindings.get(drawer)?.destroy();
        backdropCursorBindings.delete(drawer);
      });
      headerStates.delete(header);
      headerResizeObservers.get(header)?.disconnect();
      headerResizeObservers.delete(header);
      const remainingStickyHeader = Array.from(headerStates.values()).find(({ stickyType }) => stickyType !== 'none');
      if (remainingStickyHeader) updateHeaderHeight(remainingStickyHeader.header, remainingStickyHeader.stickyType);
      else {
        document.documentElement.style.removeProperty('--header-height');
        document.documentElement.style.setProperty('--header-sticky-height', '0px');
      }
    });
  };

  window.addEventListener('scroll', scheduleUpdate, { passive: true });
  window.addEventListener('resize', () => {
    restoreMobileMegaMenus();
    scheduleUpdate();
  });

  document.addEventListener('focusin', (event) => {
    const headerTop = event.target.closest?.(HEADER_SELECTOR);
    const header = headerTop ? getHeaderRoot(headerTop) : null;
    if (header) {
      header.classList.remove('header--is-hidden');
      updateStickyHeaderHeight(header);
    }
  });

  document.addEventListener('search-overlay:open', (event) => {
    const header = event.detail?.header;
    if (!header) return;
    closeHeaderSurfaces(header, { search: true });
    header.classList.add('header--search-open');
    synchronizeHeaderColorScheme(header, true);
  });

  document.addEventListener('search-overlay:close', () => {
    headerStates.forEach(({ header }) => header.classList.remove('header--search-open'));
    scheduleUpdate();
  });

  document.addEventListener('cart-drawer:open', () => {
    headerStates.forEach(({ header }) => {
      closeHeaderSurfaces(header, { cart: true });
      header.classList.add('header--cart-open');
      synchronizeHeaderColorScheme(header, true);
    });
  });

  document.addEventListener('cart-drawer:close', () => {
    headerStates.forEach(({ header }) => header.classList.remove('header--cart-open'));
    scheduleUpdate();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    const header = event.target.closest?.('.shopify-section.header');
    if (!header) return;
    const opened = Array.from(header.querySelectorAll('details[open]'));
    if (!opened.length) return;
    event.preventDefault();
    closeLocalizationDialogs(header);
    opened.forEach(closeHeaderDetails);
    opened[0].querySelector(':scope > summary')?.focus({ preventScroll: true });
  });

  document.addEventListener('shopify:section:load', (event) => {
    initializeHeaders(event.target);
    initializeFooterLocalizations(event.target);
    scheduleUpdate();
  });

  document.addEventListener('shopify:section:unload', (event) => {
    destroyLocalizationOverlays(event.target);
    removeFooterLocalizations(event.target);
    removeHeaders(event.target);
    scheduleUpdate();
  });

  document.addEventListener('shopify:section:reorder', scheduleUpdate);

  document.addEventListener('shopify:block:select', (event) => {
    const megaMenu = event.target.closest?.('[data-header-mega-menu]');
    const details = megaMenu?.closest('.header-menu__details');
    if (!megaMenu || !details) return;

    megaMenu.dataset.editorSelected = 'true';
    details.dataset.editorSelected = 'true';
    details.open = true;
    details.classList.remove('is-submenu-closing');
    scheduleUpdate();
  });

  document.addEventListener('shopify:block:deselect', (event) => {
    const megaMenu = event.target.closest?.('[data-header-mega-menu]');
    const details = megaMenu?.closest('.header-menu__details');
    if (!megaMenu || !details) return;

    delete megaMenu.dataset.editorSelected;
    delete details.dataset.editorSelected;
    if (!details.matches(':hover') && !details.matches(':focus-within')) {
      details.removeAttribute('open');
    }
    scheduleUpdate();
  });

  initializeHeaders();
  initializeFooterLocalizations();
})();

(() => {
  const instances = new Map();
  const initialize = (scope = document) => scope.querySelectorAll('[data-header-bottom]').forEach(bottom => {
    if (instances.has(bottom)) return;
    const controller = new AbortController();
    const options = { signal: controller.signal };
    const menus = [...bottom.querySelectorAll('.header-menu')].map(menu => {
      const viewport = menu.querySelector('[data-header-menu-viewport]');
      const navigation = menu.querySelector('[data-header-menu-navigation]');
      if (!viewport || !navigation) return null;
      const previous = navigation.querySelector('[data-header-menu-prev]');
      const next = navigation.querySelector('[data-header-menu-next]');
      const update = () => {
        const overflow = viewport.scrollWidth > viewport.clientWidth + 1;
        navigation.hidden = !overflow;
        previous.disabled = viewport.scrollLeft <= 1;
        next.disabled = viewport.scrollLeft >= viewport.scrollWidth - viewport.clientWidth - 1;
      };
      const advance = direction => {
        const items = [...viewport.querySelectorAll('.header-menu__list > li')];
        if (!items.length) return;
        const origin = items[0].offsetLeft;
        const positions = items.map(item => item.offsetLeft - origin);
        const step = Math.min(3, Math.max(1, Number(bottom.dataset.menuScrollStep) || 1));
        const current = positions.findIndex(position => position >= viewport.scrollLeft - 1);
        const index = Math.min(items.length - 1, Math.max(0, (current < 0 ? items.length - 1 : current) + direction * step));
        viewport.scrollTo({ left: positions[index], behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
      };
      previous.addEventListener('click', () => advance(-1), options);
      next.addEventListener('click', () => advance(1), options);
      viewport.addEventListener('scroll', () => {
        update();
        menu.querySelectorAll('details[open]').forEach(details => details.removeAttribute('open'));
      }, { ...options, passive: true });
      viewport.addEventListener('focusin', event => {
        const item = event.target.closest('.header-menu__item');
        if (!item || event.target.closest('.header-menu__submenu')) return;
        const rect = item.getBoundingClientRect();
        const frame = viewport.getBoundingClientRect();
        if (rect.left < frame.left || rect.right > frame.right) viewport.scrollBy({ left: rect.left - frame.left });
      }, options);
      const observer = new ResizeObserver(update);
      observer.observe(viewport);
      observer.observe(viewport.querySelector('.header-menu__list'));
      update();
      return observer;
    }).filter(Boolean);
    instances.set(bottom, { controller, menus });
  });
  document.addEventListener('shopify:section:load', event => initialize(event.target));
  document.addEventListener('shopify:section:unload', event => {
    instances.forEach((instance, bottom) => {
      if (!event.target.contains(bottom)) return;
      instance.controller.abort();
      instance.menus.forEach(observer => observer.disconnect());
      instances.delete(bottom);
    });
  });
  initialize();
})();

(() => {
  const updateCategoryLabels = () => document.querySelectorAll('[data-header-search-form]').forEach(form => {
    const option = form.querySelector('[data-header-search-category] option[value=""]');
    if (option) option.textContent = window.matchMedia('(max-width: 767.98px)').matches ? form.dataset.mobileCategoryLabel : form.dataset.desktopCategoryLabel;
    const category = form.querySelector('[data-header-search-category]');
    form.querySelectorAll('.header-search__category-label').forEach(label => {
      label.textContent = category?.value ? category.value : label.classList.contains('header-search__category-label--mobile') ? form.dataset.mobileCategoryLabel : form.dataset.desktopCategoryLabel;
    });
  });
  document.addEventListener('submit', event => {
    const form = event.target.closest?.('[data-header-search-form]');
    if (!form) return;
    const category = form.querySelector('[data-header-search-category]')?.value;
    const input = form.querySelector('input[type="search"]');
    const query = form.querySelector('[data-header-search-query]');
    if (!input || !query) return;
    const escape = value => value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    query.value = category ? (input.value.trim() ? `(${input.value.trim()}) AND ` : '') + `product_type:"${escape(category)}"` : input.value;
    query.name = 'q';
    input.removeAttribute('name');
    if (category) { let type = form.querySelector('input[name="type"]'); if (!type) { type = document.createElement('input'); type.type='hidden'; type.name='type'; form.append(type); } type.value='product'; }
  });
  document.addEventListener('click', event => {
    const trigger = event.target.closest?.('[data-header-category-open]');
    if (trigger) {
      const dialog = document.getElementById(trigger.getAttribute('aria-controls'));
      window.ThemeOverlay?.get(dialog)?.open({ opener: trigger });
      return;
    }
    const option = event.target.closest?.('[data-header-category-value]');
    if (!option) return;
    const list = option.closest('[data-category-form]');
    const form = document.getElementById(list.dataset.categoryForm);
    const category = form?.querySelector('[data-header-search-category]');
    if (!category) return;
    category.value = option.dataset.headerCategoryValue;
    list.querySelectorAll('[data-header-category-value]').forEach(item => {
      item.classList.toggle('is-selected', item === option);
      item.setAttribute('aria-pressed', String(item === option));
    });
    updateCategoryLabels();
    window.ThemeOverlay?.get(option.closest('[data-header-category-dialog]'))?.close();
  });
  document.addEventListener('shopify:section:unload', event => {
    document.querySelectorAll('[data-header-category-dialog]').forEach(dialog => {
      if (event.target.id === `shopify-section-${dialog.dataset.ownerSection}`) window.ThemeOverlay?.get(dialog)?.destroy();
    });
  });
  document.addEventListener('change', event => { if (event.target.matches('[data-header-search-category]')) updateCategoryLabels(); });
  window.addEventListener('resize', updateCategoryLabels, { passive: true });
  document.addEventListener('shopify:section:load', updateCategoryLabels);
  updateCategoryLabels();
})();
