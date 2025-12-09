// Polyfill Element.matches()
if (!Element.prototype.matches) {
    Element.prototype.matches = Element.prototype.msMatchesSelector || Element.prototype.webkitMatchesSelector;
}
// Polyfill Element.closest()
if (!Element.prototype.closest) {
    Element.prototype.closest = function(s) {
        var el = this;
        if (!document.documentElement.contains(el)) return null;
        do {
            if (typeof el.matches === "function" && el.matches(s)) return el;
            el = el.parentElement || el.parentNode;
        } while (el !== null);
        return null;
    };
}

var GRADLE_VERSION = location.pathname.replace("/", "").split("/", 3)[0];
var userguideIndex = []

function is74LayoutOrLater(version) {
    return /^(\d+).*/.test(version) && !/^([1-6]\.\d)|(7\.[0-3]).*/.test(version);
}

function loadUserguideIndex() {
  var xobj = new XMLHttpRequest();
  xobj.overrideMimeType("application/json");
  xobj.open('GET', '/nightly/userguide-index.json');
  xobj.onreadystatechange = function () {
    if (xobj.readyState == 4 && xobj.status == "200") {
      userguideIndex = JSON.parse(xobj.responseText)
    }
  };
  xobj.send(null);
}

/**
 * Given a version string, replace "/current" with "/$version" in the site header.
 * @param version String
 */
function versionizeDocsUrls(version) {
    function versionizeLink(linkEl) {
        var versionizedHref = linkEl.getAttribute("href")
            .replace(/^\/(dsl|release-notes|userguide|javadoc|kotlin-dsl)/g, "/current/$1")
            .replace(/^\/current/g, "/" + version);
        linkEl.setAttribute("href", versionizedHref);
    }

    Array.prototype.slice.call(document.querySelectorAll(".site-header a[href]"), 0).forEach(versionizeLink);
    Array.prototype.slice.call(document.querySelectorAll(".docs-navigation a[href]"), 0).forEach(versionizeLink);
    Array.prototype.slice.call(document.querySelectorAll(".site-footer a[href]"), 0).forEach(versionizeLink);
}

function registerNavigationActions() {
    var navigationButton = document.querySelector(".site-header__navigation-button");
    var navigationCollapsible = document.querySelector(".site-header__navigation-collapsible");

    if (navigationButton) {
        navigationButton.addEventListener("click", function () {
            navigationCollapsible.classList.toggle("site-header__navigation-collapsible--collapse");
        });
    }

    var allSubmenus = document.querySelectorAll(".site-header__navigation-submenu-section");
    Array.prototype.forEach.call(allSubmenus, function (submenu) {
        var focusinOpensSubmenu = false;

        document.addEventListener("focusout", function (event) {
            if (submenu.contains(event.target)) {
                focusinOpensSubmenu = false;
            }
        });

        document.addEventListener("focusin", function () {
            if (submenu.contains(document.activeElement)) {
                submenu.classList.add("open");
                focusinOpensSubmenu = true;
            } else {
                submenu.classList.remove("open");
            }
        });

        document.addEventListener("click", function (event) {
            if (!focusinOpensSubmenu) {
                if (submenu.contains(event.target)) {
                    submenu.classList.toggle("open");
                } else {
                    submenu.classList.remove("open");
                }
            } else {
                focusinOpensSubmenu = false;
            }
        });
    });
}

// Add "active" class to TOC link corresponding to subsection at top of page
function setActiveSubsection(activeHref) {
    var tocLinkToActivate = document.querySelector(".toc a[href$='"+activeHref+"']");
    var currentActiveTOCLink = document.querySelector(".toc a.active");
    if (tocLinkToActivate != null) {
        if (currentActiveTOCLink != null && currentActiveTOCLink !== tocLinkToActivate) {
            currentActiveTOCLink.classList.remove("active");
        }
        tocLinkToActivate.classList.add("active");
    }
}

function calculateActiveSubsectionFromLink(event) {
    var closestLink = event.target.closest("a[href]");
    if (closestLink) {
        setActiveSubsection(closestLink.getAttribute("href"));
    }
}

function calculateActiveSubsectionFromScrollPosition(position) {
    var subsections = document.querySelectorAll("h2[id] > a.anchor,h2.title > a[name],h3.title > a[name]");

    // Assign active section: take advantage of fact that querySelectorAll returns elements in source order
    var activeSection = subsections[0];

    Array.prototype.forEach.call(subsections, function(section) {
        if (Math.floor(section.offsetTop) <= (position + 50)) {
            activeSection = section;
        }
    });

    if (activeSection != null && activeSection.hasAttribute("href")) {
        setActiveSubsection(activeSection.getAttribute("href"));
    }
}

function postProcessUserguideNavigation(version) {
    [].forEach.call(document.querySelectorAll(".docs-navigation a[href$='"+ window.location.pathname +"']"), function(link) {
        // Add "active" to all links same as current URL
        link.classList.add("active");

        // Expand all parent navigation
        var parentListEl = link.closest("li");
        while (parentListEl !== null) {
            var dropDownEl = parentListEl.querySelector(".nav-dropdown");
            if (dropDownEl !== null) {
                dropDownEl.classList.add("expanded");
            }
            parentListEl = parentListEl.parentNode.closest("li");
        }
    });

    function throttle(fn, periodMs) {
        var time = Date.now();
        var context = this;
        var args = Array.prototype.slice.call(arguments);
        return function() {
            if ((time + periodMs - Date.now()) < 0) {
                fn.apply(context, args);
                time = Date.now();
            }
        }
    }

    var mainContent = document.querySelector("main.main-content > div.content");
    var mainContentExistsAndIs74LayoutOrLater = mainContent && is74LayoutOrLater(version);
    var calculateActiveSubsection = function() {
        var position = mainContentExistsAndIs74LayoutOrLater ? mainContent.scrollTop : window.scrollY;
        calculateActiveSubsectionFromScrollPosition(position);
    }

    var elementToListenScroll = mainContentExistsAndIs74LayoutOrLater ? mainContent : window;
    elementToListenScroll.addEventListener("click", calculateActiveSubsectionFromLink);
    elementToListenScroll.addEventListener("scroll", throttle(calculateActiveSubsection, 50));
    calculateActiveSubsection();
}

function initializeSearch() {
    var searchContainer = document.querySelector(".docs-navigation .search-container");
    var navigation = document.querySelector(".docs-navigation");
    var dslSearch = document.querySelector(".docs-navigation .search-container input#search-input");

    if (window.location.href.indexOf("/current/") != -1) { // Current
        if (searchContainer != null) {
            searchContainer.style.display = "block";
        }
    } else { // Not current
        if (searchContainer != null) {
            searchContainer.style.cssText = "display:none !important";
        }
    }

    if (dslSearch != null) {
        dslSearch.style.display = "none";
    }
}

function loadNavigationPositionForDsl(currentChapterFileName) {
    [].forEach.call(document.querySelectorAll(".docs-navigation a[href$='" + currentChapterFileName + "']"), function (link) {
        // Add "active" to all links same as current URL
        link.classList.add("active");
        // Scroll to center of the page if deep link
        link.scrollIntoView({ behavior: 'auto', block: 'center', inline: 'center' });
    })

    var sidebar = document.querySelector(".docs-navigation");
    var sidebarTop = sessionStorage.getItem("sidebar-scroll-dsl");
    if (sidebarTop !== null) {
        sidebar.scrollTop = parseInt(sidebarTop, 10);
    }
    [].forEach.call(document.querySelectorAll(".docs-navigation a"), function(el) {
        el.addEventListener("click", function() {
            sessionStorage.setItem("sidebar-scroll-dsl", sidebar.scrollTop);
        }, false);
    });
}

function loadNavigationPosition(version) {
    if (!is74LayoutOrLater(version)) {
        return;
    }

    function getCurrentChapterFileName(givenUrl) {
        var currentChapterFileName = givenUrl.substr(givenUrl.lastIndexOf("/") + 1);
        if (currentChapterFileName === "index.html" || currentChapterFileName === "") {
            currentChapterFileName = givenUrl.substr(0, givenUrl.lastIndexOf("/"));
            currentChapterFileName = currentChapterFileName.substr(currentChapterFileName.lastIndexOf("/") + 1) + "/index.html";
        }
        return currentChapterFileName;
    }

    if (window.location.pathname.indexOf("/dsl/") > -1) {
        loadNavigationPositionForDsl(getCurrentChapterFileName(window.location.pathname));
        return;
    }

    // Expand previously expanded items
    var expandedItems = [];
    var currentChapterFileName = getCurrentChapterFileName(window.location.pathname);
    var previousExpandedItems = sessionStorage.getItem("expanded-items") ? sessionStorage.getItem("expanded-items") : [];
    [].forEach.call(document.querySelectorAll(".docs-navigation a.nav-dropdown"), function(el) {
        if (previousExpandedItems.indexOf(el.getAttribute("href")) > -1) {
            el.classList.add("expanded");
        }
    });

    [].forEach.call(document.querySelectorAll(".docs-navigation a.expanded"), function(el) {
        if (el.getAttribute("href")) {
            expandedItems.push(el.getAttribute("href"));
        }
    });
    sessionStorage.setItem("expanded-items", expandedItems);

    // Load sidebar position
    var isEqualToPreviousClicked = sessionStorage.getItem("previous-clicked-chapter") === currentChapterFileName;
    var sidebar = document.querySelector(".docs-navigation");
    var sidebarTop = sessionStorage.getItem("sidebar-scroll");
    if (isEqualToPreviousClicked && sidebarTop !== null) {
        sidebar.scrollTop = parseInt(sidebarTop, 10);
    }

    [].forEach.call(document.querySelectorAll(".docs-navigation .nav-dropdown"), function onElementExpandChange(collapsibleElement) {
        collapsibleElement.addEventListener("click", function addToExpandedItems(evt) {
            evt.preventDefault();
            var targetHref = evt.target.getAttribute("href");
            var elementIndex = expandedItems.indexOf(targetHref);
            if (elementIndex < 0) {
                expandedItems.push(targetHref);
            } else {
                expandedItems.splice(elementIndex, 1);
            }
            sessionStorage.setItem("expanded-items", expandedItems);
            return false;
        }, false);
    });

    [].forEach.call(document.querySelectorAll(".docs-navigation a"), function(el) {
        el.addEventListener("click", function(event) {
            sessionStorage.setItem("sidebar-scroll", sidebar.scrollTop);
            var elHref = el.getAttribute("href");
            if (elHref) {
                sessionStorage.setItem("previous-clicked-chapter", getCurrentChapterFileName(elHref));
            }
            if (elHref && elHref.lastIndexOf("../userguide/", 0) !== 0
                    && elHref.lastIndexOf("../samples/", 0) !== 0
                    && elHref.lastIndexOf("#", 0) !== 0) {
                // Clear storage if we will move out of user guide docs (e.g. to the release notes or dsl),
                // we recognize such links since they don't start with "../userguide/" or "../samples/" or "#"
                sessionStorage.removeItem("sidebar-scroll");
                sessionStorage.removeItem("expanded-items");
            }
        }, false);
    });
}

function includePromotionBanner() {
    var siteHeader = document.querySelector(".site-layout__header");

    if (siteHeader != null) {
        var banner = document.createElement("div");
        banner.innerHTML = "Introducing <a href='https://gradle.com/training/introducing-gradle-enterprise-predictive-test-selection/'>Predictive Test Selection</a> — avoid running irrelevant tests using machine learning.";
        banner.className = "notification";
        siteHeader.parentNode.insertBefore(banner, siteHeader);
        return banner;
    }
    return null;
}

function postProcessNavigation(version) {
    versionizeDocsUrls(GRADLE_VERSION);
    registerNavigationActions();
    postProcessUserguideNavigation(version);
    initializeSearch();
    loadNavigationPosition(version);
}

function postProcessFooter() {
    var footerTimeEl = document.querySelector("footer time");
    if (footerTimeEl !== null) {
        footerTimeEl.innerHTML = new Date().getFullYear();
    }

    includeNewsletterSubscribeForm();
}

function includeNewsletterSubscribeForm() {
    var newsletterSubscribeContainer = document.querySelector(".newsletter-form__container");
    // Replace form with a CAPTCHA-enabled one
    if (newsletterSubscribeContainer != null) {
        newsletterSubscribeContainer.innerHTML = "<iframe id='newsletter-form-frame' name='newsletter-form-frame' src='https://go.gradle.com/l/68052/2021-12-07/fnfwcl' style='width: 354px; padding-top: 0px; border: 0;'></iframe>";
    }
}

function handleChapterMeta() {
    var path = location.pathname.replace("/", "").split("/", 3)[2];
    if (path) {
        // Restore previously selected rating
        var storageKey = "gradle-userguide-rating-" + path.replace(/\..*$/, "");
        var currentRating = window.localStorage.getItem(storageKey);
        var currentRatingEl = document.querySelector(".js-rating-widget .js-rating[data-label='" + currentRating + "']");
        if (currentRatingEl !== null) {
            currentRatingEl.classList.add("selected");
        }
    }

    // Store selected rating and persist display
    var ratingElements = document.querySelectorAll(".js-rating-widget .js-rating");
    [].forEach.call(ratingElements, function (el) {
        el.addEventListener("click", function (event) {
            var oldRatingEl = document.querySelector(".js-rating-widget .selected");
            if (oldRatingEl !== null) {
                oldRatingEl.classList.remove("selected");
            }

            var newRatingEl = event.currentTarget;
            newRatingEl.classList.add("selected");
            window.localStorage.setItem(storageKey, newRatingEl.getAttribute("data-label"));
        });
    });

    // Inject quick edit link
    var editLinkEl = document.querySelector(".js-chapter-meta .js-edit-link");
    if (editLinkEl !== null) {
        var editLinkBase = editLinkEl.getAttribute("href");
        var srcPathTag = document.querySelector("[name='adoc-src-path']")
        var adocSource = null
        if (srcPathTag != null && srcPathTag.getAttribute("content").startsWith("/")) {
            // if the source file (.adoc) location has been encoded in the 'adoc-src-path' tag, use it (Gradle 6+)
            adocSource = srcPathTag.getAttribute("content")
        } else {
            // otherwise assume that the relative file path of 'adoc' and 'html' are the same
            adocSource = path.replace(".html", ".adoc")
        }
        var page = window.location.pathname.split("/").pop()
        editLinkEl.onclick = function() {
            if (userguideIndex.includes(adocSource)) {
                // there is a corresponding page in the nightly docs (built from master) and the adoc source file likely still exists
                // go to the adoc source file on GitHub, instead of only going to the 'userguide' folder
                this.href = editLinkBase + adocSource.substring(1)
            }
        }
    }
}

function postProcessCodeBlocks() {
    // Assumptions:
    //  1) All siblings that are marked with class="multi-language-sample" should be grouped
    //  2) Only one language can be selected per domain (to allow selection to persist across all docs pages)
    //  3) There is exactly 1 small set of languages to choose from. This does not allow for multiple language preferences. For example, users cannot prefer both Kotlin and ZSH.
    //  4) Only 1 sample of each language can exist in the same collection.

    var GRADLE_DSLs = ["groovy", "kotlin"];
    var preferredBuildScriptLanguage = initPreferredBuildScriptLanguage();

    // Ensure preferred DSL is valid, defaulting to Groovy DSL
    function initPreferredBuildScriptLanguage() {
        var lang = window.localStorage.getItem("preferred-gradle-dsl");
        if (GRADLE_DSLs.indexOf(lang) === -1) {
            window.localStorage.setItem("preferred-gradle-dsl", "groovy");
            lang = "groovy";
        }
        return lang;
    }

    function capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    function processSampleEl(sampleEl, prefLangId) {
        var codeEl = sampleEl.querySelector("code[data-lang]");
        if (codeEl != null) {
            sampleEl.setAttribute("data-lang", codeEl.getAttribute("data-lang"));
            if (codeEl.getAttribute("data-lang") !== prefLangId) {
                sampleEl.classList.add("hidden");
            } else {
                sampleEl.classList.remove("hidden");
            }
        }
    }

    function switchSampleLanguage(languageId) {
        var multiLanguageSampleElements = [].slice.call(document.querySelectorAll(".multi-language-sample"));

        // Array of Arrays, each top-level array representing a single collection of samples
        var multiLanguageSets = [];
        for (var i = 0; i < multiLanguageSampleElements.length; i++) {
            var currentCollection = [multiLanguageSampleElements[i]];
            var currentSampleElement = multiLanguageSampleElements[i];
            processSampleEl(currentSampleElement, languageId);
            while (currentSampleElement.nextElementSibling != null && currentSampleElement.nextElementSibling.classList.contains("multi-language-sample")) {
                currentCollection.push(currentSampleElement.nextElementSibling);
                currentSampleElement = currentSampleElement.nextElementSibling;
                processSampleEl(currentSampleElement, languageId);
                i++;
            }

            multiLanguageSets.push(currentCollection);
        }

        multiLanguageSets.forEach(function (sampleCollection) {
            // Create selector element if not existing
            if (sampleCollection.length > 1 &&
                (sampleCollection[0].previousElementSibling == null ||
                    !sampleCollection[0].previousElementSibling.classList.contains("multi-language-selector"))) {
                var languageSelectorFragment = document.createDocumentFragment();
                var multiLanguageSelectorElement = document.createElement("div");
                multiLanguageSelectorElement.classList.add("multi-language-selector");
                languageSelectorFragment.appendChild(multiLanguageSelectorElement);


                sampleCollection.forEach(function (sampleEl) {
                    var optionEl = document.createElement("code");
                    var sampleLanguage = sampleEl.getAttribute("data-lang");
                    optionEl.setAttribute("data-lang", sampleLanguage);
                    optionEl.setAttribute("role", "button");
                    optionEl.classList.add("language-option");

                    optionEl.innerText = capitalizeFirstLetter(sampleLanguage);

                    optionEl.addEventListener("click", function updatePreferredLanguage(evt) {
                        var preferredLanguageId = optionEl.getAttribute("data-lang");
                        window.localStorage.setItem("preferred-gradle-dsl", preferredLanguageId);

                        // Record how far down the page the clicked element is before switching all samples
                        var beforeOffset = evt.target.offsetTop;

                        switchSampleLanguage(preferredLanguageId);

                        // Scroll the window to account for content height differences between different sample languages
                        window.scrollBy(0, evt.target.offsetTop - beforeOffset);
                    });
                    multiLanguageSelectorElement.appendChild(optionEl);
                });
                sampleCollection[0].parentNode.insertBefore(languageSelectorFragment, sampleCollection[0]);
            }
        });

        [].slice.call(document.querySelectorAll(".multi-language-selector .language-option")).forEach(function (optionEl) {
            if (optionEl.getAttribute("data-lang") === languageId) {
                optionEl.classList.add("selected");
            } else {
                optionEl.classList.remove("selected");
            }
        });

        [].slice.call(document.querySelectorAll(".multi-language-text")).forEach(function (el) {
            if (!el.classList.contains("lang-" + languageId)) {
                el.classList.add("hidden");
            } else {
                el.classList.remove("hidden");
            }
        });
    }

    switchSampleLanguage(preferredBuildScriptLanguage);
}

function initializeVersioning(version) {
    function createVersion(href, linkText) {
        var fragment = document.createDocumentFragment();
        var submenuItemEl = document.createElement('div');
        submenuItemEl.className = "site-header__navigation-submenu-item";
        var submenuItemLinkEl = document.createElement('a');
        submenuItemLinkEl.target = "_top";
        submenuItemLinkEl.className = "site-header__navigation-submenu-item-link";
        submenuItemLinkEl.setAttribute("href", href);
        var submenuItemTextEl = document.createElement('span');
        submenuItemTextEl.className = "site-header__navigation-submenu-item-link-text";
        submenuItemTextEl.textContent = linkText;
        submenuItemLinkEl.appendChild(submenuItemTextEl);
        submenuItemEl.appendChild(submenuItemLinkEl);
        fragment.appendChild(submenuItemEl);
        return fragment;
    }

    var versionHistoryStorageKey = "gradle-doc-version-history";
    var siteHeaderVersionEl = document.querySelector(".site-header-version");
    if (siteHeaderVersionEl != null) {
        siteHeaderVersionEl.textContent = version;

        window.addEventListener('load', function initializeVersionSelector() {
            if (typeof window.fetch === "function") {
                fetch("/docs-version-selector.html")
                    .then(function(response) {
                        return response.text();
                    }).then(function (value) {
                        siteHeaderVersionEl.innerHTML = value;
                        document.querySelector(".js-site-header__version-select .site-header-version").textContent = version;
                        var versionOptionsContainerEl = document.querySelector(".js-site-header__version-select .site-header__navigation-submenu");

                        // Manage versionHistory as a self-organizing LRA list of max length 4
                        var versionHistoryValue = window.localStorage.getItem(versionHistoryStorageKey);
                        var versionHistory = ["8.5", "7.6.2", "6.9.4", "5.6.4"];
                        if (versionHistoryValue != null) {
                            versionHistory = versionHistoryValue.split(",").filter(function(v) { return v !== GRADLE_VERSION });
                        }

                        // Add recently visited Gradle versions to the version selector with a link to all releases
                        versionHistory.forEach(function (v) {
                            var versionFragment = createVersion("/" + v, "" + v);
                            versionOptionsContainerEl.appendChild(versionFragment);
                        });
                        var allVersionsFragment = createVersion("https://gradle.org/releases/", "All versions");
                        versionOptionsContainerEl.appendChild(allVersionsFragment);

                        // Add current version to head of the list unless it's a nightly version
                        if (GRADLE_VERSION.indexOf("+") === -1) {
                            versionHistory.unshift(GRADLE_VERSION);
                        }
                        var newVersionHistory = versionHistory.slice(0, 4).join(",");
                        window.localStorage.setItem(versionHistoryStorageKey, newVersionHistory);

                        if (!is74LayoutOrLater(version)) {
                            // In 7.4 we changed the dropdown arrow
                            var hiddenVersionDropdownArrow = document.querySelector(".hidden-version-arrow");
                            if (hiddenVersionDropdownArrow) {
                                hiddenVersionDropdownArrow.classList.remove("hidden-version-arrow");
                            }
                            var siteHeaderVersion = document.querySelector(".site-header .site-header-version");
                            if (siteHeaderVersion) {
                                siteHeaderVersion.style.marginTop = "0px";
                            }
                        }
                });
            }
        });
    }
}

function scrollToElement(version) {
    if (!is74LayoutOrLater(version)) {
        return;
    }
    var mainContent = document.querySelector("main.main-content > div.content");
    var id = window.location.hash ? window.location.hash.replace("#", "") : window.location.hash;
    var element = document.getElementById(id);
    if (!element) {
        // In dsl we have to scroll to elements with name
        var elementsByName = document.getElementsByName(id);
        element = elementsByName && elementsByName.length > 0 ? elementsByName[0] : null;
    }
    if (element && mainContent) {
        element.scrollIntoView();
    }
}

document.addEventListener("DOMContentLoaded", function(event) {
    var links = document.getElementsByTagName("a");
    for (let i = 0; i < links.length; i++) {
      var link = links[i]
      if(link.getAttribute("href")?.startsWith("https://dpeuniversity.gradle.com/")) {
        link.setAttribute("promo", "yes")
        link.setAttribute("promo_offer", "DPEU")
        link.setAttribute("promo_type", link.getElementsByTagName("a") ? "link" : "image")
        link.setAttribute("promo_location", "docs")
      }
    }

    /**
     * Given an event object, determine if the source element was a link, and track it with Google Analytics if it goes to another domain.
     * @param {Event} evt object that should be fired due to a link click.
     * @return boolean if link was successfully tracked.
     */
    function trackOutbound(evt) {
        var targetLink = evt.target.closest("a");
        if (!targetLink) {
            return false;
        }

        var href = targetLink.getAttribute("href");
        if (!href || href.substring(0, 4) !== "http") {
            return false;
        }

        if(href.indexOf(document.domain) === -1 || !document.domain) {
            ga("docs.send", {hitType: "event", eventCategory: "Outbound Referral", eventAction: "Clicked", eventLabel: href});
            ga("all.send", {hitType: "event", eventCategory: "Outbound Referral", eventAction: "Clicked", eventLabel: href});
            return true;
        }
        return false;
    }

    function trackCustomEvent(evt) {
        var eventTarget = evt.target.closest(".js-analytics-event");
        if (eventTarget !== null) {
            var eventAction = eventTarget.getAttribute("data-action");
            var eventLabel = eventTarget.getAttribute("data-label");
            ga("docs.send", {hitType: "event", eventCategory: document.location.pathname, eventAction: eventAction, eventLabel: eventLabel});
            return true;
        }
        return false;
    }

    document.addEventListener("click", trackOutbound, false);
    document.addEventListener("click", trackCustomEvent, false);

    window.piAId = '69052';
    window.piCId = '2332';
    (function() {
        function async_load() {
            var s = document.createElement('script'); s.type = "text/javascript";
            s.src = ('https:' == document.location.protocol ? 'https://pi' : 'http://cdn') + '.pardot.com/pd.js';
            var c = document.getElementsByTagName('script')[0]; c.parentNode.insertBefore(s, c);
        }
        if(window.attachEvent) { window.attachEvent('onload', async_load); }
        else { window.addEventListener('load', async_load, false); }
    })();

    loadUserguideIndex();
    handleChapterMeta();
    postProcessCodeBlocks();
    postProcessFooter();
    scrollToElement(window.siteDecorateVersion);
    postProcessNavigation(window.siteDecorateVersion);
    initializeVersioning(window.siteDecorateVersion);
});
